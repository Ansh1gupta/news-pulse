import re
import json
from collections import Counter
from stopwords import STOPWORDS
from config import MIN_SHARED_KEYWORDS, TOP_KEYWORDS_PER_ARTICLE

WORD_RE = re.compile(r"[a-zA-Z']{3,}")


def extract_keywords(title, summary, top_n=TOP_KEYWORDS_PER_ARTICLE):
    """Pull the most meaningful words out of a title+summary: lowercase,
    strip stopwords/short tokens, weight title words higher, return top N."""
    text = f"{title} {title} {summary or ''}".lower()  # title counted twice: it's the strongest signal
    words = [w for w in WORD_RE.findall(text) if w not in STOPWORDS]
    counts = Counter(words)
    return [w for w, _ in counts.most_common(top_n)]


def overlap_score(keywords_a, keywords_b):
    return len(set(keywords_a) & set(keywords_b))


def assign_or_create_cluster(conn, article_id, keywords):
    """Incremental clustering: compare this article's keywords against every
    existing cluster's keyword set. Join the best match above threshold,
    else start a new cluster with this article as its seed."""
    clusters = conn.execute("SELECT id, label, keywords FROM clusters").fetchall()

    best_cluster_id = None
    best_score = 0
    for c in clusters:
        c_keywords = json.loads(c["keywords"] or "[]")
        score = overlap_score(keywords, c_keywords)
        if score > best_score:
            best_score = score
            best_cluster_id = c["id"]

    if best_cluster_id is not None and best_score >= MIN_SHARED_KEYWORDS:
        # Merge keywords into the cluster (keep the most frequent overall)
        c = conn.execute("SELECT keywords FROM clusters WHERE id = ?", (best_cluster_id,)).fetchone()
        merged = Counter(json.loads(c["keywords"] or "[]"))
        merged.update(keywords)
        top_merged = [w for w, _ in merged.most_common(TOP_KEYWORDS_PER_ARTICLE)]
        label = _label_from_keywords(top_merged)
        conn.execute(
            "UPDATE clusters SET keywords = ?, label = ? WHERE id = ?",
            (json.dumps(top_merged), label, best_cluster_id),
        )
        conn.execute("UPDATE articles SET cluster_id = ? WHERE id = ?", (best_cluster_id, article_id))
        return best_cluster_id

    # No good match — new cluster, seeded with this article's own keywords
    label = _label_from_keywords(keywords)
    cur = conn.execute(
        "INSERT INTO clusters (label, keywords) VALUES (?, ?)",
        (label, json.dumps(keywords)),
    )
    new_id = cur.lastrowid
    conn.execute("UPDATE articles SET cluster_id = ? WHERE id = ?", (new_id, article_id))
    return new_id


def _label_from_keywords(keywords):
    if not keywords:
        return "Uncategorized"
    return " / ".join(w.capitalize() for w in keywords[:3])


def recluster_all(conn):
    """Full re-cluster pass: wipes cluster assignments and re-runs the
    incremental assignment over every article in published order. Useful
    after tuning thresholds, or to run once at the end of an ingest batch
    so earlier articles can join clusters formed by later ones."""
    conn.execute("DELETE FROM clusters")
    conn.execute("UPDATE articles SET cluster_id = NULL")
    conn.commit()

    articles = conn.execute(
        "SELECT id, title, summary, keywords FROM articles ORDER BY published_at ASC"
    ).fetchall()

    for a in articles:
        keywords = json.loads(a["keywords"] or "[]")
        if not keywords:
            keywords = extract_keywords(a["title"], a["summary"])
            conn.execute("UPDATE articles SET keywords = ? WHERE id = ?", (json.dumps(keywords), a["id"]))
        assign_or_create_cluster(conn, a["id"], keywords)

    conn.commit()

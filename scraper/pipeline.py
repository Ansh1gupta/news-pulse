"""
Main entry point: pull from all configured RSS feeds, normalize, dedupe,
fetch full article bodies, store, and (re)cluster.

Runs to completion and exits — safe to run repeatedly (cron, GitHub Actions,
or triggered on-demand from the Node API). Only new articles are processed
each time; existing ones are skipped by guid.
"""
import sys
import json
import time
from db import get_conn, init_db, guid_exists
from feeds import fetch_feed
from extract import fetch_full_text
from clustering import extract_keywords, assign_or_create_cluster
from config import FEEDS


def run():
    init_db()
    conn = get_conn()

    new_count = 0
    skipped_count = 0
    failed_extract_count = 0

    for source_name, feed_url in FEEDS:
        print(f"[pipeline] fetching {source_name} ...")
        articles = fetch_feed(source_name, feed_url)
        print(f"[pipeline] {source_name}: {len(articles)} entries in feed")

        for art in articles:
            if guid_exists(conn, art["guid"]):
                skipped_count += 1
                continue  # already ingested in a previous run

            body = fetch_full_text(art["url"])
            if not body:
                failed_extract_count += 1
                # keep going with just the summary rather than dropping the article

            keywords = extract_keywords(art["title"], art["summary"])

            cur = conn.execute(
                """INSERT INTO articles (guid, source, title, summary, body, url, published_at, keywords)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (art["guid"], art["source"], art["title"], art["summary"], body,
                 art["url"], art["published_at"], json.dumps(keywords)),
            )
            article_id = cur.lastrowid
            assign_or_create_cluster(conn, article_id, keywords)
            conn.commit()
            new_count += 1
            time.sleep(0.2)  # be polite to source servers

    conn.close()
    print(f"[pipeline] done. new={new_count} skipped_existing={skipped_count} extract_failures={failed_extract_count}")
    return {"new": new_count, "skipped": skipped_count, "extract_failures": failed_extract_count}


if __name__ == "__main__":
    try:
        result = run()
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(f"[pipeline] FATAL: {e}", file=sys.stderr)
        sys.exit(1)

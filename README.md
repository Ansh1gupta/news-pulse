# News Pulse — Topic-Clustered News Timeline

A small system that pulls live articles from RSS feeds, groups related articles into topic
clusters, and displays them as a visual timeline.

## Architecture

```
scraper/    Python — RSS ingestion, full-article extraction, keyword-overlap clustering, SQLite
backend/    Node.js/Express — REST API serving clusters/timeline, triggers the scraper
frontend/   Next.js/React — timeline visualization, cluster detail view, source filter
```

All three components share one SQLite database file (`data/news_pulse.db`). The Python
pipeline owns the schema and writes to it; the Node API reads (and triggers writes via
subprocess) from the same file. SQLite was chosen over Postgres/Mongo to keep setup to zero
external services — it's a single file, which is exactly what a solo take-home needs, though a
real multi-instance deployment would want Postgres instead (see Limitations).

## News sources used

- BBC News — `http://feeds.bbci.co.uk/news/rss.xml`
- NPR — `https://feeds.npr.org/1001/rss.xml`
- Al Jazeera — `https://www.aljazeera.com/xml/rss/all.xml`

(Configurable in `scraper/config.py`.)

## Topic-grouping approach

**Keyword-overlap grouping (Option A)** — no ML dependencies, deterministic, easy to explain:

1. For each article, pull significant words from `title (weighted 2x) + summary`, lowercased,
   with stopwords and short tokens stripped (`scraper/clustering.py::extract_keywords`).
2. For each new article, compare its keyword set against every existing cluster's aggregated
   keyword set. If the overlap is **≥ 3 shared words** (`MIN_SHARED_KEYWORDS` in `config.py`),
   join that cluster (and merge keywords into it). Otherwise, start a new cluster seeded with
   this article.
3. A cluster's label is its top 3 keywords, capitalized (e.g. "Election / Senate / Vote").

**Why this threshold:** 3 words balances precision and recall on headline-length text — 1–2
shared words is often coincidental ("says", "new"), while requiring 4+ made genuinely related
articles (same story, different headline wording) fall into separate clusters too often during
testing.

**Known limitation:** this is an incremental, order-dependent clustering — an article is
compared only against clusters that exist *at the time it's processed*, not against every other
article globally. Running the feeds in a different order can occasionally produce a different
clustering. A full TF-IDF + cosine-similarity batch pass (Option B) would be more stable but
adds a scikit-learn dependency and is a reasonable next step.

## Setup

### 1. Scraper
```bash
cd scraper
pip install -r requirements.txt
python pipeline.py   # first run creates data/news_pulse.db and pulls articles
```
Re-run any time — it skips articles already ingested (dedup by RSS guid/link) and only
processes new ones.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # adjust DB_PATH/PYTHON_BIN if needed
npm start               # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # point at your backend URL
npm run dev             # http://localhost:3000
```

## API

| Endpoint | Purpose |
|---|---|
| `GET /clusters` | List of clusters — label, article count, time range |
| `GET /clusters/:id` | Full cluster detail with articles, chronological |
| `GET /timeline` | Clusters shaped for plotting — start/end time, count |
| `POST /ingest/trigger` | Runs the Python pipeline as a subprocess, returns a job ID |
| `GET /ingest/status/:jobId` | Poll ingest job status |

## Deployment

| Component | Suggested platform | Notes |
|---|---|---|
| Frontend | Vercel | Set `NEXT_PUBLIC_API_BASE` to your backend's public URL |
| Backend | Render / Railway | Set `DB_PATH`, `PYTHON_BIN`; needs Python available in the same container/service to spawn the scraper, or point `SCRAPER_DIR` at a sidecar service |
| Scraper | GitHub Actions cron (`.github/workflows/scrape.yml`, included) or triggered on-demand via the backend | For scheduled runs to persist data on a platform like Render, point `DB_PATH` at a mounted persistent disk, not the ephemeral filesystem |
| Database | SQLite file on a persistent disk (Render/Railway volume) | See Limitations — swap for Postgres for true multi-instance/production use |

Environment variables are read via `.env` (backend) / `.env.local` (frontend) — configure the
equivalents in your hosting platform's dashboard, not committed to the repo.

## Limitations / what I'd improve with more time

- SQLite + subprocess-spawning works well for a single-instance deployment but doesn't scale to
  multiple backend replicas (file locking, and each replica would spawn its own scrape). Postgres
  + a proper job queue (e.g. BullMQ) would fix both.
- Clustering is order-dependent (see above) — a scheduled full `recluster_all()` pass
  (already implemented in `scraper/clustering.py`, just not wired into a cron) would improve
  cluster stability over time.
- Cross-source story merging (recognizing the same real-world story across two outlets as one
  event) is the noted stretch goal and isn't implemented — the keyword-overlap approach already
  approximates part of this when outlets use similar language, but two outlets covering the same
  story with very different headline vocabulary won't merge.

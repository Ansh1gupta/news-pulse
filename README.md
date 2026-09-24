# News Pulse — Topic-Clustered News Timeline

**Live Demo:** https://news-pulse-eight-phi.vercel.app/
**Backend API:** https://news-pulse-docker.onrender.com
**GitHub:** https://github.com/Ansh1gupta/news-pulse

News Pulse is a full-stack news aggregation and topic-clustering application that collects articles from multiple RSS feeds, extracts article content and keywords, groups related articles into topic clusters, and presents them through a visual news timeline.

## Features

* Aggregates news from multiple RSS feeds
* Extracts article content and keywords
* Automatically groups related articles into topic clusters
* Displays clustered news through a timeline interface
* Provides REST APIs for articles, clusters, and ingestion
* Supports manual news ingestion through the backend
* Prevents duplicate article ingestion
* Dockerized backend with both Node.js and Python
* Deployed frontend and backend

## Architecture

```text
RSS Feeds
    ↓
Python Scraper
    ↓
Article Extraction
    ↓
Keyword Extraction
    ↓
Topic Clustering
    ↓
SQLite Database
    ↓
Node.js + Express API
    ↓
Next.js / React Frontend
    ↓
News Timeline
```

## Project Structure

```text
news-pulse/
├── frontend/       Next.js / React frontend
├── backend/        Node.js + Express REST API
├── scraper/        Python RSS scraper and clustering
├── data/           SQLite database
├── Dockerfile      Docker configuration
└── .dockerignore
```

## Technology Stack

### Frontend

* Next.js
* React
* JavaScript
* Timeline visualization

### Backend

* Node.js
* Express.js
* REST API
* CORS
* UUID
* SQLite

### Scraper

* Python
* Feedparser
* Requests
* BeautifulSoup
* Trafilatura
* SQLite

### Deployment

* Vercel — Frontend
* Render — Backend
* Docker — Containerization
* SQLite — Database

## News Sources

The scraper currently collects news from:

* BBC News
* NPR
* Al Jazeera

Feed configuration is maintained in:

```text
scraper/config.py
```

The scraper checks the article GUID/link before inserting an article to prevent duplicate ingestion.

## Topic Clustering

News Pulse uses a deterministic keyword-overlap approach to group related articles.

The process is:

1. Extract important words from the article title and summary.
2. Remove stopwords and very short words.
3. Give higher importance to title keywords.
4. Compare article keywords with existing clusters.
5. Add the article to a matching cluster when enough keywords overlap.
6. Create a new cluster when no suitable match exists.
7. Update cluster keywords as new articles are added.

The clustering implementation is located in:

```text
scraper/clustering.py
```

### Current Limitation

The current clustering approach is incremental and order-dependent. Articles are compared with clusters that already exist at the time of processing.

A future version could use TF-IDF with cosine similarity or semantic embeddings for more advanced topic matching.

## Article Ingestion Pipeline

The main ingestion pipeline is:

```text
scraper/pipeline.py
```

It performs the following operations:

1. Initialize the database.
2. Fetch configured RSS feeds.
3. Check for duplicate articles.
4. Extract article content where available.
5. Extract keywords.
6. Store articles in SQLite.
7. Assign articles to existing clusters or create new clusters.
8. Continue processing if individual article extraction fails.
9. Report ingestion results.

## Database

News Pulse uses SQLite, allowing the project to run without an external database service.

Database:

```text
data/news_pulse.db
```

### `articles`

Stores:

* Article ID
* GUID
* Source
* Title
* Summary
* Article body
* URL
* Published timestamp
* Cluster ID
* Keywords
* Creation timestamp

### `clusters`

Stores:

* Cluster ID
* Cluster label
* Cluster keywords
* Creation timestamp

### `ingest_jobs`

Stores:

* Job ID
* Status
* Logs
* Start time
* Finish time

## Backend API

| Method | Endpoint                | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| GET    | `/health`               | Backend health check                |
| GET    | `/clusters`             | List available topic clusters       |
| GET    | `/clusters/:id`         | Get cluster details and articles    |
| GET    | `/timeline`             | Get timeline-ready news data        |
| POST   | `/ingest/trigger`       | Start the Python ingestion pipeline |
| GET    | `/ingest/status/:jobId` | Check ingestion job status          |

### Health Check

```text
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

### Trigger Ingestion

```text
POST /ingest/trigger
```

The backend starts the Python ingestion pipeline and returns a job ID.

Example:

```json
{
  "jobId": "example-job-id",
  "status": "running"
}
```

The ingestion job can then be monitored using:

```text
GET /ingest/status/:jobId
```

## Docker Deployment

The backend and Python scraper are deployed together using Docker.

The backend needs Python to execute the scraper as a subprocess. A Node.js-only production environment does not include Python, so the project uses Docker to package both runtimes and their dependencies into the same container.

The Docker setup:

1. Uses Node.js.
2. Installs Python.
3. Installs Node.js dependencies.
4. Installs Python dependencies.
5. Creates the application data directory.
6. Configures the Python runtime.
7. Starts the Express backend.

This allows the Node.js API to execute the Python scraper inside the production container.

## Deployment

### Frontend

The frontend is deployed on Vercel.

**Live Demo:**
https://news-pulse-eight-phi.vercel.app/

The frontend uses:

```text
NEXT_PUBLIC_API_BASE
```

to communicate with the backend API.

### Backend

The backend and scraper are deployed on Render using Docker.

**Backend API:**
https://news-pulse-docker.onrender.com

The service is built using the repository-root `Dockerfile`.

### GitHub

**Repository:**
https://github.com/Ansh1gupta/news-pulse

## Local Development

### 1. Run the Scraper

```bash
cd scraper
pip install -r requirements.txt
python pipeline.py
```

### 2. Run the Backend

```bash
cd backend
npm install
npm start
```

Backend:

```text
http://localhost:4000
```

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Configure `NEXT_PUBLIC_API_BASE` to point to the backend URL.

## Deployment Fixes

### SQLite Schema Initialization

The backend initializes the required SQLite tables when it starts, allowing a fresh deployment to create the database schema automatically.

### Python Runtime

The original Node.js-only deployment could not execute the Python scraper because Python was not available in the runtime environment.

Docker solved this by packaging Node.js and Python together.

### Scraper Path

The backend locates the scraper from the project structure:

```text
news-pulse/
├── backend/
├── scraper/
└── data/
```

## Limitations

### SQLite Persistence

The current deployment uses SQLite inside the container filesystem. Container filesystems can be ephemeral, so database data may be lost after certain restarts or redeployments.

A production version could use a persistent database such as PostgreSQL.

### Clustering Stability

The keyword-overlap clustering method is order-dependent.

A future version could use TF-IDF/cosine similarity or semantic embeddings for more stable topic grouping.

### Cross-Source Story Matching

Different news sources may describe the same event using different vocabulary. Semantic similarity could improve matching of related stories across sources.

### Article Extraction

Some websites may restrict or interrupt full article extraction. The pipeline is designed to continue processing and use available RSS information when full extraction is unavailable.

## Future Improvements

* PostgreSQL for persistent production storage
* Scheduled news ingestion
* Automated reclustering
* Semantic embeddings
* Improved cross-source story matching
* Additional news sources
* Search functionality
* Pagination
* Automated tests
* Improved monitoring and logging
* Topic trend analytics

## Project Links

* **Live Demo:** https://news-pulse-eight-phi.vercel.app/
* **Backend API:** https://news-pulse-docker.onrender.com
* **GitHub:** https://github.com/Ansh1gupta/news-pulse

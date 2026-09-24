# News Pulse — Topic-Clustered News Timeline

**Live Demo:** https://news-pulse-eight-phi.vercel.app/  
**Backend API:** https://news-pulse-docker.onrender.com  
**GitHub:** https://github.com/Ansh1gupta/news-pulse

News Pulse is a full-stack news aggregation and topic-clustering application that collects
articles from multiple RSS feeds, extracts article content and keywords, groups related
articles into topic clusters, and presents the results through a visual timeline interface.

## Architecture

```text
news-pulse/
├── scraper/       Python — RSS ingestion, article extraction, keyword extraction,
│                  and topic clustering
├── backend/       Node.js + Express — REST API, SQLite access, and scraper triggering
├── frontend/      Next.js/React — timeline visualization, cluster details, and source filtering
├── data/          SQLite database
├── Dockerfile     Docker image containing Node.js, Python, and project dependencies
└── .dockerignore
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
Node.js / Express API
    ↓
Next.js / React Frontend
    ↓
Visual News Timeline
Technology Stack
Frontend
Next.js
React
JavaScript
Timeline visualization
Cluster detail views
Source filtering
Backend
Node.js
Express
REST API
CORS
UUID-based ingestion jobs
Node's built-in node:sqlite
Scraper
Python
Feedparser
Requests
BeautifulSoup
Trafilatura
SQLite
Keyword-based clustering
Deployment
Vercel — frontend
Render — Docker-based backend
Docker — combines Node.js and Python into one deployable service
SQLite — application database
News Sources

The scraper currently uses these RSS feeds:

BBC News — http://feeds.bbci.co.uk/news/rss.xml
NPR — https://feeds.npr.org/1001/rss.xml
Al Jazeera — https://www.aljazeera.com/xml/rss/all.xml

The feed configuration is maintained in:

scraper/config.py

The scraper is designed to skip articles that have already been ingested using their RSS
GUID/link, preventing duplicate entries across repeated pipeline runs.

Topic Clustering

News Pulse currently uses a deterministic keyword-overlap clustering approach rather
than a machine-learning model.

The approach was chosen because it is:

Lightweight
Deterministic
Easy to understand
Easy to deploy
Free from additional ML dependencies
How clustering works

For each article:

Significant words are extracted from the article title and summary.
Title terms receive additional weight because headlines usually contain the strongest
topic signals.
Stopwords and very short tokens are removed.
The resulting keywords are compared with the keywords already associated with existing
clusters.
If at least 3 keywords overlap, the article is assigned to that cluster.
Otherwise, a new cluster is created.
Cluster keywords are updated as new related articles are added.

The main configuration values are controlled through:

scraper/config.py

including:

MIN_SHARED_KEYWORDS
TOP_KEYWORDS_PER_ARTICLE

The current default shared-keyword threshold is:

3
Cluster labels

Cluster labels are generated from the most important keywords in the cluster.

For example:

Election / Senate / Vote

The clustering logic is implemented in:

scraper/clustering.py
Current limitation

The current clustering process is incremental and therefore order-dependent.

An article is compared against clusters that already exist when that article is processed.
This means two articles covering the same story can occasionally end up in separate clusters
if their vocabulary is sufficiently different.

A future improvement would be a full batch clustering/reclustering process using techniques
such as TF-IDF and cosine similarity or semantic embeddings.

Article Ingestion Pipeline

The main pipeline is:

scraper/pipeline.py

The pipeline:

Initializes the SQLite database.
Fetches configured RSS feeds.
Normalizes feed entries.
Checks whether an article has already been ingested.
Extracts the full article text where possible.
Extracts keywords from the article.
Stores the article in SQLite.
Assigns the article to an existing cluster or creates a new cluster.
Continues processing remaining articles.
Reports ingestion statistics when finished.

Existing articles are skipped using their unique RSS GUID/link.

If full article extraction fails, the pipeline is designed to continue rather than crash the
entire ingestion run.

Database

News Pulse uses SQLite to avoid requiring an external database service during development
and deployment.

The database file is:

data/news_pulse.db

The main tables are:

articles

Stores:

Article ID
GUID
Source
Title
Summary
Full article body
URL
Published timestamp
Cluster ID
Keywords
Creation timestamp
clusters

Stores:

Cluster ID
Cluster label
Cluster keywords
Creation timestamp
ingest_jobs

Stores information about ingestion jobs, including:

Job ID
Status
Logs
Start time
Finish time

The Node.js backend uses Node's built-in:

node:sqlite

while the Python scraper uses Python's standard:

sqlite3

Both components work with the same database file.

Backend API

The Express backend provides the following endpoints:

EndpointDescription
GET /healthHealth check for the backend
GET /clustersReturns available topic clusters
GET /clusters/:idReturns cluster information and its articles
GET /timelineReturns timeline-ready cluster/article data
POST /ingest/triggerStarts the Python ingestion pipeline
GET /ingest/status/:jobIdReturns the status and logs of an ingestion job
Health check
GET /health

Response:

{
  "status": "ok"
}
Trigger ingestion
POST /ingest/trigger

The endpoint starts the Python pipeline as a background subprocess and immediately returns
a job ID.

Example:

{
  "jobId": "example-job-id",
  "status": "running"
}

The job can then be monitored through:

GET /ingest/status/:jobId
Docker Deployment

The backend and scraper are deployed together using Docker.

Why Docker?

The Node.js backend needs to execute:

scraper/pipeline.py

as a subprocess.

A normal Node-only Render Web Service does not include a Python interpreter. This caused
the ingestion endpoint to fail with errors such as:

spawn python3 ENOENT

The solution was to create a Docker image containing both:

Node.js
Python

along with their respective dependencies.

The root-level Dockerfile:

Starts from a Node.js 22 image.
Installs Python 3 and pip.
Copies the complete project.
Installs Node dependencies.
Installs Python dependencies.
Creates the application data directory.
Sets PYTHON_BIN=python3.
Starts the Express backend.

This allows the Node backend and Python scraper to operate inside the same production
container.

Docker Project Structure

Inside the Docker container the application is organized approximately as:

/app/
├── backend/
├── scraper/
├── frontend/
├── data/
└── Dockerfile

The scraper is available at:

/app/scraper

and the SQLite database is located at:

/app/data/news_pulse.db
Deployment
Frontend

The frontend is deployed on:

Vercel

Production URL:

https://news-pulse-eight-phi.vercel.app/

The frontend uses the environment variable:

NEXT_PUBLIC_API_BASE

to communicate with the deployed backend.

Frontend project root on Vercel:

frontend
Backend

The backend and Python scraper are deployed on:

Render

Deployment type:

Docker Web Service

Production API:

https://news-pulse-docker.onrender.com

The service is built from the repository-root:

Dockerfile
Automatic deployment

The project is connected to the main branch.

After changes are pushed to GitHub, the deployment platforms can rebuild and deploy the
updated application.

Local Development
1. Run the Python scraper

From the project root:

cd scraper
pip install -r requirements.txt
python pipeline.py

The first run initializes the database and begins ingesting articles.

Repeated runs skip articles that have already been ingested.

2. Run the backend

From the project root:

cd backend
npm install
npm start

The backend normally runs on:

http://localhost:4000

For local ingestion, make sure the Python executable is available and configure
PYTHON_BIN if necessary.

On Windows this may be:

python

while Linux/Docker commonly uses:

python3

The backend requires Node.js 22+ because it uses Node's built-in node:sqlite module.

3. Run the frontend

From the project root:

cd frontend
npm install
npm run dev

The frontend normally runs on:

http://localhost:3000

Configure:

NEXT_PUBLIC_API_BASE

to point to the desired backend URL.

Environment Variables

Important configuration variables include:

DB_PATH
PYTHON_BIN
MIN_SHARED_KEYWORDS
TOP_KEYWORDS_PER_ARTICLE
NEXT_PUBLIC_API_BASE

The exact values can differ between local development and production.

Secrets and local .env files are excluded from the Docker build through .dockerignore.

Deployment Fixes and Engineering Decisions

During deployment, several issues were identified and fixed.

SQLite schema initialization

The first deployed backend failed because the clusters table did not exist in the fresh
deployment environment.

The backend database initialization was updated so that the required tables are created
automatically when the application starts.

This allows a fresh deployment to initialize its database without manually creating tables.

Scraper path

The ingestion route was updated to correctly locate the scraper directory from the backend:

news-pulse/
├── backend/
├── scraper/
└── data/

The Node backend now resolves the scraper path correctly when running inside Docker.

Python runtime

The original Render Node runtime did not contain Python.

The ingestion endpoint therefore could not launch the Python scraper.

Docker was introduced to package:

Node.js + Python + dependencies

into a single deployable service.

Limitations
SQLite persistence

The current Render free-tier deployment stores SQLite inside the container filesystem.

That filesystem is ephemeral, so the database should not be treated as permanent production
storage.

A future production version should move persistent application data to a managed database
such as PostgreSQL.

Order-dependent clustering

The current keyword-overlap clustering approach is incremental and can be order-dependent.

A more advanced implementation could periodically perform a full reclustering pass using
TF-IDF/cosine similarity or semantic embeddings.

Cross-source story matching

Different news outlets can describe the same event using very different vocabulary.

A future semantic similarity system could improve cross-source story merging.

Article extraction

Full article extraction depends on the structure and availability of each source website.
If extraction fails for an article, the pipeline continues processing rather than terminating
the entire ingestion process.

Future Improvements

Potential future improvements include:

PostgreSQL for persistent production storage
Scheduled ingestion
Scheduled full reclustering
Semantic embeddings for better story matching
Better cross-source duplicate detection
More RSS/news sources
Search functionality
Pagination for large clusters
Improved monitoring and logging
Background job processing
Automated tests
More advanced analytics around topic trends
Project Links

Live Demo:
https://news-pulse-eight-phi.vercel.app/

Backend API:
https://news-pulse-docker.onrender.com

GitHub Repository:
https://github.com/Ansh1gupta/news-pulse
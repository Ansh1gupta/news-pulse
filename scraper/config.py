import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "news_pulse.db"))

# Feed list: (source_name, feed_url)
FEEDS = [
    ("BBC News", "http://feeds.bbci.co.uk/news/rss.xml"),
    ("NPR", "https://feeds.npr.org/1001/rss.xml"),
    ("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"),
]

# Clustering thresholds
MIN_SHARED_KEYWORDS = int(os.environ.get("MIN_SHARED_KEYWORDS", 3))
TOP_KEYWORDS_PER_ARTICLE = int(os.environ.get("TOP_KEYWORDS_PER_ARTICLE", 8))

# Article extraction
REQUEST_TIMEOUT = 10

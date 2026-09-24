import requests
import trafilatura
from bs4 import BeautifulSoup
from config import REQUEST_TIMEOUT


def fetch_full_text(url):
    """Fetch and extract the main article body text. Returns '' on failure —
    the pipeline should keep going, never crash, on a bad page."""
    try:
        resp = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 (NewsPulseBot/1.0)"},
        )
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        print(f"  [extract] fetch failed for {url}: {e}")
        return ""

    # Primary: trafilatura (handles most news sites well)
    try:
        text = trafilatura.extract(html, include_comments=False, include_tables=False)
        if text and len(text.strip()) > 200:
            return text.strip()
    except Exception as e:
        print(f"  [extract] trafilatura failed for {url}: {e}")

    # Fallback: plain BeautifulSoup, grab biggest cluster of <p> tags
    try:
        soup = BeautifulSoup(html, "html.parser")
        paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        text = "\n".join(p for p in paragraphs if len(p) > 40)
        return text.strip()
    except Exception as e:
        print(f"  [extract] BeautifulSoup fallback failed for {url}: {e}")
        return ""

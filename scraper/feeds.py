import re
import time
import feedparser
from datetime import datetime, timezone, timedelta
from html import unescape
from bs4 import BeautifulSoup

MAX_ARTICLE_AGE_DAYS = 45  # real RSS items shouldn't be older than this; older = feed filler/junk


def _clean_html(raw):
    if not raw:
        return ""
    text = BeautifulSoup(unescape(raw), "html.parser").get_text(" ", strip=True)
    return re.sub(r"\s+", " ", text).strip()


def _normalize_date(entry):
    for field in ("published_parsed", "updated_parsed"):
        val = entry.get(field)
        if val:
            try:
                dt = datetime.fromtimestamp(time.mktime(val), tz=timezone.utc)
                return dt.isoformat()
            except Exception:
                pass
    return datetime.now(timezone.utc).isoformat()


def _get_summary(entry):
    for field in ("content", "summary", "description"):
        val = entry.get(field)
        if not val:
            continue
        if isinstance(val, list) and val:
            val = val[0].get("value", "")
        return _clean_html(val)
    return ""


def fetch_feed(source_name, feed_url):
    articles = []
    try:
        parsed = feedparser.parse(feed_url)
    except Exception as e:
        print(f"[feeds] failed to parse {source_name} ({feed_url}): {e}")
        return articles

    if getattr(parsed, "bozo", False) and not parsed.entries:
        print(f"[feeds] {source_name} feed looked malformed and returned no entries")

    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_ARTICLE_AGE_DAYS)
    skipped_stale = 0

    for entry in parsed.entries:
        guid = entry.get("id") or entry.get("guid") or entry.get("link")
        link = entry.get("link")
        title = _clean_html(entry.get("title", ""))
        if not guid or not link or not title:
            continue
        published_at = _normalize_date(entry)
        if datetime.fromisoformat(published_at) < cutoff:
            skipped_stale += 1
            continue  # evergreen/filler entry, not real news
        articles.append({
            "guid": guid,
            "source": source_name,
            "title": title,
            "summary": _get_summary(entry),
            "url": link,
            "published_at": published_at,
        })

    if skipped_stale:
        print(f"[feeds] {source_name}: skipped {skipped_stale} stale/filler entries older than {MAX_ARTICLE_AGE_DAYS} days")
    return articles

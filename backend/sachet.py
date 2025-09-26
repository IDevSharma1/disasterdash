import requests
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

SACHET_FEED_URL = "https://sachet.ndma.gov.in/feeds/alerts/rss"

# In-memory cache for demo (replace with DB in production)
indian_incidents = []

def fetch_sachet_incidents():
    import feedparser
    feed = feedparser.parse(SACHET_FEED_URL)
    incidents = []
    for entry in feed.entries:
        incidents.append({
            "title": entry.title,
            "description": entry.summary,
            "link": entry.link,
            "published": entry.published,
            "timestamp": datetime.strptime(entry.published, "%a, %d %b %Y %H:%M:%S %Z").isoformat() if hasattr(entry, 'published') else None,
            "location": entry.get("geo_lat", None),  # Sachet RSS may have geo tags
        })
    return incidents

@router.get("/incidents/india")
def get_india_incidents():
    global indian_incidents
    # Always fetch fresh for demo; cache for production
    indian_incidents = fetch_sachet_incidents()
    return {"incidents": indian_incidents}

# Optionally, add a background task to refresh periodically

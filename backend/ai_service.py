def fetch_reliefweb_disasters():
    url = "https://api.reliefweb.int/v1/disasters"
    params = {
        "appname": "disasterdash",
        "profile": "full",
        "limit": 10,
        "sort[]": "date:desc"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        incidents = []
        for item in data.get("data", []):
            fields = item.get("fields", {})
            incidents.append({
                "city": fields.get("country", [{}])[0].get("name", "Unknown"),
                "country": fields.get("country", [{}])[0].get("name", "Unknown"),
                "severity": fields.get("severity", "unknown"),
                "description": fields.get("name", "Disaster"),
                "latitude": fields.get("country", [{}])[0].get("lat", 0),
                "longitude": fields.get("country", [{}])[0].get("lon", 0),
                "source": "ReliefWeb API",
                "type": fields.get("type", [{}])[0].get("name", "unknown"),
                "date": fields.get("date", {}).get("created", "")
            })
        return incidents
    except Exception as e:
        logging.error(f"ReliefWeb fetch failed: {e}")
        return []

def fetch_gdacs_disasters():
    url = "https://www.gdacs.org/gdacsapi/api/events/geteventlist"
    params = {
        "profile": "full",
        "limit": 10
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        incidents = []
        for event in data.get("events", []):
            incidents.append({
                "city": event.get("country", "Unknown"),
                "country": event.get("country", "Unknown"),
                "severity": event.get("severity", "unknown"),
                "description": event.get("eventtype", "Disaster"),
                "latitude": event.get("lat", 0),
                "longitude": event.get("lon", 0),
                "source": "GDACS API",
                "type": event.get("eventtype", "unknown"),
                "date": event.get("fromdate", "")
            })
        return incidents
    except Exception as e:
        logging.error(f"GDACS fetch failed: {e}")
        return []

import os
import json
import logging
import requests
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import incidents_collection
from ws import broadcast_incident

logging.basicConfig(level=logging.INFO)

# === Severity classifier ===
def classify_severity(mag: float) -> int:
    if mag >= 6.0:
        return 90
    elif mag >= 4.5:
        return 60
    else:
        return 30

# === USGS Earthquake API fetch ===
def fetch_usgs_earthquakes():
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    params = {
        "format": "geojson",
        "limit": 10,
        "orderby": "time"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        incidents = []
        for feat in data.get("features", []):
            props = feat["properties"]
            geom = feat["geometry"]
            incidents.append({
                "city": props.get("place", "Unknown"),
                "country": "",  # USGS does not provide country
                "severity": "critical" if props.get("mag", 0) >= 6.0 else "moderate" if props.get("mag", 0) >= 4.5 else "minor",
                "description": props.get("title", "Earthquake"),
                "latitude": geom["coordinates"][1],
                "longitude": geom["coordinates"][0],
                "source": "USGS Earthquake API",
                "aiSeverityScore": classify_severity(props.get("mag", 0)),
                "magnitude": props.get("mag", 0),
                "time": props.get("time", 0)
            })
        return incidents
    except Exception as e:
        logging.error(f"USGS fetch failed: {e}")
        return []

# === Insert incidents into DB + WebSocket broadcast ===
async def store_and_broadcast(incidents: list):
    for incident in incidents:
        result = await incidents_collection.insert_one(incident)
        incident["_id"] = str(result.inserted_id)
        await broadcast_incident(incident)
    logging.info(f"Stored and broadcasted {len(incidents)} incidents.")

# === Main scheduled fetch task ===
async def fetch_incidents_from_ai():
    logging.info("Fetching incidents from USGS, ReliefWeb, and GDACS APIs...")
    incidents = []
    incidents += fetch_usgs_earthquakes()
    incidents += fetch_reliefweb_disasters()
    incidents += fetch_gdacs_disasters()
    if incidents:
        await store_and_broadcast(incidents)
    else:
        logging.warning("No incidents returned from any source.")

# === APScheduler setup ===
scheduler = AsyncIOScheduler()
scheduler.add_job(fetch_incidents_from_ai, "interval", minutes=10)
scheduler.start()

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from database import incidents_collection
from auth import verify_clerk_token

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


class Location(BaseModel):
    lat: float
    lng: float


class Incident(BaseModel):
    title: str
    description: str
    location: Location
    severity: str = Field(default="pending")
    aiSeverityScore: Optional[int] = None
    status: str = Field(default="pending")
    reporterId: Optional[str] = None
    createdAt: Optional[str] = None


def serialize_incident(incident):
    incident["_id"] = str(incident["_id"])
    return incident


@router.get("/global")
async def get_global_incidents(limit: int = 50, skip: int = 0):
    incidents = await incidents_collection.find({}).skip(skip).limit(limit).to_list(length=limit)
    return [serialize_incident(i) for i in incidents]


@router.get("/local")
async def get_local_incidents(lat: float, lng: float, radius_km: float = 50):
    incidents = await incidents_collection.find(
        {
            "location": {
                "$nearSphere": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": radius_km * 1000,
                }
            }
        }
    ).to_list(100)
    return [serialize_incident(i) for i in incidents]


@router.post("/report", status_code=status.HTTP_201_CREATED)
async def report_incident(incident: Incident, user=Depends(verify_clerk_token)):
    incident_dict = incident.dict()
    incident_dict["reporterId"] = user.get("sub")
    incident_dict["createdAt"] = datetime.utcnow().isoformat()
    incident_dict["location"] = {
        "type": "Point",
        "coordinates": [incident.location.lng, incident.location.lat],
    }

    result = await incidents_collection.insert_one(incident_dict)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create incident")
    return {"id": str(result.inserted_id), "message": "Incident reported"}

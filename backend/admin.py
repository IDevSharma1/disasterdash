from fastapi import APIRouter, Depends, HTTPException, status
from database import incidents_collection
from auth import verify_clerk_token
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/api/admin", tags=["admin"])


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    aiSeverityScore: Optional[int] = None
    verified: Optional[bool] = None


def serialize_incident(incident):
    incident["_id"] = str(incident["_id"])
    return incident


@router.get("/incidents")
async def get_all_incidents(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    incidents = await incidents_collection.find(query).to_list(200)
    return [serialize_incident(i) for i in incidents]


@router.patch("/incidents/{incident_id}")
async def update_incident(
    incident_id: str,
    update: IncidentUpdate,
    user=Depends(verify_clerk_token),
):
    if not ObjectId.is_valid(incident_id):
        raise HTTPException(status_code=400, detail="Invalid incident ID")

    result = await incidents_collection.update_one(
        {"_id": ObjectId(incident_id)}, {"$set": update.dict(exclude_unset=True)}
    )
    if result.modified_count == 0:
        raise HTTPException(
            status_code=404, detail="Incident not found or not updated"
        )
    return {"message": "Incident updated"}


@router.delete("/incidents/{incident_id}")
async def delete_incident(incident_id: str, user=Depends(verify_clerk_token)):
    if not ObjectId.is_valid(incident_id):
        raise HTTPException(status_code=400, detail="Invalid incident ID")

    result = await incidents_collection.delete_one({"_id": ObjectId(incident_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident deleted"}


@router.get("/incidents/global")
async def get_global_incidents():
    incidents = await incidents_collection.find().to_list(200)
    return [serialize_incident(i) for i in incidents]

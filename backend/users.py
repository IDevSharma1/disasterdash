from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from database import users_collection
from auth import verify_clerk_token
from ai_service import fetch_incidents_from_ai
import asyncio

router = APIRouter(prefix="/api/users", tags=["users"])


class User(BaseModel):
    id: str
    email: str
    firstName: str = ""
    lastName: str = ""


@router.post("/", status_code=status.HTTP_201_CREATED)
async def save_user(user: User, clerk=Depends(verify_clerk_token)):
    await users_collection.update_one({"id": user.id}, {"$set": user.dict()}, upsert=True)

    # Trigger Gemini AI update if DB has < 10 incidents
    count = await users_collection.estimated_document_count()
    if count < 10:
        asyncio.create_task(fetch_incidents_from_ai())

    return {"message": "User saved and AI update triggered"}

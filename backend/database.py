from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URI

client = AsyncIOMotorClient(MONGODB_URI)
db = client["disasterdash"]

users_collection = db["users"]
incidents_collection = db["incidents"]
reports_logs_collection = db["reports_logs"]

# Indexes
async def setup_indexes():
    await incidents_collection.create_index([("location", "2dsphere")])
    await incidents_collection.create_index("title")
    await incidents_collection.create_index("createdAt")

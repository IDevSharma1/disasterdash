import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "your_mongo_atlas_uri")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["disasterdash"]

# Collections
incidents_collection = db["incidents"]
users_collection = db["users"]

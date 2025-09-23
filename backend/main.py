from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio

from incidents import router as incidents_router
from admin import router as admin_router
from ws import router as ws_router
from users import router as users_router
from ai_service import fetch_incidents_from_ai

# === Logging ===
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="DisasterDash Backend")

# === CORS for frontend ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Routers ===
app.include_router(incidents_router)
app.include_router(admin_router)
app.include_router(ws_router)
app.include_router(users_router)

@app.on_event("startup")
async def startup_event():
    logging.info("🚀 DisasterDash Backend is starting up...")

    # Run Gemini fetch once immediately on startup
    asyncio.create_task(fetch_incidents_from_ai())

    logging.info("✅ Startup tasks scheduled.")

@app.get("/")
def read_root():
    return {"message": "DisasterDash Backend is running!"}

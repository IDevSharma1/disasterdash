from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from typing import Dict
import asyncio

router = APIRouter()

active_connections: Dict[str, WebSocket] = {}


@router.websocket("/ws/incidents")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_id = str(id(websocket))
    active_connections[user_id] = websocket

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.pop(user_id, None)


async def broadcast_incident(incident):
    for ws in list(active_connections.values()):
        try:
            await ws.send_json(incident)
        except Exception:
            active_connections.pop(str(id(ws)), None)

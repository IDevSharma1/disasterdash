from fastapi import WebSocket

# Active WebSocket clients
clients: list[WebSocket] = []

async def broadcast_message(message: dict):
    """Send message to all connected clients"""
    disconnected = []
    for client in clients:
        try:
            await client.send_json(message)
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        clients.remove(client)

import json
from typing import Dict, Set
from fastapi import WebSocket

# Maps ticket_id → set of connected WebSocket clients
_connections: Dict[str, Set[WebSocket]] = {}


async def connect(ticket_id: str, ws: WebSocket):
    await ws.accept()
    _connections.setdefault(ticket_id, set()).add(ws)


def disconnect(ticket_id: str, ws: WebSocket):
    if ticket_id in _connections:
        _connections[ticket_id].discard(ws)
        if not _connections[ticket_id]:
            del _connections[ticket_id]


async def broadcast(ticket_id: str, event: dict):
    """Push a status update to all clients watching this ticket."""
    dead = set()
    for ws in _connections.get(ticket_id, set()):
        try:
            await ws.send_text(json.dumps(event))
        except Exception:
            dead.add(ws)
    for ws in dead:
        disconnect(ticket_id, ws)

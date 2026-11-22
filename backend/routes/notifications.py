import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from database import db

router = APIRouter(prefix="/api", tags=["Notifications & Real-time SSE Stream"])

# In-memory list of active SSE subscriber queues
active_subscribers: List[asyncio.Queue] = []

async def broadcast_event(event_type: str, data: Dict[str, Any]):
    message = json.dumps({"type": event_type, "data": data, "timestamp": datetime.utcnow().isoformat()})
    for queue in active_subscribers:
        try:
            queue.put_nowait(message)
        except Exception:
            pass

class CreateNotificationRequest(BaseModel):
    user_id: str
    role: str = "artisan"
    type: str = "info"
    title: str
    message: str
    link_tab: Optional[str] = None

@router.get("/notifications/{user_id}")
async def get_notifications(user_id: str):
    rows = await db.fetch_all(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30",
        (user_id,)
    )
    items = [dict(r) for r in rows]
    unread = sum(1 for it in items if not it["is_read"])
    return {
        "success": True,
        "notifications": items,
        "unread_count": unread
    }

@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    await db.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    return {"success": True, "message": "Marked as read."}

@router.patch("/notifications/user/{user_id}/read-all")
async def mark_all_notifications_read(user_id: str):
    await db.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    return {"success": True, "message": "All marked as read."}

@router.post("/notifications")
async def create_notification(req: CreateNotificationRequest):
    notif_id = f"notif_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.utcnow().isoformat()
    await db.execute(
        """INSERT INTO notifications (id, user_id, role, type, title, message, link_tab, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
        (notif_id, req.user_id, req.role, req.type, req.title, req.message, req.link_tab, now_iso)
    )
    notif_dict = {
        "id": notif_id,
        "user_id": req.user_id,
        "role": req.role,
        "type": req.type,
        "title": req.title,
        "message": req.message,
        "link_tab": req.link_tab,
        "created_at": now_iso
    }
    await broadcast_event("new_notification", notif_dict)
    return {"success": True, "notification": notif_dict}

@router.get("/events/stream")
async def event_stream(request: Request):
    """
    Server-Sent Events (SSE) live stream (§6 Mandate):
    Pushes live events (new order, payment success, inquiry, stock updates)
    to connected buyers and sellers without needing full page refresh.
    """
    queue = asyncio.Queue()
    active_subscribers.append(queue)

    async def event_generator():
        try:
            # Send initial connected banner
            initial_msg = json.dumps({"type": "connected", "data": {"message": "Live Real-Time Event Stream Active"}})
            yield f"data: {initial_msg}\n\n"

            while True:
                # Disconnect check
                if await request.is_disconnected():
                    break

                try:
                    # Wait for next broadcast message or send keepalive ping every 15s
                    message = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {message}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in active_subscribers:
                active_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

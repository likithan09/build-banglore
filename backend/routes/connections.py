import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from database import db
from kafka_service import kafka_service
from services.matching_engine import matching_engine

router = APIRouter(prefix="/api", tags=["Buyer <-> Seller Inquiries & Connections"])

class CreateInquiryRequest(BaseModel):
    buyer_id: str
    product_id: str
    message: str = Field(..., min_length=2)
    quantity_needed: int = Field(1, gt=0)
    target_timeline: Optional[str] = "Within 2-4 weeks"

class SendMessageRequest(BaseModel):
    sender_id: str
    sender_role: str = "buyer"
    message_text: str = Field(..., min_length=1)

@router.post("/inquiries")
async def create_inquiry(req: CreateInquiryRequest):
    product = await db.fetch_one("SELECT * FROM products WHERE id = ?", (req.product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    buyer = await db.fetch_one("SELECT * FROM buyer_profiles WHERE user_id = ?", (req.buyer_id,))
    buyer_name = buyer["company_name"] if buyer else "Wholesale Buyer"
    target_seller_id = product["seller_id"] or "usr_artisan_channapatna"
    if target_seller_id == "usr_buyer_demo":
        target_seller_id = "usr_artisan_channapatna"

    inquiry_id = f"inq_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat()

    await db.execute(
        """INSERT INTO inquiries 
           (id, buyer_id, seller_id, product_id, message, quantity_needed, target_timeline, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)""",
        (
            inquiry_id,
            req.buyer_id,
            target_seller_id,
            req.product_id,
            req.message,
            req.quantity_needed,
            req.target_timeline,
            created_at
        )
    )

    # Notify artisan
    notif_id = f"notif_{uuid.uuid4().hex[:10]}"
    await db.execute(
        """INSERT INTO notifications (id, user_id, role, type, title, message, link_tab, is_read, created_at)
           VALUES (?, ?, 'artisan', 'new_inquiry', 'New Wholesale Inquiry Received', ?, 'artisan-inbox', 0, ?)""",
        (notif_id, target_seller_id, f"{buyer_name} inquired about {req.quantity_needed} units of {product['title']}.", created_at)
    )

    # Emit Kafka Event
    await kafka_service.emit_event("inquiry.created", {
        "inquiry_id": inquiry_id,
        "buyer_id": req.buyer_id,
        "buyer_name": buyer_name,
        "seller_id": target_seller_id,
        "product_id": req.product_id,
        "product_title": product["title"],
        "quantity_needed": req.quantity_needed,
        "timestamp": created_at
    }, key=inquiry_id)

    return {
        "success": True,
        "message": "Inquiry sent to artisan. Pending review.",
        "inquiry_id": inquiry_id,
        "status": "pending"
    }

@router.get("/inquiries/seller/{seller_id}")
@router.get("/seller/{seller_id}/inquiries")
async def get_seller_inquiries(seller_id: str):
    rows = await db.fetch_all(
        """SELECT i.*, p.title as product_title, p.image_url as product_image,
                  COALESCE(bp.company_name, 'Desi Heritage Retail Enterprises') as company_name, 
                  COALESCE(bp.contact_name, 'Ananya Sharma') as contact_name, 
                  COALESCE(bp.city, 'Bengaluru') as buyer_city, 
                  COALESCE(bp.state, 'Karnataka') as buyer_state
           FROM inquiries i
           JOIN products p ON i.product_id = p.id
           LEFT JOIN buyer_profiles bp ON i.buyer_id = bp.user_id
           WHERE i.seller_id = ? 
              OR (i.seller_id = 'usr_artisan_channapatna' AND ? != '')
              OR ? = 'usr_artisan_channapatna'
           ORDER BY i.created_at DESC""",
        (seller_id, seller_id, seller_id)
    )
    results = []
    for r in rows:
        item = dict(r)
        # Compute match score
        try:
            match_info = await matching_engine.calculate_match_score(
                seller_id=seller_id,
                desired_category="Handicrafts",
                quantity_needed=item["quantity_needed"],
                buyer_state=item.get("buyer_state")
            )
            item["match_affinity"] = match_info["match_score"]
            item["why_matched"] = match_info["why_matched"]
        except Exception:
            item["match_affinity"] = 92
            item["why_matched"] = "High compatibility based on artisan craft specialty and wholesale volume."
        results.append(item)

    return {"success": True, "count": len(results), "inquiries": results}

@router.get("/inquiries/buyer/{buyer_id}")
async def get_buyer_inquiries(buyer_id: str):
    rows = await db.fetch_all(
        """SELECT i.*, p.title as product_title, p.image_url as product_image,
                  sp.name as artisan_name, sp.craft_name, sp.city as artisan_city, sp.state as artisan_state, sp.verification_type
           FROM inquiries i
           JOIN products p ON i.product_id = p.id
           LEFT JOIN seller_profiles sp ON i.seller_id = sp.user_id
           WHERE i.buyer_id = ?
           ORDER BY i.created_at DESC""",
        (buyer_id,)
    )
    return {"success": True, "count": len(rows), "inquiries": [dict(r) for r in rows]}

@router.post("/inquiries/{inquiry_id}/accept")
async def accept_inquiry(inquiry_id: str):
    inquiry = await db.fetch_one("SELECT * FROM inquiries WHERE id = ?", (inquiry_id,))
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found.")

    await db.execute("UPDATE inquiries SET status = 'accepted' WHERE id = ?", (inquiry_id,))

    conn_id = f"conn_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat()
    await db.execute(
        """INSERT OR REPLACE INTO connections (id, inquiry_id, buyer_id, seller_id, status, created_at)
           VALUES (?, ?, ?, ?, 'active', ?)""",
        (conn_id, inquiry_id, inquiry["buyer_id"], inquiry["seller_id"], created_at)
    )

    # Initial message in thread
    msg_id = f"msg_{uuid.uuid4().hex[:10]}"
    await db.execute(
        """INSERT INTO messages (id, connection_id, sender_id, sender_role, message_text, created_at)
           VALUES (?, ?, ?, 'buyer', ?, ?)""",
        (msg_id, conn_id, inquiry["buyer_id"], inquiry["message"], created_at)
    )

    # Notify buyer of acceptance
    notif_id = f"notif_{uuid.uuid4().hex[:10]}"
    await db.execute(
        """INSERT INTO notifications (id, user_id, role, type, title, message, link_tab, is_read, created_at)
           VALUES (?, ?, 'buyer', 'inquiry_accepted', 'Inquiry Accepted by Artisan!', 'The artisan accepted your inquiry and opened a direct partnership channel.', 'connections', 0, ?)""",
        (notif_id, inquiry["buyer_id"], created_at)
    )

    await kafka_service.emit_event("connection.accepted", {
        "connection_id": conn_id,
        "inquiry_id": inquiry_id,
        "buyer_id": inquiry["buyer_id"],
        "seller_id": inquiry["seller_id"],
        "timestamp": created_at
    }, key=conn_id)

    return {
        "success": True,
        "message": "Connection accepted. Direct relationship established.",
        "connection_id": conn_id
    }

@router.post("/inquiries/{inquiry_id}/decline")
async def decline_inquiry(inquiry_id: str):
    inquiry = await db.fetch_one("SELECT * FROM inquiries WHERE id = ?", (inquiry_id,))
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found.")

    await db.execute("UPDATE inquiries SET status = 'declined' WHERE id = ?", (inquiry_id,))
    return {"success": True, "message": "Inquiry declined."}

@router.get("/connections/{user_id}")
async def get_connections(user_id: str):
    rows = await db.fetch_all(
        """SELECT c.*, i.message as initial_message, i.quantity_needed,
                  p.title as product_title, p.image_url as product_image,
                  sp.name as artisan_name, sp.craft_name, sp.state as artisan_state, sp.verification_type,
                  bp.company_name, bp.contact_name as buyer_contact, bp.email as buyer_email, bp.state as buyer_state
           FROM connections c
           JOIN inquiries i ON c.inquiry_id = i.id
           JOIN products p ON i.product_id = p.id
           LEFT JOIN seller_profiles sp ON c.seller_id = sp.user_id
           LEFT JOIN buyer_profiles bp ON c.buyer_id = bp.user_id
           WHERE c.buyer_id = ? OR c.seller_id = ?
           ORDER BY c.created_at DESC""",
        (user_id, user_id)
    )
    return {"success": True, "count": len(rows), "connections": [dict(r) for r in rows]}

@router.get("/connections/{connection_id}/messages")
async def get_connection_messages(connection_id: str):
    rows = await db.fetch_all(
        "SELECT * FROM messages WHERE connection_id = ? ORDER BY created_at ASC",
        (connection_id,)
    )
    return {"success": True, "messages": [dict(r) for r in rows]}

@router.post("/connections/{connection_id}/messages")
async def send_connection_message(connection_id: str, req: SendMessageRequest):
    msg_id = f"msg_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.utcnow().isoformat()
    await db.execute(
        """INSERT INTO messages (id, connection_id, sender_id, sender_role, message_text, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (msg_id, connection_id, req.sender_id, req.sender_role, req.message_text, now_iso)
    )
    return {
        "success": True,
        "message": {
            "id": msg_id,
            "connection_id": connection_id,
            "sender_id": req.sender_id,
            "sender_role": req.sender_role,
            "message_text": req.message_text,
            "created_at": now_iso
        }
    }

class NegotiationCreateRequest(BaseModel):
    product_id: str
    product_title: str
    product_price: float
    buyer_id: str
    buyer_name: Optional[str] = "Buyer"
    buyer_lang: Optional[str] = "en"
    seller_id: Optional[str] = "usr_artisan_channapatna"
    seller_name: Optional[str] = "Artisan"
    seller_lang: Optional[str] = "hi"

@router.post("/negotiation/create")
async def create_negotiation_session(req: NegotiationCreateRequest):
    session_id = f"neg_{req.product_id}_{uuid.uuid4().hex[:6]}"
    return {
        "success": True,
        "session": {
            "session_id": session_id,
            "product_id": req.product_id,
            "product_title": req.product_title,
            "product_price": req.product_price,
            "buyer_id": req.buyer_id,
            "buyer_name": req.buyer_name,
            "buyer_lang": req.buyer_lang,
            "seller_id": req.seller_id,
            "seller_name": req.seller_name,
            "seller_lang": req.seller_lang,
            "status": "active",
            "messages": [
                {
                    "id": f"msg_init_{session_id}",
                    "sender_role": "artisan",
                    "original_text": f"नमस्ते! मैं {req.seller_name} हूँ। आप {req.product_title} के थोक ऑर्डर या विशिष्ट डिज़ाइन के बारे में क्या जानना चाहते हैं?",
                    "translated_text": f"Namaste! I am {req.seller_name}. What would you like to know about bulk orders or custom designs for {req.product_title}?",
                    "sender_lang": "hi",
                    "receiver_lang": req.buyer_lang,
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
        }
    }


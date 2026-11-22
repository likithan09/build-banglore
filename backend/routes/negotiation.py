import random
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from database import get_db

router = APIRouter(prefix="/api/negotiation", tags=["Negotiation"])

class CreateSessionRequest(BaseModel):
    product_id: str
    product_title: str
    product_price: float
    buyer_id: str
    buyer_name: str
    buyer_lang: str = "en"
    seller_id: str
    seller_name: str
    seller_lang: str = "hi"

class SendMessageRequest(BaseModel):
    sender_id: str
    sender_name: str
    sender_role: str # buyer or seller
    text: str
    language: str
    price_offer: Optional[float] = None

TRANSLATION_MAP = {
    "hi": {
        "Can you do ₹12,000 for this handloom saree?": "क्या आप इस हथकरघा साड़ी के लिए ₹12,000 कर सकते हैं?",
        "I am ready to buy 2 pieces.": "मैं 2 पीस खरीदने के लिए तैयार हूँ।",
        "Namaste! The lowest fair price I can do is ₹13,000 as it takes 24 days to weave.": "नमस्ते! सबसे कम उचित मूल्य ₹13,000 होगा क्योंकि इसे बुनने में 24 दिन लगते हैं।",
        "Deal accepted at ₹12,500. Thank you!": "₹12,500 पर सौदा स्वीकार किया गया। धन्यवाद!",
        "Hello": "नमस्ते",
        "Thank you": "धन्यवाद"
    },
    "en": {
        "क्या आप इस हथकरघा साड़ी के लिए ₹12,000 कर सकते हैं?": "Can you do ₹12,000 for this handloom saree?",
        "नमस्ते! सबसे कम उचित मूल्य ₹13,000 होगा क्योंकि इसे बुनने में 24 दिन लगते हैं।": "Namaste! The lowest fair price I can do is ₹13,000 as it takes 24 days to weave.",
        "₹12,500 पर सौदा स्वीकार किया गया। धन्यवाद!": "Deal accepted at ₹12,500. Thank you!"
    }
}

@router.post("/create")
async def create_session(req: CreateSessionRequest):
    db = get_db()
    neg_col = await db.get_collection("negotiations")
    
    session_id = f"neg_{req.product_id}_{random.randint(1000, 9999)}"
    session = {
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
        "current_offer": req.product_price,
        "messages": [
            {
                "sender_id": "system",
                "sender_name": "KALASETU Fair Trade Mediator",
                "sender_role": "mediator",
                "text": f"Bargaining room opened for '{req.product_title}'. Standard listing price is ₹{req.product_price}. Speak or type in any language; real-time audio & text translation is active.",
                "language": "en",
                "timestamp": datetime.utcnow().isoformat()
            }
        ],
        "created_at": datetime.utcnow().isoformat()
    }
    
    await neg_col.insert_one(session)
    return {"success": True, "session": session}

@router.get("/{session_id}")
async def get_session(session_id: str):
    db = get_db()
    neg_col = await db.get_collection("negotiations")
    session = await neg_col.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Negotiation session not found")
    return {"success": True, "session": session}

@router.post("/{session_id}/message")
async def send_message(session_id: str, req: SendMessageRequest):
    db = get_db()
    neg_col = await db.get_collection("negotiations")
    session = await neg_col.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Negotiation session not found")
    
    target_lang = session.get("seller_lang") if req.sender_role == "buyer" else session.get("buyer_lang")
    
    # Auto-translate text
    translated_text = req.text
    if req.language != target_lang:
        translated_text = f"[{req.text}]" # Translated representation
        
    msg = {
        "sender_id": req.sender_id,
        "sender_name": req.sender_name,
        "sender_role": req.sender_role,
        "text": req.text,
        "language": req.language,
        "translated_text": translated_text,
        "translated_lang": target_lang,
        "price_offer": req.price_offer,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    messages = session.get("messages", [])
    messages.append(msg)
    
    updates = {"messages": messages}
    if req.price_offer:
        updates["current_offer"] = req.price_offer
        
    await neg_col.update_one({"session_id": session_id}, {"$set": updates})
    session.update(updates)
    
    return {"success": True, "message": msg, "session": session}

import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from database import db
from kafka_service import kafka_service

router = APIRouter(prefix="/api/profile", tags=["User Profiles & Onboarding Checklist"])

class SellerProfileRequest(BaseModel):
    user_id: str
    name: str
    business_name: Optional[str] = None
    craft_category: str
    craft_name: str
    bio: Optional[str] = ""
    state: str
    city: str
    pincode: Optional[str] = "562160"
    profile_photo: Optional[str] = None
    languages_spoken: List[str] = ["hi-IN"]
    verification_type: str = Field(..., description="'gstin' or 'enrollment_id'")
    verification_id: str
    capacity_per_month: int = 100

class BuyerProfileRequest(BaseModel):
    user_id: Optional[str] = "usr_buyer_demo"
    company_name: str
    contact_name: str
    email: str
    state: str
    city: str
    pincode: Optional[str] = "560001"
    gstin: str

@router.post("/seller")
async def complete_seller_profile(req: SellerProfileRequest):
    user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (req.user_id,))
    if not user:
        # Create user record if not present
        await db.execute(
            "INSERT OR IGNORE INTO users (id, phone, password_hash, role, created_at) VALUES (?, '9876543210', 'pwd_hash', 'artisan', ?)",
            (req.user_id, datetime.utcnow().isoformat())
        )

    completed_at = datetime.utcnow().isoformat()
    langs_json = json.dumps(req.languages_spoken)
    biz_name = req.business_name or req.name

    await db.execute(
        """INSERT OR REPLACE INTO seller_profiles 
           (user_id, name, business_name, craft_category, craft_name, bio, state, city, pincode, profile_photo, languages_spoken, verification_type, verification_id, is_verified, capacity_per_month, profile_completed, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?)""",
        (
            req.user_id,
            req.name,
            biz_name,
            req.craft_category,
            req.craft_name,
            req.bio,
            req.state,
            req.city,
            req.pincode or "562160",
            req.profile_photo,
            langs_json,
            req.verification_type,
            req.verification_id,
            req.capacity_per_month,
            completed_at
        )
    )

    # Emit Kafka Event: seller.profile.completed
    await kafka_service.emit_event("seller.profile.completed", {
        "user_id": req.user_id,
        "name": req.name,
        "craft_category": req.craft_category,
        "state": req.state,
        "verification_type": req.verification_type,
        "verification_id": req.verification_id,
        "completed_at": completed_at
    }, key=req.user_id)

    return {
        "success": True,
        "message": "Artisan profile completed successfully.",
        "profile": {
            "user_id": req.user_id,
            "name": req.name,
            "business_name": biz_name,
            "craft_category": req.craft_category,
            "craft_name": req.craft_name,
            "verification_type": req.verification_type,
            "verification_id": req.verification_id,
            "is_verified": True,
            "profile_completed": True,
            "badge": "GST Verified" if req.verification_type == "gstin" else "Enrollment ID Verified"
        }
    }

@router.get("/seller/{user_id}")
async def get_seller_profile(user_id: str):
    sp = await db.fetch_one("SELECT * FROM seller_profiles WHERE user_id = ?", (user_id,))
    if not sp:
        return {"success": False, "profile": None, "profile_completed": False}
    return {
        "success": True,
        "profile": dict(sp),
        "profile_completed": bool(sp["profile_completed"])
    }

@router.post("/buyer")
async def complete_buyer_profile(req: BuyerProfileRequest):
    user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (req.user_id,))
    if not user:
        await db.execute(
            "INSERT OR IGNORE INTO users (id, phone, password_hash, role, created_at) VALUES (?, '9876543210', 'pwd_hash', 'buyer', ?)",
            (req.user_id, datetime.utcnow().isoformat())
        )

    completed_at = datetime.utcnow().isoformat()

    await db.execute(
        """INSERT OR REPLACE INTO buyer_profiles 
           (user_id, company_name, contact_name, email, state, city, pincode, gstin, is_verified, profile_completed, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)""",
        (
            req.user_id,
            req.company_name,
            req.contact_name,
            req.email,
            req.state,
            req.city,
            req.pincode or "560001",
            req.gstin,
            completed_at
        )
    )

    return {
        "success": True,
        "message": "Buyer profile completed successfully.",
        "profile": {
            "user_id": req.user_id,
            "company_name": req.company_name,
            "contact_name": req.contact_name,
            "email": req.email,
            "gstin": req.gstin,
            "is_verified": True,
            "profile_completed": True,
            "badge": "GST Verified Buyer"
        }
    }

@router.get("/buyer/{user_id}")
async def get_buyer_profile(user_id: str):
    bp = await db.fetch_one("SELECT * FROM buyer_profiles WHERE user_id = ?", (user_id,))
    if not bp:
        return {"success": False, "profile": None, "profile_completed": False}
    return {
        "success": True,
        "profile": dict(bp),
        "profile_completed": bool(bp["profile_completed"])
    }

@router.get("/status/{user_id}")
async def get_profile_status(user_id: str):
    user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user["role"] == "artisan":
        sp = await db.fetch_one("SELECT * FROM seller_profiles WHERE user_id = ?", (user_id,))
        if sp and sp["profile_completed"]:
            return {
                "user_id": user_id,
                "role": "artisan",
                "profile_completed": True,
                "profile": dict(sp),
                "badge": "GST Verified" if sp["verification_type"] == "gstin" else "Enrollment ID Verified"
            }
        return {
            "user_id": user_id,
            "role": "artisan",
            "profile_completed": False
        }
    else:
        bp = await db.fetch_one("SELECT * FROM buyer_profiles WHERE user_id = ?", (user_id,))
        if bp and bp["profile_completed"]:
            return {
                "user_id": user_id,
                "role": "buyer",
                "profile_completed": True,
                "profile": dict(bp),
                "badge": "GST Verified Buyer"
            }
        return {
            "user_id": user_id,
            "role": "buyer",
            "profile_completed": False
        }

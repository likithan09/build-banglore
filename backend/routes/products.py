import os
import uuid
import json
import base64
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from database import db
from kafka_service import kafka_service
from opensearch_service import opensearch_service
from services.sarvam_voice_service import sarvam_voice_service

router = APIRouter(prefix="/api/products", tags=["Product Catalog & Discovery"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AddProductRequest(BaseModel):
    seller_id: str
    title: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)
    category: str
    price: float = Field(..., gt=0)
    stock: int = Field(10, ge=0)
    unit: str = "piece"
    tags: List[str] = []
    image_url: str
    enhanced_image_url: Optional[str] = None
    original_language: str = "en-IN"
    status: Optional[str] = "published"

class UpdateProductRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    unit: Optional[str] = None
    tags: Optional[List[str]] = None
    image_url: Optional[str] = None
    enhanced_image_url: Optional[str] = None
    status: Optional[str] = None

class UploadBase64Request(BaseModel):
    image_base64: str
    filename: Optional[str] = None

@router.post("/upload-image")
async def upload_image_base64(req: UploadBase64Request):
    try:
        raw_b64 = req.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]
        img_bytes = base64.b64decode(raw_b64)
        ext = "png" if "png" in (req.filename or "").lower() else "jpg"
        fname = f"product_{uuid.uuid4().hex[:12]}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, fname)
        with open(filepath, "wb") as f:
            f.write(img_bytes)
        return {
            "success": True,
            "url": f"/uploads/{fname}",
            "filename": fname
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image upload failed: {str(e)}")

@router.post("")
async def create_product(req: AddProductRequest):
    product_id = f"prd_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat()
    tags_json = json.dumps(req.tags)
    enhanced_img = req.enhanced_image_url or req.image_url
    status = req.status or "published"

    # 1. Insert product record
    await db.execute(
        """INSERT INTO products 
           (id, seller_id, title, description, category, price, stock, unit, tags, image_url, enhanced_image_url, original_language, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            product_id,
            req.seller_id,
            req.title,
            req.description,
            req.category,
            req.price,
            req.stock,
            req.unit,
            tags_json,
            req.image_url,
            enhanced_img,
            req.original_language,
            status,
            created_at
        )
    )

    # 2. Initialize inventory row
    await db.execute(
        "INSERT OR REPLACE INTO inventory (product_id, stock, reserved, updated_at) VALUES (?, ?, 0, ?)",
        (product_id, req.stock, created_at)
    )

    # 3. Emit Kafka event: product.published
    await kafka_service.emit_event("product.published", {
        "product_id": product_id,
        "seller_id": req.seller_id,
        "title": req.title,
        "category": req.category,
        "price": req.price,
        "stock": req.stock,
        "created_at": created_at
    }, key=product_id)

    # 4. Sync OpenSearch index
    try:
        await opensearch_service.index_product_from_db(product_id)
    except Exception:
        pass

    return {
        "success": True,
        "message": "Product created successfully.",
        "product_id": product_id,
        "product": {
            "id": product_id,
            "seller_id": req.seller_id,
            "title": req.title,
            "description": req.description,
            "category": req.category,
            "price": req.price,
            "stock": req.stock,
            "unit": req.unit,
            "tags": req.tags,
            "image_url": req.image_url,
            "enhanced_image_url": enhanced_img,
            "status": status,
            "created_at": created_at
        }
    }

@router.put("/{product_id}")
async def update_product(product_id: str, req: UpdateProductRequest):
    existing = await db.fetch_one("SELECT * FROM products WHERE id = ?", (product_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found.")

    updates = []
    params = []
    if req.title is not None:
        updates.append("title = ?")
        params.append(req.title)
    if req.description is not None:
        updates.append("description = ?")
        params.append(req.description)
    if req.category is not None:
        updates.append("category = ?")
        params.append(req.category)
    if req.price is not None:
        updates.append("price = ?")
        params.append(req.price)
    if req.stock is not None:
        updates.append("stock = ?")
        params.append(req.stock)
        await db.execute("UPDATE inventory SET stock = ?, updated_at = ? WHERE product_id = ?",
                         (req.stock, datetime.utcnow().isoformat(), product_id))
    if req.unit is not None:
        updates.append("unit = ?")
        params.append(req.unit)
    if req.tags is not None:
        updates.append("tags = ?")
        params.append(json.dumps(req.tags))
    if req.image_url is not None:
        updates.append("image_url = ?")
        params.append(req.image_url)
    if req.enhanced_image_url is not None:
        updates.append("enhanced_image_url = ?")
        params.append(req.enhanced_image_url)
    if req.status is not None:
        updates.append("status = ?")
        params.append(req.status)

    if updates:
        params.append(product_id)
        await db.execute(f"UPDATE products SET {', '.join(updates)} WHERE id = ?", tuple(params))

    updated = await db.fetch_one("SELECT * FROM products WHERE id = ?", (product_id,))
    res = dict(updated)
    if res.get("tags"):
        try:
            res["tags"] = json.loads(res["tags"])
        except Exception:
            pass

    return {"success": True, "message": "Product updated successfully.", "product": res}

@router.delete("/{product_id}")
async def delete_product(product_id: str):
    existing = await db.fetch_one("SELECT * FROM products WHERE id = ?", (product_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Soft delete by marking archived
    await db.execute("UPDATE products SET status = 'archived' WHERE id = ?", (product_id,))
    return {"success": True, "message": "Product archived successfully."}

@router.get("/seller/{seller_id}")
async def get_seller_products(seller_id: str):
    rows = await db.fetch_all(
        "SELECT * FROM products WHERE seller_id = ? AND status != 'archived' ORDER BY created_at DESC",
        (seller_id,)
    )
    results = []
    for r in rows:
        item = dict(r)
        if item.get("tags"):
            try:
                item["tags"] = json.loads(item["tags"])
            except Exception:
                pass
        results.append(item)
    return {"success": True, "products": results, "count": len(results)}

@router.get("")
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    verified_only: bool = False,
    page: int = 1,
    limit: int = 20
):
    query = "SELECT p.*, sp.name as seller_name, sp.state as seller_state, sp.is_verified, sp.verification_type FROM products p LEFT JOIN seller_profiles sp ON p.seller_id = sp.user_id WHERE p.status = 'published'"
    params = []

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query += " AND (LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.category) LIKE ? OR LOWER(p.tags) LIKE ?)"
        params.extend([term, term, term, term])

    if category and category.lower() not in ["all", "all crafts"]:
        query += " AND LOWER(p.category) = ?"
        params.append(category.lower())

    if state and state.lower() != "all":
        query += " AND LOWER(sp.state) = ?"
        params.append(state.lower())

    if min_price is not None:
        query += " AND p.price >= ?"
        params.append(min_price)

    if max_price is not None and max_price < 50000:
        query += " AND p.price <= ?"
        params.append(max_price)

    if verified_only:
        query += " AND sp.is_verified = 1"

    query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
    offset = (page - 1) * limit
    params.extend([limit, offset])

    rows = await db.fetch_all(query, tuple(params))
    results = []
    for r in rows:
        item = dict(r)
        if item.get("tags"):
            try:
                item["tags"] = json.loads(item["tags"])
            except Exception:
                pass
        item["seller_name"] = item.get("seller_name") or "Authentic Artisan"
        item["state"] = item.get("seller_state") or "India"
        item["is_verified"] = bool(item.get("is_verified", False))
        item["verification_type"] = item.get("verification_type") or "none"
        results.append(item)

    return {
        "success": True,
        "count": len(results),
        "page": page,
        "limit": limit,
        "products": results
    }

@router.get("/search")
async def search_products(
    q: str = Query("", description="Search term with fuzzy typo tolerance"),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    state: Optional[str] = None,
    verified_only: bool = False,
    lang: str = "en-IN"
):
    # Delegate to list_products SQL query with rich metadata
    res = await list_products(
        q=q,
        category=category,
        state=state,
        min_price=min_price,
        max_price=max_price,
        verified_only=verified_only,
        limit=50
    )
    return {
        "success": True,
        "query": q,
        "count": res["count"],
        "products": res["products"]
    }

@router.get("/suggestions")
async def get_suggestions(prefix: str = Query("", description="Autocomplete prefix")):
    clean = prefix.strip().lower()
    if not clean or len(clean) < 2:
        return []
    
    rows = await db.fetch_all(
        "SELECT title, category FROM products WHERE LOWER(title) LIKE ? OR LOWER(category) LIKE ? LIMIT 6",
        (f"%{clean}%", f"%{clean}%")
    )
    results = []
    for r in rows:
        results.append(f"{r['title']} ({r['category']})")
    
    # Defaults if few matches
    default_crafts = [
        "Banarasi Pure Katan Silk Saree",
        "Channapatna Lacquered Wooden Toys",
        "Madhubani Traditional Folk Art",
        "Bidriware Silver Inlay Floral Vase",
        "Kanchipuram Temple Border Silk",
        "Terracotta Clay Water Pitcher"
    ]
    for d in default_crafts:
        if clean in d.lower() and d not in results:
            results.append(d)
            if len(results) >= 6:
                break
                
    return results[:6]

@router.get("/{product_id}")
async def get_product(product_id: str):
    product = await db.fetch_one("SELECT * FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    res = dict(product)
    if res.get("tags"):
        try:
            res["tags"] = json.loads(res["tags"])
        except Exception:
            pass

    seller = await db.fetch_one("SELECT * FROM seller_profiles WHERE user_id = ?", (res["seller_id"],))
    res["seller"] = dict(seller) if seller else {}
    res["seller_name"] = seller["name"] if seller else "Artisan"
    res["state"] = seller["state"] if seller else "India"
    res["is_verified"] = bool(seller["is_verified"]) if seller else False
    res["verification_type"] = seller["verification_type"] if seller else "none"

    return {"success": True, "product": res}

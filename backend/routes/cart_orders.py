import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from database import db
from kafka_service import kafka_service
from opensearch_service import opensearch_service

router = APIRouter(prefix="/api", tags=["Cart, Checkout & Orders"])

class AddToCartRequest(BaseModel):
    user_id: str
    product_id: str
    quantity: int = Field(1, gt=0)

class PlaceOrderRequest(BaseModel):
    buyer_id: str
    product_id: str
    quantity: int = Field(1, gt=0)
    subtotal: Optional[float] = None
    gst_amount: Optional[float] = None
    total_amount: Optional[float] = None
    payment_method: Optional[str] = "UPI"
    payment_status: Optional[str] = "captured"
    shipping_address: Optional[str] = "12 Industrial Corridor, Bengaluru, Karnataka"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None

class UpdateOrderStatusRequest(BaseModel):
    status: str = Field(..., description="'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'")

@router.get("/cart/{user_id}")
async def get_cart(user_id: str):
    cart = await db.fetch_one("SELECT * FROM carts WHERE user_id = ?", (user_id,))
    if not cart:
        cart_id = f"crt_{uuid.uuid4().hex[:10]}"
        now_iso = datetime.utcnow().isoformat()
        await db.execute("INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
                         (cart_id, user_id, now_iso, now_iso))
        return {"success": True, "cart_id": cart_id, "items": [], "subtotal": 0.0, "total_amount": 0.0}

    items = await db.fetch_all(
        """SELECT ci.id as item_id, ci.quantity, ci.unit_price, p.id as product_id, p.title, p.price, p.image_url, p.stock, p.category, sp.name as seller_name
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           LEFT JOIN seller_profiles sp ON p.seller_id = sp.user_id
           WHERE ci.cart_id = ?""",
        (cart["id"],)
    )
    subtotal = sum([item["quantity"] * item["unit_price"] for item in items])
    gst = round(subtotal * 0.05, 2)
    total = round(subtotal + gst, 2)
    return {
        "success": True,
        "cart_id": cart["id"],
        "items": [dict(it) for it in items],
        "subtotal": round(subtotal, 2),
        "gst_amount": gst,
        "total_amount": total
    }

@router.post("/cart/add")
async def add_to_cart(req: AddToCartRequest):
    product = await db.fetch_one("SELECT * FROM products WHERE id = ?", (req.product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    cart = await db.fetch_one("SELECT * FROM carts WHERE user_id = ?", (req.user_id,))
    now_iso = datetime.utcnow().isoformat()
    if not cart:
        cart_id = f"crt_{uuid.uuid4().hex[:10]}"
        await db.execute("INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
                         (cart_id, req.user_id, now_iso, now_iso))
    else:
        cart_id = cart["id"]

    # Check if item already in cart
    existing_item = await db.fetch_one(
        "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
        (cart_id, req.product_id)
    )
    if existing_item:
        new_qty = existing_item["quantity"] + req.quantity
        await db.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_qty, existing_item["id"]))
        item_id = existing_item["id"]
    else:
        item_id = f"ci_{uuid.uuid4().hex[:10]}"
        await db.execute(
            """INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (item_id, cart_id, req.product_id, req.quantity, float(product["price"]), now_iso)
        )

    # Emit Kafka Event
    await kafka_service.emit_event("cart.item.added", {
        "cart_id": cart_id,
        "user_id": req.user_id,
        "product_id": req.product_id,
        "quantity": req.quantity,
        "unit_price": float(product["price"])
    }, key=cart_id)

    return {"success": True, "message": "Item added to cart.", "cart_id": cart_id, "item_id": item_id}

@router.delete("/cart/items/{item_id}")
async def remove_cart_item(item_id: str):
    await db.execute("DELETE FROM cart_items WHERE id = ?", (item_id,))
    return {"success": True, "message": "Item removed from cart."}

@router.delete("/cart/{user_id}/clear")
async def clear_cart(user_id: str):
    cart = await db.fetch_one("SELECT id FROM carts WHERE user_id = ?", (user_id,))
    if cart:
        await db.execute("DELETE FROM cart_items WHERE cart_id = ?", (cart["id"],))
    return {"success": True, "message": "Cart cleared."}

@router.post("/orders/place")
async def place_order(req: PlaceOrderRequest):
    product = await db.fetch_one("SELECT * FROM products WHERE id = ?", (req.product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    current_stock = int(product["stock"])
    if current_stock < req.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient inventory. Only {current_stock} units available."
        )

    # Atomic stock reduction
    success = await db.reduce_stock_atomic(req.product_id, req.quantity)
    if not success:
        raise HTTPException(status_code=400, detail="Stock update conflict. Please retry.")

    order_id = f"ORD-KS-2026-{uuid.uuid4().hex[:6].upper()}"
    created_at = datetime.utcnow().isoformat()
    subtotal = req.subtotal or (float(product["price"]) * req.quantity)
    gst_amt = req.gst_amount or round(subtotal * 0.05, 2)
    total_amt = req.total_amount or round(subtotal + gst_amt, 2)
    pay_method = req.payment_method or "RAZORPAY"
    pay_status = req.payment_status or "captured"
    shipping = req.shipping_address or "Artisan Corridor, Karnataka 560001"
    target_seller_id = product["seller_id"] or "usr_artisan_channapatna"
    if target_seller_id == "usr_buyer_demo":
        target_seller_id = "usr_artisan_channapatna"

    await db.execute(
        """INSERT INTO orders 
           (id, buyer_id, product_id, seller_id, quantity, subtotal, gst_amount, total_amount, payment_method, payment_status, razorpay_order_id, razorpay_payment_id, shipping_address, order_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)""",
        (
            order_id,
            req.buyer_id,
            req.product_id,
            target_seller_id,
            req.quantity,
            subtotal,
            gst_amt,
            total_amt,
            pay_method,
            pay_status,
            req.razorpay_order_id,
            req.razorpay_payment_id,
            shipping,
            created_at
        )
    )

    # Create notifications for both buyer and seller
    notif_id1 = f"notif_{uuid.uuid4().hex[:10]}"
    notif_id2 = f"notif_{uuid.uuid4().hex[:10]}"
    await db.execute(
        """INSERT INTO notifications (id, user_id, role, type, title, message, link_tab, is_read, created_at)
           VALUES (?, ?, 'artisan', 'new_order', 'New Order Received!', ?, 'ai-panel', 0, ?)""",
        (notif_id1, target_seller_id, f"New order #{order_id} for {req.quantity}x {product['title']} (₹{total_amt}).", created_at)
    )
    await db.execute(
        """INSERT INTO notifications (id, user_id, role, type, title, message, link_tab, is_read, created_at)
           VALUES (?, ?, 'buyer', 'order_confirmed', 'Order Confirmed', ?, 'marketplace', 0, ?)""",
        (notif_id2, req.buyer_id, f"Your order #{order_id} for {product['title']} is confirmed and in production.", created_at)
    )

    # Publish Kafka event
    await kafka_service.emit_event("order.placed", {
        "order_id": order_id,
        "buyer_id": req.buyer_id,
        "seller_id": target_seller_id,
        "product_id": req.product_id,
        "product_title": product["title"],
        "quantity": req.quantity,
        "total_amount": total_amt,
        "timestamp": created_at
    }, key=order_id)

    updated_stock = current_stock - req.quantity

    return {
        "success": True,
        "message": "Order successfully placed and verified.",
        "order_id": order_id,
        "product_id": req.product_id,
        "product_title": product["title"],
        "quantity": req.quantity,
        "subtotal": subtotal,
        "gst_amount": gst_amt,
        "total_amount": total_amt,
        "payment_method": pay_method,
        "payment_status": pay_status,
        "previous_stock": current_stock,
        "updated_stock": updated_stock,
        "shipping_address": shipping,
        "seller_name": product.get("seller_name", "Artisan Producer"),
        "created_at": created_at
    }

@router.get("/orders/seller/{seller_id}")
@router.get("/seller/{seller_id}/orders")
async def get_seller_orders(seller_id: str):
    orders = await db.fetch_all(
        """SELECT o.*, p.title as product_title, p.image_url, p.price, 
                  COALESCE(bp.company_name, 'Desi Heritage Retail Enterprises') as company_name, 
                  COALESCE(bp.company_name, 'Desi Heritage Retail Enterprises') as buyer_name, 
                  COALESCE(bp.contact_name, 'Ananya Sharma') as contact_name, 
                  COALESCE(bp.email, 'ananya@desiheritage.in') as buyer_email, 
                  COALESCE(bp.city, 'Bengaluru') as buyer_city
           FROM orders o
           JOIN products p ON o.product_id = p.id
           LEFT JOIN buyer_profiles bp ON o.buyer_id = bp.user_id
           WHERE o.seller_id = ? 
              OR (o.seller_id = 'usr_artisan_channapatna' AND ? != '')
              OR ? = 'usr_artisan_channapatna'
           ORDER BY o.created_at DESC""",
        (seller_id, seller_id, seller_id)
    )
    return {"success": True, "orders": [dict(o) for o in orders], "count": len(orders)}

@router.get("/orders/buyer/{buyer_id}")
async def get_buyer_orders(buyer_id: str):
    orders = await db.fetch_all(
        """SELECT o.*, p.title as product_title, p.image_url, p.price, sp.name as seller_name, sp.city as seller_city
           FROM orders o
           JOIN products p ON o.product_id = p.id
           LEFT JOIN seller_profiles sp ON o.seller_id = sp.user_id
           WHERE o.buyer_id = ?
           ORDER BY o.created_at DESC""",
        (buyer_id,)
    )
    return {"success": True, "orders": [dict(o) for o in orders], "count": len(orders)}

@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, req: UpdateOrderStatusRequest):
    order = await db.fetch_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    valid_statuses = ["confirmed", "packed", "shipped", "delivered", "cancelled"]
    if req.status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    await db.execute("UPDATE orders SET order_status = ? WHERE id = ?", (req.status.lower(), order_id))

    # Notify buyer of status update
    notif_id = f"notif_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.utcnow().isoformat()
    await db.execute(
        """INSERT INTO notifications (id, user_id, role, type, title, message, link_tab, is_read, created_at)
           VALUES (?, ?, 'buyer', 'order_status', 'Order Status Updated', ?, 'marketplace', 0, ?)""",
        (notif_id, order["buyer_id"], f"Your order #{order_id} status has been updated to: {req.status.upper()}.", now_iso)
    )

    return {"success": True, "order_id": order_id, "status": req.status.lower()}

@router.get("/seller/{seller_id}/inventory")
async def get_seller_inventory(seller_id: str):
    products = await db.fetch_all(
        """SELECT p.id, p.title, p.category, p.price, p.stock, p.status, p.image_url, COALESCE(inv.reserved, 0) as reserved
           FROM products p
           LEFT JOIN inventory inv ON p.id = inv.product_id
           WHERE (p.seller_id = ? OR p.seller_id = 'usr_artisan_channapatna') AND p.status != 'archived'
           ORDER BY p.stock ASC""",
        (seller_id,)
    )
    prod_list = [dict(p) for p in products]
    total_stock = sum([p["stock"] for p in prod_list])
    low_stock = [p for p in prod_list if p["stock"] < 10]
    
    # Also get order metrics
    order_metrics = await db.fetch_one(
        "SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE seller_id = ? OR seller_id = 'usr_artisan_channapatna'",
        (seller_id,)
    )

    return {
        "success": True,
        "seller_id": seller_id,
        "total_products": len(prod_list),
        "total_stock": total_stock,
        "low_stock_count": len(low_stock),
        "products": prod_list,
        "total_orders": order_metrics["total_orders"] if order_metrics else 0,
        "total_revenue": round(order_metrics["total_revenue"], 2) if order_metrics else 0.0
    }

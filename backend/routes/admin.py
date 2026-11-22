from fastapi import APIRouter
from kafka_service import kafka_service
from opensearch_service import opensearch_service
from database import db
from config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin & Kafka Event Audit Stream"])

@router.get("/events")
async def get_kafka_events(limit: int = 50):
    events = await kafka_service.get_recent_events(limit=limit)
    total_events = len(events)
    
    # Summary by topic
    topic_counts = {}
    for ev in events:
        t = ev.get("topic", "unknown")
        topic_counts[t] = topic_counts.get(t, 0) + 1

    return {
        "success": True,
        "total_events": total_events,
        "topic_summary": topic_counts,
        "aiven_kafka_configured": bool(settings.AIVEN_KAFKA_BOOTSTRAP_SERVERS),
        "aiven_opensearch_configured": bool(settings.AIVEN_OPENSEARCH_URI),
        "aiven_postgres_configured": bool(settings.AIVEN_PG_URI),
        "events": events
    }

@router.get("/stats")
async def get_system_stats():
    user_count = await db.fetch_one("SELECT COUNT(*) as count FROM users")
    seller_count = await db.fetch_one("SELECT COUNT(*) as count FROM seller_profiles WHERE profile_completed = 1")
    buyer_count = await db.fetch_one("SELECT COUNT(*) as count FROM buyer_profiles WHERE profile_completed = 1")
    product_count = await db.fetch_one("SELECT COUNT(*) as count FROM products WHERE status = 'published'")
    order_count = await db.fetch_one("SELECT COUNT(*) as count FROM orders")
    connection_count = await db.fetch_one("SELECT COUNT(*) as count FROM connections")

    return {
        "success": True,
        "users": user_count["count"] if user_count else 0,
        "verified_sellers": seller_count["count"] if seller_count else 0,
        "verified_buyers": buyer_count["count"] if buyer_count else 0,
        "active_products": product_count["count"] if product_count else 0,
        "orders_placed": order_count["count"] if order_count else 0,
        "active_connections": connection_count["count"] if connection_count else 0
    }

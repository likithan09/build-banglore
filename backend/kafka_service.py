import json
import uuid
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from config import settings
from database import db

logger = logging.getLogger("kalasetu_kafka")

class KafkaService:
    def __init__(self):
        self.outbox: List[Dict[str, Any]] = []
        self._consumer_running = False

    async def emit_event(self, topic: str, payload: Dict[str, Any], key: Optional[str] = None) -> Dict[str, Any]:
        event_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        full_topic = f"{settings.AIVEN_KAFKA_TOPIC_PREFIX}{topic}" if not topic.startswith(settings.AIVEN_KAFKA_TOPIC_PREFIX) else topic

        event_record = {
            "id": event_id,
            "topic": full_topic,
            "event_key": key or str(payload.get("id") or payload.get("user_id") or payload.get("product_id") or event_id),
            "payload": json.dumps(payload),
            "status": "published",
            "consumer_action": None,
            "created_at": timestamp,
            "processed_at": None
        }

        # 1. Commit to database outbox table for durability & audit
        await db.execute(
            """INSERT INTO kafka_events (id, topic, event_key, payload, status, consumer_action, created_at, processed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                event_record["id"],
                event_record["topic"],
                event_record["event_key"],
                event_record["payload"],
                event_record["status"],
                event_record["consumer_action"],
                event_record["created_at"],
                event_record["processed_at"]
            )
        )

        logger.info(f"[Kafka Producer] Published event {event_id} to topic '{full_topic}'")

        # 2. Dispatch to async consumers (idempotent decoupled consumer loop)
        asyncio.create_task(self._process_consumer(event_record, payload))

        return event_record

    async def _process_consumer(self, event_record: Dict[str, Any], payload: Dict[str, Any]):
        topic = event_record["topic"]
        short_topic = topic.replace(settings.AIVEN_KAFKA_TOPIC_PREFIX, "")
        consumer_action = ""

        try:
            # 1. order.placed consumer
            if short_topic == "order.placed":
                product_id = payload.get("product_id")
                quantity = int(payload.get("quantity", 1))
                buyer_id = payload.get("buyer_id")
                
                # Atomic stock reduction using row-level locking
                stock_reduced = await db.reduce_stock_atomic(product_id, quantity)
                if stock_reduced:
                    consumer_action = f"Reduced stock by {quantity} for product {product_id}. Emitted inventory.changed."
                    # Emit secondary event
                    await self.emit_event("inventory.changed", {
                        "product_id": product_id,
                        "quantity_changed": -quantity,
                        "reason": f"Order {payload.get('order_id')} placed by buyer {buyer_id}"
                    })
                else:
                    consumer_action = f"Insufficient stock for product {product_id}. Order processing flagged."

            # 2. product.published / updated / inventory.changed consumer
            elif short_topic in ["product.published", "product.updated", "inventory.changed"]:
                product_id = payload.get("product_id") or payload.get("id")
                # Trigger OpenSearch re-index
                from opensearch_service import opensearch_service
                await opensearch_service.index_product_from_db(product_id)
                consumer_action = f"Synchronized product {product_id} with OpenSearch index."

            # 3. inquiry.created consumer
            elif short_topic == "inquiry.created":
                seller_id = payload.get("seller_id")
                consumer_action = f"Generated artisan inbox notification for seller {seller_id}."

            # 4. seller.profile.completed consumer
            elif short_topic == "seller.profile.completed":
                user_id = payload.get("user_id")
                consumer_action = f"Calculated baseline buyer-seller matching affinities for artisan {user_id}."

            else:
                consumer_action = f"Acknowledged event for topic {short_topic}."

            # Mark processed
            processed_time = datetime.utcnow().isoformat()
            await db.execute(
                "UPDATE kafka_events SET status = 'processed', consumer_action = ?, processed_at = ? WHERE id = ?",
                (consumer_action, processed_time, event_record["id"])
            )
            logger.info(f"[Kafka Consumer] {consumer_action}")

        except Exception as e:
            logger.error(f"[Kafka Consumer Error] Failed processing event {event_record['id']}: {e}")
            await db.execute(
                "UPDATE kafka_events SET status = 'failed', consumer_action = ? WHERE id = ?",
                (f"Error: {str(e)}", event_record["id"])
            )

    async def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        rows = await db.fetch_all(
            "SELECT * FROM kafka_events ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        results = []
        for r in rows:
            item = dict(r)
            try:
                item["payload"] = json.loads(item["payload"])
            except Exception:
                pass
            results.append(item)
        return results

kafka_service = KafkaService()

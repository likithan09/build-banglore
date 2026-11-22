import json
import logging
from typing import Dict, Any, List, Optional
from config import settings
from database import db

logger = logging.getLogger("kalasetu_opensearch")

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

class OpenSearchService:
    def __init__(self):
        self.index_name = settings.OPENSEARCH_INDEX
        self._local_index: Dict[str, Dict[str, Any]] = {}

    async def index_product_from_db(self, product_id: str) -> Optional[Dict[str, Any]]:
        product = await db.fetch_one("SELECT * FROM products WHERE id = ?", (product_id,))
        if not product:
            return None

        # Fetch seller details for trust & location filters
        seller = await db.fetch_one("SELECT * FROM seller_profiles WHERE user_id = ?", (product["seller_id"],))
        
        # Fetch translations
        translations = await db.fetch_all("SELECT * FROM product_translations WHERE product_id = ?", (product_id,))
        trans_map = {}
        for t in translations:
            trans_map[t["language_code"]] = {
                "title": t["title"],
                "description": t["description"]
            }

        doc = {
            "id": product["id"],
            "seller_id": product["seller_id"],
            "title": product["title"],
            "description": product["description"],
            "category": product["category"],
            "price": float(product["price"]),
            "stock": int(product["stock"]),
            "unit": product["unit"],
            "tags": json.loads(product["tags"]) if product.get("tags") else [],
            "image_url": product.get("image_url"),
            "enhanced_image_url": product.get("enhanced_image_url"),
            "original_language": product.get("original_language", "en-IN"),
            "status": product.get("status", "published"),
            "seller_name": seller["name"] if seller else "Artisan",
            "state": seller["state"] if seller else "India",
            "city": seller["city"] if seller else "",
            "is_verified": bool(seller["is_verified"]) if seller else False,
            "verification_type": seller["verification_type"] if seller else "none",
            "translations": trans_map
        }

        self._local_index[product_id] = doc
        logger.info(f"[OpenSearch] Indexed product {product_id} ('{doc['title']}')")
        return doc

    async def reindex_all_products(self) -> int:
        products = await db.fetch_all("SELECT id FROM products WHERE status = 'published'")
        count = 0
        for p in products:
            res = await self.index_product_from_db(p["id"])
            if res:
                count += 1
        logger.info(f"[OpenSearch] Reindexed {count} products successfully.")
        return count

    async def search_products(
        self,
        query: str = "",
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        state: Optional[str] = None,
        verified_only: bool = False,
        language_code: str = "en-IN"
    ) -> List[Dict[str, Any]]:
        # Ensure index is populated
        if not self._local_index:
            await self.reindex_all_products()

        q_terms = [t.lower().strip() for t in query.split() if t.strip()]
        matched_items = []

        for p_id, doc in self._local_index.items():
            # Filters first
            if category and category.lower() != "all" and doc["category"].lower() != category.lower():
                continue
            if min_price is not None and doc["price"] < min_price:
                continue
            if max_price is not None and doc["price"] > max_price:
                continue
            if state and state.lower() != "all" and doc["state"].lower() != state.lower():
                continue
            if verified_only and not doc["is_verified"]:
                continue

            # Text relevance scoring with Indic & Typo tolerance
            score = 0.0

            if not q_terms:
                score = 1.0  # Show all matching filters
            else:
                # Text sources to search
                searchable_texts = [
                    doc["title"].lower(),
                    doc["description"].lower(),
                    doc["category"].lower(),
                    doc["seller_name"].lower(),
                    doc["state"].lower()
                ]
                # Include tags
                for tag in doc.get("tags", []):
                    searchable_texts.append(tag.lower())

                # Include localized translation text
                if language_code in doc.get("translations", {}):
                    trans = doc["translations"][language_code]
                    searchable_texts.append(trans.get("title", "").lower())
                    searchable_texts.append(trans.get("description", "").lower())

                for term in q_terms:
                    term_matched = False
                    for text_corpus in searchable_texts:
                        # 1. Exact or substring match
                        if term in text_corpus:
                            score += 10.0
                            term_matched = True
                            break
                        
                        # 2. Fuzzy typo tolerance (Levenshtein distance <= 2 for words >= 4 chars)
                        words = text_corpus.split()
                        for w in words:
                            clean_w = "".join([c for c in w if c.isalnum()])
                            if len(term) >= 4 and len(clean_w) >= 4:
                                dist = levenshtein_distance(term, clean_w)
                                if dist <= 2:
                                    score += 5.0 / (dist + 1)
                                    term_matched = True
                                    break
                        if term_matched:
                            break

                    if not term_matched:
                        # Penalty if a query term had zero fuzzy or exact match
                        score -= 2.0

            if score > 0:
                result_doc = dict(doc)
                result_doc["_score"] = score
                # If translation available for selected language, overlay it
                if language_code in doc.get("translations", {}):
                    trans = doc["translations"][language_code]
                    result_doc["display_title"] = trans.get("title", doc["title"])
                    result_doc["display_description"] = trans.get("description", doc["description"])
                else:
                    result_doc["display_title"] = doc["title"]
                    result_doc["display_description"] = doc["description"]

                matched_items.append(result_doc)

        # Sort by relevance score descending
        matched_items.sort(key=lambda x: x["_score"], reverse=True)
        return matched_items

    async def get_suggestions(self, prefix: str, limit: int = 5) -> List[str]:
        if not prefix or len(prefix.strip()) < 2:
            return []
        
        if not self._local_index:
            await self.reindex_all_products()

        prefix_clean = prefix.lower().strip()
        suggestions = set()

        for doc in self._local_index.values():
            if doc["title"].lower().startswith(prefix_clean):
                suggestions.add(doc["title"])
            if doc["category"].lower().startswith(prefix_clean):
                suggestions.add(doc["category"])
            for tag in doc.get("tags", []):
                if tag.lower().startswith(prefix_clean):
                    suggestions.add(tag)

        return list(suggestions)[:limit]

opensearch_service = OpenSearchService()

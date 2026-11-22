import logging
from typing import Dict, Any, List, Optional
from database import db

logger = logging.getLogger("matching_engine")

class MatchingEngine:
    """
    Buyer-Seller matching engine (rule + ML-style scoring)
    Evaluates:
      1. Craft Category Relevance (weight 35%)
      2. Production Capacity vs Quantity Needed (weight 25%)
      3. Regional Proximity / State Match (weight 20%)
      4. Compliance & Verification Trust (weight 20%)
    Provides explainable factor breakdowns so buyers and sellers know why they were matched.
    """

    @classmethod
    async def calculate_match_score(
        cls,
        seller_id: str,
        desired_category: str,
        quantity_needed: int = 10,
        buyer_state: Optional[str] = None
    ) -> Dict[str, Any]:
        seller = await db.fetch_one("SELECT * FROM seller_profiles WHERE user_id = ?", (seller_id,))
        if not seller:
            return {
                "match_score": 50,
                "confidence": "Low",
                "explanation_factors": ["Artisan profile incomplete"]
            }

        score = 0.0
        factors = []

        # 1. Category Alignment (35 pts)
        artisan_category = (seller.get("craft_category") or "").lower()
        if artisan_category == desired_category.lower():
            score += 35.0
            factors.append(f"Direct craft specialization in {seller.get('craft_category', 'Craft')} (+35%)")
        elif any(w in artisan_category for w in desired_category.lower().split()):
            score += 20.0
            factors.append(f"Related craft artisan (+20%)")
        else:
            score += 10.0
            factors.append("Cross-craft artisanal capabilities (+10%)")

        # 2. Capacity Fit (25 pts)
        monthly_capacity = int(seller.get("capacity_per_month") or 100)
        if monthly_capacity >= quantity_needed:
            score += 25.0
            factors.append(f"High capacity fit ({monthly_capacity} units/mo comfortably exceeds order) (+25%)")
        elif monthly_capacity * 2 >= quantity_needed:
            score += 15.0
            factors.append(f"Moderate capacity fit ({monthly_capacity} units/mo) (+15%)")
        else:
            score += 5.0
            factors.append(f"High-volume order may require extended production timeline (+5%)")

        # 3. Regional Proximity (20 pts)
        artisan_state = seller.get("state", "").strip()
        if buyer_state and artisan_state.lower() == buyer_state.lower():
            score += 20.0
            factors.append(f"Same-state local supply chain ({artisan_state}) (+20%)")
        else:
            score += 10.0
            factors.append(f"Inter-state craft corridor from {artisan_state} (+10%)")

        # 4. Verification Badge & Trust (20 pts)
        if seller.get("is_verified"):
            v_type = seller.get("verification_type", "gstin").upper()
            score += 20.0
            factors.append(f"Verified compliance credential ({v_type}) (+20%)")
        else:
            score += 5.0
            factors.append("Self-declared artisan onboarding profile (+5%)")

        final_score = int(round(min(score, 99.0)))
        tier = "Excellent Match" if final_score >= 85 else ("Good Match" if final_score >= 70 else "Potential Match")

        return {
            "seller_id": seller_id,
            "seller_name": seller.get("name", "Artisan"),
            "craft_name": seller.get("craft_name", "Handicrafts"),
            "match_score": final_score,
            "tier": tier,
            "explanation_factors": factors,
            "why_matched": f"{tier} ({final_score}% affinity) based on category fit, monthly volume capacity, and verified compliance status."
        }

matching_engine = MatchingEngine()

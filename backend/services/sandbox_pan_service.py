import re
import logging
from typing import Dict, Any
from config import settings

logger = logging.getLogger("sandbox_pan")

class SandboxPANService:
    @staticmethod
    def validate_pan_format(pan: str) -> bool:
        """Validates 10-character Indian PAN format: 5 uppercase letters, 4 digits, 1 uppercase letter."""
        pattern = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
        return bool(re.match(pattern, pan.upper().strip()))

    @staticmethod
    def validate_mobile_format(mobile: str) -> bool:
        """Validates 10-digit Indian mobile number."""
        clean_mobile = mobile.replace("+91", "").strip()
        pattern = r"^[6-9]\d{9}$"
        return bool(re.match(pattern, clean_mobile))

    @classmethod
    async def verify_pan(
        cls,
        pan: str,
        name_as_per_pan: str,
        dob_incorporation: str = "1985-05-15",
        consent: bool = True,
        reason: str = "Buyer onboarding on KALASETU"
    ) -> Dict[str, Any]:
        pan_clean = pan.upper().strip()
        if not cls.validate_pan_format(pan_clean):
            return {
                "success": False,
                "verified": False,
                "error": "Invalid PAN format. Standard format is 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)."
            }

        if not name_as_per_pan.strip():
            return {
                "success": False,
                "verified": False,
                "error": "Name as per PAN card is required."
            }

        if not consent:
            return {
                "success": False,
                "verified": False,
                "error": "Explicit consent is required for PAN verification."
            }

        # Mock Mode
        if settings.MOCK_EXTERNAL_APIS or "placeholder" in settings.SANDBOX_API_KEY:
            return {
                "success": True,
                "verified": True,
                "demo": True,
                "pan": pan_clean,
                "name": name_as_per_pan.strip(),
                "status": "VALID",
                "category": "Individual / Business Buyer",
                "message": "PAN verified successfully (Sandbox Demo Mode)"
            }

        # Real Sandbox PAN Verification API call
        try:
            import httpx
            headers = {
                "x-api-key": settings.SANDBOX_API_KEY,
                "x-api-secret": settings.SANDBOX_API_SECRET,
                "x-api-version": settings.SANDBOX_API_VERSION,
                "Content-Type": "application/json"
            }
            payload = {
                "@entity": "in.co.sandbox.kyc.pan_verification.request",
                "pan": pan_clean,
                "name_as_per_pan": name_as_per_pan.strip(),
                "date_of_birth": dob_incorporation,
                "consent": "Y" if consent else "N",
                "reason": reason
            }
            url = f"{settings.SANDBOX_BASE_URL}/kyc/pan/verify"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    is_valid = data.get("data", {}).get("status") == "VALID"
                    return {
                        "success": is_valid,
                        "verified": is_valid,
                        "demo": False,
                        "pan": pan_clean,
                        "name": data.get("data", {}).get("registered_name", name_as_per_pan),
                        "status": data.get("data", {}).get("status", "VALID"),
                        "message": "PAN verified successfully" if is_valid else "PAN status invalid"
                    }
                else:
                    return {
                        "success": False,
                        "verified": False,
                        "error": f"PAN verification failed via Sandbox (Status {res.status_code})"
                    }
        except Exception as e:
            logger.error(f"Error calling Sandbox PAN API: {e}")
            return {
                "success": False,
                "verified": False,
                "error": "PAN verification service temporarily unavailable. Please retry."
            }

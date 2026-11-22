import json
import os
from pathlib import Path
from typing import Dict, Any, List, Optional

CONFIG_PATH = Path(__file__).resolve().parent.parent / "languages.config.json"
if not CONFIG_PATH.exists():
    CONFIG_PATH = Path(__file__).resolve().parent / "languages.config.json"

_config_cache: Optional[Dict[str, Any]] = None

def load_languages_config() -> Dict[str, Any]:
    global _config_cache
    if _config_cache is None:
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                _config_cache = json.load(f)
        except Exception as e:
            # Resilient fallback default
            _config_cache = {
                "sarvam_models": {
                    "stt": {"default_model": "saaras:v2", "endpoint": "/speech-to-text"},
                    "tts": {"default_model": "bulbul:v1", "endpoint": "/text-to-speech"},
                    "translation": {"default_model": "mayura:v1", "endpoint": "/translate"},
                    "chat": {"default_model": "sarvam-2b", "endpoint": "/chat/completions"}
                },
                "supported_languages": [
                    {"code": "en-IN", "short_code": "en", "name": "English", "native_name": "English", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "hi-IN", "short_code": "hi", "name": "Hindi", "native_name": "हिन्दी", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "bn-IN", "short_code": "bn", "name": "Bengali", "native_name": "বাংলা", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "ta-IN", "short_code": "ta", "name": "Tamil", "native_name": "தமிழ்", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "te-IN", "short_code": "te", "name": "Telugu", "native_name": "తెలుగు", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "kn-IN", "short_code": "kn", "name": "Kannada", "native_name": "ಕನ್ನಡ", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "ml-IN", "short_code": "ml", "name": "Malayalam", "native_name": "മലയാളം", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "mr-IN", "short_code": "mr", "name": "Marathi", "native_name": "मराठी", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "gu-IN", "short_code": "gu", "name": "Gujarati", "native_name": "ગુજરાતી", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "pa-IN", "short_code": "pa", "name": "Punjabi", "native_name": "ਪੰਜਾਬੀ", "stt_supported": True, "tts_supported": True, "translate_supported": True},
                    {"code": "od-IN", "short_code": "od", "name": "Odia", "native_name": "ଓଡ଼ିଆ", "stt_supported": True, "tts_supported": True, "translate_supported": True}
                ]
            }
    return _config_cache

def get_sarvam_models() -> Dict[str, Any]:
    return load_languages_config().get("sarvam_models", {})

def get_supported_languages() -> List[Dict[str, Any]]:
    return load_languages_config().get("supported_languages", [])

def get_language_by_code(code: str) -> Optional[Dict[str, Any]]:
    clean = code.lower().replace("_", "-")
    for lang in get_supported_languages():
        if lang["code"].lower() == clean or lang["short_code"].lower() == clean:
            return lang
    return None

def is_stt_supported(code: str) -> bool:
    lang = get_language_by_code(code)
    return bool(lang and lang.get("stt_supported", False))

def is_tts_supported(code: str) -> bool:
    lang = get_language_by_code(code)
    return bool(lang and lang.get("tts_supported", False))

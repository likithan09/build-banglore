import os
from typing import List, Optional

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseModel as BaseSettings
    except ImportError:
        class BaseSettings:
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)

class Settings(BaseSettings):
    # App Information
    PROJECT_NAME: str = "KALASETU"
    PROJECT_VERSION: str = "2.0.0"
    TAGLINE: str = "Speak in your language. Connect to the right market."
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    API_PREFIX: str = "/api"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "kalasetu_artisan_marketplace_secret_jwt_key_2026_indic")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Aiven PostgreSQL Configuration
    AIVEN_PG_URI: Optional[str] = os.getenv("AIVEN_PG_URI", None)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        os.getenv("AIVEN_PG_URI", "sqlite:///./kalasetu.db")
    )

    # Aiven Apache Kafka Configuration
    AIVEN_KAFKA_BOOTSTRAP_SERVERS: Optional[str] = os.getenv("AIVEN_KAFKA_BOOTSTRAP_SERVERS", None)
    AIVEN_KAFKA_CLIENT_CERT: Optional[str] = os.getenv("AIVEN_KAFKA_CLIENT_CERT", None)
    AIVEN_KAFKA_CLIENT_KEY: Optional[str] = os.getenv("AIVEN_KAFKA_CLIENT_KEY", None)
    AIVEN_KAFKA_CA_CERT: Optional[str] = os.getenv("AIVEN_KAFKA_CA_CERT", None)
    AIVEN_KAFKA_TOPIC_PREFIX: str = os.getenv("AIVEN_KAFKA_TOPIC_PREFIX", "kalasetu.")

    # Aiven OpenSearch Configuration
    AIVEN_OPENSEARCH_URI: Optional[str] = os.getenv("AIVEN_OPENSEARCH_URI", None)
    OPENSEARCH_INDEX: str = os.getenv("OPENSEARCH_INDEX", "kalasetu_products")

    # Sandbox.co.in API Credentials (GSTIN / PAN Verification)
    SANDBOX_API_KEY: str = os.getenv("SANDBOX_API_KEY", "placeholder_sandbox_api_key")
    SANDBOX_API_SECRET: str = os.getenv("SANDBOX_API_SECRET", "placeholder_sandbox_api_secret")
    SANDBOX_API_VERSION: str = os.getenv("SANDBOX_API_VERSION", "1.0.0")
    SANDBOX_BASE_URL: str = os.getenv("SANDBOX_BASE_URL", "https://api.sandbox.co.in")

    # Mock GST Enrollment Service
    MOCK_ENROLLMENT_SERVICE_URL: str = os.getenv("MOCK_ENROLLMENT_SERVICE_URL", "http://localhost:4000")
    GST_DEMO_APP_URL: str = os.getenv("GST_DEMO_APP_URL", "http://localhost:5173")

    # Sarvam AI API Credentials
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "placeholder_sarvam_api_key")
    SARVAM_BASE_URL: str = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")

    # Gemini / Vision LLM Credentials
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ]

settings = Settings()

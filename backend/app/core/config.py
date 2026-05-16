"""Application configuration loaded from environment variables."""

from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    """Central configuration for the BlogVerse application."""

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "BlogVerse"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:5173"
    API_PREFIX: str = "/api"

    # ── Database (SQLite default, set DATABASE_URL for PostgreSQL) ─
    DATABASE_URL: str = "sqlite:///./blogverse.db"

    # ── JWT Authentication ───────────────────────────────────────
    SECRET_KEY: str = "change-this-to-a-random-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Gemini ───────────────────────────────────────────────────
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"

    # ── Cloudinary (optional cloud image storage) ────────────────
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # ── SMTP Email ───────────────────────────────────────────────
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@blogverse.com"
    SMTP_USE_TLS: bool = True

    # ── Resend (API-based email) ──────────────────────────────────
    RESEND_API_KEY: Optional[str] = None

    # ── File Upload ──────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5 MB

    @property
    def CLOUDINARY_CLOUD_NAME_CLEAN(self):
        return self.CLOUDINARY_CLOUD_NAME.strip() if self.CLOUDINARY_CLOUD_NAME else ""

    @property
    def CLOUDINARY_API_KEY_CLEAN(self):
        return self.CLOUDINARY_API_KEY.strip() if self.CLOUDINARY_API_KEY else ""

    @property
    def CLOUDINARY_API_SECRET_CLEAN(self):
        return self.CLOUDINARY_API_SECRET.strip() if self.CLOUDINARY_API_SECRET else ""

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "extra": "ignore"
    }


settings = Settings()

"""SQLAlchemy User model."""

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, Integer, String, Text, JSON,
)
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    social_links = Column(JSON, nullable=True, default=dict)
    # e.g. {"twitter": "", "github": "", "linkedin": "", "website": ""}

    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)
    verification_token = Column(String(64), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

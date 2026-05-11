"""Pydantic schemas for User-related requests and responses."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VerifyEmail(BaseModel):
    token: str


# ── Profile ──────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    social_links: Optional[dict] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    social_links: Optional[dict] = None
    is_admin: bool = False
    is_verified: bool = False
    is_blocked: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    social_links: Optional[dict] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

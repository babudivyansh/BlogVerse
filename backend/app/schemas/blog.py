"""Pydantic schemas for Blog-related requests and responses."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Tags ─────────────────────────────────────────────────────────

class TagResponse(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


# ── Blog Author (embedded) ──────────────────────────────────────

class BlogAuthor(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    model_config = {"from_attributes": True}


# ── Create / Update ─────────────────────────────────────────────

class BlogCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field("", min_length=0)
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    status: str = Field(default="draft", pattern="^(draft|published)$")


class BlogUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    content: Optional[str] = None
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = Field(None, pattern="^(draft|published)$")


# ── Responses ────────────────────────────────────────────────────

class BlogResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    status: str
    views: int = 0
    read_time: int = 1
    is_featured: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    author: BlogAuthor
    tags: List[TagResponse] = []
    likes_count: int = 0
    is_liked: bool = False
    web_story_slug: Optional[str] = None

    model_config = {"from_attributes": True}


class BlogCard(BaseModel):
    """Lightweight response for blog listings."""
    id: int
    title: str
    slug: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    status: str
    views: int = 0
    read_time: int = 1
    is_featured: bool = False
    created_at: Optional[datetime] = None
    author: BlogAuthor
    tags: List[TagResponse] = []
    likes_count: int = 0
    web_story_slug: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginatedBlogs(BaseModel):
    items: List[BlogCard]
    total: int
    page: int
    pages: int

"""Pydantic schemas for Comment requests and responses."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CommentAuthor(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    content: str
    blog_id: int
    parent_id: Optional[int] = None
    created_at: Optional[datetime] = None
    author: CommentAuthor
    replies: List["CommentResponse"] = []

    model_config = {"from_attributes": True}


# Rebuild for self-referential type
CommentResponse.model_rebuild()

"""Blog CRUD endpoints with search, pagination, likes, and categories."""

import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from slugify import slugify

from app.core.database import get_db
from app.core.security import get_current_user, get_verified_user, get_optional_user
from app.models.blog import Blog, BlogLike, Tag
from app.models.user import User
from app.schemas.blog import (
    BlogCard, BlogCreate, BlogResponse, BlogUpdate, PaginatedBlogs,
)
from app.services.ai_service import ai_service
from app.services.image_service import image_generation_service

router = APIRouter(prefix="/blogs", tags=["Blogs"])


class ImageGenRequest(BaseModel):
    title: str
    content: str


@router.post("/generate-cover")
async def generate_cover(
    data: ImageGenRequest,
    current_user: User = Depends(get_verified_user),
):
    """Generate an AI cover image for a blog post."""
    # 1. Generate artistic prompt using Gemini
    visual_prompt = await ai_service.generate_visual_prompt(data.title, data.content)
    
    # 2. Generate image and upload to Cloudinary
    image_url = await image_generation_service.generate_and_upload(visual_prompt)
    
    if not image_url:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to generate image")
        
    return {"url": image_url, "prompt": visual_prompt}


def _estimate_read_time(content: str) -> int:
    """Estimate read time in minutes (~200 words per minute)."""
    return max(1, len(content.split()) // 200)


def _get_or_create_tags(db: Session, tag_names: list[str]) -> list[Tag]:
    """Retrieve existing tags or create new ones."""
    tags = []
    for name in tag_names:
        name = name.strip().lower()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def _unique_slug(db: Session, title: str, exclude_id: int | None = None) -> str:
    """Generate a unique slug for a blog title."""
    base = slugify(title)
    slug = base
    counter = 1
    while True:
        query = db.query(Blog).filter(Blog.slug == slug)
        if exclude_id:
            query = query.filter(Blog.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def _blog_to_card(blog: Blog, db: Session) -> dict:
    """Convert a Blog ORM object to BlogCard-compatible dict."""
    likes_count = db.query(func.count(BlogLike.id)).filter(BlogLike.blog_id == blog.id).scalar()
    return {**blog.__dict__, "likes_count": likes_count}


def _blog_to_response(blog: Blog, db: Session, user_id: int | None = None) -> dict:
    """Convert a Blog ORM object to BlogResponse-compatible dict."""
    likes_count = db.query(func.count(BlogLike.id)).filter(BlogLike.blog_id == blog.id).scalar()
    is_liked = False
    if user_id:
        is_liked = db.query(BlogLike).filter(
            BlogLike.blog_id == blog.id, BlogLike.user_id == user_id
        ).first() is not None
    return {**blog.__dict__, "likes_count": likes_count, "is_liked": is_liked}


# ── List / Search ────────────────────────────────────────────────

@router.get("", response_model=PaginatedBlogs)
def list_blogs(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    search: str | None = None,
    category: str | None = None,
    tag: str | None = None,
    author: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """List blogs with optional filtering and pagination."""
    query = db.query(Blog)

    # Security: If status is not 'published', ensure requester is the author
    if status and status != "published":
        if not author or not current_user or (current_user.username != author and not current_user.is_admin):
            # If trying to see someone else's drafts, force published
            status = "published"
    
    if status:
        query = query.filter(Blog.status == status)
    elif author and current_user and current_user.username == author:
        # On user's own dashboard/profile, show everything by default
        pass
    else:
        # Public feed or guest: show only published
        query = query.filter(Blog.status == "published")

    if search:
        query = query.filter(
            or_(Blog.title.ilike(f"%{search}%"), Blog.summary.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Blog.category == category)
    if tag:
        query = query.join(Blog.tags).filter(Tag.name == tag.lower())
    if author:
        query = query.join(Blog.author).filter(User.username == author)

    total = query.count()
    pages = math.ceil(total / limit) if total else 1
    blogs = query.order_by(Blog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    items = [BlogCard(**_blog_to_card(b, db)) for b in blogs]
    return PaginatedBlogs(items=items, total=total, page=page, pages=pages)


@router.get("/featured", response_model=list[BlogCard])
def featured_blogs(db: Session = Depends(get_db)):
    """Return featured published blogs."""
    blogs = (
        db.query(Blog)
        .filter(Blog.status == "published", Blog.is_featured == True)
        .order_by(Blog.created_at.desc())
        .limit(6)
        .all()
    )
    return [BlogCard(**_blog_to_card(b, db)) for b in blogs]


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    """Return all unique blog categories with counts."""
    rows = (
        db.query(Blog.category, func.count(Blog.id))
        .filter(Blog.status == "published", Blog.category.isnot(None))
        .group_by(Blog.category)
        .all()
    )
    return [{"name": r[0], "count": r[1]} for r in rows]


@router.get("/tags")
def list_tags(db: Session = Depends(get_db)):
    """Return all tags."""
    tags = db.query(Tag).order_by(Tag.name).all()
    return [{"id": t.id, "name": t.name} for t in tags]


# ── Single Blog ──────────────────────────────────────────────────

@router.get("/{identifier}", response_model=BlogResponse)
def get_blog(identifier: str, db: Session = Depends(get_db)):
    """Get a single blog by slug or ID and increment view counter."""
    if identifier.isdigit():
        blog = db.query(Blog).filter(Blog.id == int(identifier)).first()
    else:
        blog = db.query(Blog).filter(Blog.slug == identifier).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")
    blog.views += 1
    db.commit()
    db.refresh(blog)
    return BlogResponse(**_blog_to_response(blog, db))


# ── Create ───────────────────────────────────────────────────────

@router.post("", response_model=BlogResponse, status_code=status.HTTP_201_CREATED)
def create_blog(
    data: BlogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Create a new blog post."""
    blog = Blog(
        title=data.title,
        slug=_unique_slug(db, data.title),
        content=data.content,
        summary=data.summary,
        cover_image=data.cover_image,
        category=data.category,
        status=data.status,
        read_time=_estimate_read_time(data.content),
        author_id=current_user.id,
    )
    if data.tags:
        blog.tags = _get_or_create_tags(db, data.tags)
    db.add(blog)
    db.commit()
    db.refresh(blog)
    return BlogResponse(**_blog_to_response(blog, db, current_user.id))


# ── Update ───────────────────────────────────────────────────────

@router.put("/{blog_id}", response_model=BlogResponse)
def update_blog(
    blog_id: int,
    data: BlogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Update an existing blog (author only)."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")
    if blog.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your blog")

    update_data = data.model_dump(exclude_unset=True)
    if "title" in update_data:
        blog.slug = _unique_slug(db, update_data["title"], exclude_id=blog.id)
    if "content" in update_data:
        update_data["read_time"] = _estimate_read_time(update_data["content"])
    if "tags" in update_data:
        blog.tags = _get_or_create_tags(db, update_data.pop("tags"))

    for key, val in update_data.items():
        setattr(blog, key, val)
    db.commit()
    db.refresh(blog)
    return BlogResponse(**_blog_to_response(blog, db, current_user.id))


# ── Delete ───────────────────────────────────────────────────────

@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Delete a blog (author or admin)."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")
    if blog.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your blog")
    db.delete(blog)
    db.commit()


# ── Like / Unlike ────────────────────────────────────────────────

@router.post("/{blog_id}/like")
def toggle_like(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle a like on a blog post."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")

    existing = db.query(BlogLike).filter(
        BlogLike.blog_id == blog_id, BlogLike.user_id == current_user.id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}
    db.add(BlogLike(blog_id=blog_id, user_id=current_user.id))
    db.commit()
    return {"liked": True}

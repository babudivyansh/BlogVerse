"""Admin dashboard and management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.blog import Blog, BlogLike
from app.models.comment import Comment
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    """Dashboard analytics: total users, blogs, views, comments, likes."""
    return {
        "total_users": db.query(func.count(User.id)).scalar(),
        "total_blogs": db.query(func.count(Blog.id)).scalar(),
        "published_blogs": db.query(func.count(Blog.id)).filter(Blog.status == "published").scalar(),
        "total_views": db.query(func.coalesce(func.sum(Blog.views), 0)).scalar(),
        "total_comments": db.query(func.count(Comment.id)).scalar(),
        "total_likes": db.query(func.count(BlogLike.id)).scalar(),
    }


@router.get("/users", response_model=list[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _=Depends(get_admin_user),
):
    """List all users (paginated)."""
    users = db.query(User).order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return users


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    """Delete a user (cannot delete yourself)."""
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    db.delete(user)
    db.commit()


@router.get("/blogs")
def list_all_blogs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _=Depends(get_admin_user),
):
    """List all blogs for admin management."""
    blogs = db.query(Blog).order_by(Blog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return [
        {
            "id": b.id, "title": b.title, "slug": b.slug, "status": b.status,
            "views": b.views, "category": b.category,
            "author": {"id": b.author.id, "username": b.author.username},
            "created_at": b.created_at,
        }
        for b in blogs
    ]


@router.delete("/blogs/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_blog(blog_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    """Admin delete any blog."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")
    db.delete(blog)
    db.commit()


@router.put("/blogs/{blog_id}/feature")
def toggle_featured(blog_id: int, db: Session = Depends(get_db), _=Depends(get_admin_user)):
    """Toggle a blog's featured status."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")
    blog.is_featured = not blog.is_featured
    db.commit()
    return {"is_featured": blog.is_featured}


@router.put("/users/{user_id}/block")
def toggle_block_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    """Toggle a user's blocked status."""
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot block yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.is_blocked = not user.is_blocked
    db.commit()
    return {"is_blocked": user.is_blocked}


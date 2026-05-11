"""User profile endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.blog import Blog
from app.models.user import User
from app.schemas.blog import BlogCard
from app.schemas.user import UserPublic, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{username}", response_model=UserPublic)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    """Get a user's public profile."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the currently authenticated user's profile."""
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(current_user, key, val)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{username}/blogs", response_model=list[BlogCard])
def get_user_blogs(username: str, db: Session = Depends(get_db)):
    """Return published blogs by a specific user."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    blogs = (
        db.query(Blog)
        .filter(Blog.author_id == user.id, Blog.status == "published")
        .order_by(Blog.created_at.desc())
        .all()
    )
    return blogs

"""Comment endpoints for blog posts."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.blog import Blog
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter(tags=["Comments"])


@router.get("/blogs/{blog_id}/comments", response_model=list[CommentResponse])
def list_comments(blog_id: int, db: Session = Depends(get_db)):
    """Return top-level comments for a blog (replies are nested)."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")
    comments = (
        db.query(Comment)
        .filter(Comment.blog_id == blog_id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.desc())
        .all()
    )
    return comments


@router.post("/blogs/{blog_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(
    blog_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment (or reply) to a blog."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog not found")

    if data.parent_id:
        parent = db.query(Comment).filter(
            Comment.id == data.parent_id, Comment.blog_id == blog_id
        ).first()
        if not parent:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Parent comment not found")

    comment = Comment(
        content=data.content,
        blog_id=blog_id,
        user_id=current_user.id,
        parent_id=data.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment (author or admin only)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your comment")
    db.delete(comment)
    db.commit()

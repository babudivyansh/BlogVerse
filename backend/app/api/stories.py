import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_verified_user, get_optional_user
from app.models.web_story import WebStory
from app.models.user import User
from app.schemas.web_story import WebStoryResponse, WebStoryCard
from app.services.story_service import story_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stories", tags=["Web Stories"])

@router.get("", response_model=List[WebStoryCard])
def list_stories(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """List all web stories."""
    stories = (
        db.query(WebStory)
        .order_by(WebStory.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    # Add cover image from first page
    results = []
    for s in stories:
        card = WebStoryCard.model_validate(s)
        if s.pages:
            card.cover_image = s.pages[0].image_url
        results.append(card)
    return results

@router.get("/{slug}", response_model=WebStoryResponse)
def get_story(slug: str, db: Session = Depends(get_db)):
    """Get a story by slug."""
    story = db.query(WebStory).filter(WebStory.slug == slug).first()
    if not story:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Story not found")
    return story

@router.post("/generate/{blog_id}", status_code=status.HTTP_202_ACCEPTED)
async def generate_story(
    blog_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Manually trigger story generation."""
    # Run as background task since it takes time
    background_tasks.add_task(story_service.create_from_blog, db, blog_id)
    return {"message": "Generation started in the background"}

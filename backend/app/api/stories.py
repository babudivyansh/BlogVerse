import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, get_verified_user, get_optional_user
from app.models.web_story import WebStory
from app.models.user import User
from app.models.blog import Blog
from app.schemas.web_story import WebStoryResponse, WebStoryCard, WebStoryCreate
from app.services.story_service import story_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stories", tags=["Web Stories"])

@router.get("", response_model=List[WebStoryCard])
def list_stories(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    search: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all web stories with optional filtering."""
    query = db.query(WebStory).outerjoin(Blog).options(joinedload(WebStory.pages)).filter(WebStory.status == "published")
    
    if search:
        query = query.filter(WebStory.title.ilike(f"%{search}%"))
    if category:
        query = query.filter(Blog.category == category)
    if tag:
        from app.models.blog import Tag, blog_tags
        query = query.join(Blog.tags).filter(Tag.name == tag)
        
    stories = (
        query.order_by(WebStory.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    
    results = []
    for s in stories:
        card = WebStoryCard.model_validate(s)
        if s.pages:
            card.cover_image = s.pages[0].image_url
        results.append(card)
    return results

@router.get("/me", response_model=List[WebStoryCard])
def list_my_stories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """List stories created by the current user."""
    stories = (
        db.query(WebStory)
        .options(joinedload(WebStory.pages))
        .filter(WebStory.author_id == current_user.id)
        .order_by(WebStory.created_at.desc())
        .all()
    )
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

@router.get("/id/{story_id}", response_model=WebStoryResponse)
def get_story_by_id(story_id: int, db: Session = Depends(get_db)):
    """Get a story by ID."""
    story = db.query(WebStory).filter(WebStory.id == story_id).first()
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

@router.post("", response_model=WebStoryResponse)
def create_story_manual(
    data: WebStoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """Create a web story manually."""
    return story_service.create_manual(db, data, current_user.id)

@router.post("/suggest/{blog_id}")
async def suggest_story_content(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """Get AI suggested slides for a blog post."""
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(404, "Blog not found")
    
    slides = await ai_service.generate_story_content(blog.title, blog.content)
    return slides

@router.post("/suggest-manual")
async def generate_manual_story_content(
    topic: str = Query(..., description="The topic to generate a story about"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """Generate AI suggested slides from a topic."""
    slides = await ai_service.generate_story_from_topic(topic)
    return slides

@router.put("/{story_id}", response_model=WebStoryResponse)
def update_story(
    story_id: int,
    data: WebStoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """Update a web story."""
    try:
        return story_service.update(db, story_id, data, current_user.id)
    except Exception as e:
        raise HTTPException(400, str(e))

@router.delete("/{story_id}")
def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user)
):
    """Delete a web story."""
    try:
        story_service.delete(db, story_id, current_user.id)
        return {"message": "Story deleted"}
    except Exception as e:
        raise HTTPException(400, str(e))

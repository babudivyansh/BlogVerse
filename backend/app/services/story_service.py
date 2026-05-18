import logging
import asyncio
from sqlalchemy.orm import Session
from slugify import slugify

from app.models.blog import Blog
from app.models.web_story import WebStory, StoryPage
from app.services.ai_service import ai_service
from app.services.image_service import image_generation_service
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.web_story import WebStoryCreate

logger = logging.getLogger(__name__)


def _unique_story_slug(db: Session, title: str, exclude_id: int | None = None) -> str:
    """Generate a unique slug for a web story title."""
    base = f"story-{slugify(title)}"
    slug = base
    counter = 1
    while True:
        query = db.query(WebStory).filter(WebStory.slug == slug)
        if exclude_id:
            query = query.filter(WebStory.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


class StoryService:
    async def create_from_blog(self, db: Session, blog_id: int) -> WebStory:
        """Generate a Web Story from a blog post."""
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if not blog:
            raise Exception("Blog not found")

        # 1. Generate story content using AI
        logger.info(f"Generating story content for blog {blog_id}...")
        slides = await ai_service.generate_story_content(blog.title, blog.content)

        # 2. Generate images for each slide (in parallel)
        logger.info(f"Generating {len(slides)} images for the story...")
        
        async def _gen_page(slide_data, index):
            img_url = await image_generation_service.generate_and_upload(
                slide_data["visual_prompt"], 
                width=720, 
                height=1280
            )
            return StoryPage(
                title=slide_data["title"],
                text=slide_data["text"],
                image_url=img_url,
                order_index=index
            )

        # Run image generation in parallel
        tasks = [_gen_page(slide, i) for i, slide in enumerate(slides)]
        pages = await asyncio.gather(*tasks)

        # 3. Create the WebStory record
        slug = _unique_story_slug(db, blog.title)
        
        # Check if story already exists for this blog
        existing = db.query(WebStory).filter(WebStory.blog_id == blog_id).first()
        if existing:
            # Delete old pages and reuse the story record
            db.query(StoryPage).filter(StoryPage.story_id == existing.id).delete()
            existing.title = blog.title
            existing.slug = slug
            existing.pages = pages
            db.commit()
            db.refresh(existing)
            return existing

        story = WebStory(
            blog_id=blog.id,
            author_id=blog.author_id,
            title=blog.title,
            slug=slug,
            pages=pages
        )
        
        db.add(story)
        db.commit()
        db.refresh(story)
        return story

    def create_manual(self, db: Session, data: "WebStoryCreate", author_id: int) -> WebStory:
        """Create a web story manually from provided data."""
        slug = _unique_story_slug(db, data.title)
        
        pages = [
            StoryPage(
                title=p.title,
                text=p.text,
                image_url=p.image_url,
                order_index=p.order_index
            ) for p in data.pages
        ]
        
        story = WebStory(
            blog_id=data.blog_id,
            author_id=author_id,
            title=data.title,
            slug=slug,
            status=data.status,
            pages=pages
        )
        
        db.add(story)
        db.commit()
        db.refresh(story)
        return story

    def update(self, db: Session, story_id: int, data: "WebStoryCreate", user_id: int) -> WebStory:
        """Update an existing web story."""
        story = db.query(WebStory).filter(WebStory.id == story_id, WebStory.author_id == user_id).first()
        if not story:
            raise Exception("Story not found or unauthorized")

        # Update basic info
        story.title = data.title
        story.slug = _unique_story_slug(db, data.title, exclude_id=story.id)
        story.status = data.status
        
        # Replace pages
        db.query(StoryPage).filter(StoryPage.story_id == story.id).delete()
        story.pages = [
            StoryPage(
                title=p.title,
                text=p.text,
                image_url=p.image_url,
                order_index=p.order_index
            ) for p in data.pages
        ]
        
        db.commit()
        db.refresh(story)
        return story

    def delete(self, db: Session, story_id: int, user_id: int):
        """Delete a web story."""
        story = db.query(WebStory).filter(WebStory.id == story_id, WebStory.author_id == user_id).first()
        if not story:
            raise Exception("Story not found or unauthorized")
        
        db.delete(story)
        db.commit()

story_service = StoryService()

import logging
import asyncio
from sqlalchemy.orm import Session
from slugify import slugify

from app.models.blog import Blog
from app.models.web_story import WebStory, StoryPage
from app.services.ai_service import ai_service
from app.services.image_service import image_generation_service

logger = logging.getLogger(__name__)

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
            img_url = await image_generation_service.generate_and_upload(slide_data["visual_prompt"])
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
        # Ensure slug uniqueness
        base_slug = blog.slug
        slug = f"story-{base_slug}"
        
        # Check if story already exists
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

story_service = StoryService()

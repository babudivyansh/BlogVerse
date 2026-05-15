from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class WebStory(Base):
    __tablename__ = "web_stories"

    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blogs.id", ondelete="CASCADE"), nullable=False, unique=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    slug = Column(String(350), unique=True, index=True, nullable=False)
    status = Column(String(20), default="published", index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    blog = relationship("Blog", backref="web_story", uselist=False)
    author = relationship("User", backref="web_stories")
    pages = relationship("StoryPage", back_populates="story", cascade="all, delete-orphan", order_by="StoryPage.order_index")

class StoryPage(Base):
    __tablename__ = "story_pages"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("web_stories.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=True)
    title = Column(String(200), nullable=True)
    text = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    # Relationship
    story = relationship("WebStory", back_populates="pages")

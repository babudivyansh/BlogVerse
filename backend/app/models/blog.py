"""SQLAlchemy Blog, Tag, BlogTag, and BlogLike models."""

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# ── Many-to-many association table ───────────────────────────────
blog_tags = Table(
    "blog_tags",
    Base.metadata,
    Column("blog_id", Integer, ForeignKey("blogs.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)

    blogs = relationship("Blog", secondary=blog_tags, back_populates="tags")


class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    slug = Column(String(350), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)

    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=True, index=True)
    status = Column(String(20), default="draft", index=True)  # draft | published
    views = Column(Integer, default=0)
    read_time = Column(Integer, default=1)  # minutes
    is_featured = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    author = relationship("User", back_populates="blogs", lazy="joined")
    tags = relationship("Tag", secondary=blog_tags, back_populates="blogs", lazy="joined")
    comments = relationship("Comment", backref="blog", cascade="all, delete-orphan", lazy="dynamic")
    likes = relationship("BlogLike", backref="blog", cascade="all, delete-orphan", lazy="dynamic")


class BlogLike(Base):
    __tablename__ = "blog_likes"

    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blogs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

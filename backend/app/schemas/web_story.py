from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class StoryPageBase(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    image_url: Optional[str] = None
    order_index: int = 0

class StoryPageCreate(StoryPageBase):
    pass

class StoryPageResponse(StoryPageBase):
    id: int
    model_config = {"from_attributes": True}

class WebStoryBase(BaseModel):
    title: str = Field(..., max_length=300)
    status: str = "published"

class WebStoryCreate(WebStoryBase):
    blog_id: Optional[int] = None
    pages: List[StoryPageCreate]

class WebStoryResponse(WebStoryBase):
    id: int
    blog_id: Optional[int] = None
    author_id: int
    slug: str
    created_at: datetime
    pages: List[StoryPageResponse]
    model_config = {"from_attributes": True}

class WebStoryCard(BaseModel):
    id: int
    title: str
    slug: str
    cover_image: Optional[str] = None # Will use the first page's image
    created_at: datetime
    model_config = {"from_attributes": True}

"""Import all models so that Base.metadata knows about them."""

from app.models.user import User          # noqa: F401
from app.models.blog import Blog, Tag, BlogLike, blog_tags  # noqa: F401
from app.models.comment import Comment    # noqa: F401
from app.models.subscriber import Subscriber  # noqa: F401
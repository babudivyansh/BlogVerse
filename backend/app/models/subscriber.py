from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

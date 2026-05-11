from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.subscriber import Subscriber

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

class SubscribeRequest(BaseModel):
    email: EmailStr

@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
def subscribe_to_newsletter(req: SubscribeRequest, db: Session = Depends(get_db)):
    """Subscribe to the newsletter."""
    existing = db.query(Subscriber).filter(Subscriber.email == req.email).first()
    if existing:
        return {"message": "You are already subscribed!"}
    
    new_sub = Subscriber(email=req.email)
    db.add(new_sub)
    db.commit()
    return {"message": "Successfully subscribed to the newsletter!"}

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.subscriber import Subscriber
from app.models.user import User
from app.models.blog import Blog
from app.core.security import get_current_user
from app.core.email import send_welcome_email, send_blog_broadcast

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

class SubscribeRequest(BaseModel):
    email: EmailStr

@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
def subscribe_to_newsletter(req: SubscribeRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Subscribe to the newsletter and send a welcome email."""
    existing = db.query(Subscriber).filter(Subscriber.email == req.email).first()
    if existing:
        return {"message": "You are already subscribed!"}
    
    new_sub = Subscriber(email=req.email)
    db.add(new_sub)
    db.commit()
    
    # Trigger welcome email in background
    background_tasks.add_task(send_welcome_email, req.email)
    
    return {"message": "Successfully subscribed to the newsletter!"}

@router.get("/subscribers")
def get_subscribers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all subscribers (Admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return db.query(Subscriber).order_by(Subscriber.created_at.desc()).all()

@router.delete("/subscribers/{id}")
def delete_subscriber(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a subscriber (Admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    sub = db.query(Subscriber).filter(Subscriber.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    
    db.delete(sub)
    db.commit()
    return {"message": "Subscriber removed"}

@router.post("/broadcast/{blog_id}")
def broadcast_blog(blog_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Broadcast a blog post to all subscribers (Admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    if blog.status != "published":
        raise HTTPException(status_code=400, detail="Only published blogs can be broadcasted")
    
    subscribers = [s.email for s in db.query(Subscriber).all()]
    if not subscribers:
        return {"message": "No subscribers to broadcast to"}
    
    # Trigger broadcast in background
    background_tasks.add_task(
        send_blog_broadcast, 
        subscribers, 
        blog.title, 
        blog.slug, 
        blog.summary
    )
    
    return {"message": f"Broadcast triggered for {len(subscribers)} subscribers"}

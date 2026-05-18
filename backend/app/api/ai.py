"""AI-powered content generation endpoints using OpenAI."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_verified_user
from app.services.ai_service import ai_service
from app.services.image_service import image_generation_service

router = APIRouter(prefix="/ai", tags=["AI Tools"])


class ContentInput(BaseModel):
    content: str


class TopicInput(BaseModel):
    topic: str

class ImageGenerationInput(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    prompt: Optional[str] = None
    width: int = 1280
    height: int = 720


@router.post("/generate-title")
async def generate_title(data: TopicInput, _=Depends(get_verified_user)):
    """Generate creative blog title suggestions for a given topic."""
    titles = await ai_service.generate_titles(data.topic)
    return {"titles": titles}


@router.post("/generate-summary")
async def generate_summary(data: ContentInput, _=Depends(get_verified_user)):
    """Generate a concise summary for blog content."""
    summary = await ai_service.generate_summary(data.content)
    return {"summary": summary}


@router.post("/suggest-tags")
async def suggest_tags(data: ContentInput, _=Depends(get_verified_user)):
    """Suggest relevant tags for blog content."""
    tags = await ai_service.suggest_tags(data.content)
    return {"tags": tags}


@router.post("/improve-content")
async def improve_content(data: ContentInput, _=Depends(get_verified_user)):
    """Improve writing quality and return enhanced content."""
    improved = await ai_service.improve_content(data.content)
    return {"improved_content": improved}


class BlogGenerationInput(BaseModel):
    topic: str
    tone: str = "professional"

@router.post("/generate-blog")
async def generate_blog(data: BlogGenerationInput, _=Depends(get_verified_user)):
    """Generate a complete blog post from a topic including an AI cover image."""
    result = await ai_service.generate_full_blog(data.topic, data.tone)
    
    # Also generate a cover image
    try:
        visual_prompt = await ai_service.generate_visual_prompt(result['title'], result['content'])
        image_url = await image_generation_service.generate_and_upload(visual_prompt)
        result['cover_image'] = image_url
    except Exception:
        result['cover_image'] = None
        
    return result

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    messages: list[ChatMessage]

@router.post("/chat")
async def chat_endpoint(data: ChatInput):
    """Conversational endpoint for the AI chatbot."""
    msgs = [{"role": m.role, "content": m.content} for m in data.messages]
    reply = await ai_service.conversational_chat(msgs)
    return {"reply": reply}

@router.post("/generate-image")
async def generate_image_endpoint(data: ImageGenerationInput, _=Depends(get_verified_user)):
    """Generate a content-relevant image based on title, summary, or a specific prompt."""
    if data.prompt:
        # Truncate overly long prompts (image generators have limits)
        visual_prompt = data.prompt[:500]
    else:
        # Combine title and summary for maximum context
        context = ""
        if data.title:
            context += data.title
        if data.summary:
            context += "\n\n" + data.summary
        
        if not context.strip():
            raise HTTPException(400, "Provide at least a title, summary, or prompt for image generation.")
        
        visual_prompt = await ai_service.generate_visual_prompt(
            data.title or "Blog Post", 
            data.summary or data.title or ""
        )
    
    url = await image_generation_service.generate_and_upload(
        visual_prompt, 
        width=data.width, 
        height=data.height
    )
    
    if not url:
        raise HTTPException(503, "Image generation failed. Please try again.")
    
    return {"url": url, "prompt_used": visual_prompt}

# Implementation Plan: AI-Powered Google Web Stories

This plan outlines the architecture and implementation steps for adding "Google Web Stories" functionality to BlogVerse. This feature will automatically generate visual, tap-through stories from blog posts using AI, and allow for manual creation/management.

## 1. Architectural Overview

### Backend (FastAPI)
- **Database Models**: `WebStory` (linked to a Blog) and `StoryPage` (individual slides).
- **AI Service**: Extend `ai_service.py` to summarize blogs into 5-7 "slides" with visual prompts and captions.
- **Image Service**: Reuse `image_generation_service` to generate cinematic backgrounds for each slide.
- **Automation**: Use an event-driven approach (or simple function call) in `blogs.py` to trigger story generation when a post is published.

### Frontend (React/Vite)
- **Story Viewer**: A high-end, mobile-responsive component for viewing stories (AMP-inspired).
- **Story Gallery**: A dedicated page to browse all generated stories.
- **Admin Dashboard**: Tools to manually trigger, edit, or delete stories.

---

## 2. Backend Implementation

### Phase 1: Data Models & Schemas
#### [NEW] [web_story.py](file:///c:/Users/user/Desktop/Blog%20Website/backend/app/models/web_story.py)
- Create `WebStory` and `StoryPage` models.
- `WebStory` contains metadata (title, slug, link to blog).
- `StoryPage` contains slide data (image URL, title, body text).

### Phase 2: AI Service Extension
#### [MODIFY] [ai_service.py](file:///c:/Users/user/Desktop/Blog%20Website/backend/app/services/ai_service.py)
- Add `generate_story_content(blog_content: str)` method.
- This will prompt Gemini to return a structured JSON list of 5-7 slides.

### Phase 3: Story Generation Service
#### [NEW] [story_service.py](file:///c:/Users/user/Desktop/Blog%20Website/backend/app/services/story_service.py)
- A new service to coordinate the AI and Image services.
- It will:
  1. Get slide content from AI.
  2. For each slide, generate an AI image.
  3. Save everything to the database.

### Phase 4: API Endpoints
#### [NEW] [stories.py](file:///c:/Users/user/Desktop/Blog%20Website/backend/app/api/stories.py)
- Provide endpoints for the frontend to fetch stories.
- Include a "manual generate" endpoint for admins.

---

## 3. Frontend Implementation

### Phase 5: Story Viewer Component
- Build a cinematic, full-screen React component.
- Features: Progress bars, tap-to-navigate, swipe support, and smooth transitions using Framer Motion.

### Phase 6: Pages & Navigation
- **Stories Gallery**: A Pinterest-style grid for all web stories.
- **Integration**: Add a "Watch Story" button to individual blog posts.

---

## 4. Automation Logic
#### [MODIFY] [blogs.py](file:///c:/Users/user/Desktop/Blog%20Website/backend/app/api/blogs.py)
- Modify the `create_blog` endpoint to asynchronously call the story generation service when a blog is published.

---

## 5. Verification Plan
- **Backend**: Automated tests for AI story parsing.
- **Frontend**: Manual testing on mobile and desktop for viewer responsiveness.
- **Integration**: End-to-end test of the auto-generation flow.

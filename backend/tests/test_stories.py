import pytest
from unittest.mock import AsyncMock, patch
from app.models.blog import Blog
from app.models.web_story import WebStory

@pytest.fixture
def test_blog(db_session, test_user):
    blog = Blog(
        title="Test Blog for Stories",
        slug="test-blog-for-stories",
        content="This is some content to convert into a story.",
        author_id=test_user.id,
        status="published"
    )
    db_session.add(blog)
    db_session.commit()
    db_session.refresh(blog)
    return blog

@pytest.fixture
def test_story(db_session, test_blog, test_user):
    story = WebStory(
        blog_id=test_blog.id,
        author_id=test_user.id,
        title=test_blog.title,
        slug=f"story-{test_blog.slug}"
    )
    db_session.add(story)
    db_session.commit()
    db_session.refresh(story)
    return story


# ── Generate Story ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_story_api(client, admin_headers, test_blog):
    with patch("app.services.story_service.ai_service.generate_story_content", new_callable=AsyncMock) as mock_ai:
        mock_ai.return_value = [
            {"title": "Slide 1", "text": "Content 1", "visual_prompt": "Prompt 1"},
            {"title": "Slide 2", "text": "Content 2", "visual_prompt": "Prompt 2"},
        ]
        with patch("app.services.story_service.image_generation_service.generate_and_upload", new_callable=AsyncMock) as mock_img:
            mock_img.return_value = "https://example.com/image.png"
            
            response = client.post(f"/api/stories/generate/{test_blog.id}", headers=admin_headers)
            assert response.status_code == 202
            assert response.json()["message"] == "Generation started in the background"

def test_generate_story_unauthorized(client, test_blog):
    response = client.post(f"/api/stories/generate/{test_blog.id}")
    assert response.status_code == 401


# ── List Stories ─────────────────────────────────────────────────

def test_list_stories_api(client, test_story):
    response = client.get("/api/stories")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["title"] == test_story.title

def test_list_stories_empty(client):
    response = client.get("/api/stories")
    assert response.status_code == 200
    assert response.json() == []

def test_list_stories_with_limit(client, db_session, test_blog, test_user):
    for i in range(5):
        db_session.add(WebStory(
            blog_id=test_blog.id, author_id=test_user.id,
            title=f"Story {i}", slug=f"story-{i}"
        ))
    db_session.commit()
    
    response = client.get("/api/stories?limit=3")
    assert response.status_code == 200
    assert len(response.json()) == 3


# ── Get Single Story ────────────────────────────────────────────

def test_get_story_by_slug(client, test_story):
    response = client.get(f"/api/stories/{test_story.slug}")
    assert response.status_code == 200
    assert response.json()["slug"] == test_story.slug

def test_get_story_by_id(client, test_story):
    response = client.get(f"/api/stories/id/{test_story.id}")
    assert response.status_code == 200
    assert response.json()["id"] == test_story.id

def test_get_story_not_found(client):
    response = client.get("/api/stories/nonexistent-slug")
    assert response.status_code == 404


# ── User's Own Stories ───────────────────────────────────────────

def test_get_my_stories(client, auth_headers, test_story):
    response = client.get("/api/stories/me", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_get_my_stories_unauthorized(client):
    response = client.get("/api/stories/me")
    assert response.status_code == 401


# ── Blog Publication Triggers Story ──────────────────────────────

@pytest.mark.asyncio
async def test_blog_publication_triggers_story(client, auth_headers):
    blog_data = {
        "title": "New Published Blog",
        "content": "Exciting content here.",
        "summary": "Summary",
        "category": "Technology",
        "status": "published",
        "tags": ["tech"]
    }
    
    with patch("app.api.blogs.story_service.create_from_blog", new_callable=AsyncMock) as mock_story_gen:
        response = client.post("/api/blogs", json=blog_data, headers=auth_headers)
        assert response.status_code == 201
        assert mock_story_gen.called


# ── Delete Story ─────────────────────────────────────────────────

def test_delete_story(client, admin_headers, test_story):
    response = client.delete(f"/api/stories/{test_story.id}", headers=admin_headers)
    assert response.status_code in [200, 204]

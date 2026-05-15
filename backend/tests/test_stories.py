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

@pytest.mark.asyncio
async def test_generate_story_api(client, admin_headers, test_blog):
    # Mock AI and Image services
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

def test_list_stories_api(client, db_session, test_blog, test_user):
    # Create a story manually
    story = WebStory(
        blog_id=test_blog.id,
        author_id=test_user.id,
        title=test_blog.title,
        slug=f"story-{test_blog.slug}"
    )
    db_session.add(story)
    db_session.commit()
    
    response = client.get("/api/stories")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["title"] == test_blog.title

def test_get_story_api(client, db_session, test_blog, test_user):
    slug = f"story-{test_blog.slug}"
    story = WebStory(
        blog_id=test_blog.id,
        author_id=test_user.id,
        title=test_blog.title,
        slug=slug
    )
    db_session.add(story)
    db_session.commit()
    
    response = client.get(f"/api/stories/{slug}")
    assert response.status_code == 200
    assert response.json()["slug"] == slug

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
        # Verify that background task was added (we can't easily check background_tasks in TestClient
        # but we can check if the mock was called if we wait or if it's sync in tests)
        # Actually, in FastAPI tests, background tasks are executed synchronously if using TestClient 
        # but here we are mocking the service call anyway.
        assert mock_story_gen.called

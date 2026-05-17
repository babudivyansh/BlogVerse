import pytest
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_ai_service():
    with patch("app.api.ai.ai_service") as mock:
        mock.generate_titles = AsyncMock()
        mock.generate_summary = AsyncMock()
        mock.suggest_tags = AsyncMock()
        mock.generate_full_blog = AsyncMock()
        mock.conversational_chat = AsyncMock()
        mock.improve_content = AsyncMock()
        mock.generate_visual_prompt = AsyncMock()
        yield mock

@pytest.fixture
def mock_image_service():
    with patch("app.api.ai.image_generation_service") as mock:
        mock.generate_and_upload = AsyncMock()
        yield mock

# ── Generate Title ───────────────────────────────────────────────

def test_generate_title(client, auth_headers, mock_ai_service):
    mock_ai_service.generate_titles.return_value = ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]
    response = client.post(
        "/api/ai/generate-title",
        headers=auth_headers,
        json={"topic": "Test"}
    )
    assert response.status_code == 200
    assert len(response.json()["titles"]) == 5

def test_generate_title_unauthorized(client, mock_ai_service):
    response = client.post("/api/ai/generate-title", json={"topic": "Test"})
    assert response.status_code == 401

# ── Generate Summary ─────────────────────────────────────────────

def test_generate_summary(client, auth_headers, mock_ai_service):
    mock_ai_service.generate_summary.return_value = "This is a summary."
    response = client.post(
        "/api/ai/generate-summary",
        headers=auth_headers,
        json={"content": "Long text goes here..."}
    )
    assert response.status_code == 200
    assert response.json()["summary"] == "This is a summary."

def test_generate_summary_unauthorized(client, mock_ai_service):
    response = client.post("/api/ai/generate-summary", json={"content": "Text"})
    assert response.status_code == 401

# ── Suggest Tags ─────────────────────────────────────────────────

def test_suggest_tags(client, auth_headers, mock_ai_service):
    mock_ai_service.suggest_tags.return_value = ["tag1", "tag2", "tag3"]
    response = client.post(
        "/api/ai/suggest-tags",
        headers=auth_headers,
        json={"content": "Content about tags"}
    )
    assert response.status_code == 200
    assert "tag1" in response.json()["tags"]

def test_suggest_tags_unauthorized(client, mock_ai_service):
    response = client.post("/api/ai/suggest-tags", json={"content": "Content"})
    assert response.status_code == 401

# ── Improve Content ──────────────────────────────────────────────

def test_improve_content(client, auth_headers, mock_ai_service):
    mock_ai_service.improve_content.return_value = "Improved and polished content here."
    response = client.post(
        "/api/ai/improve-content",
        headers=auth_headers,
        json={"content": "rough draft content"}
    )
    assert response.status_code == 200
    assert response.json()["improved_content"] == "Improved and polished content here."

def test_improve_content_unauthorized(client, mock_ai_service):
    response = client.post("/api/ai/improve-content", json={"content": "Text"})
    assert response.status_code == 401

# ── Generate Full Blog ───────────────────────────────────────────

def test_generate_blog(client, auth_headers, mock_ai_service, mock_image_service):
    mock_ai_service.generate_full_blog.return_value = {
        "title": "Gen Title", "content": "Gen Content", "summary": "Gen Sum", "tags": ["gen"]
    }
    mock_ai_service.generate_visual_prompt.return_value = "cinematic image prompt"
    mock_image_service.generate_and_upload.return_value = "https://example.com/cover.png"
    
    response = client.post(
        "/api/ai/generate-blog",
        headers=auth_headers,
        json={"topic": "Auto Generate", "tone": "friendly"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Gen Title"
    assert response.json()["cover_image"] == "https://example.com/cover.png"

def test_generate_blog_without_cover_on_image_failure(client, auth_headers, mock_ai_service, mock_image_service):
    """If image generation fails, blog should still return with cover_image=None."""
    mock_ai_service.generate_full_blog.return_value = {
        "title": "Title", "content": "Content", "summary": "Sum", "tags": ["t"]
    }
    mock_ai_service.generate_visual_prompt.side_effect = Exception("Image gen failed")
    
    response = client.post(
        "/api/ai/generate-blog",
        headers=auth_headers,
        json={"topic": "Test", "tone": "professional"}
    )
    assert response.status_code == 200
    assert response.json()["cover_image"] is None

def test_generate_blog_unauthorized(client, mock_ai_service):
    response = client.post("/api/ai/generate-blog", json={"topic": "Test"})
    assert response.status_code == 401

# ── Chat ─────────────────────────────────────────────────────────

def test_chat(client, mock_ai_service):
    mock_ai_service.conversational_chat.return_value = "Hello from AI"
    response = client.post(
        "/api/ai/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]}
    )
    assert response.status_code == 200
    assert response.json()["reply"] == "Hello from AI"

def test_chat_multi_turn(client, mock_ai_service):
    mock_ai_service.conversational_chat.return_value = "Sure, I can help with that!"
    response = client.post(
        "/api/ai/chat",
        json={"messages": [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello! How can I help?"},
            {"role": "user", "content": "Tell me about blogs"}
        ]}
    )
    assert response.status_code == 200
    assert "help" in response.json()["reply"]

# ── Generate Image ───────────────────────────────────────────────

def test_generate_image_with_prompt(client, auth_headers, mock_ai_service, mock_image_service):
    mock_image_service.generate_and_upload.return_value = "https://example.com/image.png"
    response = client.post(
        "/api/ai/generate-image",
        headers=auth_headers,
        json={"prompt": "A futuristic city skyline", "width": 1280, "height": 720}
    )
    assert response.status_code == 200
    assert response.json()["url"] == "https://example.com/image.png"

def test_generate_image_with_title(client, auth_headers, mock_ai_service, mock_image_service):
    mock_ai_service.generate_visual_prompt.return_value = "Generated visual prompt"
    mock_image_service.generate_and_upload.return_value = "https://example.com/image2.png"
    response = client.post(
        "/api/ai/generate-image",
        headers=auth_headers,
        json={"title": "My Blog Title", "summary": "About AI technology"}
    )
    assert response.status_code == 200
    assert response.json()["url"] == "https://example.com/image2.png"

def test_generate_image_unauthorized(client, mock_ai_service, mock_image_service):
    response = client.post("/api/ai/generate-image", json={"prompt": "test"})
    assert response.status_code == 401

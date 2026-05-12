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
        yield mock

def test_generate_title(client, auth_headers, mock_ai_service):
    mock_ai_service.generate_titles.return_value = ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]
    response = client.post(
        "/api/ai/generate-title",
        headers=auth_headers,
        json={"topic": "Test"}
    )
    assert response.status_code == 200
    assert len(response.json()["titles"]) == 5

def test_generate_summary(client, auth_headers, mock_ai_service):
    mock_ai_service.generate_summary.return_value = "This is a summary."
    response = client.post(
        "/api/ai/generate-summary",
        headers=auth_headers,
        json={"content": "Long text goes here..."}
    )
    assert response.status_code == 200
    assert response.json()["summary"] == "This is a summary."

def test_suggest_tags(client, auth_headers, mock_ai_service):
    mock_ai_service.suggest_tags.return_value = ["tag1", "tag2", "tag3"]
    response = client.post(
        "/api/ai/suggest-tags",
        headers=auth_headers,
        json={"content": "Content about tags"}
    )
    assert response.status_code == 200
    assert "tag1" in response.json()["tags"]

def test_generate_blog(client, auth_headers, mock_ai_service):
    mock_ai_service.generate_full_blog.return_value = {"title": "Gen Title", "content": "Gen Content", "summary": "Gen Sum", "tags": ["gen"]}
    response = client.post(
        "/api/ai/generate-blog",
        headers=auth_headers,
        json={"topic": "Auto Generate", "tone": "friendly"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Gen Title"

def test_chat(client, auth_headers, mock_ai_service):
    mock_ai_service.conversational_chat.return_value = "Hello from AI"
    response = client.post(
        "/api/ai/chat",
        headers=auth_headers,
        json={"messages": [{"role": "user", "content": "Hi"}]}
    )
    assert response.status_code == 200
    assert response.json()["reply"] == "Hello from AI"

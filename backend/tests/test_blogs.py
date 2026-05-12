import pytest
from app.models.blog import Blog

@pytest.fixture
def test_blog(db_session, test_user):
    blog = Blog(
        title="Test Blog",
        slug="test-blog",
        content="This is a test blog.",
        summary="Test summary",
        category="Tech",
        read_time=5,
        author_id=test_user.id,
        status="published"
    )
    db_session.add(blog)
    db_session.commit()
    db_session.refresh(blog)
    return blog

def test_create_blog(client, auth_headers):
    response = client.post(
        "/api/blogs",
        headers=auth_headers,
        json={
            "title": "New Blog",
            "content": "Blog content",
            "summary": "Summary",
            "category": "Science",
            "read_time": 3,
            "tags": ["space", "stars"]
        }
    )
    assert response.status_code == 201
    assert response.json()["title"] == "New Blog"
    assert response.json()["slug"] == "new-blog"

def test_get_blogs(client, test_blog):
    response = client.get("/api/blogs")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["items"][0]["title"] == test_blog.title

def test_get_blog_by_slug(client, test_blog):
    response = client.get(f"/api/blogs/{test_blog.slug}")
    assert response.status_code == 200
    assert response.json()["title"] == test_blog.title

def test_get_blog_not_found(client):
    response = client.get("/api/blogs/not-found")
    assert response.status_code == 404

def test_update_blog(client, auth_headers, test_blog):
    response = client.put(
        f"/api/blogs/{test_blog.id}",
        headers=auth_headers,
        json={
            "title": "Updated Blog Title",
            "content": "Updated content"
        }
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Blog Title"

def test_toggle_like(client, auth_headers, test_blog):
    # Like
    response = client.post(f"/api/blogs/{test_blog.id}/like", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["liked"] is True

    # Unlike
    response = client.post(f"/api/blogs/{test_blog.id}/like", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["liked"] is False

def test_delete_blog(client, auth_headers, test_blog):
    response = client.delete(f"/api/blogs/{test_blog.id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify deletion
    res = client.get(f"/api/blogs/{test_blog.slug}")
    assert res.status_code == 404

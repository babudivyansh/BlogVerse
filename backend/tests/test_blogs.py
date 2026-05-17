import pytest
from app.models.blog import Blog, Tag

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

@pytest.fixture
def featured_blog(db_session, test_user):
    blog = Blog(
        title="Featured Blog",
        slug="featured-blog",
        content="This is a featured blog.",
        summary="Featured summary",
        category="Science",
        read_time=3,
        author_id=test_user.id,
        status="published",
        is_featured=True
    )
    db_session.add(blog)
    db_session.commit()
    db_session.refresh(blog)
    return blog

@pytest.fixture
def draft_blog(db_session, test_user):
    blog = Blog(
        title="Draft Blog",
        slug="draft-blog",
        content="This is a draft.",
        summary="Draft summary",
        category="Tech",
        read_time=2,
        author_id=test_user.id,
        status="draft"
    )
    db_session.add(blog)
    db_session.commit()
    db_session.refresh(blog)
    return blog


# ── Create ───────────────────────────────────────────────────────

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

def test_create_blog_unauthorized(client):
    response = client.post(
        "/api/blogs",
        json={"title": "Fail", "content": "No auth", "summary": "x", "category": "x"}
    )
    assert response.status_code == 401

def test_create_blog_generates_slug(client, auth_headers):
    response = client.post(
        "/api/blogs",
        headers=auth_headers,
        json={"title": "My Amazing Title!", "content": "Content", "summary": "Sum", "category": "Tech"}
    )
    assert response.status_code == 201
    assert response.json()["slug"] == "my-amazing-title"

def test_create_blog_duplicate_slug_increments(client, auth_headers, test_blog):
    """Creating a blog with the same title as an existing one should produce a unique slug."""
    response = client.post(
        "/api/blogs",
        headers=auth_headers,
        json={"title": "Test Blog", "content": "Different content", "summary": "Sum", "category": "Tech"}
    )
    assert response.status_code == 201
    assert response.json()["slug"] != test_blog.slug  # Should be "test-blog-1"


# ── List / Search ────────────────────────────────────────────────

def test_get_blogs(client, test_blog):
    response = client.get("/api/blogs")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["items"][0]["title"] == test_blog.title

def test_get_blogs_pagination(client, auth_headers, db_session, test_user):
    """Test that pagination works correctly."""
    for i in range(5):
        db_session.add(Blog(
            title=f"Blog {i}", slug=f"blog-{i}", content="Content",
            author_id=test_user.id, status="published"
        ))
    db_session.commit()
    
    response = client.get("/api/blogs?page=1&limit=3")
    assert response.status_code == 200
    assert len(response.json()["items"]) == 3
    assert response.json()["pages"] == 2

def test_get_blogs_search(client, test_blog):
    response = client.get("/api/blogs?search=Test")
    assert response.status_code == 200
    assert response.json()["total"] >= 1

def test_get_blogs_search_no_results(client, test_blog):
    response = client.get("/api/blogs?search=NonExistentXYZ")
    assert response.status_code == 200
    assert response.json()["total"] == 0

def test_get_blogs_filter_by_category(client, test_blog):
    response = client.get("/api/blogs?category=Tech")
    assert response.status_code == 200
    assert response.json()["total"] >= 1

def test_get_blogs_filter_by_author(client, test_blog, test_user):
    response = client.get(f"/api/blogs?author={test_user.username}")
    assert response.status_code == 200
    assert response.json()["total"] >= 1

def test_get_blogs_hides_drafts_from_public(client, draft_blog):
    """Drafts should not appear in the public blog list."""
    response = client.get("/api/blogs")
    assert response.status_code == 200
    slugs = [item["slug"] for item in response.json()["items"]]
    assert "draft-blog" not in slugs


# ── Single Blog ──────────────────────────────────────────────────

def test_get_blog_by_slug(client, test_blog):
    response = client.get(f"/api/blogs/{test_blog.slug}")
    assert response.status_code == 200
    assert response.json()["title"] == test_blog.title

def test_get_blog_by_id(client, test_blog):
    response = client.get(f"/api/blogs/{test_blog.id}")
    assert response.status_code == 200
    assert response.json()["title"] == test_blog.title

def test_get_blog_not_found(client):
    response = client.get("/api/blogs/not-found")
    assert response.status_code == 404

def test_get_blog_increments_views(client, test_blog):
    """Each GET request should increment the view counter."""
    response1 = client.get(f"/api/blogs/{test_blog.slug}")
    views1 = response1.json()["views"]
    
    response2 = client.get(f"/api/blogs/{test_blog.slug}")
    views2 = response2.json()["views"]
    
    assert views2 == views1 + 1


# ── Featured ─────────────────────────────────────────────────────

def test_get_featured_blogs(client, featured_blog):
    response = client.get("/api/blogs/featured")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["title"] == "Featured Blog"

def test_get_featured_blogs_empty(client):
    response = client.get("/api/blogs/featured")
    assert response.status_code == 200
    assert response.json() == []


# ── Categories ───────────────────────────────────────────────────

def test_list_categories(client, test_blog):
    response = client.get("/api/blogs/categories")
    assert response.status_code == 200
    names = [c["name"] for c in response.json()]
    assert "Tech" in names

def test_list_categories_with_counts(client, test_blog):
    response = client.get("/api/blogs/categories")
    assert response.status_code == 200
    tech_cat = next(c for c in response.json() if c["name"] == "Tech")
    assert tech_cat["count"] >= 1


# ── Tags ─────────────────────────────────────────────────────────

def test_list_tags(client, db_session):
    tag = Tag(name="python")
    db_session.add(tag)
    db_session.commit()
    
    response = client.get("/api/blogs/tags")
    assert response.status_code == 200
    names = [t["name"] for t in response.json()]
    assert "python" in names


# ── Update ───────────────────────────────────────────────────────

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

def test_update_blog_not_owner(client, db_session, test_blog):
    """A non-owner, non-admin user cannot update another user's blog."""
    from app.core.security import create_access_token, hash_password
    from app.models.user import User
    
    other = User(
        username="otheruser", email="other@ex.com",
        hashed_password=hash_password("otherpass"), full_name="Other", is_verified=True
    )
    db_session.add(other)
    db_session.commit()
    db_session.refresh(other)
    token = create_access_token(data={"sub": str(other.id)})
    
    response = client.put(
        f"/api/blogs/{test_blog.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Hacked Title"}
    )
    assert response.status_code == 403

def test_update_blog_not_found(client, auth_headers):
    response = client.put("/api/blogs/99999", headers=auth_headers, json={"title": "X"})
    assert response.status_code == 404


# ── Like / Unlike ────────────────────────────────────────────────

def test_toggle_like(client, auth_headers, test_blog):
    # Like
    response = client.post(f"/api/blogs/{test_blog.id}/like", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["liked"] is True

    # Unlike
    response = client.post(f"/api/blogs/{test_blog.id}/like", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["liked"] is False

def test_like_blog_not_found(client, auth_headers):
    response = client.post("/api/blogs/99999/like", headers=auth_headers)
    assert response.status_code == 404

def test_like_unauthorized(client, test_blog):
    response = client.post(f"/api/blogs/{test_blog.id}/like")
    assert response.status_code == 401


# ── Delete ───────────────────────────────────────────────────────

def test_delete_blog(client, auth_headers, test_blog):
    response = client.delete(f"/api/blogs/{test_blog.id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify deletion
    res = client.get(f"/api/blogs/{test_blog.slug}")
    assert res.status_code == 404

def test_delete_blog_not_found(client, auth_headers):
    response = client.delete("/api/blogs/99999", headers=auth_headers)
    assert response.status_code == 404

def test_delete_blog_unauthorized(client, test_blog):
    response = client.delete(f"/api/blogs/{test_blog.id}")
    assert response.status_code == 401

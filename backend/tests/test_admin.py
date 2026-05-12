import pytest
from app.models.blog import Blog

@pytest.fixture
def test_blog(db_session, test_user):
    blog = Blog(title="Admin test blog", slug="admin-test-blog", content="Text", author_id=test_user.id)
    db_session.add(blog)
    db_session.commit()
    db_session.refresh(blog)
    return blog

def test_admin_stats(client, admin_headers):
    response = client.get("/api/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    assert "total_users" in response.json()

def test_admin_stats_forbidden(client, auth_headers):
    response = client.get("/api/admin/stats", headers=auth_headers)
    assert response.status_code == 403

def test_admin_users_list(client, admin_headers):
    response = client.get("/api/admin/users", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_admin_block_user(client, admin_headers, test_user):
    response = client.put(f"/api/admin/users/{test_user.id}/block", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["is_blocked"] is True

def test_admin_delete_blog(client, admin_headers, test_blog):
    response = client.delete(f"/api/admin/blogs/{test_blog.id}", headers=admin_headers)
    assert response.status_code == 204

def test_admin_toggle_feature(client, admin_headers, test_blog):
    response = client.put(f"/api/admin/blogs/{test_blog.id}/feature", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["is_featured"] is True

def test_admin_delete_user_with_blogs(client, admin_headers, test_user, test_blog):
    # test_blog belongs to test_user
    response = client.delete(f"/api/admin/users/{test_user.id}", headers=admin_headers)
    assert response.status_code == 204

    # Verify user is gone
    response = client.get(f"/api/users/{test_user.username}")
    assert response.status_code == 404

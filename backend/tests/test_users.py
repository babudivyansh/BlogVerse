import pytest
from app.models.user import User

def test_get_user_profile(client, test_user):
    response = client.get(f"/api/users/{test_user.username}")
    assert response.status_code == 200
    assert response.json()["username"] == test_user.username

def test_get_user_profile_not_found(client):
    response = client.get("/api/users/nonexistent")
    assert response.status_code == 404

def test_update_profile(client, auth_headers, test_user):
    response = client.put(
        "/api/users/me",
        headers=auth_headers,
        json={
            "full_name": "Updated Name",
            "bio": "New bio",
            "social_links": {"twitter": "@updated"}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["bio"] == "New bio"
    assert data["social_links"]["twitter"] == "@updated"

def test_update_profile_unauthorized(client):
    response = client.put("/api/users/me", json={"bio": "New bio"})
    assert response.status_code == 401

def test_get_user_blogs(client, test_user):
    response = client.get(f"/api/users/{test_user.username}/blogs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

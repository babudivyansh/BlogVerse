import pytest
from app.models.user import User
from app.core.security import hash_password

def test_signup_success(client, db_session):
    response = client.post(
        "/api/auth/signup",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
            "full_name": "New User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    
    # Verify user exists in db
    user = db_session.query(User).filter_by(username="newuser").first()
    assert user is not None
    assert user.verification_token is not None

def test_signup_duplicate_email(client, test_user):
    response = client.post(
        "/api/auth/signup",
        json={
            "username": "differentuser",
            "email": test_user.email,
            "password": "password123",
            "full_name": "Diff User"
        }
    )
    assert response.status_code == 409
    assert "Email already registered" in response.json()["detail"]

def test_signup_duplicate_username(client, test_user):
    response = client.post(
        "/api/auth/signup",
        json={
            "username": test_user.username,
            "email": "different@example.com",
            "password": "password123",
            "full_name": "Diff User"
        }
    )
    assert response.status_code == 409
    assert "Username already taken" in response.json()["detail"]

def test_login_success(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_user.email,
            "password": "password123"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_password(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_user.email,
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_login_invalid_email(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "notfound@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 401

def test_get_me(client, auth_headers, test_user):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == test_user.username

def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_verify_email(client, db_session):
    # Create an unverified user
    user = User(
        username="unverified",
        email="unverified@example.com",
        hashed_password="hashedpassword",
        verification_token="test-token",
        is_verified=False
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.post("/api/auth/verify-email", json={"token": "test-token"})
    assert response.status_code == 200
    
    db_session.refresh(user)
    assert user.is_verified is True
    assert user.verification_token is None

def test_verify_email_invalid_token(client):
    response = client.post("/api/auth/verify-email", json={"token": "invalid-token"})
    assert response.status_code == 400

def test_login_unverified_fails(client, db_session):
    # Create unverified user
    user = User(
        username="unverified_login",
        email="unverified_login@example.com",
        hashed_password=hash_password("password123"),
        full_name="Unverified User",
        is_verified=False
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.post(
        "/api/auth/login",
        json={
            "email": "unverified_login@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 403
    assert "verify your email" in response.json()["detail"].lower()

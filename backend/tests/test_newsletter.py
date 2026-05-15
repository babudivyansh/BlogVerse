import pytest
from app.models.subscriber import Subscriber
from app.models.blog import Blog

def test_subscribe_success(client, db_session):
    response = client.post(
        "/api/newsletter/subscribe",
        json={"email": "subscriber@example.com"}
    )
    assert response.status_code == 201
    assert "Welcome to the family" in response.json()["message"]
    
    # Verify in DB
    sub = db_session.query(Subscriber).filter_by(email="subscriber@example.com").first()
    assert sub is not None

def test_subscribe_duplicate(client, db_session):
    # Add existing
    sub = Subscriber(email="exists@example.com")
    db_session.add(sub)
    db_session.commit()
    
    response = client.post(
        "/api/newsletter/subscribe",
        json={"email": "exists@example.com"}
    )
    assert response.status_code == 200
    assert "already subscribed" in response.json()["message"]

def test_get_subscribers_admin(client, admin_headers, db_session):
    # Add some subs
    db_session.add(Subscriber(email="s1@ex.com"))
    db_session.add(Subscriber(email="s2@ex.com"))
    db_session.commit()
    
    response = client.get("/api/newsletter/subscribers", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 2

def test_get_subscribers_unauthorized(client, auth_headers):
    response = client.get("/api/newsletter/subscribers", headers=auth_headers)
    assert response.status_code == 403

def test_broadcast_success(client, admin_headers, db_session, admin_user):
    # Create a published blog
    blog = Blog(
        title="Test Blog",
        slug="test-blog",
        content="content",
        summary="summary",
        status="published",
        author_id=admin_user.id
    )
    db_session.add(blog)
    db_session.commit()
    
    # Add some subscribers
    db_session.add(Subscriber(email="fan1@ex.com"))
    db_session.commit()
    
    response = client.post(f"/api/newsletter/broadcast/{blog.id}", headers=admin_headers)
    assert response.status_code == 200
    assert "Broadcast triggered" in response.json()["message"]

def test_broadcast_draft_fails(client, admin_headers, db_session, admin_user):
    # Create a draft blog
    blog = Blog(
        title="Draft Blog",
        slug="draft-blog",
        content="content",
        status="draft",
        author_id=admin_user.id
    )
    db_session.add(blog)
    db_session.commit()
    
    response = client.post(f"/api/newsletter/broadcast/{blog.id}", headers=admin_headers)
    assert response.status_code == 400
    assert "Only published blogs" in response.json()["detail"]

def test_delete_subscriber_admin(client, admin_headers, db_session):
    # Add a subscriber
    sub = Subscriber(email="remove@ex.com")
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)
    
    response = client.delete(f"/api/newsletter/subscribers/{sub.id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Subscriber removed"
    
    # Verify removal
    exists = db_session.query(Subscriber).filter_by(id=sub.id).first()
    assert exists is None

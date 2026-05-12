import pytest
from app.models.blog import Blog
from app.models.comment import Comment

@pytest.fixture
def test_blog(db_session, test_user):
    blog = Blog(title="Blog for Comment", slug="blog-for-comment", content="Text", author_id=test_user.id)
    db_session.add(blog)
    db_session.commit()
    db_session.refresh(blog)
    return blog

@pytest.fixture
def test_comment(db_session, test_blog, test_user):
    comment = Comment(content="First comment", blog_id=test_blog.id, user_id=test_user.id)
    db_session.add(comment)
    db_session.commit()
    db_session.refresh(comment)
    return comment

def test_create_comment(client, auth_headers, test_blog):
    response = client.post(
        f"/api/blogs/{test_blog.id}/comments",
        headers=auth_headers,
        json={"content": "This is a comment"}
    )
    assert response.status_code == 201
    assert response.json()["content"] == "This is a comment"
    assert response.json()["author"]["username"] == "testuser"

def test_create_comment_reply(client, auth_headers, test_blog, test_comment):
    response = client.post(
        f"/api/blogs/{test_blog.id}/comments",
        headers=auth_headers,
        json={"content": "This is a reply", "parent_id": test_comment.id}
    )
    assert response.status_code == 201
    assert response.json()["parent_id"] == test_comment.id

def test_list_comments(client, test_blog, test_comment):
    response = client.get(f"/api/blogs/{test_blog.id}/comments")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["content"] == "First comment"

def test_delete_comment(client, auth_headers, test_comment):
    response = client.delete(f"/api/comments/{test_comment.id}", headers=auth_headers)
    assert response.status_code == 204

def test_delete_comment_unauthorized(client, test_comment):
    response = client.delete(f"/api/comments/{test_comment.id}")
    assert response.status_code == 401

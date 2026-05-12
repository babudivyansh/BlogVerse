import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set env vars for testing before importing app components
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "testsecret"
os.environ["OPENAI_API_KEY"] = "test-openai-key"

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.core.security import hash_password, create_access_token

# Configure in-memory SQLite DB for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def test_user(db_session):
    user = User(
        username="testuser",
        email="testuser@example.com",
        hashed_password=hash_password("password123"),
        full_name="Test User",
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_user(db_session):
    admin = User(
        username="adminuser",
        email="admin@example.com",
        hashed_password=hash_password("adminpass"),
        full_name="Admin User",
        is_verified=True,
        is_admin=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture
def user_token(test_user):
    return create_access_token(data={"sub": str(test_user.id)})

@pytest.fixture
def admin_token(admin_user):
    return create_access_token(data={"sub": str(admin_user.id)})

@pytest.fixture
def auth_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

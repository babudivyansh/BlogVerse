import pytest
from unittest.mock import patch
import io

@pytest.fixture
def mock_cloudinary():
    with patch("app.api.upload._upload_to_cloudinary") as mock:
        yield mock

def test_upload_image_cloudinary(client, auth_headers, mock_cloudinary):
    mock_cloudinary.return_value = "https://cloudinary.com/image.jpg"
    
    file_content = b"fake image data"
    files = {"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")}
    
    response = client.post("/api/upload", headers=auth_headers, files=files)
    assert response.status_code == 200
    assert response.json()["url"] == "https://cloudinary.com/image.jpg"
    assert response.json()["storage"] == "cloudinary"

def test_upload_image_local_fallback(client, auth_headers, mock_cloudinary):
    # Simulate cloudinary not configured or failing
    mock_cloudinary.return_value = None
    
    file_content = b"fake image data"
    files = {"file": ("test2.png", io.BytesIO(file_content), "image/png")}
    
    # We also mock _save_locally to not write files during tests
    with patch("app.api.upload._save_locally", return_value="/uploads/test2.png"):
        response = client.post("/api/upload", headers=auth_headers, files=files)
    
    assert response.status_code == 200
    assert response.json()["url"] == "/uploads/test2.png"
    assert response.json()["storage"] == "local"

def test_upload_invalid_type(client, auth_headers):
    file_content = b"fake pdf data"
    files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    
    response = client.post("/api/upload", headers=auth_headers, files=files)
    assert response.status_code == 400
    assert "Allowed types" in response.json()["detail"]

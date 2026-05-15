import pytest

def test_sitemap_exists(client):
    """Test that the sitemap.xml is accessible."""
    response = client.get("/sitemap.xml")
    assert response.status_code == 200
    assert "text/xml" in response.headers["content-type"] or "application/xml" in response.headers["content-type"]
    assert "<urlset" in response.text

def test_sitemap_api_exists(client):
    """Test that the /api/sitemap.xml is accessible."""
    response = client.get("/api/sitemap.xml")
    assert response.status_code == 200
    assert "text/xml" in response.headers["content-type"] or "application/xml" in response.headers["content-type"]
    assert "<urlset" in response.text

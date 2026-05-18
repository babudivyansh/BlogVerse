"""Google Indexing API service for auto-submitting URLs to Google Search.

Automatically notifies Google when new blogs or stories are published,
so they get crawled and indexed faster (minutes instead of days).

Setup:
1. Enable "Web Search Indexing API" in Google Cloud Console
2. Create a service account and download the JSON key
3. Set GOOGLE_INDEXING_ENABLED=true in environment
4. Set GOOGLE_SERVICE_ACCOUNT_JSON with the full JSON key content
"""

import json
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    logger.warning("google-auth not installed. Google Indexing API will be unavailable.")

INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish"
SCOPES = ["https://www.googleapis.com/auth/indexing"]
BASE_URL = "https://blogverse.info"


class GoogleIndexingService:
    """Service to submit URLs to Google for indexing via the Indexing API."""

    def __init__(self):
        self._credentials = None
        self._is_configured = False
        self._configure()

    def _configure(self):
        """Configure credentials from environment."""
        if not GOOGLE_AUTH_AVAILABLE:
            logger.debug("google-auth not available, skipping indexing setup.")
            return

        if not getattr(settings, "GOOGLE_INDEXING_ENABLED", False):
            logger.debug("Google Indexing API is disabled.")
            return

        json_str = getattr(settings, "GOOGLE_SERVICE_ACCOUNT_JSON", None)
        if not json_str:
            logger.warning("GOOGLE_SERVICE_ACCOUNT_JSON not set. Indexing API disabled.")
            return

        try:
            service_account_info = json.loads(json_str)
            self._credentials = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=SCOPES,
            )
            self._is_configured = True
            logger.info(
                f"Google Indexing API configured. "
                f"Service account: {service_account_info.get('client_email', 'unknown')}"
            )
        except Exception as e:
            logger.error(f"Failed to configure Google Indexing API: {e}")

    @property
    def is_enabled(self) -> bool:
        return self._is_configured

    def _get_auth_token(self) -> Optional[str]:
        """Get a fresh OAuth2 access token."""
        if not self._credentials:
            return None
        try:
            self._credentials.refresh(Request())
            return self._credentials.token
        except Exception as e:
            logger.error(f"Failed to get auth token: {e}")
            return None

    def submit_url(self, url: str, action: str = "URL_UPDATED") -> bool:
        """
        Submit a URL to Google for indexing.
        
        Args:
            url: Full URL to submit (e.g., https://blogverse.info/blog/my-post)
            action: "URL_UPDATED" (new/updated) or "URL_DELETED" (removed)
        
        Returns:
            True if successful, False otherwise.
        """
        if not self._is_configured:
            logger.debug(f"Indexing API not configured, skipping: {url}")
            return False

        try:
            import httpx

            token = self._get_auth_token()
            if not token:
                logger.error("Could not get auth token for Indexing API")
                return False

            payload = {
                "url": url,
                "type": action,
            }

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    INDEXING_API_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                )

            if response.status_code == 200:
                logger.info(f"[Google Indexing] Successfully submitted: {url}")
                return True
            else:
                logger.warning(
                    f"[Google Indexing] Failed ({response.status_code}): {url} "
                    f"- {response.text[:200]}"
                )
                return False

        except Exception as e:
            logger.error(f"[Google Indexing] Error submitting {url}: {e}")
            return False

    def submit_blog(self, slug: str) -> bool:
        """Submit a blog post URL for indexing."""
        url = f"{BASE_URL}/blog/{slug}"
        return self.submit_url(url)

    def submit_story(self, slug: str) -> bool:
        """Submit a web story URL for indexing."""
        url = f"{BASE_URL}/stories/{slug}"
        return self.submit_url(url)

    def remove_url(self, url: str) -> bool:
        """Notify Google that a URL has been removed."""
        return self.submit_url(url, action="URL_DELETED")

    def ping_sitemap(self) -> bool:
        """Ping Google to re-crawl the sitemap (free, no auth needed)."""
        try:
            import httpx

            sitemap_url = f"{BASE_URL}/sitemap.xml"
            ping_url = f"https://www.google.com/ping?sitemap={sitemap_url}"

            with httpx.Client(timeout=10.0) as client:
                response = client.get(ping_url)

            if response.status_code == 200:
                logger.info(f"[Sitemap Ping] Successfully pinged Google: {sitemap_url}")
                return True
            else:
                logger.warning(f"[Sitemap Ping] Failed ({response.status_code})")
                return False

        except Exception as e:
            logger.error(f"[Sitemap Ping] Error: {e}")
            return False


# Singleton instance
indexing_service = GoogleIndexingService()

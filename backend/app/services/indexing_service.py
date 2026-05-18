"""Google Indexing API service (currently disabled).

The Google Indexing API requires the service account to be added as Owner
in Search Console, which Google currently doesn't support for service
accounts via the UI. The code is kept here for future use when Google
fixes this limitation.

For now, indexing relies on:
1. Dynamic sitemap at /sitemap.xml (submitted in Search Console)
2. Manual "Request Indexing" via Search Console URL Inspection
"""

import logging

logger = logging.getLogger(__name__)


class GoogleIndexingService:
    """Stub service — Indexing API disabled due to permission limitations."""

    @property
    def is_enabled(self) -> bool:
        return False

    def submit_url(self, url: str, action: str = "URL_UPDATED") -> bool:
        """No-op: Indexing API is disabled."""
        return False

    def submit_blog(self, slug: str) -> bool:
        """No-op: Indexing API is disabled."""
        return False

    def submit_story(self, slug: str) -> bool:
        """No-op: Indexing API is disabled."""
        return False

    def remove_url(self, url: str) -> bool:
        """No-op: Indexing API is disabled."""
        return False

    def ping_sitemap(self) -> bool:
        """No-op: Google deprecated the /ping endpoint."""
        return False


# Singleton instance
indexing_service = GoogleIndexingService()

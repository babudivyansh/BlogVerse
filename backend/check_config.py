
from app.core.config import settings
print(f"GEMINI_API_KEY: {'Configured' if settings.GEMINI_API_KEY else 'NOT CONFIGURED'}")
print(f"GEMINI_MODEL: {settings.GEMINI_MODEL}")

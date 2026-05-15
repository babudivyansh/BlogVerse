from app.core.config import settings
print(f"Cloud Name: '{settings.CLOUDINARY_CLOUD_NAME}' (len: {len(settings.CLOUDINARY_CLOUD_NAME)})")
print(f"API Key: '{settings.CLOUDINARY_API_KEY}' (len: {len(settings.CLOUDINARY_API_KEY)})")
print(f"API Secret: '{settings.CLOUDINARY_API_SECRET}' (len: {len(settings.CLOUDINARY_API_SECRET)})")

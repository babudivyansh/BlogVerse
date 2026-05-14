import logging
import httpx
import uuid
import urllib.parse
import io
import cloudinary
import cloudinary.uploader
from app.core.config import settings

logger = logging.getLogger(__name__)

class ImageGenerationService:
    def __init__(self):
        self._configure_cloudinary()

    def _configure_cloudinary(self):
        """Configure Cloudinary settings."""
        if all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )
            logger.info("Cloudinary configured for ImageGenerationService.")

    def _save_locally(self, file_bytes: bytes) -> str:
        """Save file to local uploads directory as a fallback."""
        try:
            from pathlib import Path
            upload_dir = Path(settings.UPLOAD_DIR)
            upload_dir.mkdir(parents=True, exist_ok=True)
            filename = f"ai_cover_{uuid.uuid4().hex}.png"
            filepath = upload_dir / filename
            filepath.write_bytes(file_bytes)
            return f"/uploads/{filename}"
        except Exception as e:
            logger.error(f"Local save failed: {e}")
            return None

    async def generate_and_upload(self, prompt: str) -> str:
        """
        Generate an image using Pollinations.ai and upload it to Cloudinary.
        Falls back to local storage if Cloudinary fails.
        """
        try:
            # 1. Generate Image from Pollinations.ai
            encoded_prompt = urllib.parse.quote(prompt)
            seed = uuid.uuid4().int % 10000
            # Correct API URL for image generation
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&seed={seed}&nologo=true"
            
            logger.info(f"Fetching generated image for prompt: {prompt[:50]}...")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(image_url)
                if response.status_code != 200:
                    logger.error(f"Failed to fetch image from Pollinations: {response.status_code}")
                    return None
                image_bytes = response.content

            # 2. Try Cloudinary Upload
            logger.info("Attempting Cloudinary upload...")
            try:
                # Use BytesIO to mimic a file object
                file_obj = io.BytesIO(image_bytes)
                
                result = cloudinary.uploader.upload(
                    file_obj,
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    folder="blogverse/ai_covers"
                )
                
                secure_url = result.get("secure_url")
                if secure_url:
                    logger.info(f"Successfully uploaded to Cloudinary: {secure_url}")
                    return secure_url
            except Exception as cloud_err:
                logger.warning(f"Cloudinary failed, falling back to local storage: {cloud_err}")

            # 3. Fallback to Local Storage
            local_url = self._save_locally(image_bytes)
            if local_url:
                logger.info(f"Successfully saved locally: {local_url}")
                return local_url

            return None

        except Exception as e:
            logger.error(f"Error in generate_and_upload: {e}")
            return None

image_generation_service = ImageGenerationService()

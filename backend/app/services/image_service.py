import logging
import httpx
import uuid
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

    async def generate_and_upload(self, prompt: str) -> str:
        """
        Generate an image using Pollinations.ai and upload it to Cloudinary.
        Returns the secure URL of the uploaded image.
        """
        try:
            # 1. Generate Image from Pollinations.ai
            # We encode the prompt to be URL-safe
            encoded_prompt = httpx.utils.quote(prompt)
            # Use random seed for variety
            seed = uuid.uuid4().int % 10000
            # Standard dimensions for blog covers
            image_url = f"https://pollinations.ai/p/{encoded_prompt}?width=1280&height=720&seed={seed}&nologo=true"
            
            logger.info(f"Fetching generated image for prompt: {prompt[:50]}...")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(image_url)
                if response.status_code != 200:
                    logger.error(f"Failed to fetch image from Pollinations: {response.status_code}")
                    return None
                image_bytes = response.content

            # 2. Upload to Cloudinary
            unique_filename = f"ai_cover_{uuid.uuid4().hex}"
            logger.info(f"Uploading generated image to Cloudinary as {unique_filename}...")
            
            # Note: We use the blocking uploader here for simplicity as it's standard for Cloudinary
            result = cloudinary.uploader.upload(
                image_bytes, 
                folder="blogverse/ai_covers", 
                public_id=unique_filename
            )
            
            secure_url = result.get("secure_url")
            logger.info(f"Successfully generated and uploaded AI cover: {secure_url}")
            return secure_url

        except Exception as e:
            logger.error(f"Error in generate_and_upload: {e}")
            return None

image_generation_service = ImageGenerationService()

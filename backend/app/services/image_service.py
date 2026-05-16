import logging
import asyncio
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
        pass

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

    async def generate_and_upload(self, prompt: str, width: int = 1280, height: int = 720) -> str:
        """
        Generate an image using Pollinations.ai and upload it to Cloudinary.
        Falls back to local storage if Cloudinary fails.
        """
        try:
            # 1. Generate Image from Pollinations.ai
            # Use a more robust prompt cleaning
            clean_prompt = prompt.replace("\n", " ").strip()
            encoded_prompt = urllib.parse.quote(clean_prompt)
            seed = uuid.uuid4().int % 100000
            
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true"
            
            logger.info(f"Fetching generated image ({width}x{height}) via free pollinations.ai for prompt: {clean_prompt[:50]}...")
            
            image_bytes = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        response = await client.get(image_url)
                        if response.status_code == 200:
                            image_bytes = response.content
                            break
                        elif (response.status_code == 500 or response.status_code == 402) and "Queue full" in response.text:
                            logger.warning(f"Pollinations queue full (attempt {attempt + 1}/{max_retries}). Retrying in 5s...")
                            await asyncio.sleep(5)
                        else:
                            logger.error(f"Failed to fetch image: {response.status_code} - {response.text[:200]}")
                            break
                except Exception as req_err:
                    logger.error(f"Request error (attempt {attempt + 1}/{max_retries}): {req_err}")
                    await asyncio.sleep(2)

            if not image_bytes:
                logger.error("Could not fetch image after retries or due to error.")
                return None

            # 2. Try Cloudinary Upload
            if all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
                logger.info("Attempting Cloudinary upload...")
                try:
                    file_obj = io.BytesIO(image_bytes)
                    # Combine folder and ID into public_id for better signature stability
                    folder = "blogverse/stories" if height > width else "blogverse/covers"
                    pid = f"ai_{uuid.uuid4().hex}"
                    
                    result = cloudinary.uploader.upload(
                        file_obj,
                        folder=folder,
                        public_id=pid,
                        resource_type="auto"
                    )
                    
                    secure_url = result.get("secure_url")
                    if secure_url:
                        logger.info(f"Successfully uploaded to Cloudinary: {secure_url}")
                        return secure_url
                except Exception as cloud_err:
                    logger.warning(f"Cloudinary failed: {cloud_err}")

            # 3. Fallback to Local Storage
            local_url = self._save_locally(image_bytes)
            if local_url:
                logger.info(f"Successfully saved locally: {local_url}")
                return local_url

            return None

        except Exception as e:
            logger.error(f"Error in generate_and_upload: {e}", exc_info=True)
            return None

image_generation_service = ImageGenerationService()

import logging
import asyncio
import uuid
import io
import cloudinary
import cloudinary.uploader
from google import genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class ImageGenerationService:
    def __init__(self):
        self._is_configured = False
        self.client = None
        self._configure()

    def _configure(self):
        """Configure Gemini SDK for image generation using the new google-genai SDK."""
        api_key = settings.GEMINI_API_KEY
        if api_key:
            try:
                # Use the new google-genai Client (required for stable Imagen 3/4 access)
                self.client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
                self._is_configured = True
                logger.info("Gemini Image Service (google-genai) configured.")
            except Exception as e:
                logger.error(f"Gemini Image configuration failed: {e}")

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
        Generate an image using Gemini Imagen 4 (Primary) or Pollinations (Fallback).
        """
        image_bytes = None

        # 1. Primary: Gemini Imagen (via new google-genai SDK)
        if self._is_configured and self.client:
            try:
                logger.info(f"Generating Gemini Image ({width}x{height}) for prompt: {prompt[:50]}...")
                
                # Aspect ratio mapping
                # Imagen supports "1:1", "4:3", "3:4", "16:9", "9:16"
                ar = "16:9" if width > height else "1:1"
                
                # The generate_images call is synchronous, so we run it in a thread to avoid blocking
                def _gen():
                    return self.client.models.generate_images(
                        model='imagen-4.0-generate-001',
                        prompt=prompt,
                        config=genai.types.GenerateImagesConfig(
                            number_of_images=1,
                            aspect_ratio=ar,
                            output_mime_type='image/png'
                        )
                    )

                response = await asyncio.to_thread(_gen)
                
                if response.generated_images:
                    image_bytes = response.generated_images[0].image.image_bytes
            except Exception as e:
                logger.warning(f"Gemini Image generation failed, trying Pollinations fallback: {e}")

        # 2. Fallback 1: Pollinations.ai
        if not image_bytes:
            try:
                import urllib.parse
                import httpx
                clean_prompt = prompt.replace("\n", " ").strip()
                encoded_prompt = urllib.parse.quote(clean_prompt)
                seed = uuid.uuid4().int % 100000
                image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true"
                
                logger.info("Fetching fallback image via Pollinations.ai...")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(image_url)
                    if response.status_code == 200:
                        image_bytes = response.content
            except Exception as e:
                logger.error(f"Pollinations fallback also failed: {e}")

        if not image_bytes:
            logger.error("All image generation methods failed.")
            return None

        # 3. Try Cloudinary Upload
        if all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
            try:
                file_obj = io.BytesIO(image_bytes)
                folder = "blogverse"
                pid = f"ai_{uuid.uuid4().hex}"
                
                # We pass credentials directly to ensure the signature is calculated with the correct secret
                result = cloudinary.uploader.upload(
                    file_obj, 
                    folder=folder, 
                    public_id=pid, 
                    resource_type="auto",
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME_CLEAN,
                    api_key=settings.CLOUDINARY_API_KEY_CLEAN,
                    api_secret=settings.CLOUDINARY_API_SECRET_CLEAN
                )
                secure_url = result.get("secure_url")
                if secure_url:
                    return secure_url
            except Exception as cloud_err:
                # If Cloudinary fails (e.g. invalid credentials), we fall back to local storage
                logger.warning(f"Cloudinary upload failed (likely invalid credentials): {cloud_err}")

        # 4. Final Fallback: Local Storage
        try:
            return self._save_locally(image_bytes)
        except Exception as e:
            logger.error(f"Final fallback to local storage failed: {e}")
            return None

image_generation_service = ImageGenerationService()

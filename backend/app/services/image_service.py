"""Image generation service using Gemini 2.5 Flash (free tier) as primary provider.

Uses the google-genai SDK's native image generation via generate_content
with response_modalities=["Image"]. This leverages the free Gemini API key
that BlogVerse already uses for text generation.

Fallback chain:
1. Gemini 2.5 Flash Image (free, uses existing GEMINI_API_KEY)
2. Pollinations.ai (free, no API key needed)
"""

import logging
import asyncio
import uuid
import io
import cloudinary
import cloudinary.uploader
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Multi-provider image generation with Gemini Flash as primary free option."""

    def __init__(self):
        self._is_configured = False
        self.client = None
        self._configure()

    def _configure(self):
        """Configure the google-genai Client for image generation."""
        api_key = settings.GEMINI_API_KEY
        if api_key:
            try:
                self.client = genai.Client(
                    api_key=api_key,
                    http_options={"api_version": "v1beta"},
                )
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

    async def _generate_with_gemini_flash(self, prompt: str) -> bytes | None:
        """
        PRIMARY: Generate image using Gemini 2.5 Flash with native image output.
        
        Uses generate_content with response_modalities=["Image"] which is
        available on the FREE tier of the Gemini API (up to ~500-1500 images/day).
        """
        if not self._is_configured or not self.client:
            return None

        try:
            model_name = settings.GEMINI_IMAGE_MODEL
            logger.info(f"[Gemini Flash Image] Generating with model={model_name}, prompt: {prompt[:60]}...")

            def _gen():
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["Image"],
                    ),
                )
                return response

            response = await asyncio.to_thread(_gen)

            # Extract image bytes from the response
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                        image_bytes = part.inline_data.data
                        logger.info(
                            f"[Gemini Flash Image] Success! Generated {len(image_bytes)} bytes "
                            f"({part.inline_data.mime_type})"
                        )
                        return image_bytes

            logger.warning("[Gemini Flash Image] No image data in response.")
            return None

        except Exception as e:
            logger.warning(f"[Gemini Flash Image] Generation failed: {e}")
            return None

    async def _generate_with_pollinations(self, prompt: str, width: int, height: int) -> bytes | None:
        """
        FALLBACK: Generate image using Pollinations.ai (100% free, no key).
        """
        try:
            import urllib.parse
            import httpx

            clean_prompt = prompt.replace("\n", " ").strip()
            encoded_prompt = urllib.parse.quote(clean_prompt)
            seed = uuid.uuid4().int % 100000
            image_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width={width}&height={height}&seed={seed}&nologo=true"
            )

            logger.info(f"[Pollinations] Fetching image: {image_url[:80]}...")

            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                response = await client.get(image_url)
                if response.status_code == 200:
                    image_bytes = response.content
                    logger.info(f"[Pollinations] Success! ({len(image_bytes)} bytes)")
                    return image_bytes
                else:
                    logger.error(f"[Pollinations] HTTP {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"[Pollinations] Error ({type(e).__name__}): {e}")
            return None

    async def generate_and_upload(self, prompt: str, width: int = 1280, height: int = 720) -> str:
        """
        Generate an image using the cascading provider chain and upload it.
        
        Provider priority:
        1. Gemini 2.5 Flash Image (FREE tier, uses existing API key)
        2. Pollinations.ai (free, no key needed)
        
        Upload priority:
        1. Cloudinary (if configured)
        2. Local /uploads/ directory
        """
        image_bytes = None

        # ── Provider 1: Gemini Flash Image (FREE) ────────────────────
        image_bytes = await self._generate_with_gemini_flash(prompt)

        # ── Provider 2: Pollinations.ai (free fallback) ──────────────
        if not image_bytes:
            image_bytes = await self._generate_with_pollinations(prompt, width, height)

        # ── All providers failed ─────────────────────────────────────
        if not image_bytes:
            logger.error("All image generation providers failed.")
            return None

        # ── Upload: Try Cloudinary first ─────────────────────────────
        if all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
            try:
                file_obj = io.BytesIO(image_bytes)
                folder = "blogverse"
                pid = f"ai_{uuid.uuid4().hex}"

                result = cloudinary.uploader.upload(
                    file_obj,
                    folder=folder,
                    public_id=pid,
                    resource_type="auto",
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME_CLEAN,
                    api_key=settings.CLOUDINARY_API_KEY_CLEAN,
                    api_secret=settings.CLOUDINARY_API_SECRET_CLEAN,
                )
                secure_url = result.get("secure_url")
                if secure_url:
                    return secure_url
            except Exception as cloud_err:
                logger.warning(f"Cloudinary upload failed: {cloud_err}")

        # ── Upload: Local storage fallback ───────────────────────────
        try:
            return self._save_locally(image_bytes)
        except Exception as e:
            logger.error(f"Final fallback to local storage failed: {e}")
            return None


image_generation_service = ImageGenerationService()

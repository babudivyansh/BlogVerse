"""Image upload endpoint supporting local and Cloudinary storage."""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED = {"jpg", "jpeg", "png", "gif", "webp"}


def _upload_to_cloudinary(file_bytes: bytes, filename: str) -> str | None:
    """Upload to Cloudinary if configured. Returns URL or None."""
    if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
        return None
    try:
        import cloudinary
        import cloudinary.uploader
        
        # Explicitly configure to ensure clean credentials are used
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME_CLEAN,
            api_key=settings.CLOUDINARY_API_KEY_CLEAN,
            api_secret=settings.CLOUDINARY_API_SECRET_CLEAN,
            secure=True
        )
        
        # Cloudinary public_id should typically not include the extension
        pid = filename.rsplit('.', 1)[0] if '.' in filename else filename
        
        result = cloudinary.uploader.upload(
            file_bytes, 
            folder="blogverse", 
            public_id=pid,
            resource_type="auto"
        )
        url = result.get("secure_url")
        if url:
            print(f"[CLOUDINARY] Upload success: {url}")
        return url
    except Exception as exc:
        print(f"[CLOUDINARY] Upload failed: {str(exc)}")
        import logging
        logging.error(f"Cloudinary upload error: {exc}")
        return None


def _save_locally(file_bytes: bytes, filename: str) -> str:
    """Save file to local uploads directory. Returns relative URL."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = upload_dir / filename
    filepath.write_bytes(file_bytes)
    return f"/uploads/{filename}"


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    _=Depends(get_current_user),
):
    """Upload an image. Tries Cloudinary first, falls back to local storage."""
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Allowed types: {', '.join(ALLOWED)}")

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File too large (max 5 MB)")

    unique_name = f"{uuid.uuid4().hex}.{ext}"

    # Try cloud first
    cloud_url = _upload_to_cloudinary(contents, unique_name)
    if cloud_url:
        return {"url": cloud_url, "storage": "cloudinary"}

    # Fallback to local
    local_url = _save_locally(contents, unique_name)
    return {"url": local_url, "storage": "local"}

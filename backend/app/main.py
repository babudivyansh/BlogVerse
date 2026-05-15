"""BlogVerse FastAPI application entry point."""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, blogs, comments, users, admin, ai, upload, newsletter, seo

# Import models so they are registered with Base.metadata
import app.models  # noqa: F401

# ── Create tables ────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App instance ─────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL, 
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://blogverse.info",
        "https://www.blogverse.info"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploaded images) ───────────────────────────────
uploads_dir = Path(settings.UPLOAD_DIR).resolve()
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# ── Register routers ────────────────────────────────────────────
prefix = settings.API_PREFIX
app.include_router(auth.router, prefix=prefix)
app.include_router(blogs.router, prefix=prefix)
app.include_router(comments.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)
app.include_router(ai.router, prefix=prefix)
app.include_router(upload.router, prefix=prefix)
app.include_router(newsletter.router, prefix=prefix)
app.include_router(seo.router, prefix=prefix)  # Accessible at /api/sitemap.xml
app.include_router(seo.router)                 # Accessible at /sitemap.xml


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/api/docs"}

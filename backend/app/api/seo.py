from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.blog import Blog
from app.core.config import settings

router = APIRouter(tags=["SEO"])

@router.get("/sitemap.xml")
def get_sitemap(db: Session = Depends(get_db)):
    """Generate a dynamic XML sitemap."""
    base_url = "https://blogverse.info"
    
    # Fetch all published blogs
    blogs = db.query(Blog).filter(Blog.status == "published").all()
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Static pages
    static_pages = [
        {"url": "/", "priority": "1.0", "changefreq": "daily"},
        {"url": "/search", "priority": "0.8", "changefreq": "daily"},
        {"url": "/auth", "priority": "0.5", "changefreq": "monthly"},
        {"url": "/privacy", "priority": "0.4", "changefreq": "monthly"},
        {"url": "/terms", "priority": "0.4", "changefreq": "monthly"},
        {"url": "/help", "priority": "0.6", "changefreq": "weekly"},
        {"url": "/contact", "priority": "0.6", "changefreq": "weekly"},
    ]
    
    for page in static_pages:
        xml_content += f"  <url>\n"
        xml_content += f"    <loc>{base_url}{page['url']}</loc>\n"
        xml_content += f"    <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>\n"
        xml_content += f"    <changefreq>{page['changefreq']}</changefreq>\n"
        xml_content += f"    <priority>{page['priority']}</priority>\n"
        xml_content += f"  </url>\n"
    
    # Dynamic blog pages
    for blog in blogs:
        lastmod = blog.updated_at or blog.created_at
        xml_content += f"  <url>\n"
        xml_content += f"    <loc>{base_url}/blog/{blog.slug}</loc>\n"
        xml_content += f"    <lastmod>{lastmod.strftime('%Y-%m-%d')}</lastmod>\n"
        xml_content += f"    <changefreq>weekly</changefreq>\n"
        xml_content += f"    <priority>0.7</priority>\n"
        xml_content += f"  </url>\n"
        
    xml_content += "</urlset>"
    
    return Response(content=xml_content, media_type="application/xml")

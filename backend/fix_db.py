from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Altering web_stories.blog_id to be nullable...")
    conn.execute(text("ALTER TABLE web_stories ALTER COLUMN blog_id DROP NOT NULL"))
    conn.commit()
    print("Done!")

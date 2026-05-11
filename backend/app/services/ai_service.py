"""AI service wrapping OpenAI API calls with graceful fallback."""

from app.core.config import settings
import json


class AIService:
    """Wrapper around OpenAI chat completions for blog-related AI features."""

    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            try:
                print(f"DEBUG: Found API Key starting with {settings.OPENAI_API_KEY[:10]}")
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"DEBUG: Failed to init OpenAI: {e}")

    async def _chat(self, system: str, user: str) -> str:
        if not self.client:
            raise Exception("OpenAI API key not configured")
        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()

    async def generate_titles(self, topic: str) -> list[str]:
        """Generate 5 creative blog title suggestions."""
        if not self.client:
            return [
                f"The Ultimate Guide to {topic}",
                f"Understanding {topic}: A Deep Dive",
                f"Why {topic} Matters in 2025",
                f"{topic} Explained: Everything You Need to Know",
                f"Mastering {topic}: Tips and Best Practices",
            ]
        text = await self._chat(
            "You are a creative blog title generator. Return exactly 5 engaging blog titles, one per line. No numbering or bullets.",
            f"Generate 5 creative blog titles about: {topic}",
        )
        return [line.strip() for line in text.split("\n") if line.strip()][:5]

    async def generate_summary(self, content: str) -> str:
        """Generate a concise 2-3 sentence summary."""
        if not self.client:
            words = content.split()
            return " ".join(words[:50]) + "..." if len(words) > 50 else content
        return await self._chat(
            "Summarize the following blog content in 2-3 concise sentences.",
            content[:4000],
        )

    async def suggest_tags(self, content: str) -> list[str]:
        """Suggest 5-8 relevant tags."""
        if not self.client:
            return ["technology", "programming", "tutorial", "guide", "tips"]
        text = await self._chat(
            "Suggest 5-8 relevant tags for this blog post. Return only lowercase tags separated by commas.",
            content[:4000],
        )
        return [t.strip().lower() for t in text.split(",") if t.strip()][:8]

    async def improve_content(self, content: str) -> str:
        """Improve writing quality, grammar, and clarity."""
        if not self.client:
            return content
        return await self._chat(
            "Improve the following blog content for better clarity, grammar, and engagement. Keep the same markdown formatting. Return only the improved content.",
            content[:6000],
        )


    async def generate_full_blog(self, topic: str, tone: str = "professional") -> dict:
        """Generate a full blog post including title, content, summary, and tags."""
        if not self.client:
            return {
                "title": f"The Ultimate Guide to {topic}",
                "content": f"# {topic}\n\nThis is a generated blog post about {topic}.",
                "summary": f"A comprehensive guide to {topic}.",
                "tags": [topic.lower(), "guide", "tutorial"]
            }
        
        system_prompt = (
            "You are an expert blog writer. You must respond ONLY with a valid JSON object. "
            "Do not include markdown code blocks around the JSON. "
            "The JSON object must have exactly these keys: "
            "'title' (string), "
            "'content' (string, containing the full blog post in Markdown format), "
            "'summary' (string, 2-3 sentences), "
            "'tags' (list of strings, 5-8 relevant tags)."
        )
        user_prompt = f"Write a comprehensive and engaging blog post about '{topic}'. The tone should be {tone}."
        
        text = await self._chat(system_prompt, user_prompt)
        try:
            # Clean up potential markdown blocks if the model ignored instructions
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
        except Exception:
            # Fallback if parsing fails
            return {
                "title": f"Error parsing AI output for {topic}",
                "content": text,
                "summary": "AI generated content but failed to parse into JSON fields.",
                "tags": ["error"]
            }

    async def conversational_chat(self, messages: list[dict]) -> str:
        """Handle multi-turn conversational chat."""
        if not self.client:
            return "Hi there! I am currently running in offline mode. Please configure an OpenAI API key to chat with me!"
        
        sys_msg = {"role": "system", "content": "You are BlogVerse AI, a friendly, helpful, and creative writing assistant built into the BlogVerse platform. You help users brainstorm, write, edit, and navigate the site. Keep your responses friendly and relatively concise."}
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[sys_msg] + messages,
                temperature=0.7,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"

ai_service = AIService()

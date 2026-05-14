"""AI service wrapping Gemini API calls with graceful fallback."""

import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai package not installed. AI features will be limited.")


class AIService:
    """Wrapper around Gemini for blog-related AI features."""

    def __init__(self):
        self._is_configured = False
        self.genai = None
        self._configure()

    def _configure(self) -> bool:
        """Attempt to configure the Gemini API."""
        if self._is_configured:
            return True

        if not GENAI_AVAILABLE:
            logger.error("Cannot configure Gemini: google-generativeai not installed.")
            return False

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.debug("Gemini API Key is missing from settings.")
            return False

        try:
            genai.configure(api_key=api_key)
            self.genai = genai
            self._is_configured = True
            logger.info("Gemini successfully configured.")
            return True
        except Exception as e:
            logger.error(f"Error initializing Gemini: {e}")
            return False

    @property
    def is_configured(self) -> bool:
        """Check if Gemini is configured, attempting to re-configure if not."""
        if not self._is_configured:
            return self._configure()
        return True



    async def _chat(self, system: str, user: str, response_mime_type: str = "text/plain") -> str:
        if not self.is_configured:
            raise Exception("Gemini API key not configured")
        
        # We pass system instructions when initializing the model instance
        model = self.genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=system,
            generation_config=self.genai.GenerationConfig(
                response_mime_type=response_mime_type,
            )
        )
        response = await model.generate_content_async(user)
        return response.text.strip()

    async def generate_titles(self, topic: str) -> list[str]:
        """Generate 5 creative blog title suggestions."""
        if not self.is_configured:
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
        if not self.is_configured:
            words = content.split()
            return " ".join(words[:50]) + "..." if len(words) > 50 else content
        return await self._chat(
            "Summarize the following blog content in 2-3 concise sentences.",
            content[:4000],
        )

    async def suggest_tags(self, content: str) -> list[str]:
        """Suggest 5-8 relevant tags."""
        if not self.is_configured:
            return ["technology", "programming", "tutorial", "guide", "tips"]
        text = await self._chat(
            "Suggest 5-8 relevant tags for this blog post. Return only lowercase tags separated by commas.",
            content[:4000],
        )
        return [t.strip().lower() for t in text.split(",") if t.strip()][:8]

    async def improve_content(self, content: str) -> str:
        """Improve writing quality, grammar, and clarity."""
        if not self.is_configured:
            return content
        return await self._chat(
            "Improve the following blog content for better clarity, grammar, and engagement. Keep the same markdown formatting. Return only the improved content.",
            content[:6000],
        )

    async def generate_full_blog(self, topic: str, tone: str = "professional") -> dict:
        """Generate a full blog post including title, content, summary, and tags."""
        if not self.is_configured:
            return {
                "title": f"The Ultimate Guide to {topic}",
                "content": f"# {topic}\n\nThis is a generated blog post about {topic}.",
                "summary": f"A comprehensive guide to {topic}.",
                "tags": [topic.lower(), "guide", "tutorial"]
            }
        
        system_prompt = (
            "You are an expert blog writer. "
            "You must respond ONLY with a valid JSON object. "
            "The JSON object must have exactly these keys: "
            "'title' (string), "
            "'content' (string, containing the full blog post in Markdown format), "
            "'summary' (string, 2-3 sentences), "
            "'tags' (list of strings, 5-8 relevant tags)."
        )
        user_prompt = f"Write a comprehensive and engaging blog post about '{topic}'. The tone should be {tone}."
        
        # Requesting "application/json" forces Gemini to output valid JSON
        text = await self._chat(system_prompt, user_prompt, response_mime_type="application/json")
        try:
            return json.loads(text)
        except Exception:
            return {
                "title": f"Error parsing AI output for {topic}",
                "content": text,
                "summary": "AI generated content but failed to parse into JSON fields.",
                "tags": ["error"]
            }

    async def generate_visual_prompt(self, title: str, content: str) -> str:
        """Generate a detailed artistic prompt for image generation."""
        if not self.is_configured:
            return f"Digital art related to {title}, cinematic lighting, high detail."

        system_prompt = (
            "You are a professional art director. "
            "Create a highly detailed, single-paragraph artistic prompt for an AI image generator (like Stable Diffusion or Midjourney). "
            "The image should be a stunning, cinematic cover for a blog post. "
            "Describe the composition, lighting, style, and color palette. "
            "Do NOT include technical jargon about the generator, just descriptive art instructions. "
            "Keep it under 100 words."
        )
        user_prompt = f"Blog Title: {title}\nBlog Content: {content[:1000]}"
        
        return await self._chat(system_prompt, user_prompt)

    async def conversational_chat(self, messages: list[dict]) -> str:
        """Handle multi-turn conversational chat."""
        print(f"DEBUG: conversational_chat called. is_configured: {self.is_configured}")
        if not self.is_configured:
            return "Hi there! I am currently running in offline mode. Please configure a Gemini API key to chat with me!"
        
        sys_instr = "You are BlogVerse AI, a friendly, helpful, and creative writing assistant built into the BlogVerse platform. You help users brainstorm, write, edit, and navigate the site. Keep your responses friendly and relatively concise."
        
        try:
            print(f"DEBUG: Using model {settings.GEMINI_MODEL}")
            model = self.genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=sys_instr,
            )
            
            # Convert OpenAI message format to Gemini format
            gemini_history = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                gemini_history.append({"role": role, "parts": [msg["content"]]})
                
            # If the last message is from the user, we separate it out to pass to generate_content_async
            # Actually, we can just start a chat session
            if not gemini_history:
                return "How can I help you today?"
                
            latest_message = gemini_history.pop()["parts"][0]
            
            print(f"DEBUG: Sending message to Gemini...")
            chat_session = model.start_chat(history=gemini_history)
            response = await chat_session.send_message_async(latest_message)
            print("DEBUG: Success!")
            return response.text.strip()
            
        except Exception as e:
            print(f"DEBUG: Chat Error: {e}")
            return f"I'm sorry, I encountered an error: {str(e)}"


ai_service = AIService()

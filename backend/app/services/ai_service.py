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
        """Generate a massive, multi-stage blog post for maximum depth."""
        if not self.is_configured:
            return {
                "title": f"The Ultimate Guide to {topic}",
                "content": f"# {topic}\n\nThis is a generated blog post about {topic}.",
                "summary": f"A comprehensive guide to {topic}.",
                "tags": [topic.lower(), "guide", "tutorial"]
            }

        logger.info(f"[AI] Starting multi-stage generation for topic: {topic}")
        
        # 1. Generate Outline
        outline = await self.generate_blog_outline(topic, tone)
        
        # 2. Generate each section individually
        full_content = []
        context = ""
        
        for section in outline:
            logger.info(f"[AI] Generating section: {section['heading']}")
            section_text = await self.generate_section_content(topic, section, tone, context)
            heading_md = f"## {section['heading']}" if section.get('type') != 'intro' else f"# {topic}"
            full_content.append(f"{heading_md}\n\n{section_text}")
            context += section_text[-500:] # Keep small context for flow
            
        merged_content = "\n\n".join(full_content)
        
        # 3. Generate Summary and Tags based on the full content
        summary = await self.generate_summary(merged_content)
        tags = await self.suggest_tags(merged_content)
        
        return {
            "title": outline[0]['heading'] if (outline and len(outline) > 0) else f"Deep Dive into {topic}",
            "content": merged_content,
            "summary": summary,
            "tags": tags
        }

    async def generate_section_content(self, topic: str, section: dict, tone: str, context: str = "") -> str:
        """Write a precisely calibrated 300 word section."""
        system_prompt = (
            "You are a world-class Subject Matter Expert and Senior Content Writer. "
            "Write a highly detailed, engaging section that is EXACTLY 300 words long. "
            "Provide deep technical analysis and real-world examples. "
            "Do not summarize; maintain consistent depth throughout. "
            "Use Markdown formatting. Return ONLY the content."
        )
        user_prompt = f"Topic: {topic}\nSection: {section['heading']}\nDescription: {section['description']}\nTone: {tone}\nContext: {context}"
        return await self._chat(system_prompt, user_prompt)

    async def generate_blog_outline(self, topic: str, tone: str) -> list[dict]:
        """Generate a comprehensive 5-section outline."""
        system_prompt = (
            "You are a Chief Research Officer and Master Content Architect. "
            "Create a comprehensive, EXACTLY 5-section outline for a definitive guide. "
            "Return ONLY a valid JSON list of 5 objects. "
            "Each object must have: 'heading' (string), 'description' (string), and 'type' (string). "
            "Ensure you include sections for: Historical Context, Current Trends, Technical Deep-Dive, and Future Predictions."
        )
        user_prompt = f"Create a massive, authoritative outline for a definitive guide about '{topic}' with a {tone} tone."
        text = await self._chat(system_prompt, user_prompt, response_mime_type="application/json")
        try:
            return json.loads(text)
        except Exception:
            return []

    async def generate_visual_prompt(self, title: str, content: str) -> str:
        """Generate a blog-relevant, content-aware image prompt.
        
        The prompt is designed to produce images that clearly represent
        the blog's specific topic, not generic abstract art.
        """
        if not self.is_configured:
            # Fallback: create a descriptive prompt from the title itself
            return (
                f"A professional, high-quality blog cover image about '{title}'. "
                f"Clean modern design, relevant visual elements, "
                f"16:9 aspect ratio, photorealistic style, soft lighting."
            )

        system_prompt = (
            "You are an expert blog cover image designer. Your job is to write a detailed "
            "image generation prompt that will produce a cover image DIRECTLY RELEVANT to the blog's topic.\n\n"
            "RULES:\n"
            "1. The image MUST visually represent the blog's SPECIFIC subject matter — not abstract art.\n"
            "2. Include concrete visual elements related to the topic (e.g., for a blog about Python programming, "
            "show a laptop with code, Python logo elements, developer workspace).\n"
            "3. For technology topics: show relevant tools, screens, devices, diagrams, or real-world applications.\n"
            "4. For lifestyle/travel topics: show relevant scenes, locations, activities.\n"
            "5. For business topics: show relevant charts, meetings, products, or professional settings.\n"
            "6. Specify: art style (photorealistic/illustration/3D render), lighting, color palette, and composition.\n"
            "7. Keep the prompt between 40-80 words. Be specific, not vague.\n"
            "8. NEVER use words like 'abstract', 'symbolic', 'metaphorical', or 'conceptual'.\n"
            "9. The image should make a viewer immediately understand what the blog is about.\n\n"
            "Return ONLY the image prompt, nothing else."
        )

        # Extract key context — use title + first meaningful chunk of content
        context = content[:1500] if content else title
        user_prompt = (
            f"Blog Title: {title}\n"
            f"Blog Content Preview: {context}\n\n"
            f"Write an image generation prompt for a cover image that clearly represents this blog's topic."
        )

        return await self._chat(system_prompt, user_prompt)

    async def generate_story_content(self, title: str, content: str) -> list[dict]:
        """Convert a blog post into a 5-7 slide visual story."""
        if not self.is_configured:
            # Mock data for offline mode
            return [
                {"title": title, "text": "Slide 1 content", "visual_prompt": "Artistic prompt 1"},
                {"title": "Key Point", "text": "Slide 2 content", "visual_prompt": "Artistic prompt 2"},
            ]

        system_prompt = (
            "You are a visual storyteller. "
            "Convert the provided blog post into a 6-slide visual 'Web Story'. "
            "You must respond ONLY with a valid JSON list of 6 objects. "
            "Each object must have: "
            "'title' (string, max 5 words), "
            "'text' (string, max 20 words, key takeaway), "
            "'visual_prompt' (string, 30-50 words, specific and concrete image description "
            "that directly shows the slide's subject — include specific objects, settings, "
            "colors, and style. Never use abstract or symbolic language)."
        )
        user_prompt = f"Blog Title: {title}\nBlog Content: {content[:4000]}"

        text = await self._chat(system_prompt, user_prompt, response_mime_type="application/json")
        try:
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error parsing story AI output: {e}")
            return [
                {"title": title, "text": "Failed to generate story content.", "visual_prompt": "Error illustration"}
            ]

    async def generate_story_from_topic(self, topic: str) -> list[dict]:
        """Generate a 6-slide visual story from a single topic or prompt."""
        if not self.is_configured:
            return [
                {"title": topic, "text": "Exploring the world of " + topic, "visual_prompt": "Cinematic wide shot related to " + topic},
                {"title": "The Beginning", "text": "Where it all started and why it matters today.", "visual_prompt": "Abstract digital art of origins"},
                {"title": "Key Insight", "text": "A deep dive into the most important aspect of " + topic, "visual_prompt": "Hyper-realistic close up detail"},
                {"title": "The Impact", "text": "How this affects the world and the people in it.", "visual_prompt": "Epic landscape showing scale"},
                {"title": "Future View", "text": "What's next for " + topic + " in the coming years.", "visual_prompt": "Futuristic cyberpunk aesthetic"},
                {"title": "Summary", "text": "The final takeaway for our visual journey.", "visual_prompt": "Peaceful sunset ending scene"},
            ]

        system_prompt = (
            "You are a visual storyteller. "
            "Generate a 6-slide visual 'Web Story' based on the provided topic. "
            "You must respond ONLY with a valid JSON list of 6 objects. "
            "Each object must have: "
            "'title' (string, max 5 words), "
            "'text' (string, max 20 words, key takeaway), "
            "'visual_prompt' (string, 30-50 words, specific and concrete image description "
            "that directly shows the slide's subject — include specific objects, settings, "
            "colors, and style. Never use abstract or symbolic language)."
        )
        user_prompt = f"Create a visual story about: {topic}"

        text = await self._chat(system_prompt, user_prompt, response_mime_type="application/json")
        try:
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error parsing story AI output: {e}")
            return [
                {"title": topic, "text": "Failed to generate story content.", "visual_prompt": "Error illustration"}
            ]

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

# Implementation Plan: Gemini Imagen 3 Upgrade

This plan outlines the transition from the free Pollinations.ai service to **Google's Imagen 3** using your existing Gemini API key. This will eliminate "queue full" errors and provide professional-grade cover images.

## 1. Objectives
- **Zero Latency**: Eliminate third-party queue delays.
- **Premium Quality**: Use Google's latest photorealistic and artistic models.
- **Unified API**: Keep everything (text & image) under a single Gemini billing/key structure.

---

## 2. Technical Changes

### Phase 1: Update Image Service
**File**: `backend/app/services/image_service.py`
- Remove the `Pollinations` HTTP logic.
- Integrate the `google.generativeai` Image Generation call.
- Update the `generate_and_upload` method to handle Gemini's image format (PIL or bytes).

### Phase 2: Refine Visual Prompts
**File**: `backend/app/services/ai_service.py`
- Update the `generate_visual_prompt` system instructions to better align with **Imagen 3's** advanced prompt requirements (focusing on composition, lighting, and camera settings).

### Phase 3: Error Handling & Fallbacks
- Implement robust error handling if the specific Imagen model is not available in your region, with a fallback to the original Pollinations system if needed.

---

## 3. Comparison

| Feature | Pollinations.ai (Current) | Gemini Imagen 3 (New) |
| :--- | :--- | :--- |
| **Stability** | Low (Frequent Queue Full) | High (Professional Grade) |
| **Image Quality** | Good | Exceptional (Imagen 3) |
| **Prompt Adherence** | Moderate | High (Understands complex detail) |
| **Cost** | Free (Public) | Uses Gemini API Credits |

---

## 4. Next Steps
1. [ ] Verify if `imagen-3` or `imagen-2` is enabled for your API key.
2. [ ] Refactor `image_service.py` to use `genai.ImageModel`.
3. [ ] Test generation with a sample blog topic.

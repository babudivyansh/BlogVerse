import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

try:
    print("Listing available models...")
    for m in genai.list_models():
        if 'image' in m.name.lower() or 'imagen' in m.name.lower():
            print(f"[IMAGE MODEL] {m.name} - {m.display_name}")
        else:
            print(f"[TEXT MODEL] {m.name}")
except Exception as e:
    print(f"Error: {e}")

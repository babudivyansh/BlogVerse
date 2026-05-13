import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print(f"Testing with key: {api_key}")

genai.configure(api_key=api_key)

print("Listing models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"Model: {m.name}")

model = genai.GenerativeModel('gemini-1.5-flash')

try:
    response = model.generate_content("Hello, world!")
    print("Success!")
    print(response.text)
except Exception as e:
    print(f"Failed: {e}")

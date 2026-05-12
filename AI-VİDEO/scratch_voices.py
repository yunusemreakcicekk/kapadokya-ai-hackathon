import os
import requests
from dotenv import load_dotenv
import json

load_dotenv()
api_key = os.getenv("ELEVENLABS_API_KEY")

headers = {
    "Accept": "application/json",
    "xi-api-key": api_key
}

voices_url = "https://api.elevenlabs.io/v1/voices"
response = requests.get(voices_url, headers=headers)

if response.status_code == 200:
    voices_data = response.json()
    categories = set()
    for voice in voices_data.get('voices', []):
        categories.add(voice.get('category'))
        print(f"Name: {voice.get('name')}, Category: {voice.get('category')}, ID: {voice.get('voice_id')}")
    print(f"\nAll categories found: {categories}")
else:
    print(f"Error: {response.status_code} - {response.text}")

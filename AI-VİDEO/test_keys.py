import os
import requests
from google import genai
from dotenv import load_dotenv

load_dotenv()

def test_keys():
    gemini_key = os.getenv("GEMINI_API_KEY")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    
    print("--- API ANAHTARI TESTI Basliyor ---")
    
    # 1. Gemini Testi
    print("\n1. Gemini API test ediliyor...")
    try:
        client = genai.Client(api_key=gemini_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents="Merhaba, sadece 'Test Basarili' yaz.",
        )
        if "Test Basarili" in response.text or response.text.strip() != "":
            print("[BASARILI] Gemini API calisiyor! Cevap:", response.text.strip())
        else:
            print("[UYARI] Gemini calisti ama beklenmeyen bir cevap geldi:", response.text)
    except Exception as e:
        print("[HATA] Gemini API Hatasi:", str(e))
        
    # 2. ElevenLabs Testi
    print("\n2. ElevenLabs API test ediliyor...")
    try:
        headers = {
            "Accept": "application/json",
            "xi-api-key": elevenlabs_key
        }
        voices_url = "https://api.elevenlabs.io/v1/voices"
        voices_response = requests.get(voices_url, headers=headers)
        
        if voices_response.status_code == 200:
            voices = voices_response.json().get('voices', [])
            print(f"[BASARILI] ElevenLabs API calisiyor! {len(voices)} adet ses bulundu.")
        else:
            print(f"[HATA] ElevenLabs API Hatasi: {voices_response.status_code} - {voices_response.text}")
    except Exception as e:
        print("[HATA] ElevenLabs API Hatasi:", str(e))

if __name__ == "__main__":
    test_keys()

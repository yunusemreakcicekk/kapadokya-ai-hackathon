import os
import requests

def generate_voice(text: str, output_path: str = "voiceover.mp3") -> str:
    """
    Generate voiceover using ElevenLabs API and save to output_path.
    Based on user's provided script.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY bulunamadı!")
        
    headers = {
        "Accept": "application/json",
        "xi-api-key": api_key
    }
    
    # Adım 1: Ücretsiz (veya premade) ses bulma
    voices_url = "https://api.elevenlabs.io/v1/voices"
    voices_response = requests.get(voices_url, headers=headers)
    
    secilen_voice_id = None
    if voices_response.status_code == 200:
        voices_data = voices_response.json()
        for voice in voices_data.get('voices', []):
            if voice.get('category') == 'premade':
                secilen_voice_id = voice['voice_id']
                break
    else:
        print(f"ElevenLabs API Hatasi: {voices_response.status_code} - {voices_response.text}")
                
    if not secilen_voice_id:
        raise ValueError(f"Kullanılabilir bir ElevenLabs sesi bulunamadı! API Cevabı: {voices_response.status_code} - {voices_response.text if voices_response.status_code != 200 else 'No premade voice found.'}")
        
    # Adım 2: Metni Sese Çevirme
    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{secilen_voice_id}"
    tts_headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    tts_response = requests.post(tts_url, json=data, headers=tts_headers)
    
    if tts_response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(tts_response.content)
        return output_path
    else:
        raise Exception(f"ElevenLabs Hatası: {tts_response.status_code} - {tts_response.text}")

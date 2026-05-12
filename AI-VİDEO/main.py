import os
import uuid
import json
import random
import urllib.parse
import requests
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from services.story_service import generate_story, translate_story
from services.voice_service import generate_voice
from services.video_service import process_video_dynamic
from services.social_service import router as social_router

# Çevresel değişkenleri yükle
load_dotenv(override=True)

app = FastAPI(title="AI Video Pipeline MVP")
app.include_router(social_router, prefix="/api")

# CORS (Frontend'in Backend'e erisebilmesi icin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dosyaların kaydedileceği klasörler
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8001")
IMAGE_DURATION_SECONDS = 4

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Olusturulan videolari disari sunmak icin (URL uzerinden erisim)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

def estimate_media_duration(media_metadata):
    total = 0.0
    for meta in media_metadata:
        if meta.get("type") == "image":
            total += IMAGE_DURATION_SECONDS
            continue

        duration = float(meta.get("duration") or 0)
        trim_start = float(meta.get("trimStart") or 0)
        trim_end = meta.get("trimEnd")
        usable_end = float(trim_end) if trim_end not in ("", None) else duration

        if usable_end > trim_start:
            total += max(0.0, usable_end - trim_start)
        elif duration > trim_start:
            total += max(0.0, duration - trim_start)

    return total

def clamp_story_to_chars(story_text, max_chars):
    if not max_chars or max_chars <= 0 or len(story_text) <= max_chars:
        return story_text

    clipped = story_text[:int(max_chars)].rsplit(" ", 1)[0].strip()
    return (clipped or story_text[:int(max_chars)].strip()).rstrip(".,;:") + "."

@app.post("/api/generate")
async def generate_pipeline(
    seller_name: str = Form(...),
    buyer_country: str = Form(...),
    target_language: str = Form("English"),
    product_type: str = Form("seramik"),
    story_mode: str = Form("ai"),
    manual_story: str = Form(""),
    target_duration: float = Form(0),
    max_words: int = Form(0),
    max_chars: int = Form(0),
    metadata: str = Form(...), # JSON formatinda her medyanin ayarlari
    files: list[UploadFile] = File(...)
):
    try:
        media_metadata = json.loads(metadata)
        estimated_duration = target_duration or estimate_media_duration(media_metadata)
        
        job_id = str(uuid.uuid4())[:8]
        job_upload_dir = os.path.join(UPLOAD_DIR, job_id)
        job_output_dir = os.path.join(OUTPUT_DIR, job_id)
        
        os.makedirs(job_upload_dir, exist_ok=True)
        os.makedirs(job_output_dir, exist_ok=True)
        
        # 1. Dosyalari sunucuya kaydet ve metadata'ya yollarini ekle
        file_paths = []
        for i, (meta, file_obj) in enumerate(zip(media_metadata, files)):
            file_ext = file_obj.filename.split(".")[-1]
            file_path = os.path.join(job_upload_dir, f"clip_{i}.{file_ext}")
            with open(file_path, "wb") as f:
                f.write(await file_obj.read())
            meta['filepath'] = file_path
            
        print(f"[{job_id}] 1. Dosyalar kaydedildi. Ayarlar:", media_metadata)

        # 2. Hikaye Uretimi
        print(f"[{job_id}] 2. Hikaye uretiliyor veya hazirlaniyor...")
        if story_mode == "manual":
            story_text = clamp_story_to_chars(manual_story, max_chars)
            print(f"[{job_id}] Manuel hikaye kullaniliyor.")
        else:
            story_text = generate_story(
                seller_name,
                buyer_country,
                target_language,
                product_type=product_type,
                target_duration=estimated_duration,
                max_words=max_words,
                max_chars=max_chars,
            )
        
        # 3. Seslendirme (ElevenLabs)
        print(f"[{job_id}] 3. Seslendirme yapiliyor...")
        voice_output_path = os.path.join(job_output_dir, "voiceover.mp3")
        generate_voice(story_text, voice_output_path)
        
        # 4. Dinamik Video Isleme (FFmpeg)
        print(f"[{job_id}] 4. FFmpeg dinamik islem basladi...")
        final_video_path = os.path.join(job_output_dir, "final_video.mp4")
        process_video_dynamic(media_metadata, voice_output_path, final_video_path)
        print(f"[{job_id}] 5. Islem tamam!")
        
        # Windows path'leri tarayicida calismasi icin / yapalim
        web_path = final_video_path.replace("\\", "/")
        
        return JSONResponse(content={
            "status": "success",
            "job_id": job_id,
            "message": "Video basariyla uretildi.",
            "data": {
                "story": story_text,
                "video_path": web_path
            }
        })
        
    except Exception as e:
        print("HATA:", str(e))
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/api/generate_story")
async def api_generate_story(
    seller_name: str = Form(...),
    buyer_country: str = Form(...),
    target_language: str = Form("English"),
    product_type: str = Form("seramik"),
    prompt: str = Form(""),
    current_story: str = Form(""),
    target_duration: float = Form(0),
    max_words: int = Form(0),
    max_chars: int = Form(0)
):
    try:
        story_text = generate_story(
            seller_name,
            buyer_country,
            target_language,
            prompt,
            current_story,
            target_duration,
            max_words,
            max_chars,
            product_type=product_type,
        )
        return JSONResponse(content={"status": "success", "story": story_text})
    except Exception as e:
        print("HATA (Hikaye Uretimi):", str(e))
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/api/translate_story")
async def api_translate_story(
    text: str = Form(...),
    target_language: str = Form("English"),
    product_type: str = Form("seramik"),
    target_duration: float = Form(0),
    max_words: int = Form(0),
    max_chars: int = Form(0)
):
    try:
        translated_text = translate_story(
            text,
            target_language,
            target_duration,
            max_words,
            max_chars,
            product_type=product_type,
        )
        return JSONResponse(content={"status": "success", "text": translated_text})
    except Exception as e:
        print("HATA (Hikaye Cevirisi):", str(e))
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/api/generate_image")
async def api_generate_image(prompt: str = Form(...)):
    try:
        # Daha iyi sonuclar icin prompt'u zenginlestiriyoruz
        enhanced_prompt = prompt + " high quality product photography, advertisement style, cinematic lighting, 4k"
        # Her uretimde farkli sonuc gelmesi ve takilmayi onlemek icin rastgele seed ekliyoruz
        seed = random.randint(1, 9999999)
        url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(enhanced_prompt)}?nologo=true&seed={seed}"
        
        print(f"Resim uretiliyor: {url}")
        
        # Zaman asimi (timeout) veya gecici hatalar icin tekrar deneme mekanizmasi
        max_retries = 2
        resp = None
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        for attempt in range(max_retries):
            try:
                # 45 saniye bekleme suresi, eger gelmezse bir daha dener
                resp = requests.get(url, headers=headers, timeout=45)
                if resp.status_code == 200:
                    break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise Exception(f"Görsel oluşturulurken hata oluştu: {str(e)}. Lütfen tekrar deneyin.")
                print(f"Bağlantı veya zaman aşımı hatası, tekrar deneniyor ({attempt+1}/{max_retries})... Hata: {str(e)}")
                continue
                
        if resp is None or resp.status_code != 200:
            status = resp.status_code if resp else "Bilinmeyen"
            raise Exception(f"Pollinations AI API hatasi: {status}")
            
        filename = f"ai_gen_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(resp.content)
            
        web_path = filepath.replace("\\", "/")
        print(f"Resim uretildi ve kaydedildi: {web_path}")
        return JSONResponse(content={"status": "success", "image_url": f"{API_BASE_URL}/{web_path}", "filename": filename})
    except Exception as e:
        print("HATA (Resim Uretimi):", str(e))
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/")
def read_root():
    return {"message": "AI Video Pipeline API calisiyor."}

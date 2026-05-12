import os
from services.story_service import generate_story
from services.voice_service import generate_voice
from services.video_service import process_video_dynamic
from services.image_service import generate_image
from dotenv import load_dotenv

load_dotenv()

def run_test():
    print("[BASLIYOR] Pipeline Testi Baslatiliyor...")
    
    # Girdi dosyalari (Kullanicinin belirttigi yollar)
    video1 = r"C:\Users\kinbe\Desktop\okul dersleri\hackathon\videolar\1.mp4"
    video2 = r"C:\Users\kinbe\Desktop\okul dersleri\hackathon\videolar\2.mp4"
    
    video_paths = [video1, video2]
    
    # Cikti klasoru
    output_dir = "test_output"
    os.makedirs(output_dir, exist_ok=True)
    
    seller_name = "Kapadokya Seramik Evi"
    buyer_country = "USA"
    target_language = "English"
    
    try:
        # 1. Hikaye Uretimi
        print(f"\n1. Hikaye uretiliyor... (Satici: {seller_name}, Alici: {buyer_country})")
        # story_text = generate_story(seller_name, buyer_country, target_language)
        story_text = f"Hello! This unique ceramic piece, carefully and lovingly handcrafted by {seller_name}, is on its way to you in the {buyer_country}. It carries the traces of our hard work in every curve. We hope you enjoy using it on beautiful days!"
        print(f"[BASARILI] Hikaye Uretildi (Sabit Metin):\n{story_text}\n")
        
        # 2. Seslendirme
        print("2. Seslendirme (ElevenLabs) baslatiliyor...")
        voice_output_path = os.path.join(output_dir, "test_voiceover_en.mp3")
        generate_voice(story_text, voice_output_path)
        print(f"[BASARILI] Ses dosyasi kaydedildi: {voice_output_path}")
        
        # 3. Fotograf Uretimi
        print("\n3. Fotograf uretimi (Placeholder) baslatiliyor...")
        photo_output_path = os.path.join(output_dir, "test_photo_en.jpg")
        generate_image(f"{seller_name} ceramic", photo_output_path)
        print(f"[BASARILI] Fotograf kaydedildi: {photo_output_path}")
        
        # 4. Video Birlestirme
        print("\n4. Video birlestirme ve ses ekleme (FFmpeg) baslatiliyor...")
        final_video_path = os.path.join(output_dir, "test_final_video_intro.mp4")
        
        media_metadata = []
        media_metadata.append({
            'filepath': photo_output_path,
            'type': 'image',
            'transition': 'zoompan',
            'text': seller_name,
            'textStart': 0,
            'textEnd': 4
        })
        for v in video_paths:
            media_metadata.append({
                'filepath': v,
                'type': 'video',
                'filter': 'cinematic',
                'transition': 'fade'
            })
            
        process_video_dynamic(media_metadata, voice_output_path, final_video_path)
        print(f"[BASARILI] Final Video kaydedildi: {final_video_path}")
        
        print("\n[TAMAMLANDI] TEST BASARIYLA TAMAMLANDI!")
        
    except Exception as e:
        print(f"\n[HATA] TEST SIRASINDA HATA OLUSTU: {str(e)}")

if __name__ == "__main__":
    run_test()

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import io

app = FastAPI()

# CORS - Next.js frontend'in (localhost:3000) erişebilmesi için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODEL YAPILANDIRMASI
# Mimari: MobileNetV2 (özel classifier katmanı)
# Çıkış: 5 kategori
# ============================================================

CLASSES = ["Comlek", "Vazo", "Hali", "Kilim", "Tabak"]
NUM_CLASSES = 5

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_model():
    """MobileNetV2 mimarisini oluştur ve eğitilmiş ağırlıkları yükle"""
    try:
        # 1. Temel MobileNetV2 mimarisini oluştur
        model = models.mobilenet_v2(weights=None)
        
        # 2. Classifier katmanını modeldeki yapıya göre değiştir
        #    classifier.1: Linear(1280 -> 128)
        #    classifier.3: Linear(128 -> 5)
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(1280, 128),
            nn.ReLU(),
            nn.Linear(128, NUM_CLASSES)
        )
        
        # 3. Eğitilmiş ağırlıkları yükle
        state_dict = torch.load("hackathon_model.pth", map_location=device, weights_only=False)
        
        # Eğer dict içinde 'model_state_dict' varsa onu kullan
        if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
            state_dict = state_dict['model_state_dict']
        
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        
        print("=" * 50)
        print("[OK] Model basariyla yuklendi!")
        print(f"   Mimari: MobileNetV2")
        print(f"   Kategoriler: {CLASSES}")
        print(f"   Cihaz: {device}")
        print("=" * 50)
        
        return model
        
    except Exception as e:
        print(f"[HATA] Model yuklenirken hata: {e}")
        import traceback
        traceback.print_exc()
        return None

model = load_model()

# Görsel ön işleme (ImageNet standart normalizasyonu)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

@app.get("/")
async def root():
    return {
        "status": "running",
        "model_loaded": model is not None,
        "classes": CLASSES
    }

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    if model is None:
        return {
            "success": False,
            "error": "Model yüklenemedi",
            "category": CLASSES[0],
            "confidence": 0.0,
            "all_predictions": {}
        }

    try:
        # Resmi oku
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')

        # Ön işleme ve tahmin
        tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)

            class_idx = predicted.item()
            category = CLASSES[class_idx] if class_idx < len(CLASSES) else f"Kategori_{class_idx}"

            # Tüm kategorilerin olasılıklarını döndür
            all_preds = {
                CLASSES[i]: round(probabilities[0][i].item() * 100, 2)
                for i in range(NUM_CLASSES)
            }

            print(f"[TAHMIN] {category} (%{confidence.item()*100:.1f})")

            return {
                "success": True,
                "category": category,
                "confidence": round(confidence.item() * 100, 2),
                "all_predictions": all_preds
            }

    except Exception as e:
        print(f"[HATA] Tahmin hatasi: {e}")
        return {
            "success": False,
            "error": str(e),
            "category": CLASSES[0],
            "confidence": 0.0
        }

if __name__ == "__main__":
    import uvicorn
    print("\nKapadokya AI Sunucusu Baslatiliyor...")
    print("   http://127.0.0.1:8000")
    print("   http://127.0.0.1:8000/docs (API Belgeleri)\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)

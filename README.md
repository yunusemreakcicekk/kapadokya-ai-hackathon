# Hackhathon1

Bu depo; Kapadokya web uygulaması, RFID mobil uygulaması ve AI video üretim backend/frontend parçalarını içerir.

## Proje Yapısı

- `web sitesi/kapadokya`: Next.js web uygulaması
- `rfid_mobil`: Flutter mobil uygulaması
- `AI-VİDEO`: FastAPI backend ve Vite/React frontend
- `Bowl`, `Pot`, `Rug`, `Vase`, `scatter rug`: ürün görselleri

## Ortam Değişkenleri

Gerçek API anahtarları GitHub'a gönderilmemelidir.

AI video backend için:

```bash
cd AI-VİDEO
copy .env.example .env
```

Ardından `.env` içine kendi değerlerinizi girin:

- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `API_BASE_URL`

Mobil Firebase ayarı için:

```bash
copy rfid_mobil\android\app\google-services.example.json rfid_mobil\android\app\google-services.json
```

Sonra Firebase Console'dan aldığınız gerçek değerleri `google-services.json` içine ekleyin.

Kapadokya web uygulamasında döviz API'si için:

```bash
copy "web sitesi\kapadokya\.env.example" "web sitesi\kapadokya\.env.local"
```

Ardından `.env.local` içine `EVDS_API_KEY` ve `GEMINI_API_KEY` değerlerini girin.

## Çalıştırma

### Web

```bash
cd "web sitesi/kapadokya"
npm install
npm run dev
```

### AI Video Backend

```bash
cd AI-VİDEO
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### AI Video Frontend

```bash
cd AI-VİDEO\frontend
npm install
npm run dev
```

### Mobil

```bash
cd rfid_mobil
flutter pub get
flutter run
```

## GitHub'a Gönderilmemesi Gerekenler

Bu depo `.gitignore` ile şu dosyaları dışarıda bırakır:

- API anahtarları ve `.env` dosyaları
- YouTube OAuth token dosyası
- Firebase `google-services.json`
- build klasörleri, loglar, cache dosyaları
- AI video upload/output/test çıktıları

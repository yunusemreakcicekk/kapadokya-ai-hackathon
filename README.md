# kapadokya-ai-hackaton

AI destekli Kapadokya el sanatlari platformu. Bu depo; web uygulamasi, RFID mobil uygulamasi ve AI video uretim backend/frontend parcalarini icerir.

## Proje Videosu

[Proje videosunu izle](media/proje-videosu.mp4)

## Ozellikler

- Next.js web arayuzu
- Flutter tabanli RFID mobil uygulamasi
- FastAPI backend ve Vite/React AI video frontend'i
- Urun hikayesi uretimi, ceviri ve gorsel icerik akislari
- Lojistik, rota ve karbon etkisi ekranlari

## Urun Guvenligi

Bu proje, el sanatlari urunlerinin ozgunlugunu ve teslimat surecindeki guvenligini artirmak icin RFID tabanli urun takibi, Firebase kayitlari ve satici/alici panelleri kullanir.

Urunler kimliklendirilerek kayit altina alinir. Alici tarafinda urun bilgileri dogrulanabilir, satici tarafinda ise urunun surec icindeki durumu takip edilebilir. Bu yapi; sahte urun riskini azaltmayi, temel izlenebilirlik saglamayi ve kullanicinin urune guvenmesini kolaylastirmayi hedefler.

## Proje Yapisi

- `web sitesi/kapadokya`: Next.js web uygulamasi
- `rfid_mobil`: Flutter mobil uygulamasi
- `AI-VİDEO`: FastAPI backend ve Vite/React frontend
- `media`: proje tanitim videosu
- `Bowl`, `Pot`, `Rug`, `Vase`, `scatter rug`: urun gorselleri

## Ortam Degiskenleri

Gercek API anahtarlari GitHub'a gonderilmemelidir. Bu depoda yalnizca ornek dosyalar tutulur.

AI video backend icin:

```bash
cd AI-VİDEO
copy .env.example .env
```

Ardindan `.env` icine kendi degerlerinizi girin:

- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `API_BASE_URL`

Mobil Firebase ayari icin:

```bash
copy rfid_mobil\android\app\google-services.example.json rfid_mobil\android\app\google-services.json
```

Sonra Firebase Console'dan aldiginiz gercek degerleri `google-services.json` icine ekleyin.

Kapadokya web uygulamasinda doviz API'si icin:

```bash
copy "web sitesi\kapadokya\.env.example" "web sitesi\kapadokya\.env.local"
```

Ardindan `.env.local` icine `EVDS_API_KEY` ve `GEMINI_API_KEY` degerlerini girin.

Firebase Admin kullanilacaksa:

```bash
copy "web sitesi\kapadokya\serviceAccountKey.example.json" "web sitesi\kapadokya\serviceAccountKey.json"
```

Gercek `serviceAccountKey.json` dosyasi sadece lokal ortamda tutulmalidir.

## Calistirma

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

## GitHub'a Gonderilmemesi Gerekenler

Bu depo `.gitignore` ile su dosyalari disarida birakir:

- API anahtarlari ve `.env` dosyalari
- YouTube OAuth token dosyasi
- Firebase `google-services.json`
- Firebase Admin `serviceAccountKey.json`
- build klasorleri, loglar, cache dosyalari
- AI video upload/output/test ciktilari

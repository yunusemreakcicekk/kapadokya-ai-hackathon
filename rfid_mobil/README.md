# rfid_mobil

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Kapadokya Hackathon 2026 Lojistik ve Karbon Modulu

Bu projeye Kapadokya Hackathon 2026 teknik beklentilerine uygun, yerel uretici odakli bir lojistik ve karbon hesaplama katmani eklendi. Modulun ana hedefi, Kapadokya bolgesindeki zanaatkar, depo isletmecisi, pekmez ureticisi ve seramik ureticisi gibi farkli profillerin sevkiyat kararlarini daha olculebilir, daha seffaf ve daha ihracata hazir hale getirmektir. Uygulama acilisinda kullaniciya "Kapadokya Yerel Uretici Profili" sectirilir. Bu secim yalnizca gorsel bir tercih degildir; uygulamanin tema rengi, kullaniciya sunulan tasima secenekleri ve AI destekli yorum mantigi profil ile birlikte degisir. Ornegin pekmez ureticisi profilinde kara, deniz ve demiryolu secenekleri one cikarilirken, zanaatkar profilinde kirilgan veya dusuk hacimli urunler icin kara, demiryolu ve hava senaryolari daha gorunur hale getirilir.

Karbon izi hesaplama yapisi `lib/logistics/services/carbon_calculator.dart` dosyasinda sade ve test edilebilir bir servis olarak tutulur. Formul Mesafe (km) x Agirlik (ton) x Emisyon Katsayisi seklindedir. Hava tasimasi icin 0.500, deniz tasimasi icin 0.015, kara tasimasi icin 0.100 ve demiryolu icin 0.030 katsayilari kullanilir. Bu yaklasim kullanicinin ayni rota ve agirlik icin farkli lojistik modlarinin karbon etkisini hizli bicimde karsilastirmasini saglar. Rota ve mesafe hesaplama katmani `RouteService` icindedir. OpenRouteService API anahtari `AppConstants.openRouteServiceApiKey` uzerinden merkezi olarak okunur. Anahtar tanimlanmadiginda uygulama gelistirme ve demo akisinin kirilmamasi icin iki koordinat arasindaki haversine mesafesini yedek hesap olarak kullanir. Adres arama ve autocomplete ozelligi Nominatim uzerinden calisir ve kullanici cikis ile varis adreslerini harita uzerinde rota noktalarina donusturebilir.

Doviz katmani `ExchangeRateService` icinde merkezi olarak tasarlanmistir. TCMB EVDS API adresi ve anahtari `AppConstants` sinifinda tutulur. EVDS anahtari saglandiginda USD ve EUR kurlari okunur, toplam lojistik ucret hem TL hem de doviz karsiliklariyla gosterilir. API anahtari olmayan demo ortaminda sistem varsayilan kur degerleriyle calisarak arayuzun ve hesap akisinin test edilebilir kalmasini saglar. Bu yapi ihracat yapan veya ihracata hazirlanan yerel ureticiler icin onemlidir, cunku maliyet yalnizca yerel para birimiyle degil, dis ticaret kararlarinda kullanilan para birimleriyle de izlenebilir.

AI katmani gercek bir uzak model cagirmadan, aciklanabilir ve profil bazli bir karar destek mantigi simule eder. Doviz trendi yukseliyorsa kullaniciya "Su an odeme yaparak karbon maliyetinizi sabitleyebilirsiniz" gibi aksiyon odakli bir uyari uretilir. Pekmez ureticisi profilinde sezonluk uretim ve ihracat maliyeti vurgulanir; depo isletmecisi profilinde toplu sevkiyat ve rota birlestirme onerileri one cikar. Bu metinler `LogisticsProvider` icindeki hesaplama sonucuna, secilen profile, karbon emisyonuna ve doviz trendine gore olusturulur. Boylece kullanici yalnizca sayisal bir sonuc degil, kendi is akisini ilgilendiren okunabilir bir ozet alir.

Arayuz tarafinda `LogisticsDashboardPage`, `flutter_map` ile rota gorunumu, Nominatim adres arama alanlari, tasima modu secimi, agirlik ve temel lojistik ucret girisi, karbon sonucu, cift para birimi sonucu, AI asistan ozeti ve Impact Tracker bileşenlerini tek ekranda toplar. Impact Tracker kullanicinin hayatinda neyin degistigini somutlastirir: manuel mesafe girisi yerine otomatik rota, elle karbon hesabi yerine katsayi bazli hesaplama, yalnizca TL maliyeti yerine USD/EUR ihracat gorunurlugu. Bu, hackathon anlatiminda urunun sosyal ve operasyonel etkisini gostermek icin kullanilabilir.

Loglama yapisi `LogisticsLogger` ile kuruldu. Her rota secimi, tasima modu degisikligi, EVDS kur okuma denemesi, karbon hesaplama sonucu ve AI onerisi zaman damgali olarak saklanir. Ayni servis `buildReadmeExport` fonksiyonu ile README veya final rapora aktarilabilecek ayrintili bir metin uretir. Bu metin profil ozetini, hesaplama girdilerini, karbon formulunu, doviz bilgisini, AI yorumunu ve islem gunlugunu kapsar. Entegrasyonun moduler tutulmasi sayesinde servisler daha sonra gercek API anahtarlari, kalici Firestore kaydi, PDF raporlama veya daha gelismis AI modeliyle kolayca genisletilebilir.

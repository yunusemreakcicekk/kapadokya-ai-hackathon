import '../models/logistics_models.dart';

class LogisticsLogger {
  final List<String> _entries = [];

  List<String> get entries => List.unmodifiable(_entries);

  void log(String message) {
    final timestamp = DateTime.now().toIso8601String();
    _entries.add('[$timestamp] $message');
  }

  String buildReadmeExport({
    required ProducerProfile profile,
    required CarbonCalculationResult? result,
    required ExchangeRates? rates,
    required String aiInsight,
  }) {
    final buffer = StringBuffer()
      ..writeln('# Kapadokya Hackathon 2026 Lojistik ve Karbon Raporu')
      ..writeln()
      ..writeln('## Secilen Profil')
      ..writeln(
        '${profile.title} profili, ${profile.description} Bu profil ile uygulama renkleri ve lojistik secenekleri otomatik olarak kisilestirildi.',
      )
      ..writeln()
      ..writeln('## Hesaplama Ozeti');

    if (result == null) {
      buffer.writeln(
        'Henuz tamamlanmis bir hesaplama yok. Kullanici baslangic ve varis noktalarini, agirligi ve tasima modunu sectiginde sistem rota mesafesini, karbon ayak izini ve doviz bazli maliyeti hesaplayacaktir.',
      );
    } else {
      buffer
        ..writeln(
          'Rota mesafesi ${result.distanceKm.toStringAsFixed(2)} km, tasima agirligi ${result.weightTon.toStringAsFixed(2)} ton ve tasima modu ${result.mode.label} olarak hesaplandi.',
        )
        ..writeln(
          'Karbon formulu Mesafe x Agirlik x Katsayi olarak uygulandi. Bu islem sonucunda ${result.carbonTon.toStringAsFixed(3)} ton CO2e ve ${result.carbonCostTry.toStringAsFixed(2)} TL karbon maliyeti olustu.',
        )
        ..writeln(
          'Toplam lojistik ucret ${result.totalLogisticsFeeTry.toStringAsFixed(2)} TL, ${result.totalUsd.toStringAsFixed(2)} USD ve ${result.totalEur.toStringAsFixed(2)} EUR olarak raporlandi.',
        );
    }

    buffer
      ..writeln()
      ..writeln('## Doviz ve AI Yorumu')
      ..writeln(
        rates == null
            ? 'TCMB EVDS verisi henuz cekilmedi. API anahtari tanimlandiginda sistem guncel USD ve EUR kurlarini alip toplam maliyeti cift para biriminde gosterecektir.'
            : 'USD/TL ${rates.usdTry.toStringAsFixed(4)}, EUR/TL ${rates.eurTry.toStringAsFixed(4)} ve USD trendi ${rates.usdTrendPercent.toStringAsFixed(2)}% olarak okundu.',
      )
      ..writeln(aiInsight)
      ..writeln()
      ..writeln('## Detayli Islem Gunlugu');

    for (final entry in _entries) {
      buffer.writeln('- $entry');
    }

    buffer
      ..writeln()
      ..writeln('## Hackathon Uygunluk Notu')
      ..writeln(
        'Bu modul Kapadokya yerel ureticilerinin lojistik kararlarini daha seffaf hale getirmek icin tasarlandi. Sistem, rota verisini Nominatim ve OpenRouteService yaklasimina uygun sekilde konum bazli ele alir; OpenRouteService anahtari yoksa demo ve gelistirme ortaminda iki nokta arasindaki haversine mesafesini guvenli bir yedek hesap olarak kullanir. Karbon izi hesaplamasi dort farkli tasima turu icin sabit katsayilar uzerinden yapilir: hava, deniz, kara ve demiryolu. Bu sayede kullanici ayni urunun farkli tasima senaryolarinda nasil degisen bir emisyon urettigini gorebilir. TCMB EVDS entegrasyonu, kur riskini lojistik maliyetin dogal parcasi olarak dashboard uzerine tasir. Kullanici yalnizca TL toplamlarini degil, ihracat odakli USD ve EUR karsiliklarini da gorur. AI katmani gercek bir model cagirmadan kural tabanli ve aciklanabilir bir karar destegi sunar. Doviz trendi yukseliyorsa maliyet sabitleme onerisi, profil pekmez ureticisi ise sezonluk ihracat ve uretim miktari yorumu, depo isletmecisi ise toplu sevkiyat ve rota birlestirme onerisi verilir. Impact Tracker, manuel hesaplama yerine otomatik rota, karbon ve doviz analizinin ureticinin gunluk is akisinda neyi degistirdigini gorsellestirir. Bu yapi README veya final rapora aktarilabilecek ayrintili log uretir ve her hesaplamanin hangi girdilerle yapildigini izlenebilir kilar.',
      );

    return buffer.toString();
  }
}

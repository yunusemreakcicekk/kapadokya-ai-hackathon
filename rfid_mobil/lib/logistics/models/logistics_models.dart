import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

enum TransportMode {
  air('Hava', 0.500, Icons.flight),
  sea('Deniz', 0.015, Icons.directions_boat),
  road('Kara', 0.100, Icons.local_shipping),
  rail('Demiryolu', 0.030, Icons.train);

  final String label;
  final double emissionFactor;
  final IconData icon;

  const TransportMode(this.label, this.emissionFactor, this.icon);
}

enum ProducerProfile {
  artisan(
    'Zanaatkar',
    'El isi, dusuk hacimli ve ozenli paketlenen yerel urunler.',
    Color(0xFFB85C38),
    [TransportMode.road, TransportMode.rail, TransportMode.air],
  ),
  warehouse(
    'Depo Isletmecisi',
    'Toplu sevkiyat, rota optimizasyonu ve kapasite takibi.',
    Color(0xFF2E7D68),
    [TransportMode.road, TransportMode.rail, TransportMode.sea],
  ),
  molassesProducer(
    'Pekmez Ureticisi',
    'Sezonluk gida uretimi, ihracat ve soguk olmayan zincir planlamasi.',
    Color(0xFF7A3E1D),
    [TransportMode.road, TransportMode.sea, TransportMode.rail],
  ),
  ceramicProducer(
    'Seramik Ureticisi',
    'Kirilgan urunler icin kontrollu lojistik ve guvenli teslimat.',
    Color(0xFF33658A),
    [TransportMode.road, TransportMode.rail, TransportMode.air],
  );

  final String title;
  final String description;
  final Color seedColor;
  final List<TransportMode> allowedModes;

  const ProducerProfile(
    this.title,
    this.description,
    this.seedColor,
    this.allowedModes,
  );
}

class AddressSuggestion {
  final String displayName;
  final LatLng point;

  const AddressSuggestion({
    required this.displayName,
    required this.point,
  });
}

class RouteInfo {
  final double distanceKm;
  final List<LatLng> points;

  const RouteInfo({
    required this.distanceKm,
    required this.points,
  });
}

class ExchangeRates {
  final double usdTry;
  final double eurTry;
  final double previousUsdTry;
  final DateTime updatedAt;

  const ExchangeRates({
    required this.usdTry,
    required this.eurTry,
    required this.previousUsdTry,
    required this.updatedAt,
  });

  double get usdTrendPercent {
    if (previousUsdTry <= 0) return 0;
    return ((usdTry - previousUsdTry) / previousUsdTry) * 100;
  }
}

class CarbonCalculationResult {
  final double distanceKm;
  final double weightTon;
  final TransportMode mode;
  final double carbonTon;
  final double carbonCostTry;
  final double totalLogisticsFeeTry;
  final double totalUsd;
  final double totalEur;
  final DateTime createdAt;

  const CarbonCalculationResult({
    required this.distanceKm,
    required this.weightTon,
    required this.mode,
    required this.carbonTon,
    required this.carbonCostTry,
    required this.totalLogisticsFeeTry,
    required this.totalUsd,
    required this.totalEur,
    required this.createdAt,
  });
}

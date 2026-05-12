import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../../core/app_constants.dart';
import '../models/logistics_models.dart';
import '../services/carbon_calculator.dart';
import '../services/exchange_rate_service.dart';
import '../services/geocoding_service.dart';
import '../services/logistics_logger.dart';
import '../services/route_service.dart';

class LogisticsProvider extends ChangeNotifier {
  final GeocodingService _geocodingService;
  final RouteService _routeService;
  final ExchangeRateService _exchangeRateService;
  final LogisticsLogger logger;

  LogisticsProvider({
    GeocodingService? geocodingService,
    RouteService? routeService,
    ExchangeRateService? exchangeRateService,
    LogisticsLogger? logger,
  })  : _geocodingService = geocodingService ?? GeocodingService(),
        _routeService = routeService ?? RouteService(),
        _exchangeRateService = exchangeRateService ?? ExchangeRateService(),
        logger = logger ?? LogisticsLogger();

  AddressSuggestion? origin;
  AddressSuggestion? destination;
  List<AddressSuggestion> originSuggestions = [];
  List<AddressSuggestion> destinationSuggestions = [];
  List<LatLng> routePoints = [];
  TransportMode selectedMode = TransportMode.road;
  ExchangeRates? rates;
  CarbonCalculationResult? result;
  String aiInsight = 'Profilinizi secip rota hesapladiginizda AI onerisi burada gorunecek.';
  bool isLoading = false;

  Future<void> searchOrigin(String query) async {
    originSuggestions = await _geocodingService.searchAddress(query);
    notifyListeners();
  }

  Future<void> searchDestination(String query) async {
    destinationSuggestions = await _geocodingService.searchAddress(query);
    notifyListeners();
  }

  void setOrigin(AddressSuggestion suggestion) {
    origin = suggestion;
    originSuggestions = [];
    logger.log('Cikis noktasi secildi: ${suggestion.displayName}');
    notifyListeners();
  }

  void setDestination(AddressSuggestion suggestion) {
    destination = suggestion;
    destinationSuggestions = [];
    logger.log('Varis noktasi secildi: ${suggestion.displayName}');
    notifyListeners();
  }

  void setTransportMode(TransportMode mode) {
    selectedMode = mode;
    logger.log('Tasima modu degisti: ${mode.label}');
    notifyListeners();
  }

  Future<void> refreshRates() async {
    rates = await _exchangeRateService.fetchRates();
    logger.log(
      'TCMB EVDS kur verisi: USD ${rates!.usdTry}, EUR ${rates!.eurTry}, USD trend ${rates!.usdTrendPercent.toStringAsFixed(2)}%',
    );
    notifyListeners();
  }

  Future<void> calculate({
    required double weightKg,
    required double baseLogisticsFeeTry,
    required ProducerProfile profile,
  }) async {
    if (origin == null || destination == null) {
      throw Exception('Cikis ve varis adresi secilmelidir');
    }

    isLoading = true;
    notifyListeners();

    try {
      rates ??= await _exchangeRateService.fetchRates();
      final route = await _routeService.fetchRoute(
        start: origin!.point,
        end: destination!.point,
      );

      routePoints = route.points;
      final weightTon = weightKg / 1000;
      final carbonTon = CarbonCalculator.calculateCarbonTon(
        distanceKm: route.distanceKm,
        weightTon: weightTon,
        mode: selectedMode,
      );
      final carbonCostTry = CarbonCalculator.calculateCarbonCostTry(
        carbonTon: carbonTon,
        carbonPricePerTonTry: AppConstants.defaultCarbonPricePerTonTry,
      );
      final totalTry = baseLogisticsFeeTry + carbonCostTry;

      result = CarbonCalculationResult(
        distanceKm: route.distanceKm,
        weightTon: weightTon,
        mode: selectedMode,
        carbonTon: carbonTon,
        carbonCostTry: carbonCostTry,
        totalLogisticsFeeTry: totalTry,
        totalUsd: rates!.usdTry > 0 ? totalTry / rates!.usdTry : 0,
        totalEur: rates!.eurTry > 0 ? totalTry / rates!.eurTry : 0,
        createdAt: DateTime.now(),
      );

      aiInsight = _buildAiInsight(profile, result!, rates!);
      logger
        ..log(
          'Rota ${route.distanceKm.toStringAsFixed(2)} km olarak hesaplandi.',
        )
        ..log(
          'Karbon: ${carbonTon.toStringAsFixed(3)} ton CO2e, karbon maliyeti: ${carbonCostTry.toStringAsFixed(2)} TL.',
        )
        ..log('AI onerisi: $aiInsight');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  String buildReadmeExport(ProducerProfile profile) {
    return logger.buildReadmeExport(
      profile: profile,
      result: result,
      rates: rates,
      aiInsight: aiInsight,
    );
  }

  String _buildAiInsight(
    ProducerProfile profile,
    CarbonCalculationResult result,
    ExchangeRates rates,
  ) {
    final trend = rates.usdTrendPercent;
    final trendAdvice = trend > 0.75
        ? 'USD trendi yukseliyor. Su an odeme yaparak karbon maliyetinizi sabitleyebilirsiniz.'
        : 'Doviz trendi sakin. Sevkiyat icin dusuk emisyonlu alternatifleri karsilastirmak daha avantajli.';

    if (profile == ProducerProfile.molassesProducer) {
      return 'Pekmez ureticisi icin sezonluk sevkiyat analiz edildi. ${result.weightTon.toStringAsFixed(2)} ton urun, ${result.mode.label} ile ${result.carbonTon.toStringAsFixed(3)} ton CO2e uretiyor. Ihracat maliyeti ${result.totalUsd.toStringAsFixed(2)} USD. $trendAdvice';
    }

    if (profile == ProducerProfile.warehouse) {
      return 'Depo profili icin rota birlestirme onemli. Bu hesap toplu sevkiyat planina eklenirse manuel mesafe ve karbon takibi otomatiklesir. $trendAdvice';
    }

    return '${profile.title} profili icin ${result.mode.label} tasimasi hesaplandi. Eskiden manuel yapilan emisyon ve doviz karsiligi artik tek ekranda izleniyor. $trendAdvice';
  }
}

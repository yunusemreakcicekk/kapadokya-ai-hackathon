import '../models/logistics_models.dart';

class CarbonCalculator {
  static double calculateCarbonTon({
    required double distanceKm,
    required double weightTon,
    required TransportMode mode,
  }) {
    return distanceKm * weightTon * mode.emissionFactor;
  }

  static double calculateCarbonCostTry({
    required double carbonTon,
    required double carbonPricePerTonTry,
  }) {
    return carbonTon * carbonPricePerTonTry;
  }
}

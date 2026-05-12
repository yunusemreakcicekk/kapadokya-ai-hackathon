class AppConstants {
  AppConstants._();

  static const String nominatimSearchUrl =
      'https://nominatim.openstreetmap.org/search';
  static const String nominatimReverseUrl =
      'https://nominatim.openstreetmap.org/reverse';

  static const String openRouteServiceDirectionsUrl =
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
  static const String openRouteServiceApiKey = String.fromEnvironment(
    'OPEN_ROUTE_SERVICE_API_KEY',
    defaultValue: '',
  );

  static const String evdsApiUrl =
      'https://evds2.tcmb.gov.tr/service/evds/';
  static const String evdsApiKey = String.fromEnvironment(
    'TCMB_EVDS_API_KEY',
    defaultValue: '',
  );

  static const double defaultCarbonPricePerTonTry = 750;
  static const String appUserAgent =
      'rfid_mobil_kapadokya_hackathon_2026/1.0';
}

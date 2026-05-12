import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/app_constants.dart';
import '../models/logistics_models.dart';

class ExchangeRateService {
  Future<ExchangeRates> fetchRates() async {
    if (AppConstants.evdsApiKey.isEmpty) {
      return ExchangeRates(
        usdTry: 32.5,
        eurTry: 35.2,
        previousUsdTry: 32.1,
        updatedAt: DateTime.now(),
      );
    }

    final today = DateTime.now();
    final startDate = today.subtract(const Duration(days: 7));
    final uri = Uri.parse(
      '${AppConstants.evdsApiUrl}'
      'series=TP.DK.USD.A.YTL-TP.DK.EUR.A.YTL'
      '&startDate=${_formatEvdsDate(startDate)}'
      '&endDate=${_formatEvdsDate(today)}'
      '&type=json',
    );

    final response = await http.get(
      uri,
      headers: {'key': AppConstants.evdsApiKey},
    );

    if (response.statusCode != 200) {
      throw Exception('TCMB EVDS kur verisi alinamadi');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final items = (json['items'] as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .where((item) => item['TP_DK_USD_A_YTL'] != null)
        .toList();

    if (items.isEmpty) {
      throw Exception('TCMB EVDS bos kur verisi dondu');
    }

    final latest = items.last;
    final previous = items.length > 1 ? items[items.length - 2] : latest;

    return ExchangeRates(
      usdTry: _readDouble(latest['TP_DK_USD_A_YTL']),
      eurTry: _readDouble(latest['TP_DK_EUR_A_YTL']),
      previousUsdTry: _readDouble(previous['TP_DK_USD_A_YTL']),
      updatedAt: today,
    );
  }

  String _formatEvdsDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day-$month-${date.year}';
  }

  double _readDouble(dynamic value) {
    return double.tryParse(value.toString().replaceAll(',', '.')) ?? 0;
  }
}

import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../../core/app_constants.dart';
import '../models/logistics_models.dart';

class GeocodingService {
  Future<List<AddressSuggestion>> searchAddress(String query) async {
    if (query.trim().length < 3) return [];

    final uri = Uri.parse(AppConstants.nominatimSearchUrl).replace(
      queryParameters: {
        'q': query.trim(),
        'format': 'json',
        'addressdetails': '1',
        'limit': '5',
      },
    );

    final response = await http.get(
      uri,
      headers: {'User-Agent': AppConstants.appUserAgent},
    );

    if (response.statusCode != 200) {
      throw Exception('Adres arama basarisiz: ${response.statusCode}');
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data.map((item) {
      final map = item as Map<String, dynamic>;
      return AddressSuggestion(
        displayName: map['display_name']?.toString() ?? '',
        point: LatLng(
          double.parse(map['lat'].toString()),
          double.parse(map['lon'].toString()),
        ),
      );
    }).toList();
  }
}

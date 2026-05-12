import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../../core/app_constants.dart';
import '../models/logistics_models.dart';

class RouteService {
  Future<RouteInfo> fetchRoute({
    required LatLng start,
    required LatLng end,
  }) async {
    if (AppConstants.openRouteServiceApiKey.isEmpty) {
      return _fallbackDistance(start: start, end: end);
    }

    final response = await http.post(
      Uri.parse(AppConstants.openRouteServiceDirectionsUrl),
      headers: {
        'Authorization': AppConstants.openRouteServiceApiKey,
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'coordinates': [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude],
        ],
      }),
    );

    if (response.statusCode != 200) {
      return _fallbackDistance(start: start, end: end);
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final feature = (data['features'] as List<dynamic>).first;
    final properties = feature['properties'] as Map<String, dynamic>;
    final summary = properties['summary'] as Map<String, dynamic>;
    final geometry = feature['geometry'] as Map<String, dynamic>;
    final coordinates = geometry['coordinates'] as List<dynamic>;

    return RouteInfo(
      distanceKm: (summary['distance'] as num).toDouble() / 1000,
      points: coordinates.map((coord) {
        final list = coord as List<dynamic>;
        return LatLng(
          (list[1] as num).toDouble(),
          (list[0] as num).toDouble(),
        );
      }).toList(),
    );
  }

  RouteInfo _fallbackDistance({
    required LatLng start,
    required LatLng end,
  }) {
    final distanceKm = const Distance().as(
      LengthUnit.Kilometer,
      start,
      end,
    );

    return RouteInfo(
      distanceKm: distanceKm,
      points: [start, end],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../models/logistics_models.dart';
import '../providers/logistics_provider.dart';
import '../providers/user_provider.dart';
import '../widgets/impact_tracker.dart';

class LogisticsDashboardPage extends StatefulWidget {
  const LogisticsDashboardPage({super.key});

  @override
  State<LogisticsDashboardPage> createState() => _LogisticsDashboardPageState();
}

class _LogisticsDashboardPageState extends State<LogisticsDashboardPage> {
  final originController = TextEditingController();
  final destinationController = TextEditingController();
  final weightController = TextEditingController(text: '250');
  final feeController = TextEditingController(text: '3500');

  @override
  void dispose() {
    originController.dispose();
    destinationController.dispose();
    weightController.dispose();
    feeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = context.watch<UserProvider>();
    final logistics = context.watch<LogisticsProvider>();
    final profile = userProvider.profile ?? ProducerProfile.artisan;
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lojistik ve Karbon'),
        backgroundColor: primary,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          _AiSummaryCard(profile: profile, insight: logistics.aiInsight),
          const SizedBox(height: 12),
          _AddressSearchField(
            controller: originController,
            label: 'Cikis adresi',
            suggestions: logistics.originSuggestions,
            onChanged: logistics.searchOrigin,
            onSelected: (suggestion) {
              originController.text = suggestion.displayName;
              logistics.setOrigin(suggestion);
            },
          ),
          _AddressSearchField(
            controller: destinationController,
            label: 'Varis adresi',
            suggestions: logistics.destinationSuggestions,
            onChanged: logistics.searchDestination,
            onSelected: (suggestion) {
              destinationController.text = suggestion.displayName;
              logistics.setDestination(suggestion);
            },
          ),
          Row(
            children: [
              Expanded(
                child: _NumberField(
                  controller: weightController,
                  label: 'Agirlik (kg)',
                  icon: Icons.scale,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _NumberField(
                  controller: feeController,
                  label: 'Ucret (TL)',
                  icon: Icons.payments,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final mode in userProvider.allowedModes)
                ChoiceChip(
                  avatar: Icon(mode.icon, size: 18),
                  label: Text(mode.label),
                  selected: logistics.selectedMode == mode,
                  onSelected: (_) => logistics.setTransportMode(mode),
                ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 230,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: FlutterMap(
                options: MapOptions(
                  initialCenter:
                      logistics.origin?.point ?? const LatLng(38.6431, 34.8289),
                  initialZoom: 7,
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.example.rfid_mobil',
                  ),
                  if (logistics.routePoints.isNotEmpty)
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: logistics.routePoints,
                          color: primary,
                          strokeWidth: 5,
                        ),
                      ],
                    ),
                  MarkerLayer(
                    markers: [
                      if (logistics.origin != null)
                        Marker(
                          point: logistics.origin!.point,
                          child: const Icon(Icons.trip_origin, color: Colors.green),
                        ),
                      if (logistics.destination != null)
                        Marker(
                          point: logistics.destination!.point,
                          child: const Icon(Icons.location_on, color: Colors.red),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              onPressed: logistics.isLoading
                  ? null
                  : () async {
                      final weight =
                          double.tryParse(weightController.text.trim()) ?? 0;
                      final fee =
                          double.tryParse(feeController.text.trim()) ?? 0;
                      try {
                        await context.read<LogisticsProvider>().calculate(
                              weightKg: weight,
                              baseLogisticsFeeTry: fee,
                              profile: profile,
                            );
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(e.toString())),
                        );
                      }
                    },
              icon: logistics.isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.calculate),
              label: const Text('Karbon ve Ucret Hesapla'),
            ),
          ),
          const SizedBox(height: 12),
          _ResultCard(result: logistics.result, rates: logistics.rates),
          const SizedBox(height: 12),
          ImpactTracker(profile: profile, result: logistics.result),
          const SizedBox(height: 12),
          _ReadmeExportCard(exportText: logistics.buildReadmeExport(profile)),
        ],
      ),
    );
  }
}

class _AiSummaryCard extends StatelessWidget {
  final ProducerProfile profile;
  final String insight;

  const _AiSummaryCard({required this.profile, required this.insight});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AI Asistani - ${profile.title}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(insight),
          ],
        ),
      ),
    );
  }
}

class _AddressSearchField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final List<AddressSuggestion> suggestions;
  final ValueChanged<String> onChanged;
  final ValueChanged<AddressSuggestion> onSelected;

  const _AddressSearchField({
    required this.controller,
    required this.label,
    required this.suggestions,
    required this.onChanged,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            TextField(
              controller: controller,
              decoration: InputDecoration(
                labelText: label,
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
              ),
              onChanged: onChanged,
            ),
            for (final suggestion in suggestions)
              ListTile(
                dense: true,
                title: Text(
                  suggestion.displayName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                onTap: () => onSelected(suggestion),
              ),
          ],
        ),
      ),
    );
  }
}

class _NumberField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;

  const _NumberField({
    required this.controller,
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: const OutlineInputBorder(),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  final CarbonCalculationResult? result;
  final ExchangeRates? rates;

  const _ResultCard({required this.result, required this.rates});

  @override
  Widget build(BuildContext context) {
    if (result == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('Hesaplama sonucu burada gorunecek.'),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cift Para Birimli Sonuc',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text('Mesafe: ${result!.distanceKm.toStringAsFixed(2)} km'),
            Text('Karbon: ${result!.carbonTon.toStringAsFixed(3)} ton CO2e'),
            Text('Karbon maliyeti: ${result!.carbonCostTry.toStringAsFixed(2)} TL'),
            Text('Toplam: ${result!.totalLogisticsFeeTry.toStringAsFixed(2)} TL'),
            Text('USD: ${result!.totalUsd.toStringAsFixed(2)}'),
            Text('EUR: ${result!.totalEur.toStringAsFixed(2)}'),
            if (rates != null)
              Text('USD trend: ${rates!.usdTrendPercent.toStringAsFixed(2)}%'),
          ],
        ),
      ),
    );
  }
}

class _ReadmeExportCard extends StatelessWidget {
  final String exportText;

  const _ReadmeExportCard({required this.exportText});

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      tilePadding: const EdgeInsets.symmetric(horizontal: 12),
      title: const Text('README rapor logu'),
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: SelectableText(exportText),
        ),
      ],
    );
  }
}

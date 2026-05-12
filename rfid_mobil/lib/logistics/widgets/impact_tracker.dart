import 'package:flutter/material.dart';

import '../models/logistics_models.dart';

class ImpactTracker extends StatelessWidget {
  final ProducerProfile profile;
  final CarbonCalculationResult? result;

  const ImpactTracker({
    super.key,
    required this.profile,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final hasResult = result != null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Impact Tracker',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _ImpactRow(
              icon: Icons.route,
              title: 'Rota hesaplama',
              value: hasResult
                  ? '${result!.distanceKm.toStringAsFixed(1)} km otomatik bulundu'
                  : 'Manuel mesafe girmeye gerek kalmayacak',
            ),
            _ImpactRow(
              icon: Icons.co2,
              title: 'Emisyon otomasyonu',
              value: hasResult
                  ? '${result!.carbonTon.toStringAsFixed(3)} ton CO2e hesaplandi'
                  : 'Karbon formulu profilinize gore hazir',
            ),
            _ImpactRow(
              icon: Icons.payments,
              title: 'Ihracat gorunurlugu',
              value: hasResult
                  ? '${result!.totalUsd.toStringAsFixed(2)} USD / ${result!.totalEur.toStringAsFixed(2)} EUR'
                  : '${profile.title} icin cift para birimi hazir',
            ),
          ],
        ),
      ),
    );
  }
}

class _ImpactRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _ImpactRow({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(value, style: const TextStyle(color: Colors.black54)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

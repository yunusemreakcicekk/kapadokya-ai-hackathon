import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/logistics_models.dart';
import '../providers/user_provider.dart';

class ProfileOnboardingPage extends StatelessWidget {
  final Widget nextPage;

  const ProfileOnboardingPage({
    super.key,
    required this.nextPage,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 12),
            const Text(
              'Kapadokya Yerel Uretici Profili',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Profil secimi tema renklerini ve lojistik seceneklerini kisilestirir.',
              style: TextStyle(fontSize: 15, color: Colors.black54),
            ),
            const SizedBox(height: 22),
            for (final profile in ProducerProfile.values)
              _ProfileCard(profile: profile, nextPage: nextPage),
          ],
        ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  final ProducerProfile profile;
  final Widget nextPage;

  const _ProfileCard({
    required this.profile,
    required this.nextPage,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(14),
        leading: CircleAvatar(backgroundColor: profile.seedColor),
        title: Text(
          profile.title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(profile.description),
        ),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () {
          context.read<UserProvider>().selectProfile(profile);
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => nextPage),
          );
        },
      ),
    );
  }
}

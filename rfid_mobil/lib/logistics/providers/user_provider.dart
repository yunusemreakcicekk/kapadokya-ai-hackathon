import 'package:flutter/material.dart';

import '../models/logistics_models.dart';

class UserProvider extends ChangeNotifier {
  ProducerProfile? _profile;

  ProducerProfile? get profile => _profile;
  bool get hasProfile => _profile != null;

  List<TransportMode> get allowedModes {
    return _profile?.allowedModes ?? TransportMode.values;
  }

  Color get seedColor => _profile?.seedColor ?? const Color(0xFFB85C38);

  ThemeData get theme {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: seedColor),
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFFF6F6F6),
    );
  }

  void selectProfile(ProducerProfile profile) {
    _profile = profile;
    notifyListeners();
  }
}

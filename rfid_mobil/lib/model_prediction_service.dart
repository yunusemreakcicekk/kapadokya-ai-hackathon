import 'dart:io';
import 'dart:math';

import 'package:flutter/services.dart';
import 'package:pytorch_lite/pytorch_lite.dart';

class ProductPrediction {
  final String label;
  final double confidence;

  const ProductPrediction({
    required this.label,
    required this.confidence,
  });
}

class ModelPredictionService {
  static const String _modelPath = 'assets/models/hackathon_model.ptl';
  static const String _labelPath = 'assets/models/labels.txt';
  static const int _imageSize = 224;

  ClassificationModel? _model;
  List<String>? _labels;

  Future<void> load() async {
    if (_model != null && _labels != null) return;

    _labels = (await rootBundle.loadString(_labelPath))
        .split('\n')
        .map((label) => label.trim())
        .where((label) => label.isNotEmpty)
        .toList();

    _model = await PytorchLite.loadClassificationModel(
      _modelPath,
      _imageSize,
      _imageSize,
      _labels!.length,
      labelPath: _labelPath,
      ensureMatchingNumberOfClasses: false,
    );
  }

  Future<ProductPrediction> predict(File imageFile) async {
    await load();

    final model = _model;
    final labels = _labels;

    if (model == null || labels == null || labels.isEmpty) {
      throw StateError('Model yuklenemedi');
    }

    final imageBytes = await imageFile.readAsBytes();
    final probabilities = await model.getImagePredictionListProbabilities(
      imageBytes,
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
    );

    if (probabilities.isEmpty) {
      final label = await model.getImagePrediction(
        imageBytes,
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
      );
      return ProductPrediction(label: label, confidence: 0);
    }

    var bestIndex = 0;
    var bestScore = probabilities.first;

    for (var i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > bestScore) {
        bestScore = probabilities[i];
        bestIndex = i;
      }
    }

    return ProductPrediction(
      label: labels[min(bestIndex, labels.length - 1)],
      confidence: bestScore,
    );
  }
}

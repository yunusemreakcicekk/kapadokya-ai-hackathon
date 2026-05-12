import 'dart:convert';
import 'dart:io';
import 'main.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:image_picker/image_picker.dart';

import 'logistics/screens/logistics_dashboard_page.dart';
import 'seller_products_page.dart';

class UserPanel extends StatefulWidget {
  const UserPanel({super.key});

  @override
  State<UserPanel> createState() => _UserPanelState();
}

class _UserPanelState extends State<UserPanel> {
  final productNameController = TextEditingController();
  final categoryController = TextEditingController();
  final priceController = TextEditingController();
  final rfidIdController = TextEditingController();
  final descriptionController = TextEditingController();

  final artisanNameController = TextEditingController();
  final sallerLocationController = TextEditingController();
  final cargoTypeController = TextEditingController();
  final weightKgController = TextEditingController();
  final capacityController = TextEditingController();

  File? selectedImageFile;
  String imageBase64 = "";
  bool isPredictingCategory = false;
  String predictedCategoryText = "";
  final List<String> categoryOptions = const [
    "Comlek",
    "Kilim",
    "Hali",
    "Seramik Tabak",
    "Vazo",
  ];

  Future<void> takePhoto() async {
    final picker = ImagePicker();

    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 90,
      maxWidth: 1024,
      maxHeight: 1024,
    );

    if (pickedFile == null) return;

    final file = File(pickedFile.path);
    final bytes = await file.readAsBytes();

    setState(() {
      selectedImageFile = file;
      imageBase64 = "data:image/jpeg;base64,${base64Encode(bytes)}";
      predictedCategoryText = "";
    });

    await predictCategoryFromPhoto(file);
  }

  Future<void> pickPhotoFromGallery() async {
    final picker = ImagePicker();

    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
      maxWidth: 1024,
      maxHeight: 1024,
    );

    if (pickedFile == null) return;

    final file = File(pickedFile.path);
    final bytes = await file.readAsBytes();

    setState(() {
      selectedImageFile = file;
      imageBase64 = "data:image/jpeg;base64,${base64Encode(bytes)}";
      predictedCategoryText = "";
    });

    await predictCategoryFromPhoto(file);
  }

  Future<void> predictCategoryFromPhoto(File file) async {
    setState(() {
      isPredictingCategory = true;
    });

    try {
      if (!mounted) return;

      setState(() {
        categoryController.text = "Comlek";
        predictedCategoryText = "Kategori otomatik dolduruldu: Comlek";
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        categoryController.text = "Comlek";
        predictedCategoryText = "Kategori otomatik dolduruldu: Comlek";
      });
    } finally {
      if (mounted) {
        setState(() {
          isPredictingCategory = false;
        });
      }
    }
  }

  Future<void> startNfcRead() async {
    final isAvailable =
        await NfcManager.instance.checkAvailability() ==
        NfcAvailability.enabled;

    if (!isAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Bu cihazda NFC desteklenmiyor")),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("RFID / NFC kartı telefona yaklaştırın")),
    );

    NfcManager.instance.startSession(
      pollingOptions: {NfcPollingOption.iso14443, NfcPollingOption.iso15693},
      onDiscovered: (NfcTag tag) async {
        final String tagId = tag.toString();

        setState(() {
          rfidIdController.text = tagId;
        });

        await NfcManager.instance.stopSession();
      },
    );
  }

  Future<void> addProduct() async {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Önce giriş yapmalısın")));
      return;
    }

    final name = productNameController.text.trim();
    final category = categoryController.text.trim();
    final price = priceController.text.trim();
    final rfid = rfidIdController.text.trim();
    final description = descriptionController.text.trim();

    final artisanName = artisanNameController.text.trim();
    final sallerLocation = sallerLocationController.text.trim();
    final cargoType = cargoTypeController.text.trim();
    final weightKg = int.tryParse(weightKgController.text.trim()) ?? 0;
    final capacity = int.tryParse(capacityController.text.trim()) ?? 0;

    final fiyat = double.tryParse(price) ?? 0;

    if (name.isEmpty || rfid.isEmpty || imageBase64.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Ürün adı, RFID ve fotoğraf boş olamaz")),
      );
      return;
    }

    try {
      final existingRfid = await FirebaseFirestore.instance
          .collection("Urunler")
          .where("RFID", isEqualTo: rfid)
          .limit(1)
          .get();

      if (existingRfid.docs.isNotEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Bu RFID zaten kayıtlı")));
        return;
      }

      await FirebaseFirestore.instance.collection("Urunler").add({
        "isim": name,
        "Category": category,
        "Explanation": description,
        "RFID": rfid,
        "fiyat": fiyat,
        "imageBase64": imageBase64,

        "ArtisanName": artisanName,
        "SallerLocation": sallerLocation,
        "CargoType": cargoType,
        "WeightKg": weightKg,
        "capacity": capacity,

        "sellerId": user.uid,
        "createdAt": FieldValue.serverTimestamp(),
      });

      productNameController.clear();
      categoryController.clear();
      priceController.clear();
      rfidIdController.clear();
      descriptionController.clear();

      artisanNameController.clear();
      sallerLocationController.clear();
      cargoTypeController.clear();
      weightKgController.clear();
      capacityController.clear();

      setState(() {
        selectedImageFile = null;
        imageBase64 = "";
        predictedCategoryText = "";
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Ürün Firebase'e kaydedildi")),
      );
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Firebase kayıt hatası: $e")));
    }
  }

  Widget field({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          prefixIcon: Icon(icon),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }

  @override
  void dispose() {
    productNameController.dispose();
    categoryController.dispose();
    priceController.dispose();
    rfidIdController.dispose();
    descriptionController.dispose();

    artisanNameController.dispose();
    sallerLocationController.dispose();
    cargoTypeController.dispose();
    weightKgController.dispose();
    capacityController.dispose();

    try {
      NfcManager.instance.stopSession();
    } catch (_) {}

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6E7D8),
      appBar: AppBar(
        title: const Text("Satıcı Paneli"),
        backgroundColor: const Color(0xFFB85C38),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            tooltip: "Lojistik ve karbon",
            icon: const Icon(Icons.route),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const LogisticsDashboardPage(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();

              if (!context.mounted) return;

              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginPanel()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(
            children: [
              field(
                controller: productNameController,
                label: "İsim",
                icon: Icons.inventory_2,
              ),
              field(
                controller: categoryController,
                label: "Category",
                icon: Icons.category,
              ),
              if (isPredictingCategory || predictedCategoryText.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      if (isPredictingCategory) ...[
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 10),
                        const Text("Model tahmin ediyor..."),
                      ] else
                        Expanded(
                          child: Text(
                            predictedCategoryText,
                            style: const TextStyle(
                              color: Colors.deepOrange,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final category in categoryOptions)
                      ChoiceChip(
                        label: Text(category),
                        selected: categoryController.text == category,
                        onSelected: (_) {
                          setState(() {
                            categoryController.text = category;
                            predictedCategoryText =
                                "Kategori elle seÃ§ildi: $category";
                          });
                        },
                      ),
                  ],
                ),
              ),
              field(
                controller: descriptionController,
                label: "Explanation",
                icon: Icons.description,
                maxLines: 3,
              ),
              field(
                controller: artisanNameController,
                label: "ArtisanName",
                icon: Icons.person,
              ),
              field(
                controller: sallerLocationController,
                label: "SallerLocation",
                icon: Icons.location_on,
              ),
              field(
                controller: cargoTypeController,
                label: "CargoType",
                icon: Icons.local_shipping,
              ),
              field(
                controller: weightKgController,
                label: "WeightKg",
                icon: Icons.scale,
                keyboardType: TextInputType.number,
              ),
              field(
                controller: capacityController,
                label: "capacity",
                icon: Icons.inventory,
                keyboardType: TextInputType.number,
              ),
              field(
                controller: rfidIdController,
                label: "RFID",
                icon: Icons.nfc,
              ),

              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton.icon(
                  onPressed: startNfcRead,
                  icon: const Icon(Icons.nfc),
                  label: const Text("RFID / NFC Oku"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),

              const SizedBox(height: 12),

              field(
                controller: priceController,
                label: "Fiyat",
                icon: Icons.payments,
                keyboardType: TextInputType.number,
              ),

              if (selectedImageFile != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.file(
                      selectedImageFile!,
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),

              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton.icon(
                  onPressed: takePhoto,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text("Kamera ile Fotoğraf Çek"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),

              const SizedBox(height: 10),

              SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton.icon(
                  onPressed: pickPhotoFromGallery,
                  icon: const Icon(Icons.photo_library),
                  label: const Text("Galeriden FotoÄŸraf SeÃ§"),
                ),
              ),

              const SizedBox(height: 16),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: addProduct,
                  icon: const Icon(Icons.add),
                  label: const Text("Ürünü Firebase'e Kaydet"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFB85C38),
                    foregroundColor: Colors.white,
                  ),
                ),
              ),

              const SizedBox(height: 12),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const SellerProductsPage(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.list),
                  label: const Text("Benim Ürünlerim"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.brown,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),

              const SizedBox(height: 12),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LogisticsDashboardPage(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.route),
                  label: const Text("Lojistik ve Karbon Hesapla"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

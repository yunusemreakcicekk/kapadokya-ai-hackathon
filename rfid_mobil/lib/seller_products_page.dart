import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:convert';

class SellerProductsPage extends StatelessWidget {
  const SellerProductsPage({super.key});

  Widget productImage(Map<String, dynamic> data) {
    final imageBase64 = data["imageBase64"]?.toString() ?? "";
    final imageUrl = data["imageUrl"]?.toString() ?? "";

    if (imageBase64.isNotEmpty) {
      try {
        final cleanBase64 = imageBase64.contains(",")
            ? imageBase64.split(",").last
            : imageBase64;

        return Image.memory(
          base64Decode(cleanBase64),
          width: 90,
          height: 90,
          fit: BoxFit.cover,
        );
      } catch (e) {
        return const Icon(Icons.error);
      }
    }

    if (imageUrl.startsWith("assets/")) {
      return Image.asset(imageUrl, width: 90, height: 90, fit: BoxFit.cover);
    }

    return Image.network(
      imageUrl,
      width: 90,
      height: 90,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        return Container(
          width: 90,
          height: 90,
          color: Colors.grey.shade300,
          child: const Icon(Icons.image_not_supported),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text("Giriş yapan kullanıcı bulunamadı")),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF6E7D8),
      appBar: AppBar(
        title: const Text("Benim Ürünlerim"),
        backgroundColor: const Color(0xFFB85C38),
        foregroundColor: Colors.white,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection("Urunler")
            .where("sellerId", isEqualTo: user.uid)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text("Hata oluştu: ${snapshot.error}"));
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final products = snapshot.data!.docs;

          if (products.isEmpty) {
            return const Center(
              child: Text(
                "Henüz sana ait ürün yok",
                style: TextStyle(fontSize: 18),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final doc = products[index];
              final data = doc.data() as Map<String, dynamic>;

              final isim = data["isim"] ?? "";
              final category = data["Category"] ?? "";
              final explanation = data["Explanation"] ?? "";
              final rfid = data["RFID"] ?? "";
              final fiyat = data["fiyat"] ?? 0;

              return Card(
                margin: const EdgeInsets.only(bottom: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: productImage(data),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isim,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text("Kategori: $category"),
                            Text("Fiyat: $fiyat TL"),
                            Text("RFID: $rfid"),
                            const SizedBox(height: 4),
                            Text(
                              explanation,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

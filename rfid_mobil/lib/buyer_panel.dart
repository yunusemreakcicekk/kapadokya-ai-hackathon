import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'dart:convert';
import 'main.dart';
import 'lang.dart';
import 'logistics/screens/logistics_dashboard_page.dart';

class BuyerPanel extends StatefulWidget {
  const BuyerPanel({super.key});

  @override
  State<BuyerPanel> createState() => _BuyerPanelState();
}

class _BuyerPanelState extends State<BuyerPanel> {
  int selectedIndex = 0;
  String selectedCategory = "";
  String searchQuery = "";
  final TextEditingController searchController = TextEditingController();

  final List<Map<String, dynamic>> favoriteProducts = [];
  final List<Map<String, dynamic>> cartProducts = [];

  bool isFavorite(Map<String, dynamic> product) {
    return favoriteProducts.any((item) => item["id"] == product["id"]);
  }

  void toggleFavorite(Map<String, dynamic> product) {
    setState(() {
      if (isFavorite(product)) {
        favoriteProducts.removeWhere((item) => item["id"] == product["id"]);
      } else {
        favoriteProducts.add(product);
      }
    });
  }

  void addToCart(Map<String, dynamic> product) {
    setState(() {
      final alreadyInCart = cartProducts.any(
        (item) => item["id"] == product["id"],
      );

      if (!alreadyInCart) {
        cartProducts.add(product);
      }

      selectedIndex = 3;
    });

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text("Ürün sepete eklendi")));
  }

  double get totalPrice {
    double total = 0;

    for (var item in cartProducts) {
      final price = double.tryParse(item["fiyat"].toString()) ?? 0;
      total += price;
    }

    return total;
  }

  void showPaymentDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(Lang.t("paymentTitle")),
          content: Text(
            "${Lang.t("paymentTitle")}: $totalPrice TL\n\n${Lang.t("paymentQuestion")}",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(Lang.t("cancel")),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  cartProducts.clear();
                });

                Navigator.pop(context);

                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(Lang.t("paymentSuccess"))),
                );
              },
              child: Text(Lang.t("pay")),
            ),
          ],
        );
      },
    );
  }

  void openProductDetail(BuildContext context, Map<String, dynamic> data) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            ProductDetailPage(data: data, onAddToCart: () => addToCart(data)),
      ),
    );
  }

  Future<void> startRfidProductSearch() async {
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

        await NfcManager.instance.stopSession();

        QuerySnapshot queryResult = await FirebaseFirestore.instance
            .collection("Urunler")
            .where("RFID", isEqualTo: tagId)
            .limit(1)
            .get();

        if (queryResult.docs.isEmpty) {
          queryResult = await FirebaseFirestore.instance
              .collection("Urunler")
              .where("rfidId", isEqualTo: tagId)
              .limit(1)
              .get();
        }

        if (!mounted) return;

        if (queryResult.docs.isEmpty) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text("Ürün bulunamadı")));
          return;
        }

        final doc = queryResult.docs.first;
        final data = doc.data() as Map<String, dynamic>;
        data["id"] = doc.id;

        openProductDetail(context, data);
      },
    );
  }

  void showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Dil Seç"),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Lang.current == "tr"
                    ? const Icon(Icons.check, color: Colors.green)
                    : const SizedBox(width: 24),
                title: const Text("Türkçe"),
                onTap: () {
                  setState(() {
                    Lang.current = "tr";
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Lang.current == "en"
                    ? const Icon(Icons.check, color: Colors.green)
                    : const SizedBox(width: 24),
                title: const Text("English"),
                onTap: () {
                  setState(() {
                    Lang.current = "en";
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget buildHomePage() {
    final stream = FirebaseFirestore.instance.collection("Urunler").snapshots();
    final categories = ["Kilim", "Hali", "Comlek", "Vazo", "Seramik Tabak"];

    return Column(
      children: [
        SizedBox(
          height: 58,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(10),
            children: [
              CategoryChip(
                title: "Tümü",
                selected: selectedCategory.isEmpty,
                onTap: () {
                  setState(() {
                    selectedCategory = "";
                  });
                },
              ),
              for (final category in categories)
                CategoryChip(
                  title: category,
                  selected: selectedCategory == category,
                  onTap: () {
                    setState(() {
                      selectedCategory = category;
                    });
                  },
                ),
            ],
          ),
        ),
        Container(
          margin: const EdgeInsets.all(14),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFB85C38), Color(0xFFE0A458)],
            ),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            children: [
              const Icon(Icons.storefront, color: Colors.white, size: 48),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  Lang.t("discover"),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: stream,
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return Center(child: Text(Lang.t("productsError")));
              }

              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              final docs = snapshot.data!.docs.where((doc) {
                final data = doc.data() as Map<String, dynamic>;
                final name = data["isim"]?.toString().toLowerCase() ?? "";
                final category =
                    data["kategori"]?.toString() ??
                    data["Category"]?.toString() ??
                    "";
                final normalizedCategory = _normalizeFilterText(category);
                final selected = _normalizeFilterText(selectedCategory);
                final query = _normalizeFilterText(searchQuery);
                final normalizedName = _normalizeFilterText(name);

                final matchesCategory =
                    selected.isEmpty ||
                    normalizedCategory == selected ||
                    normalizedCategory.contains(selected) ||
                    selected.contains(normalizedCategory);
                final matchesSearch =
                    query.isEmpty || normalizedName.contains(query);

                return matchesCategory && matchesSearch;
              }).toList();

              if (docs.isEmpty) {
                return Center(child: Text(Lang.t("noProduct")));
              }

              return GridView.builder(
                padding: const EdgeInsets.all(14),
                itemCount: docs.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.58,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemBuilder: (context, index) {
                  final data = docs[index].data() as Map<String, dynamic>;
                  data["id"] = docs[index].id;

                  return ProductCard(
                    data: data,
                    isFavorite: isFavorite(data),
                    onFavoriteTap: () => toggleFavorite(data),
                    onAddToCart: () => addToCart(data),
                    onTap: () => openProductDetail(context, data),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget buildRfidPage() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.nfc, size: 90, color: Colors.orange),
            const SizedBox(height: 20),
            const Text(
              "RFID / NFC Ürün Okuma",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              "Kartı telefona yaklaştır. Ürün Firebase'de kayıtlıysa detay sayfası açılır.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: startRfidProductSearch,
                icon: const Icon(Icons.nfc),
                label: const Text("RFID / NFC Oku"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildFavoritesPage() {
    if (favoriteProducts.isEmpty) {
      return Center(child: Text(Lang.t("noFavorite")));
    }

    return GridView.builder(
      padding: const EdgeInsets.all(14),
      itemCount: favoriteProducts.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.58,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemBuilder: (context, index) {
        final data = favoriteProducts[index];

        return ProductCard(
          data: data,
          isFavorite: true,
          onFavoriteTap: () => toggleFavorite(data),
          onAddToCart: () => addToCart(data),
          onTap: () => openProductDetail(context, data),
        );
      },
    );
  }

  Widget cartImage(Map<String, dynamic> data) {
    final imageBase64 = data["imageBase64"]?.toString() ?? "";

    if (imageBase64.isNotEmpty && !imageBase64.startsWith("http")) {
      try {
        final cleanBase64 = imageBase64.contains(",")
            ? imageBase64.split(",").last
            : imageBase64;

        return Image.memory(
          base64Decode(cleanBase64),
          width: 80,
          height: 80,
          fit: BoxFit.cover,
        );
      } catch (_) {}
    }

    return Container(
      width: 80,
      height: 80,
      color: Colors.grey.shade300,
      child: const Icon(Icons.image_not_supported),
    );
  }

  Widget buildPaymentPage() {
    if (cartProducts.isEmpty) {
      return const Center(
        child: Text(
          "Sepet boş",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(14),
            itemCount: cartProducts.length,
            itemBuilder: (context, index) {
              final product = cartProducts[index];

              final name = product["isim"]?.toString() ?? "";
              final category =
                  product["kategori"]?.toString() ??
                  product["Category"]?.toString() ??
                  "";
              final price = product["fiyat"]?.toString() ?? "";

              return Card(
                margin: const EdgeInsets.only(bottom: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: cartImage(product),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text("Kategori: $category"),
                            const SizedBox(height: 6),
                            Text(
                              "$price TL",
                              style: const TextStyle(
                                fontSize: 18,
                                color: Colors.deepOrange,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () {
                          setState(() {
                            cartProducts.removeAt(index);
                          });
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Toplam",
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "$totalPrice TL",
                    style: const TextStyle(
                      fontSize: 22,
                      color: Colors.deepOrange,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: showPaymentDialog,
                  icon: const Icon(Icons.payment),
                  label: const Text("Ödemeye Geç"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget paymentBox({required String title, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget radioRow(String text, bool selected, {String? price}) {
    return Row(
      children: [
        Icon(
          selected ? Icons.radio_button_checked : Icons.radio_button_off,
          color: selected ? Colors.orange : Colors.grey,
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 16))),
        if (price != null)
          Text(
            price,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
      ],
    );
  }

  Widget checkRow(String text, bool checked) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            checked ? Icons.check_box : Icons.check_box_outline_blank,
            color: checked ? Colors.orange : Colors.grey,
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 15))),
        ],
      ),
    );
  }

  Widget inputBox(String label, String hint) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          filled: true,
          fillColor: const Color(0xFFF7F7F7),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }

  Widget buildAccountPage() {
    final user = FirebaseAuth.instance.currentUser;
    final email = user?.email ?? "mail@example.com";
    final name = email.contains("@") ? email.split("@").first : "guestUser";

    return Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        children: [
          const CircleAvatar(
            radius: 48,
            backgroundColor: Colors.orange,
            child: Icon(Icons.person, size: 58, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            Lang.t("userAccount"),
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Card(
            child: ListTile(
              leading: const Icon(Icons.language),
              title: const Text("Dil Seç"),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: showLanguageDialog,
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.person),
              title: const Text("Name Surname"),
              subtitle: Text(name),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.email),
              title: const Text("Email"),
              subtitle: Text(email),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.history),
              title: Text(Lang.t("orderHistory")),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text("Sipariş geçmişi yakında eklenecek"),
                  ),
                );
              },
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text("Logout"),
              onTap: () async {
                await FirebaseAuth.instance.signOut();

                if (!mounted) return;

                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginPanel()),
                  (route) => false,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget buildPage() {
    if (selectedIndex == 0) return buildHomePage();
    if (selectedIndex == 1) return buildRfidPage();
    if (selectedIndex == 2) return buildFavoritesPage();
    if (selectedIndex == 3) return buildPaymentPage();
    if (selectedIndex == 4) return buildAccountPage();
    if (selectedIndex == 5) return const LogisticsDashboardPage();

    return Center(child: Text(Lang.t("prepared")));
  }

  String _normalizeFilterText(String value) {
    return value
        .toLowerCase()
        .replaceAll("ç", "c")
        .replaceAll("ğ", "g")
        .replaceAll("ı", "i")
        .replaceAll("ö", "o")
        .replaceAll("ş", "s")
        .replaceAll("ü", "u")
        .replaceAll("ä±", "i")
        .replaceAll("ã§", "c")
        .replaceAll("ã¶", "o")
        .replaceAll("åÿ", "s")
        .replaceAll("ã¼", "u");
  }

  @override
  void dispose() {
    searchController.dispose();

    try {
      NfcManager.instance.stopSession();
    } catch (_) {}

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F6F6),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F1F1),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              const Icon(Icons.search, color: Colors.orange),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: searchController,
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    hintText: Lang.t("search"),
                    isDense: true,
                  ),
                  onChanged: (value) {
                    setState(() {
                      searchQuery = value;
                    });
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      body: buildPage(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: selectedIndex,
        onTap: (index) {
          setState(() {
            selectedIndex = index;
          });
        },
        selectedItemColor: Colors.orange,
        unselectedItemColor: Colors.black54,
        type: BottomNavigationBarType.fixed,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home),
            label: Lang.t("home"),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.nfc),
            label: Lang.t("rfid"),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.favorite_border),
            label: Lang.t("favorites"),
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart),
            label: "Sepet",
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person),
            label: Lang.t("account"),
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.route),
            label: "Lojistik",
          ),
        ],
      ),
    );
  }
}

class CategoryChip extends StatelessWidget {
  final String title;
  final bool selected;
  final VoidCallback? onTap;

  const CategoryChip({
    super.key,
    required this.title,
    this.selected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: selected ? Colors.orange : Colors.white,
          borderRadius: BorderRadius.circular(22),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(color: selected ? Colors.white : Colors.black),
        ),
      ),
    );
  }

  String _normalizeFilterText(String value) {
    return value
        .toLowerCase()
        .replaceAll("ç", "c")
        .replaceAll("ğ", "g")
        .replaceAll("ı", "i")
        .replaceAll("ö", "o")
        .replaceAll("ş", "s")
        .replaceAll("ü", "u")
        .replaceAll("ä±", "i")
        .replaceAll("ã§", "c")
        .replaceAll("ã¶", "o")
        .replaceAll("åŸ", "s")
        .replaceAll("ã¼", "u");
  }
}

String fixGoogleDriveImageUrl(String imageUrl) {
  if (imageUrl.isEmpty) return imageUrl;

  if (!imageUrl.contains("drive.google.com")) {
    return imageUrl;
  }

  final uri = Uri.tryParse(imageUrl);

  if (uri == null) {
    return imageUrl;
  }

  String? fileId;

  if (uri.pathSegments.contains("d")) {
    final index = uri.pathSegments.indexOf("d");
    if (index + 1 < uri.pathSegments.length) {
      fileId = uri.pathSegments[index + 1];
    }
  }

  fileId ??= uri.queryParameters["id"];

  if (fileId == null || fileId.isEmpty) {
    return imageUrl;
  }

  return "https://drive.google.com/uc?export=view&id=$fileId";
}

class ProductCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final bool isFavorite;
  final VoidCallback onFavoriteTap;
  final VoidCallback onAddToCart;
  final VoidCallback onTap;

  const ProductCard({
    super.key,
    required this.data,
    required this.isFavorite,
    required this.onFavoriteTap,
    required this.onAddToCart,
    required this.onTap,
  });
  Widget productImage(Map<String, dynamic> data) {
    final imageBase64 = data["imageBase64"]?.toString() ?? "";

    if (imageBase64.isNotEmpty && !imageBase64.startsWith("http")) {
      try {
        final cleanBase64 = imageBase64.contains(",")
            ? imageBase64.split(",").last
            : imageBase64;

        return Image.memory(
          base64Decode(cleanBase64),
          height: 150,
          width: double.infinity,
          fit: BoxFit.cover,
        );
      } catch (e) {
        return fallback();
      }
    }

    return fallback();
  }

  Widget fallback() {
    return Image.asset(
      "assets/vase.jpg",
      height: 150,
      width: double.infinity,
      fit: BoxFit.cover,
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = data["isim"]?.toString() ?? "";
    final category =
        data["kategori"]?.toString() ?? data["Category"]?.toString() ?? "";
    final price = data["fiyat"]?.toString() ?? "";

    String imageUrl = data["imageUrl"]?.toString() ?? "";

    if (imageUrl.isEmpty) {
      imageUrl = "assets/vase.jpg";
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(14),
                  ),
                  child: productImage(data),
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      category,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: onFavoriteTap,
                    child: CircleAvatar(
                      backgroundColor: Colors.white,
                      child: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? Colors.red : Colors.black87,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 5),
                  Text(
                    "$price TL",
                    style: const TextStyle(
                      color: Colors.deepOrange,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: double.infinity,
                    height: 34,
                    child: ElevatedButton(
                      onPressed: onAddToCart,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.zero,
                      ),
                      child: const Text("Sepete Ekle"),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProductDetailPage extends StatelessWidget {
  final Map<String, dynamic> data;
  final VoidCallback onAddToCart;

  const ProductDetailPage({
    super.key,
    required this.data,
    required this.onAddToCart,
  });

  Widget imageWidget(Map<String, dynamic> data) {
    final imageBase64 = data["imageBase64"]?.toString() ?? "";

    if (imageBase64.isNotEmpty && !imageBase64.startsWith("http")) {
      try {
        final cleanBase64 = imageBase64.contains(",")
            ? imageBase64.split(",").last
            : imageBase64;

        return Image.memory(
          base64Decode(cleanBase64),
          width: double.infinity,
          height: 280,
          fit: BoxFit.cover,
        );
      } catch (_) {}
    }

    return Container(
      width: double.infinity,
      height: 280,
      color: const Color(0xFFF1F1F1),
      child: const Icon(Icons.image_not_supported, size: 60),
    );
  }

  Widget infoBox({
    required IconData icon,
    required String title,
    required String text,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.orange.shade100),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.deepOrange),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(text),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget storyBox({required String title, required String text}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F5F1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.brown.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.brown,
            ),
          ),
          const SizedBox(height: 10),
          Text(text, style: const TextStyle(fontSize: 15, height: 1.5)),
        ],
      ),
    );
  }

  Widget infoSmallBox({
    required IconData icon,
    required String title,
    required String text,
  }) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.orange.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.deepOrange, size: 20),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(text, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = data["isim"]?.toString() ?? "";
    final category =
        data["kategori"]?.toString() ?? data["Category"]?.toString() ?? "";
    final price = data["fiyat"]?.toString() ?? "";
    final description =
        data["aciklama"]?.toString() ?? data["Explanation"]?.toString() ?? "";
    final video = data["videoUrl"]?.toString() ?? "";

    return Scaffold(
      backgroundColor: const Color(0xFFF6F6F6),
      appBar: AppBar(
        title: Text(name),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            imageWidget(data),
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(14),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      category.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    "$price TL",
                    style: const TextStyle(
                      fontSize: 28,
                      color: Colors.deepOrange,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  infoBox(
                    icon: Icons.workspace_premium,
                    title: "Kültürel Miras Bilgilendirmesi",
                    text: description,
                  ),
                  Text(description),

                  storyBox(
                    title: "Ürünün Hikayesi",
                    text:
                        data["hikaye"]?.toString() ??
                        "Bu ürün geleneksel yöntemlerle üretilmiştir.",
                  ),

                  storyBox(
                    title: "Kapadokya ile Bağlantısı",
                    text:
                        data["baglanti"]?.toString() ??
                        "Kapadokya bölgesinin kültürel mirasını yansıtır.",
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: infoSmallBox(
                          icon: Icons.person_outline,
                          title: "Üreten Kişi",
                          text: data["ArtisanName"]?.toString() ?? "",
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: infoSmallBox(
                          icon: Icons.location_on_outlined,
                          title: "Üretim Yeri",
                          text: data["SallerLocation"]?.toString() ?? "",
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: infoSmallBox(
                          icon: Icons.local_shipping_outlined,
                          title: "Kargo Tipi",
                          text: data["CargoType"]?.toString() ?? "",
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: infoSmallBox(
                          icon: Icons.inventory_2_outlined,
                          title: "Ürün Bilgisi",
                          text:
                              "Ağırlık: ${data["WeightKg"]?.toString() ?? ""} kg / Kapasite: ${data["capacity"]?.toString() ?? ""}",
                        ),
                      ),
                    ],
                  ),
                  if (video.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    infoBox(
                      icon: Icons.video_library_outlined,
                      title: Lang.t("videoInfo"),
                      text: video,
                    ),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        onAddToCart();
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.shopping_cart),
                      label: const Text("Sepete Ekle"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

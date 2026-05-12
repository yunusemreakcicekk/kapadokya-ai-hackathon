class Product {
  final String name;
  final String category;
  final String price;
  final String rfidId;
  final String description;
  final String videoUrl;
  final String imageUrl;

  Product({
    required this.name,
    required this.category,
    required this.price,
    required this.rfidId,
    required this.description,
    required this.videoUrl,
    required this.imageUrl,
  });
}

class ProductStore {
  static final List<Product> products = [
    Product(
      name: "El Dokuma Kilim",
      category: "Kilim",
      price: "850 TL",
      rfidId: "RFID001",
      description: "Nevşehir yöresel el dokuma kilim.",
      videoUrl: "",
      imageUrl: "assets/scatter rug.jpeg",
    ),
    Product(
      name: "Nevşehir Halısı",
      category: "Halı",
      price: "1250 TL",
      rfidId: "RFID002",
      description: "Yöresel motifli Nevşehir halısı.",
      videoUrl: "",
      imageUrl: "assets/rug.jpeg",
    ),
    Product(
      name: "Avanos Çömlek",
      category: "Çömlek",
      price: "320 TL",
      rfidId: "RFID003",
      description: "Avanos el yapımı çömlek.",
      videoUrl: "",
      imageUrl: "assets/Pot.jpg",
    ),
    Product(
      name: "Dekoratif Vazo",
      category: "Vazo",
      price: "430 TL",
      rfidId: "RFID004",
      description: "Dekoratif yöresel vazo.",
      videoUrl: "",
      imageUrl: "assets/vase.jpg",
    ),
    Product(
      name: "Seramik Tabak",
      category: "Seramik Tabak",
      price: "275 TL",
      rfidId: "RFID005",
      description: "El yapımı seramik tabak.",
      videoUrl: "",
      imageUrl: "assets/bowl.jpeg",
    ),
  ];

  static void addProduct(Product product) {
    products.add(product);
  }
}

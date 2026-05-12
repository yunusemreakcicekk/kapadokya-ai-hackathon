class Lang {
  static String current = "tr";

  static final Map<String, Map<String, String>> words = {
    "tr": {
      "home": "Anasayfa",
      "favorites": "Favorilerim",
      "payment": "Ödeme",
      "account": "Hesap",
      "addToCart": "Sepete Ekle",
      "emptyCart": "Sepetiniz boş",
      "language": "Dil Seç",
      "turkish": "Türkçe",
      "english": "İngilizce",

      // 🔥 LOGIN
      "login": "Giriş Yap",
      "username": "Kullanıcı Adı",
      "password": "Şifre",
      "loginError": "Kullanıcı adı veya şifre hatalı",

      // 🔥 KATEGORİLER
      "rug": "Kilim",
      "carpet": "Halı",
      "pottery": "Çömlek",
      "vase": "Vazo",
      "ceramicPlate": "Seramik Tabak",
      "selectLanguage": "Dil Seç",
    },

    "en": {
      "home": "Home",
      "favorites": "Favorites",
      "payment": "Payment",
      "account": "Account",
      "addToCart": "Add to Cart",
      "emptyCart": "Your cart is empty",
      "language": "Select Language",
      "turkish": "Turkish",
      "english": "English",

      // 🔥 LOGIN
      "login": "Login",
      "username": "Username",
      "password": "Password",
      "loginError": "Username or password is incorrect",

      // 🔥 KATEGORİLER
      "rug": "Rug",
      "carpet": "Carpet",
      "pottery": "Pottery",
      "vase": "Vase",
      "ceramicPlate": "Ceramic Plate",
      "selectLanguage": "Select Language",
    },
  };

  static String t(String key) {
    return words[current]?[key] ?? key;
  }
}

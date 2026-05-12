import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata = {
  title: "Kapadokya El Sanatları | Premium Geleneksel El İşi Ürünler",
  description: "Kapadokya'nın binlerce yıllık el sanatları geleneğini keşfedin. Avanos çömlekçiliği, el dokuma halılar, seramikler ve daha fazlası. RFID destekli dijital ürün deneyimi.",
  keywords: "Kapadokya, el sanatları, çömlek, seramik, halı, vazo, testi, RFID, geleneksel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
        <AuthProvider>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

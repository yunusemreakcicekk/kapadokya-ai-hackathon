// src/services/geoService.js

/**
 * Coğrafi konum, mesafe hesaplama ve adres geocoding servisi.
 * Hackathon kısıtları: Sadece OpenStreetMap, Nominatim, OpenRouteService veya Overpass API kullanılabilir.
 */

// Demo/Mock Fallback verileri
const MOCK_LOCATIONS = {
  'Avanos': { lat: 38.7183, lng: 34.8471 },
  'Ürgüp': { lat: 38.6315, lng: 34.9126 },
  'Göreme': { lat: 38.6433, lng: 34.8291 },
  'Nevşehir': { lat: 38.6247, lng: 34.7142 },
  'İstanbul': { lat: 41.0082, lng: 28.9784 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Berlin': { lat: 52.5200, lng: 13.4050 }
};

class GeoService {
  /**
   * Adresi koordinata çevir (Geocode)
   * Demo amacıyla önbellekteki yerleri kullanır, bulunamazsa Nominatim'e yönlendirilebilir bir yapı.
   */
  async geocodeAddress(address) {
    if (!address) return { ...MOCK_LOCATIONS['Avanos'], isReal: false };

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          isReal: true
        };
      }
    } catch (e) {
      console.warn("Nominatim error, falling back to mock:", e);
    }

    // Demo mock fallback
    for (const [key, coords] of Object.entries(MOCK_LOCATIONS)) {
      if (address.toLowerCase().includes(key.toLowerCase())) {
        return { ...coords, isReal: false };
      }
    }
    
    // Default fallback
    return { ...MOCK_LOCATIONS['İstanbul'], isReal: false };
    
    /* Gerçek kullanım örneği (Nominatim):
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error('Geocoding error', e);
    }
    */
  }

  /**
   * Haversine formülü ile iki nokta arası tahmini kuş uçuşu mesafeyi hesaplar.
   * Rota mesafesi için kuş uçuşu mesafeye ~%20-30 civarı eklenerek yaklaşık karayolu mesafesi bulunur.
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Kuş uçuşu mesafe
    
    return d * 1.25; // Yaklaşık rota/yol mesafesi katsayısı
  }

  /**
   * Üretim yeri ile teslimat yeri arasındaki mesafeyi hesaplar
   */
  async getRouteDistance(originCoords, destCoords) {
    if (!originCoords || !destCoords) return null;
    
    try {
      const res = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: originCoords, dest: destCoords })
      });
      
      if (res.ok) {
        const data = await res.json();
        return data; // { distanceKm, geometry }
      }
    } catch (e) {
      console.warn('Routing error via API, falling back to Haversine', e);
    }
    
    // Fallback
    const distance = this.calculateHaversineDistance(
      originCoords.lat, originCoords.lng,
      destCoords.lat, destCoords.lng
    );
    return { distanceKm: Math.round(distance), geometry: null };
  }

  /**
   * Origin ve Destination bilgisini alarak harita için rota bilgilerini döner.
   */
  async getDeliveryRoute(originStr, destStr) {
    const origin = await this.geocodeAddress(originStr);
    const dest = await this.geocodeAddress(destStr);
    
    const routeData = await this.getRouteDistance(origin, dest);
    let distanceKm = routeData ? routeData.distanceKm : 730;
    const geometry = routeData ? routeData.geometry : null;
    
    // Fallback if 0
    if (distanceKm === 0) distanceKm = 730;

    const isDemo = !(origin.isReal && dest.isReal) || !geometry;

    return {
      origin,
      dest,
      distanceKm,
      geometry, // Eklendi: Rota çizgisi koordinatları
      dataSource: !geometry ? 'Mock Fallback (Haversine)' : 'OpenRouteService / Nominatim',
      isDemo
    };
  }
}

export const geoService = new GeoService();

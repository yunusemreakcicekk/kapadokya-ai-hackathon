// src/services/carbonService.js

/**
 * Taşıma kaynaklı karbon ayak izini hesaplama servisi.
 */

class CarbonService {
  // Hackathon kısıtları doğrultusunda belirlenmiş emisyon faktörleri (kg CO₂ / ton-km)
  EMISSION_FACTORS = {
    'Hava Kargo': 0.500,
    'Deniz Yolu': 0.015,
    'Kara (TIR)': 0.100,
    'Demiryolu': 0.030
  };

  /**
   * Taşıma moduna göre emisyon faktörünü getir.
   */
  getEmissionFactor(transportMode) {
    return this.EMISSION_FACTORS[transportMode] || this.EMISSION_FACTORS['Kara (TIR)'];
  }

  /**
   * Mesafe, ürün ağırlığı ve taşıma moduna göre karbon salınımını hesaplar.
   * @param {number} distanceKm - Rota mesafesi (km)
   * @param {number} weightKg - Ürün ağırlığı (kg)
   * @param {string} transportMode - Taşıma modu ('Hava Kargo', 'Deniz Yolu', vb.)
   * @returns {number} Karbon ayak izi (kg CO₂)
   */
  calculateCarbonFootprint(distanceKm, weightKg, transportMode) {
    if (!distanceKm || !weightKg || !transportMode) return 0;
    
    const weightTon = weightKg / 1000;
    const emissionFactor = this.getEmissionFactor(transportMode);
    
    // Formül: Karbon Salınımı = Mesafe(km) x Ürün Ağırlığı(ton) x Emisyon Faktörü
    const footprint = distanceKm * weightTon * emissionFactor;
    
    // Formatlama (3 ondalık)
    return parseFloat(footprint.toFixed(3));
  }
}

export const carbonService = new CarbonService();

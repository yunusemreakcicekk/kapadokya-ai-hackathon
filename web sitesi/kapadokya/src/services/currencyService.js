// src/services/currencyService.js

/**
 * Canlı döviz kurlarını TCMB EVDS API üzerinden çeken ve çeviren servis.
 */

const SERIES_MAP = {
  USD: 'TP.DK.USD.S.YTL',
  EUR: 'TP.DK.EUR.S.YTL',
  GBP: 'TP.DK.GBP.S.YTL'
};

const MOCK_RATES = {
  TRY: 1,
  USD: 32.55,
  EUR: 35.20,
  GBP: 41.15
};

class CurrencyService {
  constructor() {
    this.cache = {}; // Cache results to prevent multiple API calls
  }

  /**
   * Kurları EVDS API üzerinden getirir.
   */
  async getExchangeRate(currency, forceRefresh = false) {
    if (currency === 'TRY') {
      return {
        currency: 'TRY',
        rate: 1,
        source: 'TCMB EVDS',
        seriesCode: null,
        lastUpdated: new Date().toLocaleDateString('tr-TR'),
        isDemo: false
      };
    }

    if (!forceRefresh && this.cache[currency]) {
      return this.cache[currency];
    }

    const seriesCode = SERIES_MAP[currency];

    try {
      // Call the Next.js API route to protect EVDS_API_KEY
      const res = await fetch(`/api/currency?currency=${currency}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch from EVDS proxy');
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      this.cache[currency] = data;
      return data;
      
    } catch (e) {
      // Sadece geliştirici konsolunda uyarı olarak göster, kırmızı Next.js overlay çıkarmaması için console.error yerine warn kullanıyoruz.
      console.warn(`EVDS API proxy yanıt vermedi (${currency}). Demo kurlara geçiliyor.`);
      // Demo Fallback
      return {
        currency,
        rate: MOCK_RATES[currency] || 1,
        source: "TCMB EVDS Demo Fallback",
        seriesCode,
        lastUpdated: new Date().toLocaleDateString('tr-TR'),
        isDemo: true
      };
    }
  }

  /**
   * TRY fiyatı istenen para birimine çevirir.
   */
  async convertTRYPrice(amountTRY, currency, forceRefresh = false) {
    if (currency === 'TRY') {
      return {
        amountTRY,
        currency,
        rate: 1,
        convertedPrice: amountTRY,
        source: 'TCMB EVDS',
        seriesCode: null,
        lastUpdated: new Date().toLocaleDateString('tr-TR'),
        isDemo: false
      };
    }

    const rateData = await this.getExchangeRate(currency, forceRefresh);
    const convertedPrice = amountTRY / rateData.rate;

    return {
      amountTRY,
      currency,
      rate: rateData.rate,
      convertedPrice,
      source: rateData.source,
      seriesCode: rateData.seriesCode,
      lastUpdated: rateData.lastUpdated,
      isDemo: rateData.isDemo
    };
  }

  // Geriye dönük uyumluluk için (eski senkron çağıran kodları bozmamak adına)
  getSourceInfo() {
    return {
      source: 'TCMB EVDS',
      lastUpdated: new Date().toISOString()
    };
  }
}

export const currencyService = new CurrencyService();

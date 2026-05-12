'use client';
import { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { geoService } from '../../services/geoService';
import { carbonService } from '../../services/carbonService';
import { useLanguage } from '../../context/LanguageContext';
import CarbonRoutePanel from './CarbonRoutePanel';

const COUNTRY_CITIES = {
  "Türkiye": ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Nevşehir"],
  "Rusya Federasyonu": ["Moskova", "St. Petersburg", "Kazan", "Novosibirsk", "Soçi"],
  "Polonya": ["Varşova", "Krakow", "Wroclaw", "Poznan", "Gdansk"],
  "Ukrayna": ["Kiev", "Lviv", "Odessa", "Kharkiv", "Dnipro"],
  "Almanya": ["Berlin", "Münih", "Frankfurt", "Hamburg", "Köln"],
  "Irak": ["Bağdat", "Erbil", "Basra", "Musul", "Necef"],
  "Romanya": ["Bükreş", "Kaloşvar", "Timișoara", "Yaş", "Köstence"],
  "Bulgaristan": ["Sofya", "Filibe", "Varna", "Burgaz", "Rusçuk"],
  "İtalya": ["Roma", "Milano", "Venedik", "Floransa", "Napoli"],
  "Fransa": ["Paris", "Marsilya", "Lyon", "Toulouse", "Nice"]
};

export default function DeliveryLocationSelector({ 
  onCalculate, 
  productWeight = 1.8, 
  productionLocation = 'Avanos' 
}) {
  const [country, setCountry] = useState('Türkiye');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [transportMode, setTransportMode] = useState('Kara (TIR)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const { t } = useLanguage();

  const isSeaRouteAvailable = country !== 'Türkiye';

  useEffect(() => {
    if (!isSeaRouteAvailable && transportMode === 'Deniz Yolu') {
      setTransportMode('Kara (TIR)');
    }
  }, [isSeaRouteAvailable, transportMode]);

  const handleCalculate = async () => {
    if (!country || !city) {
      setError(t('delivery.fillError'));
      return;
    }
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const fullAddress = district ? `${district}, ${city}, ${country}` : `${city}, ${country}`;
      const route = await geoService.getDeliveryRoute(productionLocation, fullAddress);
      const carbon = carbonService.calculateCarbonFootprint(route.distanceKm, productWeight, transportMode);

      // Store route data for the carbon panel
      setRouteData({
        ...route,
        originStr: productionLocation,
        destStr: fullAddress,
        isSeaRouteAvailable,
      });

      if (onCalculate) {
        onCalculate(
          {
            fullAddress,
            country,
            city,
            district,
            ...route
          }, 
          carbon, 
          transportMode, 
          route.isDemo
        );
        
        setResults({
          distanceKm: route.distanceKm,
          carbonFootprint: carbon,
          transportMode
        });
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(t('delivery.calcError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C65A2E]/20 mb-6">
      <h3 className="text-lg font-bold text-[#3E2A1F] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
        <MapPin className="text-[#C65A2E]" size={20} />
        {t('delivery.title')}
      </h3>
      
      {error && <p className="text-xs text-red-500 mb-3 font-medium bg-red-50 p-2 rounded border border-red-100">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-[#5A3E2B] mb-1">{t('delivery.country')}</label>
          <input 
            type="text" 
            value={country} 
            onChange={e => {
              setCountry(e.target.value);
              setCity('');
            }}
            list="countries"
            className="w-full bg-[#F5E6D3]/30 border border-[#C65A2E]/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C65A2E]"
          />
          <datalist id="countries">
            {Object.keys(COUNTRY_CITIES).map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#5A3E2B] mb-1">{t('delivery.city')}</label>
          <input 
            type="text" 
            value={city} 
            onChange={e => setCity(e.target.value)}
            list="cities"
            placeholder="Örn: İstanbul"
            className="w-full bg-[#F5E6D3]/30 border border-[#C65A2E]/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C65A2E]"
          />
          <datalist id="cities">
            {(COUNTRY_CITIES[country] || []).map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[#5A3E2B] mb-1">{t('delivery.district')}</label>
          <input 
            type="text" 
            value={district} 
            onChange={e => setDistrict(e.target.value)}
            placeholder="Örn: Kadıköy"
            className="w-full bg-[#F5E6D3]/30 border border-[#C65A2E]/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C65A2E]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[#5A3E2B] mb-1">{t('delivery.transportMode')}</label>
          <select 
            value={transportMode} 
            onChange={e => setTransportMode(e.target.value)}
            className="w-full bg-[#F5E6D3]/30 border border-[#C65A2E]/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C65A2E]"
          >
            <option value="Kara (TIR)">Kara (TIR)</option>
            <option value="Demiryolu">Demiryolu</option>
            <option value="Hava Kargo">Hava Kargo</option>
            {isSeaRouteAvailable && <option value="Deniz Yolu">Deniz Yolu</option>}
          </select>
        </div>
      </div>
      
      <button 
        onClick={handleCalculate}
        disabled={loading}
        className="w-full bg-[#C65A2E] hover:bg-[#A04520] text-white rounded-xl py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Search size={16} />
            {t('delivery.calculateBtn')}
          </>
        )}
      </button>

      {success && results && (
        <div className="mt-6 p-4 bg-[#F5E6D3]/50 rounded-xl border border-[#C65A2E]/30 animate-fade-in">
          <h4 className="font-bold text-[#3E2A1F] mb-3 text-sm flex items-center gap-2">
            ✅ {t('delivery.resultTitle')}
          </h4>
          <table className="w-full text-sm text-left">
            <tbody>
              <tr className="border-b border-[#C65A2E]/10">
                <td className="py-2 text-[#5A3E2B]">{t('delivery.estDistance')}</td>
                <td className="py-2 font-bold text-[#C65A2E] text-right">{results.distanceKm} km</td>
              </tr>
              <tr className="border-b border-[#C65A2E]/10">
                <td className="py-2 text-[#5A3E2B]">{t('delivery.transportMode')}</td>
                <td className="py-2 font-bold text-[#C65A2E] text-right">{results.transportMode}</td>
              </tr>
              <tr>
                <td className="py-2 text-[#5A3E2B]">{t('delivery.carbonFootprint')}</td>
                <td className="py-2 font-bold text-[#C65A2E] text-right">{results.carbonFootprint} kg CO₂</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Animated Carbon Route Panel - Opens below the button after calculation */}
      {routeData && (
        <CarbonRoutePanel
          routeData={routeData}
          productWeight={productWeight}
          selectedMode={transportMode}
        />
      )}
    </div>
  );
}

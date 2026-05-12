'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { rfidService } from '../../services/rfidService';
import { geoService } from '../../services/geoService';
import { carbonService } from '../../services/carbonService';
import { currencyService } from '../../services/currencyService';
import { formatPrice, formatDate, formatTime } from '../../utils/formatters';
import DeliveryLocationSelector from '../../components/delivery/DeliveryLocationSelector';
import { Wifi, Search, CreditCard, Package, User, Calendar, Clock, Hash, ArrowRight, AlertCircle, CheckCircle, Loader2, DollarSign, Route, Leaf, MapPin, Truck } from 'lucide-react';

const DEMO_CARDS = [
  { id: 'rfid-001', label: 'Demo Kart 1 — Kırmızı Kil Vazo' },
  { id: 'rfid-002', label: 'Demo Kart 2 — Seramik Tabak' },
  { id: 'rfid-003', label: 'Demo Kart 3 — Kapadokya Testi' },
];

export default function RFIDPage() {
  const [rfidInput, setRfidInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Hackathon Modules State
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [currencyData, setCurrencyData] = useState(null);
  const [transportMode, setTransportMode] = useState('Kara (TIR)');
  const [distanceKm, setDistanceKm] = useState(0);
  const [carbonFootprint, setCarbonFootprint] = useState(0);
  const [deliveryData, setDeliveryData] = useState(null);

  const handleGeoCalculation = (routeInfo, carbon, mode, isDemo) => {
    setDistanceKm(routeInfo.distanceKm);
    setCarbonFootprint(carbon);
    setTransportMode(mode);
    setDeliveryData({ ...routeInfo, isDemo });
  };

  useEffect(() => {
    async function loadGeoData() {
      if (result) {
        try {
          const dest = result.order?.deliveryCity || 'İstanbul';
          const origin = result.product?.productionCity || 'Avanos';
          const route = await geoService.getDeliveryRoute(origin, dest);
          setDistanceKm(route.distanceKm);
          
          const tMode = result.order?.transportMode || transportMode;
          setTransportMode(tMode);
          
          const carbon = carbonService.calculateCarbonFootprint(route.distanceKm, result.product?.weightKg || 1.8, tMode);
          setCarbonFootprint(carbon);
        } catch(e) {
          console.error(e);
        }
      }
    }
    loadGeoData();
  }, [result]);

  useEffect(() => {
    if (result) {
      const carbon = carbonService.calculateCarbonFootprint(distanceKm, result.product?.weightKg || 1.8, transportMode);
      setCarbonFootprint(carbon);
    }
  }, [transportMode, distanceKm, result]);

  useEffect(() => {
    async function updateCurrency() {
      if (result) {
        const data = await currencyService.convertTRYPrice(result.product.price, selectedCurrency);
        setCurrencyData(data);
      }
    }
    updateCurrency();
  }, [selectedCurrency, result]);

  const handleLookup = async (cardId) => {
    const id = cardId || rfidInput.trim();
    if (!id) {
      setError('Lütfen bir RFID kart ID girin.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    setScanned(true);
    
    const data = await rfidService.lookupCard(id);
    
    if (data) {
      setResult(data);
    } else {
      setError('Bu RFID kartına ait kayıt bulunamadı.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-background min-h-screen py-8 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cream rounded-full text-sm text-earth mb-4">
            <Wifi size={16} className="text-terracotta" />
            RFID Dijital Deneyim
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-deep-earth mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            RFID Kart Okuma
          </h1>
          <p className="text-earth text-lg max-w-xl mx-auto">
            Ürününüzle birlikte gelen RFID kartınızı okutarak dijital deneyiminize erişin.
          </p>
        </div>

        {/* Scanner Area */}
        <div className="bg-white rounded-3xl shadow-md border border-cream overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-terracotta via-warm-orange to-sunset p-6 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 ${loading ? '' : 'animate-pulse-glow'}`}>
              <CreditCard size={32} className="text-white" />
            </div>
            <h2 className="text-white font-semibold text-lg">Kart Okutma Alanı</h2>
            <p className="text-white/70 text-sm mt-1">RFID kartınızı okuyucuya yaklaştırın veya ID&apos;yi manuel girin</p>
          </div>

          <div className="p-6 lg:p-8">
            {/* Manual input */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-earth" />
                <input
                  type="text"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="RFID Kart ID girin (örn: rfid-001)"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-stone/30 bg-background text-dark-brown focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all text-lg"
                />
              </div>
              <button 
                onClick={() => handleLookup()}
                disabled={loading}
                className="btn-primary px-6 py-3.5 text-lg disabled:opacity-60"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                Oku
              </button>
            </div>

            {/* Demo cards */}
            <div>
              <p className="text-sm text-earth mb-3">Hızlı Demo — bir karta tıklayın:</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_CARDS.map(card => (
                  <button
                    key={card.id}
                    onClick={() => { setRfidInput(card.id); handleLookup(card.id); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cream hover:bg-stone/30 text-sm text-dark-brown font-medium transition-colors border border-stone/20"
                  >
                    <CreditCard size={14} className="text-terracotta" />
                    {card.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-start gap-3 animate-fade-in">
            <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-800">{error}</p>
              <p className="text-sm text-red-600 mt-1">Lütfen geçerli bir RFID kart ID deneyin.</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 animate-fade-in">
            <Loader2 size={40} className="animate-spin text-terracotta mx-auto mb-3" />
            <p className="text-earth">Kart okunuyor...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="animate-fade-in-up">
            {/* Success badge */}
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle size={20} className="text-green-500" />
              <span className="font-semibold text-green-700">Kart başarıyla okundu!</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-cream overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 shrink-0">
                    <img 
                      src={result.product.images[0]} 
                      alt={result.product.name}
                      className="w-full h-48 sm:h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1">
                    <span className="badge-premium mb-2 inline-block">{result.product.category}</span>
                    <h3 className="text-xl font-bold text-deep-earth mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                      {result.product.name}
                    </h3>
                    <p className="text-sm text-earth mb-4 line-clamp-3">{result.product.description}</p>
                    <span className="text-2xl font-bold text-terracotta">{formatPrice(result.product.price)}</span>
                    <div className="mt-4">
                      <Link href={`/products/${result.product.productId}`} className="btn-primary text-sm py-2">
                        Ürün Detayını Gör <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream">
                  <h4 className="font-semibold text-dark-brown mb-3 flex items-center gap-2">
                    <Package size={16} className="text-terracotta" />
                    Sipariş Bilgileri
                  </h4>
                  <div className="space-y-3">
                    <InfoRow icon={<Hash size={14} />} label="Sipariş No" value={result.order.orderId} />
                    <InfoRow icon={<Calendar size={14} />} label="Tarih" value={formatDate(result.order.orderDate)} />
                    <InfoRow icon={<Clock size={14} />} label="Saat" value={result.order.orderTime} />
                    <InfoRow 
                      icon={<CheckCircle size={14} />} 
                      label="Ödeme" 
                      value={result.order.paymentStatus === 'paid' ? 'Ödendi ✓' : 'Beklemede'} 
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream">
                  <h4 className="font-semibold text-dark-brown mb-3 flex items-center gap-2">
                    <User size={16} className="text-terracotta" />
                    Müşteri
                  </h4>
                  <p className="text-dark-brown font-medium">{result.user.name}</p>
                  <p className="text-sm text-earth">{result.user.country}</p>
                </div>

                <div className="bg-cream/50 rounded-2xl p-5 border border-stone/20">
                  <h4 className="font-semibold text-dark-brown mb-2 flex items-center gap-2">
                    <CreditCard size={16} className="text-terracotta" />
                    RFID Kart
                  </h4>
                  <p className="text-sm text-earth">Kart ID: <span className="font-mono font-medium text-dark-brown">{result.card.rfidCardId}</span></p>
                  <p className="text-sm text-earth mt-1">Durum: <span className="text-green-600 font-medium">{result.card.isActive ? 'Aktif' : 'Pasif'}</span></p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-[#F5E6D3]/30">
              <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                Teknik Analizler
              </h2>
              
              <DeliveryLocationSelector 
                onCalculate={handleGeoCalculation} 
                productWeight={result.product.weightKg} 
                productionLocation={result.product.productionLocation || 'Avanos'} 
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Canlı Kur ile Fiyat Kartı */}
                <div className="bg-[#F5E6D3] rounded-2xl p-6 shadow-sm border border-stone/20">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-[#C65A2E]" />
                    <h3 className="text-lg font-bold text-[#3E2A1F]" style={{ fontFamily: 'var(--font-display)' }}>Canlı Kur ile Fiyat</h3>
                  </div>
                  <div className="space-y-2 text-sm text-[#5A3E2B]">
                    <div className="flex justify-between"><span>Ana Fiyat:</span> <span className="font-semibold text-[#C65A2E]">₺{result.product.price}</span></div>
                    <div className="flex justify-between items-center">
                      <span>Seçilen Para Birimi:</span>
                      <select 
                        className="bg-white border border-[#C65A2E]/30 rounded px-2 py-1 text-xs"
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div className="flex justify-between"><span>Kur Kaynağı:</span> <span>{currencyData?.source || 'TCMB EVDS'}</span></div>
                    {currencyData?.seriesCode && (
                      <div className="flex justify-between"><span>EVDS Seri Kodu:</span> <span>{currencyData.seriesCode}</span></div>
                    )}
                    <div className="flex justify-between"><span>Güncel Kur:</span> <span>1 {selectedCurrency} = {currencyData?.rate || 1} TL</span></div>
                    {currencyData?.lastUpdated && (
                      <div className="flex justify-between"><span>Son Güncelleme:</span> <span>{currencyData.lastUpdated}</span></div>
                    )}
                    <div className="flex justify-between mt-2 pt-2 border-t border-[#3E2A1F]/10">
                      <span className="font-semibold">Yaklaşık Tutar:</span> 
                      <span className="font-bold text-lg text-[#C65A2E]">{(currencyData?.convertedPrice || result.product.price).toFixed(2)} {selectedCurrency}</span>
                    </div>
                  </div>
                  {currencyData?.isDemo && (
                    <p className="text-[10px] text-[#C65A2E] mt-4 leading-tight italic font-medium">
                      Demo Modu: Döviz kuru prototip amaçlı gösterilmektedir. Gerçek kullanımda kur TCMB EVDS API üzerinden çekilecektir.
                    </p>
                  )}
                </div>

                {/* 2. Ürünün Yolculuğu Kartı */}
                <div className="bg-[#F5E6D3] rounded-2xl p-6 shadow-sm border border-stone/20 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Route size={20} className="text-[#C65A2E]" />
                    <h3 className="text-lg font-bold text-[#3E2A1F]" style={{ fontFamily: 'var(--font-display)' }}>Ürünün Yolculuğu</h3>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center">
                        <MapPin size={24} className="text-[#C65A2E] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-[#3E2A1F]">{result.product.productionLocation || 'Avanos, Kapadokya'}</p>
                      </div>
                      <div className="flex-1 border-t-2 border-dashed border-[#C65A2E]/30 mx-4 relative">
                        <Truck size={16} className="text-[#C65A2E] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#F5E6D3] px-1" />
                      </div>
                      <div className="text-center">
                        <MapPin size={24} className="text-[#3E2A1F] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-[#3E2A1F]">{deliveryData ? deliveryData.city : 'İstanbul'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-[#5A3E2B]">
                    <div className="flex justify-between"><span>Üretim Yeri:</span> <span>{result.product.productionLocation || 'Avanos, Kapadokya'}</span></div>
                    <div className="flex justify-between"><span>Teslimat Noktası:</span> <span className="text-right truncate ml-4" title={deliveryData?.fullAddress}>{deliveryData ? deliveryData.fullAddress : 'İstanbul'}</span></div>
                    <div className="flex justify-between"><span>Veri Kaynağı:</span> <span className="text-xs text-right">{deliveryData?.dataSource || 'OpenStreetMap / Nominatim'}</span></div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-[#3E2A1F]/10">
                      <span className="font-semibold">Tahmini Rota:</span> 
                      <span className="font-bold text-lg text-[#C65A2E]">{distanceKm} km</span>
                    </div>
                  </div>
                  {deliveryData?.isDemo && (
                    <p className="text-[10px] text-[#C65A2E] mt-4 leading-tight italic font-medium">
                      Demo Modu: Teslimat mesafesi prototip amaçlı gösterilmektedir. Gerçek kullanımda konum ve mesafe bilgileri OpenStreetMap, Nominatim veya OpenRouteService üzerinden çekilecektir.
                    </p>
                  )}
                </div>

                {/* 3. Sürdürülebilir Teslimat Kartı */}
                <div className="bg-[#F5E6D3] rounded-2xl p-6 shadow-sm border border-stone/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Leaf size={20} className="text-[#C65A2E]" />
                    <h3 className="text-lg font-bold text-[#3E2A1F]" style={{ fontFamily: 'var(--font-display)' }}>Sürdürülebilir Teslimat</h3>
                  </div>
                  <div className="space-y-3 text-sm text-[#5A3E2B]">
                    <div className="flex justify-between items-center">
                      <span>Taşıma Modu:</span>
                      <span className="font-medium bg-white px-2 py-1 rounded text-[#C65A2E]">{transportMode}</span>
                    </div>
                    <div className="flex justify-between"><span>Ürün Ağırlığı:</span> <span>{result.product.weightKg || 1.8} kg</span></div>
                    <div className="flex justify-between"><span>Emisyon Faktörü:</span> <span className="text-xs text-right">{carbonService.getEmissionFactor(transportMode)} kg CO₂ / ton-km</span></div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-[#3E2A1F]/10">
                      <span className="font-semibold">Tahmini Karbon:</span> 
                      <span className="font-bold text-lg text-[#C65A2E]">{carbonFootprint} kg CO₂</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-white/50 p-3 rounded-xl border border-[#3E2A1F]/10">
                    <p className="text-xs text-[#3E2A1F] font-medium mb-1">🌍 Doğa Dostu Seçim</p>
                    <p className="text-[10px] text-[#5A3E2B] leading-tight">Taşıma modu seçiminizle karbon ayak izinizi %30'a kadar azaltabilirsiniz.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-earth">
        <span className="text-stone">{icon}</span>
        {label}
      </div>
      <span className="text-sm font-medium text-dark-brown">{value}</span>
    </div>
  );
}

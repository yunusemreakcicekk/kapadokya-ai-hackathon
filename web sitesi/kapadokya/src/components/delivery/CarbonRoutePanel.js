'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Truck, Ship, Train, Plane, Leaf, ChevronDown, ChevronUp, Info } from 'lucide-react';

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 md:h-80 bg-[#F5E6D3]/50 rounded-2xl animate-pulse flex items-center justify-center text-[#5A3E2B] font-medium border border-[#C65A2E]/20">Harita Yükleniyor...</div>
});

// Transport modes ordered from lowest to highest carbon footprint
const TRANSPORT_MODES = [
  { key: 'Deniz Yolu', label: 'Deniz Yolu', factor: 0.015, color: '#22c55e', colorName: 'Yeşil', icon: Ship, desc: 'En düşük karbon izi' },
  { key: 'Demiryolu', label: 'Demiryolu', factor: 0.030, color: '#eab308', colorName: 'Sarı', icon: Train, desc: 'Düşük karbon izi' },
  { key: 'Kara (TIR)', label: 'Kara / TIR', factor: 0.100, color: '#f97316', colorName: 'Turuncu', icon: Truck, desc: 'Yüksek karbon izi' },
  { key: 'Hava Kargo', label: 'Hava Kargo', factor: 0.500, color: '#ef4444', colorName: 'Kırmızı', icon: Plane, desc: 'En yüksek karbon izi' },
];

function AnimatedRouteLine({ color, delay, duration, label }) {
  return (
    <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}33, ${color})`,
          animation: `routeGrow ${duration}s ease-out ${delay}s forwards`,
          width: '0%',
        }}
      />
      {/* Moving dot */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}80`,
          animation: `routeMove ${duration}s ease-out ${delay}s forwards`,
          left: '0%',
        }}
      />
    </div>
  );
}

export default function CarbonRoutePanel({ routeData, productWeight, selectedMode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const panelRef = useRef(null);

  // Recalculate all transport modes
  const distanceKm = routeData?.distanceKm || 0;
  const weightTon = (productWeight || 1.8) / 1000;

  const availableModes = TRANSPORT_MODES.filter(mode => {
    if (mode.key === 'Deniz Yolu' && routeData && routeData.isSeaRouteAvailable === false) {
      return false;
    }
    return true;
  });

  const allModeResults = availableModes.map(mode => ({
    ...mode,
    carbonKg: parseFloat((distanceKm * weightTon * mode.factor).toFixed(3)),
  }));

  const maxCarbon = Math.max(...allModeResults.map(m => m.carbonKg), 0.001);

  // Restart animation on data change
  useEffect(() => {
    setAnimKey(prev => prev + 1);
  }, [distanceKm, productWeight]);

  if (!routeData) return null;

  const originLabel = routeData.originLabel || routeData.origin
    ? `${routeData.origin?.lat?.toFixed(4) || '?'}°N, ${routeData.origin?.lng?.toFixed(4) || '?'}°E`
    : 'Bilinmiyor';
  const destLabel = routeData.destLabel || routeData.dest
    ? `${routeData.dest?.lat?.toFixed(4) || '?'}°N, ${routeData.dest?.lng?.toFixed(4) || '?'}°E`
    : 'Bilinmiyor';

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#C65A2E]/30 shadow-lg" ref={panelRef}>
      {/* Panel Header - Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#3E2A1F] to-[#5A3E2B] text-white hover:from-[#4E3A2F] hover:to-[#6A4E3B] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Leaf size={20} className="text-green-400" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-sm">Karbon Rota Analizi</h4>
            <p className="text-[11px] text-white/60">Tüm taşıma modlarının karşılaştırmalı analizi</p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Panel Body */}
      <div
        className="transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isOpen ? '3000px' : '0px',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
        }}
      >
        <div className="bg-[#F5E6D3] p-6 space-y-6">

          {/* 1. ROTA ÖZETİ */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C65A2E]/10">
            <h5 className="text-sm font-bold text-[#3E2A1F] mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-[#C65A2E]" />
              Rota Özeti
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-1">Satıcı Konumu</p>
                <p className="text-sm font-bold text-[#3E2A1F]">{routeData.originStr || 'Avanos, Kapadokya'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{originLabel}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wide mb-1">Alıcı Konumu</p>
                <p className="text-sm font-bold text-[#3E2A1F]">{routeData.destStr || 'Bilinmiyor'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{destLabel}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide mb-1">Toplam Mesafe</p>
                <p className="text-2xl font-black text-[#C65A2E]">{distanceKm} <span className="text-sm font-semibold">km</span></p>
              </div>
            </div>
          </div>

          {/* 1.5 HARİTA GÖRSELLEŞTİRMESİ */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C65A2E]/10 relative z-0">
            <h5 className="text-sm font-bold text-[#3E2A1F] mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-[#C65A2E]" />
              Gerçek Zamanlı Karayolu Haritası
            </h5>
            <RouteMap 
              origin={routeData.origin} 
              dest={routeData.dest} 
              geometry={routeData.geometry} 
            />
          </div>

          {/* 2. ANİMASYONLU KARBON ROTA GÖRSELLEŞTİRMESİ */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C65A2E]/10">
            <h5 className="text-sm font-bold text-[#3E2A1F] mb-4">
              Animasyonlu Karbon Rota Görselleştirmesi
            </h5>
            <div key={animKey} className="space-y-4">
              {/* Origin and destination markers */}
              <div className="flex items-center justify-between text-xs text-[#5A3E2B] font-semibold mb-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#C65A2E] animate-pulse" />
                  <span>Satıcı</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Alıcı</span>
                  <div className="w-3 h-3 rounded-full bg-[#3E2A1F] animate-pulse" />
                </div>
              </div>

              {/* Animated route lines for each transport mode */}
              {availableModes.map((mode, i) => {
                const Icon = mode.icon;
                return (
                  <div key={mode.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Icon size={13} style={{ color: mode.color }} />
                        <span className="font-medium text-[#3E2A1F]">{mode.label}</span>
                      </div>
                      <span className="font-bold" style={{ color: mode.color }}>
                        {allModeResults[i].carbonKg} kg CO₂
                      </span>
                    </div>
                    <AnimatedRouteLine
                      color={mode.color}
                      delay={i * 0.4}
                      duration={1.2}
                      label={mode.label}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. TAŞIMA MODU KARBON KARŞILAŞTIRMASI */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C65A2E]/10">
            <h5 className="text-sm font-bold text-[#3E2A1F] mb-4 flex items-center gap-2">
              <Leaf size={16} className="text-green-600" />
              Taşıma Modu Karbon Karşılaştırması
            </h5>
            <div className="space-y-3">
              {allModeResults.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.key;
                const barWidth = maxCarbon > 0 ? (mode.carbonKg / maxCarbon) * 100 : 0;

                return (
                  <div
                    key={mode.key}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      isSelected
                        ? 'border-[#C65A2E] bg-[#C65A2E]/5 shadow-md'
                        : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${mode.color}15` }}
                        >
                          <Icon size={16} style={{ color: mode.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#3E2A1F]">{mode.label}</span>
                            {isSelected && (
                              <span className="text-[9px] px-2 py-0.5 bg-[#C65A2E] text-white rounded-full font-bold">
                                SEÇİLİ
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">{mode.desc}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black" style={{ color: mode.color }}>
                          {mode.carbonKg}
                        </p>
                        <p className="text-[10px] text-gray-400">kg CO₂</p>
                      </div>
                    </div>

                    {/* Carbon bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: mode.color,
                        }}
                      />
                    </div>

                    {/* Detail row */}
                    <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                      <span>Mesafe: {distanceKm} km</span>
                      <span>Emisyon Faktörü: {mode.factor} kg CO₂/ton-km</span>
                      <span>Yük: {(productWeight || 1.8)} kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. HESAPLAMA YÖNTEMİ */}
          <div className="bg-white/80 rounded-xl p-4 border border-[#C65A2E]/10">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-[#C65A2E] mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-[#3E2A1F] font-semibold mb-1">Hesaplama Yöntemi</p>
                <p className="text-[10px] text-[#5A3E2B] leading-relaxed">
                  Karbon emisyonu, açık kaynak coğrafi veri servislerinden alınan mesafe bilgisi ile
                  taşıma moduna ait emisyon faktörünün ve yük miktarının çarpılmasıyla hesaplanır.
                </p>
                <p className="text-[10px] text-[#5A3E2B] mt-1 font-medium">
                  Formül: Karbon (kg CO₂) = Mesafe (km) × Yük (ton) × Emisyon Faktörü
                </p>
                <p className="text-[9px] text-gray-400 mt-2 italic">
                  Veri Kaynağı: {routeData.dataSource || 'OpenStreetMap / Nominatim'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes routeGrow {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes routeMove {
          0% { left: 0%; }
          100% { left: calc(100% - 12px); }
        }
      `}</style>
    </div>
  );
}

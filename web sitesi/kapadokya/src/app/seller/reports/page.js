'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../contexts/AuthContext';
import { reportService } from '../../../services/reportService';
import { currencyService } from '../../../services/currencyService';
import { formatPrice } from '../../../utils/formatters';
import { ArrowLeft, BarChart3, TrendingUp, Globe, Award, Calendar, DollarSign, ShoppingCart, Package, Leaf, MapPin, Route } from 'lucide-react';

// Dynamic import for Recharts (SSR incompatible)
const RechartsComponents = dynamic(() => import('../../../components/seller/SalesChart'), { ssr: false });

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [countrySales, setCountrySales] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  // Hackathon Modules State
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [currencyData, setCurrencyData] = useState(null);

  useEffect(() => {
    async function load() {
      const allReports = await reportService.getBySeller('seller-001');
      const monthly = await reportService.getMonthlySalesData();
      const country = await reportService.getCountrySalesData();
      setReports(allReports);
      setMonthlySales(monthly);
      setCountrySales(country);
      setLoading(false);
    }
    load();
  }, []);

  const currentReport = reports.find(r => r.type === selectedPeriod) || reports[0];

  useEffect(() => {
    async function updateCurrency() {
      if (currentReport) {
        const revenue = currentReport.totalRevenueTRY || currentReport.totalRevenue || 0;
        const data = await currencyService.convertTRYPrice(revenue, selectedCurrency);
        setCurrencyData(data);
      }
    }
    updateCurrency();
  }, [selectedCurrency, currentReport]);

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/seller" className="p-2 rounded-xl hover:bg-cream transition-colors">
            <ArrowLeft size={20} className="text-earth" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-deep-earth" style={{ fontFamily: 'var(--font-display)' }}>Satış Raporları</h1>
            <p className="text-sm text-earth">Satış performansınızı ve trendlerinizi takip edin</p>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'weekly', label: 'Haftalık', icon: <Calendar size={14} /> },
            { key: 'monthly', label: 'Aylık', icon: <Calendar size={14} /> },
            { key: 'seasonal', label: 'Sezonluk', icon: <Calendar size={14} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedPeriod(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedPeriod === tab.key 
                  ? 'bg-terracotta text-white shadow-md' 
                  : 'bg-white text-dark-brown border border-stone/30 hover:border-terracotta/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 shimmer rounded-2xl" />)}
            </div>
            <div className="h-80 shimmer rounded-2xl" />
          </div>
        ) : currentReport ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <ReportStat icon={<DollarSign size={20} />} label="Toplam Gelir" value={formatPrice(currentReport.totalRevenue)} color="bg-green-50 text-green-600" />
              <ReportStat icon={<ShoppingCart size={20} />} label="Toplam Sipariş" value={currentReport.totalOrders} color="bg-blue-50 text-blue-600" />
              <ReportStat icon={<Globe size={20} />} label="Ülke Sayısı" value={Object.keys(currentReport.countryBreakdown).length} color="bg-purple-50 text-purple-600" />
              <ReportStat icon={<Package size={20} />} label="Ürün Çeşidi" value={currentReport.topProducts.length} color="bg-orange-50 text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Sales Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-cream">
                <h3 className="font-semibold text-dark-brown mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-terracotta" />
                  Aylık Satış Trendi
                </h3>
                <div className="h-72">
                  <RechartsComponents monthlySales={monthlySales} countrySales={countrySales} />
                </div>
              </div>

              {/* Country breakdown */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream">
                <h3 className="font-semibold text-dark-brown mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-terracotta" />
                  Ülkelere Göre Satış
                </h3>
                <div className="space-y-3">
                  {Object.entries(currentReport.countryBreakdown).map(([country, data]) => (
                    <div key={country} className="flex items-center justify-between p-3 bg-cream/30 rounded-xl">
                      <div>
                        <p className="font-medium text-dark-brown text-sm">{country}</p>
                        <p className="text-xs text-earth">{data.orders} sipariş</p>
                      </div>
                      <span className="font-semibold text-terracotta">{formatPrice(data.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products - Only for Admin */}
            {isAdmin && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream">
                <h3 className="font-semibold text-dark-brown mb-4 flex items-center gap-2">
                  <Award size={18} className="text-terracotta" />
                  En Çok Satan Ürünler
                </h3>
                <div className="space-y-3">
                  {currentReport.topProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between p-4 bg-cream/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-dark-brown">{product.name}</p>
                          <p className="text-xs text-earth">{product.totalSold} adet satıldı</p>
                        </div>
                      </div>
                      <span className="font-bold text-terracotta text-lg">{formatPrice(product.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Hackathon Rapor Modülleri */}
            <div className="mt-12 pt-8 border-t border-cream">
              <h2 className="text-xl font-bold text-deep-earth mb-6" style={{ fontFamily: 'var(--font-display)' }}>Sürdürülebilirlik ve Global Satış Analizi</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* 1. Karbon Raporu Kartı */}
                <div className="bg-[#F5E6D3] rounded-2xl p-6 shadow-sm border border-stone/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Leaf size={20} className="text-[#C65A2E]" />
                    <h3 className="font-semibold text-[#3E2A1F]">Karbon Raporu</h3>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-[#5A3E2B]">Toplam Karbon Ayak İzi</p>
                    <p className="text-2xl font-bold text-[#C65A2E]">{currentReport.totalCarbonFootprintKg || 0} kg CO₂</p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-[#3E2A1F] border-b border-[#3E2A1F]/10 pb-1">Taşıma Moduna Göre Dağılım</h4>
                    {Object.entries(currentReport.transportModeBreakdown || {}).map(([mode, pct]) => (
                      <div key={mode} className="flex justify-between items-center text-sm">
                        <span className="text-[#5A3E2B]">{mode}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-[#C65A2E]" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#5A3E2B]/70 mt-4 italic">Karbon verileri açık kaynak hesaplamalarıyla simüle edilmiştir.</p>
                </div>

                {/* 2. Global Teslimat Haritası (Placeholder) */}
                <div className="bg-[#F5E6D3] rounded-2xl p-6 shadow-sm border border-stone/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Route size={20} className="text-[#C65A2E]" />
                    <h3 className="font-semibold text-[#3E2A1F]">Teslimat Haritası Özeti</h3>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-[#5A3E2B]">Toplam Teslimat Mesafesi</p>
                    <p className="text-2xl font-bold text-[#C65A2E]">{currentReport.totalDistanceKm || 0} km</p>
                  </div>
                  
                  {/* Map Placeholder Graphic */}
                  <div className="h-28 bg-[#E07A3F]/10 rounded-xl border border-[#E07A3F]/20 relative overflow-hidden mb-3 flex items-center justify-center flex-col">
                     <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C65A2E 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                     <Globe size={32} className="text-[#C65A2E] mb-2 opacity-50" />
                     <span className="text-xs font-medium text-[#C65A2E]">OpenStreetMap Verisi İle Görselleştirilecektir</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-[#3E2A1F] border-b border-[#3E2A1F]/10 pb-1 mb-2">Ülkelere Göre Karbon Etkisi</h4>
                    {Object.entries(currentReport.countryCarbonBreakdown || {}).map(([country, carbon]) => (
                      <div key={country} className="flex justify-between text-xs text-[#5A3E2B]">
                        <span>{country}</span>
                        <span className="font-medium text-[#C65A2E]">{carbon} kg CO₂</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Canlı Kur ile Gelir Özeti */}
                <div className="bg-[#F5E6D3] rounded-2xl p-6 shadow-sm border border-stone/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign size={20} className="text-[#C65A2E]" />
                      <h3 className="font-semibold text-[#3E2A1F]">Canlı Kur Gelir Özeti</h3>
                    </div>
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
                  
                  <div className="space-y-4">
                    <div className="bg-white/50 p-3 rounded-xl border border-[#C65A2E]/20">
                      <p className="text-xs text-[#5A3E2B]">Aylık Gelir</p>
                      <p className="text-lg font-bold text-[#3E2A1F]">₺{currentReport.totalRevenueTRY || currentReport.totalRevenue}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#C65A2E]/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 bg-[#C65A2E] rounded-bl-lg">
                        <span className="text-[10px] text-white font-bold">{selectedCurrency}</span>
                      </div>
                      <p className="text-xs text-[#5A3E2B] mb-1">{selectedCurrency} Karşılığı</p>
                      <p className="text-3xl font-black text-[#C65A2E]">
                        {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : '£'}
                        {currencyData?.convertedPrice ? currencyData.convertedPrice.toFixed(2) : 0}
                      </p>
                      <div className="text-[10px] text-[#5A3E2B] mt-3 space-y-0.5">
                        <p>Kur Kaynağı: <span className="font-medium">{currencyData?.source || 'TCMB EVDS'}</span></p>
                        {currencyData?.seriesCode && <p>EVDS Seri Kodu: <span className="font-medium">{currencyData.seriesCode}</span></p>}
                        {currencyData?.lastUpdated && <p>Son Güncelleme: <span className="font-medium">{currencyData.lastUpdated}</span></p>}
                      </div>
                    </div>
                  </div>
                  {currencyData?.isDemo && (
                    <p className="text-[10px] text-[#C65A2E] mt-4 leading-tight italic font-medium">
                      Demo Modu: Döviz kuru prototip amaçlı gösterilmektedir. Gerçek kullanımda kur TCMB EVDS API üzerinden çekilecektir.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <BarChart3 size={48} className="text-earth mx-auto mb-4 opacity-40" />
            <p className="text-earth font-medium">Bu dönem için rapor bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportStat({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-dark-brown">{value}</p>
      <p className="text-sm text-earth">{label}</p>
    </div>
  );
}

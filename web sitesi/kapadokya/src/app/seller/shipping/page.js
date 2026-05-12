'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { shippingService } from '../../../services/shippingService';
import { formatPrice } from '../../../utils/formatters';
import { ArrowLeft, Truck, Globe, MapPin, CheckCircle, Plus } from 'lucide-react';

export default function ShippingPage() {
  const [shipping, setShipping] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await shippingService.getAll();
      setShipping(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/seller" className="p-2 rounded-xl hover:bg-cream transition-colors">
            <ArrowLeft size={20} className="text-earth" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-deep-earth" style={{ fontFamily: 'var(--font-display)' }}>Kargo Seçenekleri</h1>
            <p className="text-sm text-earth">Kargo firmalarını ve ücretleri yönetin</p>
          </div>
          <button className="btn-primary text-sm py-2">
            <Plus size={16} /> Yeni Ekle
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {shipping.map(opt => (
              <div key={opt.shippingOptionId} className="bg-white rounded-2xl p-6 shadow-sm border border-cream card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-terracotta">
                      <Truck size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-brown text-lg">{opt.companyName}</h3>
                      <p className="text-sm text-earth">{opt.deliveryTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {opt.freeShipping ? (
                      <span className="text-green-600 font-bold text-lg">Ücretsiz</span>
                    ) : (
                      <span className="text-xl font-bold text-terracotta">{formatPrice(opt.price)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-cream">
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin size={14} className="text-earth" />
                    <span className="text-earth">Yurt İçi</span>
                    <CheckCircle size={14} className="text-green-500" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe size={14} className="text-earth" />
                    <span className="text-earth">Uluslararası</span>
                    {opt.internationalAvailable ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <span className="text-xs text-earth/50">—</span>
                    )}
                  </div>
                  {opt.freeShipping && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">Ücretsiz Kargo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

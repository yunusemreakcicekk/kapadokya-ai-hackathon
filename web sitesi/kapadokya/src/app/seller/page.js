'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';
import { 
  Package, ShoppingCart, TrendingUp, AlertTriangle, Plus, BarChart3, 
  Truck, Megaphone, Camera, ArrowRight, Film
} from 'lucide-react';

export default function SellerDashboard() {
  const { user, seller, isSeller, isAdmin } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let products = [];
      let orders = [];

      if (isAdmin) {
        products = await productService.getAll();
        orders = await orderService.getAll();
      } else {
        const sellerId = seller?.sellerId || 'seller-001';
        const rawProducts = await productService.getBySeller(sellerId);
        products = rawProducts.filter(p => p.category === (seller?.specialty || 'Çömlek'));
        orders = await orderService.getBySeller(sellerId);
      }
      
      const revenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.price : 0), 0);
      
      setStats({
        products: products.length,
        orders: orders.length,
        revenue
      });
      setRecentOrders(orders.slice(-3).reverse());
      setLoading(false);
    }
    load();
  }, [seller, isAdmin]);

  if (!isSeller && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertTriangle size={48} className="text-warm-orange mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-dark-brown mb-2" style={{ fontFamily: 'var(--font-display)' }}>Erişim Kısıtlı</h2>
        <p className="text-earth mb-6">Bu sayfaya erişmek için satıcı veya admin olarak giriş yapmalısınız.</p>
        <Link href="/login" className="btn-primary">Giriş Yap</Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-deep-earth" style={{ fontFamily: 'var(--font-display)' }}>
              {isAdmin ? 'Sistem Yöneticisi Paneli' : 'Satıcı Paneli'}
            </h1>
            <p className="text-earth">
              {isAdmin ? 'Tüm Kapadokya e-ticaret ekosisteminin genel özeti' : 'Ahmet Usta - Kapadokya Çömlek Atölyesi'}
            </p>
          </div>
          <Link href="/seller/add-product" className="btn-primary">
            <Plus size={18} />
            Yeni Ürün Ekle
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Package size={22} />} label="Toplam Ürün" value={stats.products} color="bg-blue-50 text-blue-600" loading={loading} />
          <StatCard icon={<ShoppingCart size={22} />} label="Toplam Sipariş" value={stats.orders} color="bg-green-50 text-green-600" loading={loading} />
          <StatCard icon={<TrendingUp size={22} />} label="Toplam Gelir" value={formatPrice(stats.revenue)} color="bg-orange-50 text-orange-600" loading={loading} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <QuickAction href="/seller/products" icon={<Package size={20} />} label="Ürünlerim" desc="Tüm ürünleri yönet" />
          <QuickAction href="/seller/add-product" icon={<Camera size={20} />} label="AI Ürün Kayıt" desc="Kamera ile ekle" />
          <QuickAction href="/seller/reports" icon={<BarChart3 size={20} />} label="Raporlar" desc="Satış raporları" />
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark-brown text-lg" style={{ fontFamily: 'var(--font-display)' }}>Son Siparişler</h3>
            <Link href="/seller/reports" className="text-sm text-terracotta font-medium hover:text-hover flex items-center gap-1">
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-earth text-center py-8">Henüz sipariş yok</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.orderId} className="flex items-center justify-between p-4 bg-cream/30 rounded-xl">
                  <div>
                    <p className="font-medium text-dark-brown text-sm">{order.orderId}</p>
                    <p className="text-xs text-earth">{order.orderDate} • {order.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-dark-brown">{formatPrice(order.price)}</p>
                    <span className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, alert, loading }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${alert ? 'border-red-200' : 'border-cream'} card-hover`}>
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 shimmer rounded-xl w-10" />
          <div className="h-5 shimmer rounded w-1/2" />
          <div className="h-4 shimmer rounded w-2/3" />
        </div>
      ) : (
        <>
          <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-3`}>
            {icon}
          </div>
          <p className="text-2xl font-bold text-dark-brown">{value}</p>
          <p className="text-sm text-earth">{label}</p>
        </>
      )}
    </div>
  );
}

function QuickAction({ href, icon, label, desc, disabled }) {
  const content = (
    <div className={`card-hover bg-white rounded-2xl p-5 shadow-sm border border-cream text-center ${disabled ? 'opacity-50' : ''}`}>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cream to-stone/20 flex items-center justify-center mx-auto mb-3 text-terracotta">
        {icon}
      </div>
      <p className="font-semibold text-dark-brown text-sm">{label}</p>
      <p className="text-xs text-earth mt-0.5">{desc}</p>
    </div>
  );
  
  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}

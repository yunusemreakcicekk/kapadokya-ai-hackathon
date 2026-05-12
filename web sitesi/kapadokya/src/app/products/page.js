'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { productService } from '../../services/productService';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatters';
import { PRODUCT_CATEGORIES } from '../../types';
import { Search, Filter, Grid3x3, List } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { isSeller, isAdmin, seller } = useAuth();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let data = await productService.getAll();
      if (isSeller && !isAdmin) {
        data = data.filter(p => p.category === (seller?.specialty || 'Halı'));
      }
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = [...products];
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [products, selectedCategory, searchQuery]);

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  return (
    <div className="bg-background min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-deep-earth mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Ürün Koleksiyonu
          </h1>
          <p className="text-earth text-lg">Kapadokya&apos;nın en seçkin el sanatları eserleri</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-earth" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone/30 bg-white text-dark-brown focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-terracotta text-white shadow-md' 
                  : 'bg-white text-dark-brown border border-stone/30 hover:border-terracotta/50'
              }`}
            >
              Tümü
            </button>
            {!loading && Array.from(new Set(products.map(p => p.category))).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat 
                    ? 'bg-terracotta text-white shadow-md' 
                    : 'bg-white text-dark-brown border border-stone/30 hover:border-terracotta/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-earth mb-6">{filtered.length} ürün bulundu</p>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-square shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                  <div className="h-5 shimmer rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-earth mb-2">Ürün bulunamadı</p>
            <p className="text-sm text-earth/60">Farklı bir arama terimi veya kategori deneyin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <Link
                key={product.productId}
                href={`/products/${product.productId}`}
                className="card-hover group bg-white rounded-2xl overflow-hidden shadow-sm border border-cream"
              >
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="badge-premium">{product.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-dark-brown mb-1 group-hover:text-terracotta transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-earth line-clamp-2 mb-3">{product.description.substring(0, 80)}...</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-terracotta">{formatPrice(product.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12"><div className="h-8 shimmer rounded w-48 mb-8" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}

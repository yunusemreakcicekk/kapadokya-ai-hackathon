'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService } from '../../../services/productService';
import { aiService } from '../../../services/aiService';
import { ArrowLeft, Megaphone, Sparkles, Loader2, Film, Volume2, FileText, Copy, Check } from 'lucide-react';

export default function AdvertisementsPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [generating, setGenerating] = useState(false);
  const [adResult, setAdResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await productService.getAll();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.productId === selectedProduct);
    if (!product) return;
    
    setGenerating(true);
    const result = await aiService.generateAdText(product.name, product.category, product.description);
    setAdResult(result);
    setGenerating(false);
  };

  const handleCopy = (field, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/seller" className="p-2 rounded-xl hover:bg-cream transition-colors">
            <ArrowLeft size={20} className="text-earth" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-deep-earth" style={{ fontFamily: 'var(--font-display)' }}>AI Reklam Metni</h1>
            <p className="text-sm text-earth">Yapay zeka ile ürün reklam içeriği oluşturun</p>
          </div>
        </div>

        {/* Generator */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream mb-8">
          <h3 className="font-semibold text-dark-brown mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-terracotta" />
            Reklam Metni Oluştur
          </h3>
          
          <div className="flex gap-3 mb-4">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-stone/30 bg-background focus:outline-none focus:border-terracotta"
            >
              <option value="">Ürün seçin...</option>
              {products.map(p => (
                <option key={p.productId} value={p.productId}>{p.name}</option>
              ))}
            </select>
            <button 
              onClick={handleGenerate}
              disabled={!selectedProduct || generating}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Oluştur
            </button>
          </div>

          {generating && (
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin text-terracotta mx-auto mb-3" />
              <p className="text-earth font-medium">AI reklam metinleri üretiliyor...</p>
            </div>
          )}

          {adResult && !generating && (
            <div className="space-y-4 animate-fade-in-up">
              <AdTextCard 
                icon={<Megaphone size={18} />}
                title="Kısa Reklam Metni"
                text={adResult.adText}
                onCopy={() => handleCopy('ad', adResult.adText)}
                copied={copiedField === 'ad'}
              />
              <AdTextCard 
                icon={<FileText size={18} />}
                title="Ürün Tanıtım Metni"
                text={adResult.productIntroText}
                onCopy={() => handleCopy('intro', adResult.productIntroText)}
                copied={copiedField === 'intro'}
              />
              <AdTextCard 
                icon={<Volume2 size={18} />}
                title="Sesli Reklam Metni"
                text={adResult.voiceAdText}
                onCopy={() => handleCopy('voice', adResult.voiceAdText)}
                copied={copiedField === 'voice'}
              />
            </div>
          )}
        </div>

        {/* AI Video Button */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream">
          <h3 className="font-semibold text-dark-brown mb-4 flex items-center gap-2">
            <Film size={18} className="text-purple-600" />
            AI Video Oluştur
          </h3>
          <p className="text-sm text-earth mb-4">Ürününüz için yapay zeka destekli tanıtım videosu oluşturun.</p>
          <button 
            onClick={() => {
              window.open('http://localhost:5173', '_blank');
              fetch('/api/open-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start-ai-video' })
              }).catch(() => {});
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            <Film size={18} />
            AI Video Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}

function AdTextCard({ icon, title, text, onCopy, copied }) {
  return (
    <div className="bg-cream/30 rounded-xl p-4 border border-cream">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-dark-brown flex items-center gap-2 text-sm">
          <span className="text-terracotta">{icon}</span>
          {title}
        </h4>
        <button onClick={onCopy} className="flex items-center gap-1 text-xs text-earth hover:text-terracotta transition-colors">
          {copied ? <><Check size={14} className="text-green-500" /> Kopyalandı</> : <><Copy size={14} /> Kopyala</>}
        </button>
      </div>
      <p className="text-sm text-earth leading-relaxed">{text}</p>
    </div>
  );
}

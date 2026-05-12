'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { User, Store, Shield, ArrowRight, Sparkles } from 'lucide-react';

const roles = [
  { 
    role: 'customer', 
    icon: <User size={28} />, 
    title: 'Müşteri',
    desc: 'Ürünleri keşfedin, RFID kartınızı okutun ve alışveriş yapın.',
    color: 'from-sunset to-warm-orange'
  },
  { 
    role: 'seller', 
    icon: <Store size={28} />, 
    title: 'Satıcı',
    desc: 'Ürünlerinizi AI ile yönetin ve satış raporlarınızı görüntüleyin.',
    color: 'from-warm-orange to-terracotta'
  },
  { 
    role: 'admin', 
    icon: <Shield size={28} />, 
    title: 'Admin',
    desc: 'Tüm sistemi yönetin, kullanıcıları ve satıcıları kontrol edin.',
    color: 'from-terracotta to-hover'
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!selectedRole) return;
    setLoading(true);
    const user = await login(selectedRole);
    if (user) {
      if (selectedRole === 'seller' || selectedRole === 'admin') {
        router.push('/seller');
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-background">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sunset via-warm-orange to-terracotta flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>K</span>
          </div>
          <h1 className="text-3xl font-bold text-deep-earth mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Hoş Geldiniz
          </h1>
          <p className="text-earth">Demo giriş — bir rol seçerek devam edin</p>
        </div>

        {/* Role Cards */}
        <div className="space-y-3 mb-8">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                selectedRole === r.role 
                  ? 'border-terracotta bg-cream/60 shadow-md' 
                  : 'border-cream bg-white hover:border-stone/50'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white shrink-0`}>
                {r.icon}
              </div>
              <div>
                <h3 className="font-semibold text-dark-brown">{r.title}</h3>
                <p className="text-sm text-earth">{r.desc}</p>
              </div>
              {selectedRole === r.role && (
                <div className="ml-auto shrink-0">
                  <div className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
                    <Sparkles size={14} className="text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={!selectedRole || loading}
          className="btn-primary w-full justify-center text-lg py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          <ArrowRight size={18} />
        </button>

        <p className="text-center text-xs text-earth mt-4">
          Bu bir prototip girişidir. İleride Firebase Authentication ile değiştirilecektir.
        </p>
      </div>
    </div>
  );
}

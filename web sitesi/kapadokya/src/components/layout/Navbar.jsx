'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Menu, X, ShoppingBag, User, LogOut, CreditCard, Wifi, LayoutDashboard, Home, Package, Globe } from 'lucide-react';
import CurrencyTicker from './CurrencyTicker';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated, isSeller, isAdmin } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-stone/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset via-warm-orange to-terracotta flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>K</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-deep-earth" style={{ fontFamily: 'var(--font-display)' }}>
                Kapadokya
              </h1>
              <p className="text-xs text-earth -mt-1">El Sanatları</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink href="/" icon={<Home size={16} />}>{t('nav.home')}</NavLink>
            <NavLink href="/products" icon={<Package size={16} />}>{t('nav.products')}</NavLink>
            <NavLink href="/rfid" icon={<Wifi size={16} />}>{t('nav.rfid')}</NavLink>
            {(isSeller || isAdmin) && (
              <NavLink href="/seller" icon={<LayoutDashboard size={16} />}>{t('nav.sellerPanel')}</NavLink>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <CurrencyTicker />

            {/* Language Switcher */}
            <div className="flex items-center bg-cream/50 rounded-xl p-1 border border-stone/20 mr-2">
              <button 
                onClick={() => changeLanguage('tr')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'tr' ? 'bg-white text-terracotta shadow-sm' : 'text-earth hover:text-dark-brown'}`}
              >
                TR
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white text-terracotta shadow-sm' : 'text-earth hover:text-dark-brown'}`}
              >
                EN
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cream rounded-xl">
                  <User size={16} className="text-terracotta" />
                  <span className="text-sm font-medium text-dark-brown">{user.name}</span>
                  <span className="badge-premium text-[10px]">{user.role}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 rounded-xl text-earth hover:text-terracotta hover:bg-cream transition-all"
                  title="Çıkış Yap"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-2">
                <User size={16} />
                Giriş Yap
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="lg:hidden p-2 rounded-xl text-dark-brown hover:bg-cream transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-stone/20 bg-white/95 backdrop-blur-lg animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            <MobileNavLink href="/" icon={<Home size={18} />} onClick={() => setIsOpen(false)}>{t('nav.home')}</MobileNavLink>
            <MobileNavLink href="/products" icon={<Package size={18} />} onClick={() => setIsOpen(false)}>{t('nav.products')}</MobileNavLink>
            <MobileNavLink href="/rfid" icon={<Wifi size={18} />} onClick={() => setIsOpen(false)}>{t('nav.rfid')}</MobileNavLink>
            {(isSeller || isAdmin) && (
              <MobileNavLink href="/seller" icon={<LayoutDashboard size={18} />} onClick={() => setIsOpen(false)}>{t('nav.sellerPanel')}</MobileNavLink>
            )}
            
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone/20 mt-2">
              <span className="text-sm font-medium text-dark-brown flex items-center gap-2"><Globe size={16} /> Dil / Language</span>
              <div className="flex items-center bg-cream/50 rounded-xl p-1 border border-stone/20">
                <button 
                  onClick={() => changeLanguage('tr')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'tr' ? 'bg-white text-terracotta shadow-sm' : 'text-earth hover:text-dark-brown'}`}
                >
                  TR
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white text-terracotta shadow-sm' : 'text-earth hover:text-dark-brown'}`}
                >
                  EN
                </button>
              </div>
            </div>
            <div className="border-t border-stone/20 pt-3 mt-3">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-terracotta" />
                    <span className="font-medium text-dark-brown">{user.name}</span>
                    <span className="badge-premium text-[10px]">{user.role}</span>
                  </div>
                  <button onClick={() => { logout(); setIsOpen(false); }} className="text-earth hover:text-terracotta">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="btn-primary w-full justify-center" onClick={() => setIsOpen(false)}>
                  <User size={18} />
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children, icon }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-dark-brown hover:text-terracotta hover:bg-cream/80 transition-all"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, icon, onClick }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-dark-brown hover:bg-cream transition-colors"
    >
      <span className="text-terracotta">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}

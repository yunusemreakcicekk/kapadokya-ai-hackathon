'use client';

import Link from 'next/link';
import { Package, MapPin, Phone, Mail, Camera, Globe, Hash } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone border-t border-stone/20 pt-16 pb-8 relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-warm-orange/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset via-warm-orange to-terracotta flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>K</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-brown" style={{ fontFamily: 'var(--font-display)' }}>
                  Kapadokya
                </h2>
                <p className="text-xs text-earth -mt-1">El Sanatları</p>
              </div>
            </Link>
            <p className="text-sm text-earth leading-relaxed pr-4">
              {t('footer.aboutText')}
            </p>
            <div className="flex items-center gap-4">
              <SocialLink href="#" icon={<Camera size={18} />} />
              <SocialLink href="#" icon={<Hash size={18} />} />
              <SocialLink href="#" icon={<Globe size={18} />} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-dark-brown mb-6" style={{ fontFamily: 'var(--font-display)' }}>{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              <FooterLink href="/">{t('nav.home')}</FooterLink>
              <FooterLink href="/products">{t('nav.products')}</FooterLink>
              <FooterLink href="/rfid">{t('nav.rfid')}</FooterLink>
              <FooterLink href="/login">{t('footer.sellerLogin')}</FooterLink>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-dark-brown mb-6" style={{ fontFamily: 'var(--font-display)' }}>{t('categories.title')}</h3>
            <ul className="space-y-3">
              <FooterLink href="/products?category=Seramik">{t('categories.Seramik')}</FooterLink>
              <FooterLink href="/products?category=Halı">{t('categories.Halı')}</FooterLink>
              <FooterLink href="/products?category=Kilim">{t('categories.Kilim')}</FooterLink>
              <FooterLink href="/products?category=Çömlek">{t('categories.Çömlek')}</FooterLink>
              <FooterLink href="/products?category=Vazo">{t('categories.Vazo')}</FooterLink>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-dark-brown mb-6" style={{ fontFamily: 'var(--font-display)' }}>{t('footer.contact')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-earth">
                <MapPin size={18} className="text-terracotta shrink-0 mt-0.5" />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-earth">
                <Phone size={18} className="text-terracotta shrink-0" />
                <span>+90 (384) 511 00 00</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-earth">
                <Mail size={18} className="text-terracotta shrink-0" />
                <span>hello@kapadokya.crafts</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-dark-brown/20 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-brown">
            © {new Date().getFullYear()} Kapadokya El Sanatları. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-6 text-sm text-dark-brown">
            <Link href="#" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t('footer.termsOfUse')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link href={href} className="text-sm text-dark-brown hover:text-white transition-colors">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ icon, href }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-xl bg-dark-brown/80 flex items-center justify-center text-stone hover:bg-terracotta hover:text-white transition-all"
    >
      {icon}
    </a>
  );
}

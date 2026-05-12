'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { tr } from '../locales/tr';
import { en } from '../locales/en';

const LanguageContext = createContext();

const dictionaries = {
  tr,
  en
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('tr');

  // Load saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Helper function to get nested keys (e.g., 'nav.home')
  const t = (key) => {
    const keys = key.split('.');
    let value = dictionaries[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to Turkish if key not found
        let fallback = dictionaries['tr'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return key; // return key itself if completely missing
          }
        }
        return fallback;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

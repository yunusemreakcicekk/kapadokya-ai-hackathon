'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { currencyService } from '../../services/currencyService';

export default function CurrencyTicker() {
  const [rates, setRates] = useState({ USD: null, EUR: null });
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      setLoading(true);
      // forceRefresh = true to bypass cache in currencyService
      const [usdRes, eurRes] = await Promise.all([
        currencyService.getExchangeRate('USD', true),
        currencyService.getExchangeRate('EUR', true)
      ]);
      setRates({
        USD: usdRes?.rate?.toFixed(2),
        EUR: eurRes?.rate?.toFixed(2)
      });
      setLastFetchTime(Date.now());
    } catch (e) {
      console.warn("Döviz çekme hatası", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch every 15 seconds
  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => {
      fetchRates();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update "seconds ago" timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastFetchTime]);

  return (
    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-cream/50 rounded-xl border border-stone/20 text-xs font-medium text-dark-brown mr-2">
      <div className="flex items-center gap-2">
        <span className="text-terracotta flex items-center gap-1">
          <span className="font-bold">$</span> 
          {rates.USD ? rates.USD : '...'}
        </span>
        <span className="text-stone-300">|</span>
        <span className="text-terracotta flex items-center gap-1">
          <span className="font-bold">€</span> 
          {rates.EUR ? rates.EUR : '...'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-earth border-l border-stone/20 pl-3">
        <RefreshCw size={10} className={loading ? 'animate-spin text-terracotta' : ''} />
        {secondsAgo} sn önce
      </div>
    </div>
  );
}

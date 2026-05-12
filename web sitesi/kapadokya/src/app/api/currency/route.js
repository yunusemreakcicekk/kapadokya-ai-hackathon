import { NextResponse } from 'next/server';

const SERIES_MAP = {
  USD: 'TP.DK.USD.S.YTL',
  EUR: 'TP.DK.EUR.S.YTL',
  GBP: 'TP.DK.GBP.S.YTL'
};

const TCMB_DAILY_RATES_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

function xmlText(source, tag) {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : null;
}

function parseCurrency(xml, code) {
  const blockMatch = xml.match(
    new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>([\\s\\S]*?)</Currency>`, "i"),
  );

  if (!blockMatch) {
    throw new Error(`${code} kuru TCMB yanıtında bulunamadı.`);
  }

  const block = blockMatch[1];
  return Number.parseFloat(xmlText(block, "ForexSelling"));
}

async function fetchFromXmlFallback(currency, seriesCode) {
  const response = await fetch(TCMB_DAILY_RATES_URL, {
    headers: {
      "User-Agent": "tcmb-currency-demo/1.0",
      Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`TCMB isteği başarısız: ${response.status}`);
  }

  const xml = await response.text();
  const date = xml.match(/Tarih="([^"]+)"/i)?.[1] || new Date().toLocaleDateString('tr-TR');
  
  let rate = parseCurrency(xml, currency);
  
  return {
    currency,
    rate,
    source: 'TCMB (XML)',
    seriesCode,
    lastUpdated: date,
    isDemo: false
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency');

  if (!currency || !SERIES_MAP[currency]) {
    return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
  }

  const seriesCode = SERIES_MAP[currency];
  const apiKey = process.env.EVDS_API_KEY;

  try {
    if (apiKey) {
      // EVDS API Key varsa EVDS üzerinden çekmeyi dene
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 5);
      
      const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
      };

      const startDate = formatDate(pastDate);
      const endDate = formatDate(today);

      const url = `https://evds2.tcmb.gov.tr/service/evds/series=${seriesCode}&startDate=${startDate}&endDate=${endDate}&type=json`;
      
      try {
        const response = await fetch(url, { headers: { 'key': apiKey }, cache: 'no-store' });
        
        if (response.ok) {
          const text = await response.text();
          // Eğer yanıt HTML ise (geçersiz key nedeniyle ana sayfaya yönlendirme gibi) JSON parse etmeden fallback yap
          if (!text.trim().startsWith('<')) {
            const data = JSON.parse(text);
            let rate = null;
            let lastUpdated = null;
            
            if (data.items && data.items.length > 0) {
              for (let i = data.items.length - 1; i >= 0; i--) {
                const item = data.items[i];
                if (item[seriesCode.replace(/\./g, '_')] !== null) {
                  rate = parseFloat(item[seriesCode.replace(/\./g, '_')]);
                  lastUpdated = item.Tarih;
                  break;
                }
              }
            }

            if (rate) {
              return NextResponse.json({
                currency, rate, source: 'TCMB EVDS', seriesCode, lastUpdated, isDemo: false
              });
            }
          }
        }
      } catch (evdsErr) {
        console.warn("EVDS fetch failed, falling back to XML:", evdsErr.message);
      }
    }

    // EVDS çalışmadıysa, key hatalıysa veya key hiç yoksa XML'den çek
    const xmlData = await fetchFromXmlFallback(currency, seriesCode);
    return NextResponse.json(xmlData);

  } catch (error) {
    console.error('Currency API Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

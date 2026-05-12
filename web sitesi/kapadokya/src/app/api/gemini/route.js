import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
    const { productName, category, materials, technique } = body;

    if (!GEMINI_API_KEY) {
      const fallbackStory = `${productName}, Kapadokya'nÄ±n eÅŸsiz ${category} geleneÄŸinin modern bir yorumudur. ${materials} kullanÄ±larak, usta ellerde ${technique} ile Ã¼retilmiÅŸtir. Binlerce yÄ±llÄ±k Anadolu kÃ¼ltÃ¼rel mirasÄ±nÄ± yaÅŸam alanlarÄ±nÄ±za taÅŸÄ±yan bu eser, eÅŸsiz bir sanat ve tarih sentezidir.`;
      return NextResponse.json({ story: fallbackStory });
    }

    const prompt = `Sen bir Kapadokya el sanatları uzmanısın. Aşağıdaki ürün için kısa ve etkileyici bir kültürel hikaye yaz (en fazla 3 cümle, Türkçe):
    
Ürün: ${productName}
Kategori: ${category}
Malzemeler: ${materials}
Üretim Tekniği: ${technique}

Hikaye, ürünün Kapadokya kültürel mirası ile bağlantısını vurgulamalı.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Gemini API Error (Quota/Limit vs):', JSON.stringify(data));
      // Hackathon için Fallback Hikaye: Kota dolsa bile jüri sunumunda çökmesin
      const fallbackStory = `${productName}, Kapadokya'nın eşsiz ${category} geleneğinin modern bir yorumudur. ${materials} kullanılarak, usta ellerde ${technique} ile üretilmiştir. Binlerce yıllık Anadolu kültürel mirasını yaşam alanlarınıza taşıyan bu eser, eşsiz bir sanat ve tarih sentezidir.`;
      
      return NextResponse.json({ story: fallbackStory });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json({ story: text?.trim() || '' });

  } catch (error) {
    console.error('Gemini Route Error:', error);
    // İnternet hatası vs için fallback
    const fallbackStory = `Kapadokya'nın binlerce yıllık el sanatı geleneği, bu özel ${body.category || 'eser'} ile yeniden hayat buluyor. Eşsiz işçiliği ile evinize tarihi bir dokunuş katar.`;
    return NextResponse.json({ story: fallbackStory });
  }
}

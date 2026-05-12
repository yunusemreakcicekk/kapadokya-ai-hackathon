import { NextResponse } from 'next/server';
import { getFirestore } from '../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized' }, { status: 500 });
    }

    // Try 'Urunler' collection (capital U as per screenshot)
    let snapshot = await db.collection('Urunler').get();
    
    // Fallback to 'urunler' if 'Urunler' is empty
    if (snapshot.empty) {
      snapshot = await db.collection('urunler').get();
    }

    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        productId: doc.id, // Her zaman dökümanın gerçek ID'sini kullan
        name: data.isim || 'İsimsiz Ürün',
        category: data.Category || 'Kategorisiz',
        description: data.Explanation || '',
        price: Number(data.fiyat || 0),
        images: data.imageBase64 ? [data.imageBase64] : (data.imageUrl ? [data.imageUrl] : []),
        stock: Number(data.capacity || 0),
        weightKg: Number(data.WeightKg || 0),
        productionLocation: data.SallerLocation || 'Avanos, Kapadokya',
        artisanName: data.ArtisanName || data.UretenKisi || 'Bilinmeyen Usta',
        transportType: data.CargoType || 'Kara',
        rfidCode: data.RFID || '',
        isVerified: true,
        
        // Satıcı bilgileri veritabanında olmadığı için varsayılan değerler
        artisanId: 'seller-001',
        materials: 'Yerel Malzeme',
        technique: 'El İşçiliği',
        culturalStory: 'Kapadokya bölgesinin otantik yapısına uygun olarak üretilmiştir.'
      };
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('API /products Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized' }, { status: 500 });
    }

    const body = await request.json();
    
    // Rastgele RFID (ID) oluştur (hackathon amaçlı)
    const newId = `RFID-${Math.floor(Math.random() * 100000)}`;
    
    const productData = {
      isim: body.name || '',
      Category: body.category || '',
      Explanation: body.description || '',
      fiyat: Number(body.price) || 0,
      imageUrl: body.imageUrl || '',
      imageBase64: body.imageBase64 || '',
      WeightKg: Number(body.weightKg) || 1.0,
      SallerLocation: body.productionLocation || 'Nevşehir, Turkey',
      ArtisanName: body.artisanName || '',
      CargoType: body.transportType || 'Kara',
      RFID: newId,
      capacity: Number(body.stock) || 1,
      createdAt: new Date().toISOString()
    };

    // Firebase'e yaz
    await db.collection('Urunler').doc(newId).set(productData);

    return NextResponse.json({ success: true, id: newId, data: productData });
  } catch (error) {
    console.error('API POST /products Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

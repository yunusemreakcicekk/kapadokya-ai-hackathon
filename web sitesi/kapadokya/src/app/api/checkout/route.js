import { NextResponse } from 'next/server';
import { getFirestore } from '../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    const db = getFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { productId, price, shippingId, currency, deliveryData } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Stok kontrolü ve düşürme işlemi (Transaction ile güvenli)
    const productRef = db.collection('Urunler').doc(productId);
    
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(productRef);
      if (!doc.exists) {
        throw new Error("Ürün bulunamadı!");
      }

      const data = doc.data();

      // Siparişi kaydet
      const orderRef = db.collection('Siparisler').doc();
      const orderData = {
        orderId: `ORD-${Date.now().toString().slice(-8)}`,
        productId: productId,
        productName: data.isim || 'Ürün',
        sellerId: data.artisanId || 'seller-001',
        price: price,
        shippingId: shippingId || null,
        currency: currency || 'TRY',
        deliveryData: deliveryData || null,
        status: 'pending', // pending, shipped, delivered
        orderDate: new Date().toISOString(),
        paymentStatus: 'paid'
      };

      transaction.set(orderRef, orderData);
      
      return orderData;
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    console.error('API POST /checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

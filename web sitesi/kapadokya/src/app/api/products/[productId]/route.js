import { NextResponse } from 'next/server';
import { getFirestore } from '../../../../lib/firebaseAdmin';

export async function PUT(request, { params }) {
  try {
    const db = getFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized' }, { status: 500 });
    }

    const { productId } = await params;
    const body = await request.json();
    
    // Firestore'da güncellenecek alanları hazırla
    const updateData = {};
    if (body.name !== undefined) updateData.isim = body.name;
    if (body.price !== undefined) updateData.fiyat = Number(body.price);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.imageBase64 !== undefined) updateData.imageBase64 = body.imageBase64;
    if (body.stock !== undefined) updateData.capacity = Number(body.stock);
    if (body.category !== undefined) updateData.Category = body.category;
    if (body.artisanName !== undefined) updateData.ArtisanName = body.artisanName;
    if (body.productionLocation !== undefined) updateData.SallerLocation = body.productionLocation;

    updateData.updatedAt = new Date().toISOString();

    // Firebase'de güncelle
    await db.collection('Urunler').doc(productId).update(updateData);

    return NextResponse.json({ success: true, id: productId });
  } catch (error) {
    console.error('API PUT /products/[id] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

export function getFirestore() {
  if (admin.apps.length > 0) {
    return admin.app().firestore();
  }

  try {
    const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK successfully initialized');
      return admin.firestore();
    } else {
      console.error('⚠️ serviceAccountKey.json bulunamadı. Lütfen proje kök dizinine ekleyin.');
      return null;
    }
  } catch (error) {
    console.error('🔥 Firebase başlatma hatası:', error);
    return null;
  }
}

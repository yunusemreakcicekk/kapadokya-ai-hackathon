const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUrls() {
  const snapshot = await db.collection('Urunler').get();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.imageUrl) {
      console.log(`ID: ${doc.id}, URL: ${data.imageUrl}`);
    }
  });
}

checkUrls();

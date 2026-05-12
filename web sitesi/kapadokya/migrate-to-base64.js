const admin = require('firebase-admin');
const fs = require('fs');
const https = require('https');

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function downloadAsBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects manually just in case, though google thumbnail might not redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadAsBase64(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download image: ${res.statusCode}`));
      }

      const contentType = res.headers['content-type'] || 'image/jpeg';
      const data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const base64 = buffer.toString('base64');
        resolve(`data:${contentType};base64,${base64}`);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function migrate() {
  console.log("Starting migration...");
  const snapshot = await db.collection('Urunler').get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.imageUrl && !data.imageBase64) {
      console.log(`Processing ID: ${doc.id}`);
      try {
        const base64Str = await downloadAsBase64(data.imageUrl);
        await db.collection('Urunler').doc(doc.id).update({
          imageBase64: base64Str
        });
        console.log(`✅ Successfully updated ID: ${doc.id}`);
      } catch (err) {
        console.error(`❌ Failed for ID: ${doc.id} - ${err.message}`);
      }
    } else if (data.imageBase64) {
      console.log(`⏩ Skipping ID: ${doc.id} (already has imageBase64)`);
    }
  }
  
  console.log("Migration completed.");
  process.exit(0);
}

migrate();

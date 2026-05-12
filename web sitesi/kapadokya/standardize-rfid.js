const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function generateUniqueRfid(existingIds) {
  let newId;
  do {
    newId = `RFID-${Math.floor(Math.random() * 100000)}`;
  } while (existingIds.has(newId));
  existingIds.add(newId);
  return newId;
}

async function standardizeRfids() {
  console.log("Starting RFID Standardization...");
  const snapshot = await db.collection('Urunler').get();
  
  // Track all used IDs to prevent duplicates
  const existingIds = new Set();
  snapshot.docs.forEach(doc => {
    if (doc.id.startsWith('RFID-')) {
      existingIds.add(doc.id);
    }
  });

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentId = doc.id;

    if (!currentId.startsWith('RFID-')) {
      // Needs a new ID
      const newId = generateUniqueRfid(existingIds);
      console.log(`Migrating ${currentId} -> ${newId} (${data.isim || 'İsimsiz'})`);
      
      const newData = { ...data, RFID: newId };
      
      // Create new doc
      await db.collection('Urunler').doc(newId).set(newData);
      // Delete old doc
      await db.collection('Urunler').doc(currentId).delete();
      console.log(`✅ Successfully migrated and deleted old doc.`);
    } else {
      // ID is correct, just ensure the RFID field inside matches
      if (data.RFID !== currentId) {
        console.log(`Updating internal RFID field for ${currentId}`);
        await db.collection('Urunler').doc(currentId).update({ RFID: currentId });
        console.log(`✅ Updated internal RFID.`);
      } else {
        console.log(`⏭️ ID ${currentId} is already standard.`);
      }
    }
  }
  
  console.log("RFID Standardization completed.");
  process.exit(0);
}

standardizeRfids();

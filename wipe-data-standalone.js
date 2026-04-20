const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('Missing Firebase Admin environment variables in .env.local');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function wipeData() {
  console.log('--- Starting Data Wipe (Standalone) ---');
  
  const collections = ['restaurants', 'menus', 'orders', 'settings'];
  
  for (const colName of collections) {
    console.log(`Wiping collection: ${colName}...`);
    const snapshot = await db.collection(colName).get();
    
    if (snapshot.empty) {
      console.log(`Collection ${colName} is already empty.`);
      continue;
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} documents from ${colName}.`);
  }

  console.log('--- Wipe Complete ---');
}

wipeData().catch(err => {
  console.error('Wipe failed:', err);
  process.exit(1);
});

const admin = require('firebase-admin');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = env.match(new RegExp(key + '="?([^\\n"]*)"?'));
  return match ? match[1] : null;
};

const serviceAccount = {
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  clientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
  privateKey: getEnv('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  if (snapshot.size === 0) return;
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

async function wipeAll() {
  const collections = ['restaurants', 'menus', 'orders', 'messages', 'settings'];
  console.log('Starting full database wipe...');
  for (const coll of collections) {
    try {
      console.log(`Deleting ${coll}...`);
      await deleteCollection(coll);
    } catch (e) {
      console.log(`Skip ${coll}: ${e.message}`);
    }
  }
  console.log('Database wipe complete!');
  process.exit(0);
}

wipeAll();

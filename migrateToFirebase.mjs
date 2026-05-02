import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const migrate = async () => {
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      await set(ref(db, '/'), data);
      console.log("Migration to Firebase completed successfully.");
    } else {
      console.log("No local data.json found.");
    }
  } catch (error) {
    console.error("Error migrating:", error);
  }
  process.exit();
};

migrate();

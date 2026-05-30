import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB2eI498qsMcghoSQgzvx6ZO1cvPF4oVFw",
  authDomain: "frameapp-ce456.firebaseapp.com",
  databaseURL: "https://frameapp-ce456-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "frameapp-ce456",
  storageBucket: "frameapp-ce456.firebasestorage.app",
  messagingSenderId: "98784998076",
  appId: "1:98784998076:web:d112459eb1b8cce64116b9",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app, "https://frameapp-ce456-default-rtdb.asia-southeast1.firebasedatabase.app");

async function check() {
  try {
    console.log("Connecting to Firebase...");
    for (const key of ['invoices', 'billingInvoices', 'contracts', 'supervision', 'attachments']) {
      try {
        console.log(`Checking /${key}...`);
        const snap = await get(ref(db, `/${key}`));
        if (snap.exists()) {
          console.log(`/${key} read SUCCESS. Keys count:`, Object.keys(snap.val()).length);
        } else {
          console.log(`/${key} read SUCCESS (empty).`);
        }
      } catch (err) {
        console.error(`Error on /${key}:`, err.message);
      }
    }
  } catch (err) {
    console.error("General error:", err);
  }
  process.exit();
}

check();

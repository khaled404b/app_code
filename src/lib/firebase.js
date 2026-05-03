import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage } from "firebase/storage";

// THE ONLY SOURCE OF TRUTH FOR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB2eI498qsMcghoSQgzvx6ZO1cvPF4oVFw",
  authDomain: "frameapp-ce456.firebaseapp.com",
  databaseURL: "https://frameapp-ce456-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "frameapp-ce456",
  storageBucket: "frameapp-ce456.firebasestorage.app",
  messagingSenderId: "98784998076",
  appId: "1:98784998076:web:d112459eb1b8cce64116b9",
  measurementId: "G-LYZ7F0LKQZ"
};

// Singleton pattern to ensure only one instance exists
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Force the database to use the specific regional URL provided
export const db = getDatabase(app, "https://frameapp-ce456-default-rtdb.asia-southeast1.firebasedatabase.app");
export const storage = getStorage(app);

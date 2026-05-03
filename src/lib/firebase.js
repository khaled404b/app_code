import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Hardcoded config is necessary for Surge static deployment to ensure connectivity
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
export const storage = getStorage(app);

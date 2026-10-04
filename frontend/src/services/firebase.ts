import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Public Firebase Web Client Configuration
// Safe for client application bundle per Firebase architecture
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyClkRXsh3sO0O_Ql0brcdnDcqIWwHAMJoo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "proofline-527f4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "proofline-527f4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "proofline-527f4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1038661227752",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1038661227752:web:7b3f28c983f6d07c0e655d",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

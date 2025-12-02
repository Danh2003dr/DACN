import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
// Lấy từ environment variables hoặc dùng config mặc định
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyACqT54Gs7kFLR9L0mxBywlGn3tlb2Nko0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "drug-traceability-system-d89c1.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "drug-traceability-system-d89c1",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "drug-traceability-system-d89c1.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "874430072046",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:874430072046:web:9f7e282ff5b05895eb1fff",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-4BLHL8MNOY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;


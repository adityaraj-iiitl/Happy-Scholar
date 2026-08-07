import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDBpjaSrIkhQMa5wEQ9LHCndg0Gb301E3U",
  authDomain: "happyscholar-f098c.firebaseapp.com",
  projectId: "happyscholar-f098c",
  storageBucket: "happyscholar-f098c.firebasestorage.app",
  messagingSenderId: "682246569082",
  appId: "1:682246569082:web:691d6d4932141bac6c0fc3",
  measurementId: "G-6VQ8SDHJ23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and export
export const auth = getAuth(app);

// Configure and export Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
// Force selecting account during login popup
googleProvider.setCustomParameters({ prompt: 'select_account' });

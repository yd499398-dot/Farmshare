import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

// Firebase is retained only for the optional Google OAuth popup.
// Application data, users, OTPs, rentals, reviews and saved items are stored in MongoDB.
const firebaseConfig = {
  apiKey: "AIzaSyBUxOtcTi4ZtcV0qI7SqFVaShJ0bKyr04w",
  authDomain: "infinite-palisade-ldpgw.firebaseapp.com",
  projectId: "infinite-palisade-ldpgw",
  storageBucket: "infinite-palisade-ldpgw.firebasestorage.app",
  messagingSenderId: "87435493865",
  appId: "1:87435493865:web:704e7a85990a53ac87cb78"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };

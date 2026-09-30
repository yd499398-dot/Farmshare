import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaP0gU3rPjaw8859wHWRYve7hIQZoheKg",
  authDomain: "project-ea3ce.firebaseapp.com",
  projectId: "project-ea3ce",
  storageBucket: "project-ea3ce.firebasestorage.app",
  messagingSenderId: "442425642170",
  appId: "1:442425642170:web:5cfa1584017d37fe9c8683",
  measurementId: "G-90LB6TBGFB"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Explicitly export every function App.tsx expects
export { signInWithPopup, signOut, onAuthStateChanged };
export default app;

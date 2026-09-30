import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaP0gU3rPjaw8859wHWRYve7hIQZoheKg",
  authDomain: "project-ea3ce.firebaseapp.com",
  projectId: "project-ea3ce",
  storageBucket: "project-ea3ce.firebasestorage.app",
  messagingSenderId: "442425642170",
  appId: "1:442425642170:web:5cfa1584017d37fe9c8683"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { signInWithPopup };
export default app;

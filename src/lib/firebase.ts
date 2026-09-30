import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaP0gU3rPjaw8859wHWRYve7hIQZoheKg",
  authDomain: "project-ea3ce.firebaseapp.com",
  projectId: "project-ea3ce",
  storageBucket: "project-ea3ce.firebasestorage.app",
  messagingSenderId: "442425642170",
  appId: "1:442425642170:web:5cfa1584017d37fe9c8683",
  measurementId: "G-90LB6TBGFB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

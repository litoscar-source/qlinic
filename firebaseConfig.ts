
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASxr0MMlP5Mw6AKlY_zD9_CZMT0ihhDZw",
  authDomain: "qlinic-37fb5.firebaseapp.com",
  projectId: "qlinic-37fb5",
  storageBucket: "qlinic-37fb5.firebasestorage.app",
  messagingSenderId: "282563051376",
  appId: "1:282563051376:web:45c1f85335d23dea6b59b5",
  measurementId: "G-75C0YERVYF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app); // EXTREMAMENTE IMPORTANTE: Exportar o db para o App.tsx usar
export const analytics = getAnalytics(app);

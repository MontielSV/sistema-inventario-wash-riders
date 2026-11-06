import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Aquí va la configuración oficial de tu proyecto de Firebase
// Usamos variables de entorno para mayor seguridad en tu proyecto de grado
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "TU_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "TU_DOMINIO",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "TU_PROYECTO",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "TU_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "TU_SENDER",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "TU_APP_ID"
};

// Verificamos si Firebase ya arrancó para que Next.js no lo intente cargar dos veces y genere error
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportamos las herramientas que vamos a usar en las demás páginas
export const db = getFirestore(app); // Para el catálogo de arepas en tiempo real
export const auth = getAuth(app);    // Para el login del administrador
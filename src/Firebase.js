import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzxbzE7i72wVd74HFul2ILMiPlNOjE_A8",
  authDomain: "los-de-nunca.firebaseapp.com",
  projectId: "los-de-nunca",
  storageBucket: "los-de-nunca.firebasestorage.app",
  messagingSenderId: "49466152826",
  appId: "1:49466152826:web:15323d500963541d6ee8c3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Ta configuration Firebase (à remplacer par tes valeurs)
const firebaseConfig = {
  apiKey: "AIzaSyAvzBdwVqiicoY-0gx8D5hGZzRjHU52Z4g",
  authDomain: "planning-maritime-loick.firebaseapp.com",
  projectId: "planning-maritime-loick",
  storageBucket: "planning-maritime-loick.firebasestorage.app",
  messagingSenderId: "432495659193",
  appId: "1:432495659193:web:10a4dca69937e58490f368",
  measurementId: "G-CFMB6Z73DG"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
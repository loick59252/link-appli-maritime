// src/services/primes.ts
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export const getPrimes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "primes"));
    const primes: any[] = [];
    querySnapshot.forEach((doc) => {
      primes.push({ id: doc.id, ...doc.data() });
    });
    return primes;
  } catch (error) {
    console.error("Erreur lors de la récupération des primes:", error);
    return [];
  }
};
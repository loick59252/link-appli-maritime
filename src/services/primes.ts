// src/services/primes.ts
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export const getPrimes = async () => {
  try {
    const primesRef = collection(db, "primes"); // ✅ Vérifie que le nom de la collection est exact
    const querySnapshot = await getDocs(primesRef);

    if (querySnapshot.empty) {
      console.warn("Aucune prime trouvée dans la collection 'primes'.");
      return [];
    }

    const primes: any[] = [];
    querySnapshot.forEach((doc) => {
      primes.push({ id: doc.id, ...doc.data() });
    });

    console.log("Primes chargées depuis Firebase:", primes); // ✅ Debug
    return primes;
  } catch (error) {
    console.error("Erreur Firestore dans getPrimes:", error);
    return [];
  }
};
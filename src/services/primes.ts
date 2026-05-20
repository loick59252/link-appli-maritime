// src/services/primes.ts
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

type Prime = {
  id: string;
  nom: string;
  montant: number;
};

export const getPrimes = async (): Promise<Prime[]> => {
  const querySnapshot = await getDocs(collection(db, "primes"));
  const primes: Prime[] = [];
  querySnapshot.forEach((doc) => {
    primes.push({ id: doc.id, ...doc.data() } as Prime);
  });
  return primes;
};

export const ajouterPrime = async (prime: Omit<Prime, 'id'>) => {
  const docRef = await addDoc(collection(db, "primes"), prime);
  return docRef.id;
};

export const supprimerPrime = async (id: string) => {
  await deleteDoc(doc(db, "primes", id));
};

export const mettreAJourPrime = async (id: string, prime: Partial<Prime>) => {
  await updateDoc(doc(db, "primes", id), prime);
};
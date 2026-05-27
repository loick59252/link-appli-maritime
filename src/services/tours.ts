// src/services/tours.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from 'firebase/firestore';
import type { Tour } from '../types';

export type { Tour };

export const ajouterTour = async (tour: Omit<Tour, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'tours'), tour);
  return docRef.id;
};

export const mettreAJourTour = async (id: string, data: Partial<Tour>): Promise<void> => {
  await updateDoc(doc(db, 'tours', id), data);
};

export const supprimerTour = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'tours', id));
};

export const getTours = async (): Promise<Tour[]> => {
  const snapshot = await getDocs(collection(db, 'tours'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour));
};

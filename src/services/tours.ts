// src/services/tours.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where } from 'firebase/firestore';
import type { Tour } from '../types';

export type { Tour };

const sansValeursUndefined = <T extends object>(data: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

export const ajouterTour = async (tour: Omit<Tour, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'tours'), sansValeursUndefined(tour));
  return docRef.id;
};

export const mettreAJourTour = async (id: string, data: Partial<Tour>): Promise<void> => {
  await updateDoc(doc(db, 'tours', id), sansValeursUndefined(data));
};

export const supprimerTour = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'tours', id));
};

export const getTours = async (): Promise<Tour[]> => {
  const snapshot = await getDocs(collection(db, 'tours'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour));
};

export const getToursParEntreprise = async (entrepriseId: string): Promise<Tour[]> => {
  const q = query(collection(db, 'tours'), where('entrepriseId', '==', entrepriseId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour));
};

// src/services/saisons.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where } from 'firebase/firestore';
import type { Saison } from '../types';

export type { Saison };

export const ajouterSaison = async (saison: Omit<Saison, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'saisons'), saison);
  return docRef.id;
};

export const mettreAJourSaison = async (id: string, data: Partial<Saison>): Promise<void> => {
  await updateDoc(doc(db, 'saisons', id), data);
};

export const supprimerSaison = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'saisons', id));
};

export const getSaisons = async (): Promise<Saison[]> => {
  const snapshot = await getDocs(collection(db, 'saisons'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Saison));
};

export const getSaisonsParEntreprise = async (entrepriseId: string): Promise<Saison[]> => {
  const q = query(collection(db, 'saisons'), where('entrepriseId', '==', entrepriseId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Saison));
};

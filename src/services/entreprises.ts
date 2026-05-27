// src/services/entreprises.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from 'firebase/firestore';
import type { Entreprise } from '../types';

export type { Entreprise };

export const ajouterEntreprise = async (entreprise: Omit<Entreprise, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'entreprises'), entreprise);
  return docRef.id;
};

export const mettreAJourEntreprise = async (id: string, data: Partial<Entreprise>): Promise<void> => {
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await updateDoc(doc(db, 'entreprises', id), cleaned);
};

export const supprimerEntreprise = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'entreprises', id));
};

export const getEntreprises = async (): Promise<Entreprise[]> => {
  const snapshot = await getDocs(collection(db, 'entreprises'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entreprise));
};

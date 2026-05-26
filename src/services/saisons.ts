// src/services/saisons.ts
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc
} from "firebase/firestore";

export type Saison = {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
};

export const ajouterSaison = async (saison: Omit<Saison, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'saisons'), saison);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la saison:", error);
    throw error;
  }
};

export const mettreAJourSaison = async (id: string, saison: Partial<Saison>) => {
  try {
    await updateDoc(doc(db, 'saisons', id), saison);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la saison:", error);
    throw error;
  }
};

export const supprimerSaison = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'saisons', id));
  } catch (error) {
    console.error("Erreur lors de la suppression de la saison:", error);
    throw error;
  }
};

export const getSaisons = async (): Promise<Saison[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'saisons'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Saison[];
  } catch (error) {
    console.error("Erreur lors de la récupération des saisons:", error);
    throw error;
  }
};
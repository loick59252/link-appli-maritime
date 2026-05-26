// src/services/entreprises.ts
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc
} from "firebase/firestore";

export type Entreprise = {
  id: string;
  nom: string;
  couleur: string;
  logo?: string;
  salaires: {
    matelot: { montant: number; isBrut: boolean };
    capitaine: { montant: number; isBrut: boolean };
  };
  primes: {
    id: string;
    nom: string;
    montant: number;
    isBrut: boolean;
    applicableA: 'Matelot' | 'Capitaine' | 'Tous';
  }[];
};

export const ajouterEntreprise = async (entreprise: Omit<Entreprise, 'id'>): Promise<string> => {
  try {
    const entrepriseSansId = { ...entreprise };
    delete entrepriseSansId.id;
    const docRef = await addDoc(collection(db, 'entreprises'), entrepriseSansId);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'entreprise:", error);
    throw error;
  }
};

export const mettreAJourEntreprise = async (id: string, entreprise: Partial<Entreprise>) => {
  try {
    const entrepriseNettoyee = Object.fromEntries(
      Object.entries(entreprise).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(doc(db, 'entreprises', id), entrepriseNettoyee);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entreprise:", error);
    throw error;
  }
};

export const supprimerEntreprise = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'entreprises', id));
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entreprise:", error);
    throw error;
  }
};

export const getEntreprises = async (): Promise<Entreprise[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'entreprises'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Entreprise[];
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises:", error);
    throw error;
  }
};
// src/services/saisons.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// Types locaux
type Saison = {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
};

// Ajouter une saison
export const ajouterSaison = async (saison: Omit<Saison, 'id'>) => {
  const docRef = await addDoc(collection(db, "saisons"), saison);
  return docRef.id;
};

// Récupérer toutes les saisons
export const getSaisons = async (): Promise<Saison[]> => {
  const querySnapshot = await getDocs(collection(db, "saisons"));
  const saisons: Saison[] = [];
  querySnapshot.forEach((doc) => {
    saisons.push({ id: doc.id, ...doc.data() } as Saison);
  });
  return saisons;
};

// Supprimer une saison
export const supprimerSaison = async (id: string) => {
  await deleteDoc(doc(db, "saisons", id));
};

// Mettre à jour une saison
export const mettreAJourSaison = async (id: string, saison: Partial<Saison>) => {
  await updateDoc(doc(db, "saisons", id), saison);
};
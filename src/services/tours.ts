// src/services/tours.ts
import {
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  doc
} from '../firebaseConfig'; // ✅ Import depuis firebaseConfig

export type Tour = {
  id: string;
  numero: string;
  saisonId: string;
  entrepriseId: string;
  heurePriseService: string;
  heureDepartPause?: string;
  heureReprise?: string;
  heureFinService: string;
  lignesDestinations: string[];
  primes?: { id: string; nom: string; montant: number }[];
};

export const ajouterTour = async (tour: Omit<Tour, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'tours'), tour);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du tour:", error);
    throw error;
  }
};

export const mettreAJourTour = async (id: string, tour: Partial<Tour>) => {
  try {
    await updateDoc(doc(db, 'tours', id), tour);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tour:", error);
    throw error;
  }
};

export const supprimerTour = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'tours', id));
  } catch (error) {
    console.error("Erreur lors de la suppression du tour:", error);
    throw error;
  }
};

export const getTours = async (): Promise<Tour[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'tours'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tour[];
  } catch (error) {
    console.error("Erreur lors de la récupération des tours:", error);
    throw error;
  }
};

export const getToursParEntreprise = async (entrepriseId: string): Promise<Tour[]> => {
  try {
    const q = query(collection(db, 'tours'), where('entrepriseId', '==', entrepriseId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tour[];
  } catch (error) {
    console.error(`Erreur lors de la récupération des tours pour l'entreprise ${entrepriseId}:`, error);
    throw error;
  }
};
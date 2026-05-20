// src/services/tours.ts
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { RDTPM_ID } from '../App';

type Prime = { id: string; nom: string; montant: number };
type Tour = {
  id: string;
  numero: string;
  saisonId: string;
  entrepriseId?: string;
  heurePriseService: string;
  heureDepartPause?: string;
  heureReprise?: string;
  heureFinService: string;
  lignesDestinations: string[];
  primes?: Prime[];
};

export const getTours = async (): Promise<Tour[]> => {
  const querySnapshot = await getDocs(collection(db, "tours"));
  const tours: Tour[] = [];
  querySnapshot.forEach((doc) => {
    const tourData = doc.data();
    if (!tourData.entrepriseId) {
      tourData.entrepriseId = RDTPM_ID; // Rétrocompatibilité
    }
    tours.push({ id: doc.id, ...tourData } as Tour);
  });
  return tours;
};

export const getToursParSaison = async (saisonId: string): Promise<Tour[]> => {
  const q = query(collection(db, "tours"), where("saisonId", "==", saisonId));
  const querySnapshot = await getDocs(q);
  const tours: Tour[] = [];
  querySnapshot.forEach((doc) => {
    tours.push({ id: doc.id, ...doc.data() } as Tour);
  });
  return tours;
};

export const ajouterTour = async (tour: Omit<Tour, 'id'>) => {
  const docRef = await addDoc(collection(db, "tours"), tour);
  return docRef.id;
};

export const supprimerTour = async (id: string) => {
  await deleteDoc(doc(db, "tours", id));
};

export const mettreAJourTour = async (id: string, tour: Partial<Tour>) => {
  await updateDoc(doc(db, "tours", id), tour);
};
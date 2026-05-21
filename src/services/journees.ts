// src/services/journees.ts
import { db } from '../firebaseConfig'; // ✅ ./firebaseConfig
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';

// Types
type Prime = { id: string; nom: string; montant: number };
type Journee = {
  id: string;
  date: string;
  entrepriseId: string;
  role: 'Matelot' | 'Capitaine';
  tourId?: string;
  saisonId?: string;
  heurePriseService: string;
  heureDepartPause?: string;
  heureReprise?: string;
  heureFinService: string;
  lignesDestinations?: string[];
  primes: Prime[];
  notes?: string;
};

// Fonctions
export const ajouterJournee = async (journee: Omit<Journee, 'id'>) => {
  const docRef = await addDoc(collection(db, "journees"), journee);
  return docRef.id;
};

export const getJournees = async (): Promise<Journee[]> => {
  const querySnapshot = await getDocs(collection(db, "journees"));
  const journees: Journee[] = [];
  querySnapshot.forEach((doc) => {
    journees.push({ id: doc.id, ...doc.data() } as Journee);
  });
  return journees;
};

export const getJourneesParDate = async (date: string): Promise<Journee[]> => {
  const q = query(collection(db, "journees"), where("date", "==", date));
  const querySnapshot = await getDocs(q);
  const journees: Journee[] = [];
  querySnapshot.forEach((doc) => {
    journees.push({ id: doc.id, ...doc.data() } as Journee);
  });
  return journees;
};

export const supprimerJournee = async (id: string) => {
  await deleteDoc(doc(db, "journees", id));
};

export const mettreAJourJournee = async (id: string, journee: Partial<Journee>) => {
  await updateDoc(doc(db, "journees", id), journee);
};

/**
 * Récupère toutes les journées pour un mois donné
 */
export const getJourneesParMois = async (annee: number, mois: number) => {
  const startDate = new Date(annee, mois - 1, 1);
  const endDate = new Date(annee, mois, 0, 23, 59, 59);

  const q = query(
    collection(db, "journees"),
    where("date", ">=", startDate.toISOString().split('T')[0]),
    where("date", "<=", endDate.toISOString().split('T')[0])
  );

  const querySnapshot = await getDocs(q);
  const journees: any[] = [];
  querySnapshot.forEach((doc) => {
    journees.push({ id: doc.id, ...doc.data() });
  });
  return journees;
};
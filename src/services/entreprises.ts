// src/services/entreprises.ts
import {
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc
} from '../firebaseConfig';

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

/**
 * Ajoute une nouvelle entreprise
 * @param entreprise - Les données de l'entreprise (SANS l'ID)
 */
export const ajouterEntreprise = async (entreprise: Omit<Entreprise, 'id'>): Promise<string> => {
  try {
    // ✅ On s'assure qu'il n'y a pas de champ 'id' dans l'objet
    const entrepriseSansId = { ...entreprise };
    delete entrepriseSansId.id; // Supprime le champ id s'il existe

    const docRef = await addDoc(collection(db, 'entreprises'), entrepriseSansId);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'entreprise:", error);
    throw error;
  }
};

/**
 * Met à jour une entreprise existante
 */
export const mettreAJourEntreprise = async (id: string, entreprise: Partial<Entreprise>) => {
  try {
    // ✅ On supprime les champs undefined pour éviter les erreurs Firebase
    const entrepriseNettoyee = Object.fromEntries(
      Object.entries(entreprise).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(doc(db, 'entreprises', id), entrepriseNettoyee);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entreprise:", error);
    throw error;
  }
};

/**
 * Récupère toutes les entreprises
 */
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
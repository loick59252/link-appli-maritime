// src/services/entreprises.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// Définis les types directement ici
type Prime = {
  id: string;
  nom: string;
  montant: number;
};

type Entreprise = {
  id: string;
  nom: string;
  salaireMatelot: number;
  salaireCapitaine: number;
  primes: Prime[];
};

// Ajoute une entreprise
export const ajouterEntreprise = async (entreprise: Omit<Entreprise, 'id'>) => {
  const docRef = await addDoc(collection(db, "entreprises"), entreprise);
  return docRef.id;
};

// Récupère toutes les entreprises
export const getEntreprises = async (): Promise<Entreprise[]> => {
  const querySnapshot = await getDocs(collection(db, "entreprises"));
  const entreprises: Entreprise[] = [];
  querySnapshot.forEach((doc) => {
    entreprises.push({ id: doc.id, ...doc.data() } as Entreprise);
  });
  return entreprises;
};

// Supprime une entreprise
export const supprimerEntreprise = async (id: string) => {
  await deleteDoc(doc(db, "entreprises", id));
};

// Met à jour une entreprise
export const mettreAJourEntreprise = async (id: string, entreprise: Partial<Entreprise>) => {
  await updateDoc(doc(db, "entreprises", id), entreprise);
};
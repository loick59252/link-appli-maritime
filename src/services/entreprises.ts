// src/services/entreprises.ts
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

type Entreprise = {
  id: string;
  nom: string;
  couleur: string;
  salaireBase: number;
  isSalaireBrut: boolean; // ✅ Nouveau: true = brut, false = net
  primes: {
    id: string;
    nom: string;
    montant: number;
    isBrut: boolean; // ✅ Nouveau: pour chaque prime
  }[];
};

export const getEntreprises = async (): Promise<Entreprise[]> => {
  const querySnapshot = await getDocs(collection(db, "entreprises"));
  const entreprises: Entreprise[] = [];
  querySnapshot.forEach((doc) => {
    entreprises.push({ id: doc.id, ...doc.data() } as Entreprise);
  });
  return entreprises;
};

export const ajouterEntreprise = async (entreprise: Omit<Entreprise, 'id'>) => {
  const docRef = await addDoc(collection(db, "entreprises"), entreprise);
  return docRef.id;
};

export const supprimerEntreprise = async (id: string) => {
  await deleteDoc(doc(db, "entreprises", id));
};

export const mettreAJourEntreprise = async (id: string, entreprise: Partial<Entreprise>) => {
  await updateDoc(doc(db, "entreprises", id), entreprise);
};

export const getEntrepriseById = async (id: string) => {
  const docRef = doc(db, "entreprises", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    console.warn("Aucune entreprise trouvée avec l'ID:", id);
    return null;
  }
};
// src/services/journees.ts
import { db, collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, doc } from '../firebaseConfig';

// ✅ Fonction pour normaliser les dates (supprime le décalage UTC)
const normalizeDate = (date: string | Date): string => {
  const d = new Date(date);
  // Crée une nouvelle date à minuit (heure locale) pour éviter les problèmes de fuseau horaire
  const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return normalized.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

export const ajouterJournee = async (journee: any): Promise<string> => {
  try {
    const normalizedJournee = {
      ...journee,
      date: normalizeDate(journee.date) // ✅ Normalise la date
    };
    const docRef = await addDoc(collection(db, 'journees'), normalizedJournee);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la journée:", error);
    throw error;
  }
};

export const mettreAJourJournee = async (id: string, journee: any) => {
  try {
    const normalizedJournee = {
      ...journee,
      date: normalizeDate(journee.date) // ✅ Normalise la date
    };
    await updateDoc(doc(db, 'journees', id), normalizedJournee);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la journée:", error);
    throw error;
  }
};

export const supprimerJournee = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'journees', id));
  } catch (error) {
    console.error("Erreur lors de la suppression de la journée:", error);
    throw error;
  }
};

export const getJourneesParMois = async (year: number, month: number): Promise<any[]> => {
  try {
    // ✅ Utilise des dates normalisées pour la requête
    const startDate = normalizeDate(new Date(year, month - 1, 1));
    const endDate = normalizeDate(new Date(year, month, 0));

    const q = query(
      collection(db, 'journees'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Erreur lors de la récupération des journées:`, error);
    throw error;
  }
};
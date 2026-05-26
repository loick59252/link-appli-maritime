// src/services/journees.ts
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

export const ajouterJournee = async (journee: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'journees'), journee);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la journée:", error);
    throw error;
  }
};

export const mettreAJourJournee = async (id: string, journee: any) => {
  try {
    await updateDoc(doc(db, 'journees', id), journee);
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
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

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
    console.error(`Erreur lors de la récupération des journées pour ${month}/${year}:`, error);
    throw error;
  }
};
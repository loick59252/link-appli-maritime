// src/services/journees.ts
import { db, collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, doc } from '../firebaseConfig';
import type { Journee } from '../types';

/**
 * Formate une date en "YYYY-MM-DD" en heure locale (évite le décalage UTC).
 * C'est le vrai fix du bug de dates Firebase mentionné dans le README.
 */
const toLocalDateString = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ajouterJournee = async (journee: Omit<Journee, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'journees'), {
    ...journee,
    date: toLocalDateString(journee.date),
  });
  return docRef.id;
};

export const mettreAJourJournee = async (id: string, journee: Partial<Journee>): Promise<void> => {
  const data = journee.date
    ? { ...journee, date: toLocalDateString(journee.date) }
    : journee;
  await updateDoc(doc(db, 'journees', id), data);
};

export const supprimerJournee = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'journees', id));
};

export const getJourneesParMois = async (year: number, month: number): Promise<Journee[]> => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const q = query(
    collection(db, 'journees'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Journee));
};

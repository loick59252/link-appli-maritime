// src/utils/calculs.ts
import type { Journee, Entreprise, Role } from '../types';

/** Convertit "HH:MM" en minutes depuis minuit */
const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Calcule la durée travaillée d'une journée en minutes */
export const calculerMinutesJournee = (journee: Journee): number => {
  let totalMinutes = toMinutes(journee.heureFinService) - toMinutes(journee.heurePriseService);
  if (journee.heureDepartPause && journee.heureReprise) {
    totalMinutes -= toMinutes(journee.heureReprise) - toMinutes(journee.heureDepartPause);
  }
  return Math.max(0, totalMinutes);
};

/** Calcule la durée travaillée d'une journée en heures décimales */
export const calculerHeuresJournee = (journee: Journee): number =>
  calculerMinutesJournee(journee) / 60;

/** Formate des minutes en "Xh Ymin" */
export const formatDureeHHMM = (totalMinutes: number): string => {
  const heures = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${heures}h ${minutes}min` : `${heures}h`;
};

/** Calcule le salaire brut d'une journée */
export const calculerSalaireJournee = (journee: Journee, entreprise: Entreprise): number => {
  const heures = calculerHeuresJournee(journee);
  const salaireConfig = journee.role === 'Capitaine'
    ? entreprise.salaires.capitaine
    : entreprise.salaires.matelot;

  const salaireBase = salaireConfig.montant * heures;

  let primesMontant = 0;
  if (journee.primes && entreprise.primes) {
    for (const primeId of journee.primes) {
      const prime = entreprise.primes.find(
        p => p.id === primeId && (p.applicableA === 'Tous' || p.applicableA === journee.role)
      );
      if (prime) primesMontant += prime.montant;
    }
  }

  return salaireBase + primesMontant;
};

/** Convertit un salaire brut/net en brut et net */
export const normaliserSalaire = (
  montant: number,
  isBrut: boolean
): { brut: number; net: number } => {
  const RATIO = 1.22;
  return isBrut
    ? { brut: montant, net: montant / RATIO }
    : { brut: montant * RATIO, net: montant };
};

export type StatsMois = {
  joursTravailes: number;
  heuresTotales: number;
  minutesTotales: number;
  salaireBrut: number;
  salaireNet: number;
};

/** Calcule les stats globales pour une liste de journées */
export const calculerStatsMois = (journees: Journee[], entreprises: Entreprise[]): StatsMois => {
  let joursTravailes = 0;
  let minutesTotales = 0;
  let salaireBrut = 0;
  let salaireNet = 0;

  for (const journee of journees) {
    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
    if (!entreprise) continue;

    joursTravailes++;
    const minutes = calculerMinutesJournee(journee);
    minutesTotales += minutes;

    const salaire = calculerSalaireJournee(journee, entreprise);
    const role: Role = journee.role;
    const isBrut = role === 'Capitaine'
      ? entreprise.salaires.capitaine.isBrut
      : entreprise.salaires.matelot.isBrut;

    const { brut, net } = normaliserSalaire(salaire, isBrut);
    salaireBrut += brut;
    salaireNet += net;
  }

  return {
    joursTravailes,
    minutesTotales,
    heuresTotales: minutesTotales / 60,
    salaireBrut,
    salaireNet,
  };
};

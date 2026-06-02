// src/utils/calculs.ts
import type { Journee, Entreprise, Role } from '../types';
import { estJourneeTravaillee } from './statutsJournee';

/** Convertit "HH:MM" en minutes depuis minuit */
const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Calcule la durée travaillée d'une journée en minutes */
export const calculerMinutesJournee = (journee: Journee): number => {
  if (!estJourneeTravaillee(journee)) return 0;
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
  if (!estJourneeTravaillee(journee)) return 0;
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

const roleMatches = (applicableA: 'Matelot' | 'Capitaine' | 'Tous', role: Role): boolean =>
  applicableA === 'Tous' || applicableA === role;

const getStartOfWeekKey = (dateStr: string): string => {
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export type DetailHeuresSupp = {
  entrepriseId: string;
  role: Role;
  semaine: string;
  nom: string;
  minutes: number;
  tauxMajoration: number;
  montantMajoration: number;
  isBrut: boolean;
};

export type DetailModulation = {
  entrepriseId: string;
  role: Role;
  semaine: string;
  nom: string;
  minutes: number;
};

export type AnalyseHebdomadaire = {
  modulationMinutes: number;
  heuresSupplementairesMinutes: number;
  majorationHeuresSupplementairesBrut: number;
  majorationHeuresSupplementairesNet: number;
  detailsHeuresSupplementaires: DetailHeuresSupp[];
  detailsModulation: DetailModulation[];
};

export const analyserReglesHebdomadaires = (
  journees: Journee[],
  entreprises: Entreprise[]
): AnalyseHebdomadaire => {
  const groupes = new Map<string, { entreprise: Entreprise; role: Role; semaine: string; minutes: number }>();

  for (const journee of journees) {
    if (!estJourneeTravaillee(journee)) continue;
    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
    if (!entreprise) continue;
    const semaine = getStartOfWeekKey(journee.date);
    const key = `${entreprise.id}-${journee.role}-${semaine}`;
    const current = groupes.get(key) ?? { entreprise, role: journee.role, semaine, minutes: 0 };
    current.minutes += calculerMinutesJournee(journee);
    groupes.set(key, current);
  }

  const detailsHeuresSupplementaires: DetailHeuresSupp[] = [];
  const detailsModulation: DetailModulation[] = [];

  for (const groupe of groupes.values()) {
    const salaireConfig = groupe.role === 'Capitaine'
      ? groupe.entreprise.salaires.capitaine
      : groupe.entreprise.salaires.matelot;
    const tauxHoraire = salaireConfig.montant;

    for (const regle of groupe.entreprise.modulation ?? []) {
      if (!roleMatches(regle.applicableA, groupe.role)) continue;
      const debutMinutes = regle.debutHebdomadaire * 60;
      const finMinutes = regle.finHebdomadaire * 60;
      let minutes = 0;

      if (groupe.minutes < debutMinutes) {
        minutes = groupe.minutes - debutMinutes;
      } else if (groupe.minutes > debutMinutes) {
        minutes = Math.min(groupe.minutes, finMinutes) - debutMinutes;
      }

      if (minutes !== 0) {
        detailsModulation.push({
          entrepriseId: groupe.entreprise.id,
          role: groupe.role,
          semaine: groupe.semaine,
          nom: regle.nom,
          minutes,
        });
      }
    }

    const reglesHeuresSupp = [...(groupe.entreprise.heuresSupplementaires ?? [])]
      .filter(regle => roleMatches(regle.applicableA, groupe.role))
      .sort((a, b) => a.seuilHebdomadaire - b.seuilHebdomadaire);

    reglesHeuresSupp.forEach((regle, index) => {
      const debutMinutes = regle.seuilHebdomadaire * 60;
      const finMinutes = reglesHeuresSupp[index + 1]?.seuilHebdomadaire
        ? reglesHeuresSupp[index + 1].seuilHebdomadaire * 60
        : Number.POSITIVE_INFINITY;
      const minutes = Math.max(0, Math.min(groupe.minutes, finMinutes) - debutMinutes);
      if (minutes <= 0) return;

      detailsHeuresSupplementaires.push({
        entrepriseId: groupe.entreprise.id,
        role: groupe.role,
        semaine: groupe.semaine,
        nom: regle.nom,
        minutes,
        tauxMajoration: regle.tauxMajoration,
        montantMajoration: (minutes / 60) * tauxHoraire * (regle.tauxMajoration / 100),
        isBrut: salaireConfig.isBrut,
      });
    });
  }

  const majorations = detailsHeuresSupplementaires.reduce(
    (acc, detail) => {
      const { brut, net } = normaliserSalaire(detail.montantMajoration, detail.isBrut);
      acc.brut += brut;
      acc.net += net;
      return acc;
    },
    { brut: 0, net: 0 }
  );

  return {
    modulationMinutes: detailsModulation.reduce((total, detail) => total + detail.minutes, 0),
    heuresSupplementairesMinutes: detailsHeuresSupplementaires.reduce((total, detail) => total + detail.minutes, 0),
    majorationHeuresSupplementairesBrut: majorations.brut,
    majorationHeuresSupplementairesNet: majorations.net,
    detailsHeuresSupplementaires,
    detailsModulation,
  };
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
  modulationMinutes: number;
  heuresSupplementairesMinutes: number;
  majorationHeuresSupplementairesBrut: number;
  majorationHeuresSupplementairesNet: number;
  detailsHeuresSupplementaires: DetailHeuresSupp[];
  detailsModulation: DetailModulation[];
};

/** Calcule les stats globales pour une liste de journées */
export const calculerStatsMois = (journees: Journee[], entreprises: Entreprise[]): StatsMois => {
  let joursTravailes = 0;
  let minutesTotales = 0;
  let salaireBrut = 0;
  let salaireNet = 0;
  const analyseHebdomadaire = analyserReglesHebdomadaires(journees, entreprises);

  for (const journee of journees) {
    if (!estJourneeTravaillee(journee)) continue;
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

  salaireBrut += analyseHebdomadaire.majorationHeuresSupplementairesBrut;
  salaireNet += analyseHebdomadaire.majorationHeuresSupplementairesNet;

  return {
    joursTravailes,
    minutesTotales,
    heuresTotales: minutesTotales / 60,
    salaireBrut,
    salaireNet,
    modulationMinutes: analyseHebdomadaire.modulationMinutes,
    heuresSupplementairesMinutes: analyseHebdomadaire.heuresSupplementairesMinutes,
    majorationHeuresSupplementairesBrut: analyseHebdomadaire.majorationHeuresSupplementairesBrut,
    majorationHeuresSupplementairesNet: analyseHebdomadaire.majorationHeuresSupplementairesNet,
    detailsHeuresSupplementaires: analyseHebdomadaire.detailsHeuresSupplementaires,
    detailsModulation: analyseHebdomadaire.detailsModulation,
  };
};

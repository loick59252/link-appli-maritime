// src/types.ts — Types partagés dans toute l'application

export type Role = 'Matelot' | 'Capitaine';
export type ApplicableA = 'Matelot' | 'Capitaine' | 'Tous';
export type StatutJournee = 'travaille' | 'rh' | 'ca' | 'mhn' | 'permute';

export type Prime = {
  id: string;
  nom: string;
  montant: number;
  isBrut: boolean;
  applicableA: ApplicableA;
};

export type Salaire = {
  montant: number;
  isBrut: boolean;
};

export type RegleHeuresSupplementaires = {
  id: string;
  nom: string;
  seuilHebdomadaire: number;
  tauxMajoration: number;
  applicableA: ApplicableA;
};

export type RegleModulation = {
  id: string;
  nom: string;
  debutHebdomadaire: number;
  finHebdomadaire: number;
  applicableA: ApplicableA;
};

export type FonctionnalitesEntreprise = {
  utiliseSaisons: boolean;
  utiliseTours: boolean;
  utiliseModulation: boolean;
  utiliseHeuresSupplementaires: boolean;
};

export type Entreprise = {
  id: string;
  nom: string;
  couleur: string;
  favori?: boolean;
  logo?: string;
  salaires: {
    matelot: Salaire;
    capitaine: Salaire;
  };
  primes: Prime[];
  fonctionnalites?: FonctionnalitesEntreprise;
  heuresSupplementaires?: RegleHeuresSupplementaires[];
  modulation?: RegleModulation[];
};

export type Saison = {
  id: string;
  entrepriseId: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
};

export type Tour = {
  id: string;
  numero: string;
  saisonId: string;
  entrepriseId: string;
  heurePriseService: string;
  heureDepartPause?: string;
  heureReprise?: string;
  heureFinService: string;
  lignesDestinations: string[];
  primes: string[];
  estActif: boolean;
};

export type Journee = {
  id: string;
  date: string;
  statut?: StatutJournee;
  entrepriseId: string;
  role: Role;
  heurePriseService: string;
  heureFinService: string;
  heureDepartPause?: string | null;
  heureReprise?: string | null;
  lignesDestinations?: string[] | null;
  tourId?: string | null;
  primes?: string[] | null;
  notes?: string | null;
  saisonId?: string | null;
};

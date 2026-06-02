import type { Journee, StatutJournee } from '../types';

export type StatutJourneeConfig = {
  label: string;
  icone: string;
  compteTravail: boolean;
};

export const STATUTS_JOURNEE: Record<StatutJournee, StatutJourneeConfig> = {
  travaille: {
    label: 'Travaille',
    icone: '',
    compteTravail: true,
  },
  rh: {
    label: 'RH',
    icone: '🏡',
    compteTravail: false,
  },
  ca: {
    label: 'CA',
    icone: '⛱️',
    compteTravail: false,
  },
  mhn: {
    label: 'MHN',
    icone: '🏥',
    compteTravail: false,
  },
  permute: {
    label: 'Permute',
    icone: '🔄',
    compteTravail: true,
  },
};

export const STATUTS_JOURNEE_OPTIONS = (Object.keys(STATUTS_JOURNEE) as StatutJournee[])
  .filter(statut => statut !== 'travaille')
  .map(statut => ({
    value: statut,
    ...STATUTS_JOURNEE[statut],
  }));

export const getStatutJournee = (journee: Pick<Journee, 'statut'>): StatutJournee =>
  journee.statut ?? 'travaille';

export const getConfigStatutJournee = (journee: Pick<Journee, 'statut'>): StatutJourneeConfig =>
  STATUTS_JOURNEE[getStatutJournee(journee)];

export const estJourneeTravaillee = (journee: Pick<Journee, 'statut'>): boolean =>
  STATUTS_JOURNEE[getStatutJournee(journee)].compteTravail;

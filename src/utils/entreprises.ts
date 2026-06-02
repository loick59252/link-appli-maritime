import type { Entreprise } from '../types';

export const trierEntreprisesAvecFavoris = <T extends Pick<Entreprise, 'nom' | 'favori'>>(entreprises: T[]): T[] =>
  [...entreprises].sort((a, b) => {
    if (!!a.favori !== !!b.favori) {
      return a.favori ? -1 : 1;
    }
    return a.nom.localeCompare(b.nom);
  });

export const libelleEntreprise = (entreprise: Pick<Entreprise, 'nom' | 'favori'>): string =>
  `${entreprise.favori ? '★ ' : ''}${entreprise.nom}`;

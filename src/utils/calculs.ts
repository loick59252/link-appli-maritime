// src/utils/calculs.ts

/**
 * Calcule les heures travaillées pour une journée
 * @param journee - La journée à analyser
 * @returns {heures: number, heuresSupp: number} - Heures normales et supplémentaires
 */
export const calculerHeuresJournee = (journee: any): { heures: number; heuresSupp: number } => {
  const [priseH, priseM] = journee.heurePriseService.split(':').map(Number);
  const [finH, finM] = journee.heureFinService.split(':').map(Number);

  // Durée totale en minutes
  let totalMinutes = (finH * 60 + finM) - (priseH * 60 + priseM);

  // Soustrait la pause si elle existe
  if (journee.heureDepartPause && journee.heureReprise) {
    const [pauseH, pauseM] = journee.heureDepartPause.split(':').map(Number);
    const [repriseH, repriseM] = journee.heureReprise.split(':').map(Number);
    totalMinutes -= (repriseH * 60 + repriseM) - (pauseH * 60 + pauseM);
  }

  const heuresTotales = totalMinutes / 60;

  // Pour l'instant, on ne gère pas les heures supp (car tu les gères via des primes)
  // On retourne juste les heures totales
  return {
    heures: heuresTotales,
    heuresSupp: 0 // ✅ Tu gères ça via des primes, pas des heures supp
  };
};

/**
 * Calcule le salaire journalier pour une journée
 * @param journee - La journée à analyser
 * @param entreprise - L'entreprise associée
 * @returns {salaire: number, details: {base: number, primes: number}} - Salaire total et détails
 */
export const calculerSalaireJournee = (journee: any, entreprise: any): { salaire: number; details: { base: number; primes: number } } => {
  const { heures } = calculerHeuresJournee(journee);

  // Salaire de base
  const salaireBase = entreprise.salaireBase * heures;

  // Primes de l'entreprise
  let primesMontant = 0;
  if (journee.primes) {
    journee.primes.forEach((primeId: string) => {
      const prime = entreprise.primes?.find((p: any) => p.id === primeId);
      if (prime) {
        primesMontant += prime.montant;
      }
    });
  }

  // Primes spéciales
  let primesSpecialesMontant = 0;
  if (journee.primesSpeciales) {
    journee.primesSpeciales.forEach((prime: any) => {
      primesSpecialesMontant += prime.montant;
    });
  }

  const salaireTotal = salaireBase + primesMontant + primesSpecialesMontant;

  return {
    salaire: salaireTotal,
    details: {
      base: salaireBase,
      primes: primesMontant + primesSpecialesMontant
    }
  };
};

/**
 * Calcule les stats pour une liste de journées
 * @param journees - Liste des journées
 * @param entreprises - Liste des entreprises
 * @returns Stats globales
 */
export const calculerStatsMois = (journees: any[], entreprises: any[]) => {
  let joursTravailes = 0;
  let heuresTotales = 0;
  let salaireBrutTotal = 0;
  let salaireNetTotal = 0;

  journees.forEach(journee => {
    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
    if (!entreprise) return;

    joursTravailes++;
    const { heures } = calculerHeuresJournee(journee);
    heuresTotales += heures;

    const { salaire, details } = calculerSalaireJournee(journee, entreprise);

    // Si le salaire de base est en brut, on ajoute au total brut
    if (entreprise.isSalaireBrut) {
      salaireBrutTotal += salaire;
      // Estimation du net (brut / 1.22)
      salaireNetTotal += salaire / 1.22;
    } else {
      // Si c'est du net, on ajoute au net et on estime le brut (net * 1.22)
      salaireNetTotal += salaire;
      salaireBrutTotal += salaire * 1.22;
    }
  });

  return {
    joursTravailes,
    heuresTotales,
    salaireBrut: salaireBrutTotal,
    salaireNet: salaireNetTotal
  };
};
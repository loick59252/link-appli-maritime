// src/components/RecapTab.tsx
import { useState } from 'react';

type RecapTabProps = {
  journees: any[];
  entreprises: any[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  rdtpmId: string;
};

const calculerHeuresJournee = (journee: any): number => {
  const [h1, m1] = journee.heurePriseService.split(':').map(Number);
  const [h2, m2] = journee.heureFinService.split(':').map(Number);
  let totalMins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (journee.heureDepartPause && journee.heureReprise) {
    const [ph, pm] = journee.heureDepartPause.split(':').map(Number);
    const [rh, rm] = journee.heureReprise.split(':').map(Number);
    totalMins -= (rh * 60 + rm) - (ph * 60 + pm);
  }
  return totalMins / 60;
};

const calculerSalaireJournee = (journee: any, entreprise: any): number => {
  const heures = calculerHeuresJournee(journee);
  const salaireBase = journee.role === 'Matelot'
    ? entreprise.salaires.matelot.montant * heures
    : entreprise.salaires.capitaine.montant * heures;

  let primesMontant = 0;
  if (journee.primes) {
    journee.primes.forEach((primeId: string) => {
      const prime = entreprise.primes?.find((p: any) => p.id === primeId && (p.applicableA === 'Tous' || p.applicableA === journee.role));
      if (prime) primesMontant += prime.montant;
    });
  }

  if (journee.primesSpeciales) {
    journee.primesSpeciales.forEach((prime: any) => primesMontant += prime.montant);
  }

  return salaireBase + primesMontant;
};

const calculerStatsMois = (journees: any[], entreprises: any[]) => {
  let joursTravailes = 0;
  let heuresTotales = 0;
  let salaireBrutTotal = 0;
  let salaireNetTotal = 0;

  journees.forEach(journee => {
    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
    if (!entreprise) return;

    joursTravailes++;
    heuresTotales += calculerHeuresJournee(journee);

    const salaire = calculerSalaireJournee(journee, entreprise);
    const isBrut = journee.role === 'Matelot' ? entreprise.salaires.matelot.isBrut : entreprise.salaires.capitaine.isBrut;

    if (isBrut) {
      salaireBrutTotal += salaire;
      salaireNetTotal += salaire / 1.22;
    } else {
      salaireNetTotal += salaire;
      salaireBrutTotal += salaire * 1.22;
    }
  });

  return { joursTravailes, heuresTotales, salaireBrut: salaireBrutTotal, salaireNet: salaireNetTotal };
};

export const RecapTab = ({ journees, entreprises, selectedDate, setSelectedDate }: RecapTabProps) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(selectedDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(selectedDate.getFullYear());

  const filteredJournees = journees.filter(j => {
    const date = new Date(j.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const stats = calculerStatsMois(filteredJournees, entreprises);

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDate(new Date(year, month, 1));
  };

  return (
    <div className="recap-container">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Récapitulatif mensuel</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <select value={selectedMonth} onChange={(e) => handleMonthChange(Number(e.target.value), selectedYear)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}</option>)}
        </select>
        <select value={selectedYear} onChange={(e) => handleMonthChange(selectedMonth, Number(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="stat-card"><h3>Jours travaillés</h3><p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.joursTravailes}</p></div>
        <div className="stat-card"><h3>Heures totales</h3><p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.heuresTotales.toFixed(2)} h</p></div>
        <div className="stat-card"><h3>Salaire brut</h3><p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.salaireBrut.toFixed(2)} €</p></div>
        <div className="stat-card"><h3>Salaire net</h3><p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.salaireNet.toFixed(2)} €</p></div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="recap-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Entreprise</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Rôle</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Heures</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Salaire</th>
            </tr>
          </thead>
          <tbody>
            {filteredJournees.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(journee => {
              const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
              if (!entreprise) return null;
              const heures = calculerHeuresJournee(journee);
              const salaire = calculerSalaireJournee(journee, entreprise);
              return (
                <tr key={journee.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{new Date(journee.date).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{entreprise.nom}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{journee.role}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{heures.toFixed(2)} h</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{salaire.toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
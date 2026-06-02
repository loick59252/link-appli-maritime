// src/components/RecapTab.tsx
import { useState, useMemo } from 'react';
import {
  calculerHeuresJournee,
  calculerSalaireJournee,
  calculerStatsMois,
  formatDureeHHMM,
} from '../utils/calculs';
import type { Journee, Entreprise } from '../types';

type RecapTabProps = {
  journees: Journee[];
  entreprises: Entreprise[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

const formatEuros = (montant: number) => `${montant.toFixed(2)} €`;

const formatSignedDuration = (minutes: number) => {
  const sign = minutes < 0 ? '-' : '';
  return `${sign}${formatDureeHHMM(Math.abs(minutes))}`;
};

const formatWeek = (weekStart: string) =>
  new Date(`${weekStart}T12:00:00`).toLocaleDateString('fr-FR');

export const RecapTab = ({ journees, entreprises, selectedDate, setSelectedDate }: RecapTabProps) => {
  const [selectedMonth, setSelectedMonth] = useState(selectedDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());

  const filteredJournees = useMemo(() =>
    journees.filter(j => {
      const d = new Date(`${j.date}T12:00:00`);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }),
    [journees, selectedMonth, selectedYear]
  );

  const stats = useMemo(
    () => calculerStatsMois(filteredJournees, entreprises),
    [filteredJournees, entreprises]
  );

  const sortedJournees = useMemo(
    () => [...filteredJournees].sort((a, b) => a.date.localeCompare(b.date)),
    [filteredJournees]
  );

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDate(new Date(year, month, 1));
  };

  return (
    <div className="recap-container">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Récapitulatif mensuel</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <select
          value={selectedMonth}
          onChange={e => handleMonthChange(Number(e.target.value), selectedYear)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={e => handleMonthChange(selectedMonth, Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="stat-card">
          <h3>Jours travaillés</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.joursTravailes}</p>
        </div>
        <div className="stat-card">
          <h3>Heures totales</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {formatDureeHHMM(stats.minutesTotales)}
            <span style={{ fontSize: '14px', color: '#aaa' }}> ({stats.heuresTotales.toFixed(2)}h)</span>
          </p>
        </div>
        <div className="stat-card">
          <h3>Modulation</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatSignedDuration(stats.modulationMinutes)}</p>
        </div>
        <div className="stat-card">
          <h3>Heures supp.</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatDureeHHMM(stats.heuresSupplementairesMinutes)}</p>
        </div>
        <div className="stat-card">
          <h3>Majoration HS</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatEuros(stats.majorationHeuresSupplementairesBrut)}</p>
          <span style={{ fontSize: '14px', color: '#aaa' }}>Net estimé: {formatEuros(stats.majorationHeuresSupplementairesNet)}</span>
        </div>
        <div className="stat-card">
          <h3>Salaire brut</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatEuros(stats.salaireBrut)}</p>
        </div>
        <div className="stat-card">
          <h3>Salaire net</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatEuros(stats.salaireNet)}</p>
        </div>
      </div>

      {(stats.detailsModulation.length > 0 || stats.detailsHeuresSupplementaires.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div className="stat-card">
            <h3>Détail modulation</h3>
            {stats.detailsModulation.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {stats.detailsModulation.map((detail, index) => {
                  const entreprise = entreprises.find(e => e.id === detail.entrepriseId);
                  return (
                    <li key={`${detail.entrepriseId}-${detail.semaine}-${detail.role}-${index}`} style={{ marginBottom: '8px', color: '#ddd' }}>
                      <strong>{entreprise?.nom || 'Entreprise'}</strong> - semaine du {formatWeek(detail.semaine)}<br />
                      {detail.nom} ({detail.role}) : {formatSignedDuration(detail.minutes)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ color: '#aaa' }}>Aucune modulation sur ce mois.</p>
            )}
          </div>

          <div className="stat-card">
            <h3>Détail heures supp.</h3>
            {stats.detailsHeuresSupplementaires.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {stats.detailsHeuresSupplementaires.map((detail, index) => {
                  const entreprise = entreprises.find(e => e.id === detail.entrepriseId);
                  return (
                    <li key={`${detail.entrepriseId}-${detail.semaine}-${detail.role}-${detail.nom}-${index}`} style={{ marginBottom: '8px', color: '#ddd' }}>
                      <strong>{entreprise?.nom || 'Entreprise'}</strong> - semaine du {formatWeek(detail.semaine)}<br />
                      {detail.nom} ({detail.role}) : {formatDureeHHMM(detail.minutes)} à +{detail.tauxMajoration}% = {formatEuros(detail.montantMajoration)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ color: '#aaa' }}>Aucune heure supplémentaire sur ce mois.</p>
            )}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="recap-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Entreprise</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Rôle</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Heures</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Salaire jour</th>
            </tr>
          </thead>
          <tbody>
            {sortedJournees.map(journee => {
              const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
              if (!entreprise) return null;
              const heures = calculerHeuresJournee(journee);
              const salaire = calculerSalaireJournee(journee, entreprise);
              return (
                <tr key={journee.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                    {new Date(`${journee.date}T12:00:00`).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{entreprise.nom}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{journee.role}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{heures.toFixed(2)} h</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{formatEuros(salaire)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

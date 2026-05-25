// src/components/RecapTab.tsx
import { useState } from 'react';
import { calculerStatsMois, calculerHeuresJournee, calculerSalaireJournee } from '../utils/calculs';

type RecapTabProps = {
  journees: any[];
  entreprises: any[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

export const RecapTab = ({ journees, entreprises, selectedDate, setSelectedDate }: RecapTabProps) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(selectedDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(selectedDate.getFullYear());

  // Filtre les journées pour le mois sélectionné
  const filteredJournees = journees.filter(j => {
    const date = new Date(j.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  // Calcule les stats
  const stats = calculerStatsMois(filteredJournees, entreprises);

  // Change le mois/année sélectionné
  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedDate(new Date(year, month, 1));
  };

  return (
    <div className="recap-container">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Récapitulatif mensuel</h2>

      {/* Sélecteur de mois/année */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(Number(e.target.value), selectedYear)}
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
          onChange={(e) => handleMonthChange(selectedMonth, Number(e.target.value))}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="stat-card">
          <h3>Jours travaillés</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.joursTravailes}</p>
        </div>
        <div className="stat-card">
          <h3>Heures totales</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.heuresTotales.toFixed(2)} h</p>
        </div>
        <div className="stat-card">
          <h3>Salaire brut</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.salaireBrut.toFixed(2)} €</p>
        </div>
        <div className="stat-card">
          <h3>Salaire net</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.salaireNet.toFixed(2)} €</p>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div style={{ overflowX: 'auto' }}>
        <table className="recap-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Entreprise</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Heures</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Salaire journalier</th>
            </tr>
          </thead>
          <tbody>
            {filteredJournees
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(journee => {
                const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
                if (!entreprise) return null;

                const { heures } = calculerHeuresJournee(journee);
                const { salaire } = calculerSalaireJournee(journee, entreprise);

                return (
                  <tr key={journee.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      {new Date(journee.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      {entreprise.nom}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      {heures.toFixed(2)} h
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                      {salaire.toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
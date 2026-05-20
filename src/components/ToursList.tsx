// src/components/ToursList.tsx
import { useState, useEffect } from 'react';
import { getTours, supprimerTour } from './../services/tours';
import { getSaisons } from './../services/saisons';
import { getEntreprises } from './../services/entreprises';
import { TourForm } from './TourForm';
import { RDTPM_ID } from './../App';

export const ToursList = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [saisons, setSaisons] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [showTourForm, setShowTourForm] = useState(false);
  const [tourToEdit, setTourToEdit] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [toursData, saisonsData, entreprisesData] = await Promise.all([
        getTours(),
        getSaisons(),
        getEntreprises()
      ]);
      setTours(toursData);
      setSaisons(saisonsData);
      setEntreprises(entreprisesData);
    };
    loadData();
  }, []);

  // Filtre pour n'afficher QUE les tours de RDTPM (ou ceux sans entrepriseId pour la rétrocompatibilité)
  const rdpmTours = tours.filter(t => t.entrepriseId === RDTPM_ID || !t.entrepriseId);

  const handleDeleteTour = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce tour ?")) {
      try {
        await supprimerTour(id);
        setTours(tours.filter(t => t.id !== id));
        alert("Tour supprimé avec succès !");
      } catch (error) {
        alert(`Erreur: ${error}`);
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3>Tours de service (RDTPM uniquement)</h3>
        <button
          onClick={() => {
            setTourToEdit(null);
            setShowTourForm(true);
          }}
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '6px 12px',
            cursor: 'pointer'
          }}
        >
          Ajouter un tour
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {rdpmTours.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2a2a2a' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Numéro</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Saison</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Heures</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Lignes</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Primes</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rdpmTours.map((tour) => {
                const saison = saisons.find(s => s.id === tour.saisonId);
                return (
                  <tr key={tour.id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ padding: '8px' }}>{tour.numero}</td>
                    <td style={{ padding: '8px' }}>{saison?.nom || tour.saisonId}</td>
                    <td style={{ padding: '8px' }}>
                      {tour.heurePriseService} - {tour.heureFinService}
                      {tour.heureDepartPause && <><br />Pause: {tour.heureDepartPause} - {tour.heureReprise}</>}
                    </td>
                    <td style={{ padding: '8px' }}>{tour.lignesDestinations?.join(', ') || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      {tour.primes?.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {tour.primes.map((p: any) => (
                            <li key={p.id}>{p.nom} (+{p.montant}€)</li>
                          ))}
                        </ul>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => {
                          setTourToEdit(tour);
                          setShowTourForm(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#0078d4', cursor: 'pointer', marginRight: '10px', fontSize: '14px' }}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTour(tour.id)}
                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '14px' }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#888' }}>Aucun tour trouvé pour RDTPM.</p>
        )}
      </div>

      {showTourForm && (
        <TourForm
          onClose={() => {
            setShowTourForm(false);
            setTourToEdit(null);
          }}
          onTourAjoute={() => {
            getTours().then(setTours);
          }}
          tourToEdit={tourToEdit}
        />
      )}
    </div>
  );
};
// src/components/ToursList.tsx
// ✅ Corrige les imports (chemin relatif depuis components/)
import { useState, useEffect } from 'react';
import { getTours, supprimerTour, mettreAJourTour } from '../services/tours'; // ✅ ../services/
import { getSaisons } from '../services/saisons';
import { TourForm } from './TourForm'; // ✅ ./TourForm car dans le même dossier

export const ToursList = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [saisons, setSaisons] = useState<any[]>([]);
  const [selectedSaisonId, setSelectedSaisonId] = useState<string>('');
  const [showTourForm, setShowTourForm] = useState(false);
  const [tourToEdit, setTourToEdit] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [tours, saisons] = await Promise.all([getTours(), getSaisons()]);
      setTours(tours);
      setSaisons(saisons);
      if (saisons.length > 0) {
        setSelectedSaisonId(saisons[0].id);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSaisonId) {
      getTours().then((allTours) => {
        const filteredTours = allTours
          .filter(tour => tour.saisonId === selectedSaisonId)
          .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
        setTours(filteredTours);
      });
    }
  }, [selectedSaisonId]);

  const handleDeleteTour = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce tour ?")) {
      try {
        await supprimerTour(id);
        const updatedTours = tours.filter(tour => tour.id !== id);
        setTours(updatedTours);
        alert("Tour supprimé avec succès !");
      } catch (error) {
        alert(`Erreur: ${error}`);
      }
    }
  };

  const handleEditTour = (tour: any) => {
    setTourToEdit(tour);
    setShowTourForm(true);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={selectedSaisonId}
          onChange={(e) => setSelectedSaisonId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
        >
          {saisons.map((saison) => (
            <option key={saison.id} value={saison.id}>{saison.nom}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setTourToEdit(null);
            setShowTourForm(true);
          }}
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 15px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Ajouter un tour
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {tours.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2a2a2a' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Numéro</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Lignes</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Horaires</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <tr key={tour.id} style={{ borderBottom: '1px solid #444' }}>
                  <td style={{ padding: '8px' }}>Tour {tour.numero}</td>
                  <td style={{ padding: '8px' }}>{tour.lignesDestinations?.join(', ')}</td>
                  <td style={{ padding: '8px' }}>
                    {tour.heurePriseService} - {tour.heureFinService}
                    {tour.heureDepartPause && ` (Pause: ${tour.heureDepartPause} - ${tour.heureReprise})`}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => handleEditTour(tour)}
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
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#888' }}>Aucun tour trouvé pour cette saison.</p>
        )}
      </div>

      {showTourForm && (
        <TourForm
          onClose={() => {
            setShowTourForm(false);
            setTourToEdit(null);
          }}
          onTourAjoute={() => {
            getTours().then((allTours) => {
              const filteredTours = allTours
                .filter(tour => tour.saisonId === selectedSaisonId)
                .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
              setTours(filteredTours);
            });
          }}
          tourToEdit={tourToEdit}
        />
      )}
    </div>
  );
};
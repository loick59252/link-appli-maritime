// src/components/ToursList.tsx
import { useState } from 'react';
import { ajouterTour, mettreAJourTour, supprimerTour } from '../services/tours';

type Tour = {
  id: string;
  numero: string;
  saisonId: string;
  entrepriseId: string;
  heurePriseService: string;
  heureDepartPause?: string;
  heureReprise?: string;
  heureFinService: string;
  lignesDestinations: string[];
  primes?: { id: string; nom: string; montant: number }[];
};

type ToursListProps = {
  tours: Tour[];
  onToursUpdated: () => void;
  entreprises: any[];
  rdtpmId: string; // ✅ Reçoit rdtpmId en prop
};

export const ToursList = ({ tours, onToursUpdated, entreprises, rdtpmId }: ToursListProps) => {
  const [editingTour, setEditingTour] = useState<Partial<Tour> & { id?: string } | null>(null);
  const [newLigne, setNewLigne] = useState('');

  const handleAddTour = () => {
    setEditingTour({
      numero: '',
      saisonId: '',
      entrepriseId: rdtpmId, // ✅ Utilise rdtpmId ici
      heurePriseService: '08:00',
      heureFinService: '16:00',
      lignesDestinations: []
    });
  };

  const handleEdit = (tour: Tour) => setEditingTour({ ...tour });

  const handleSave = async () => {
    if (!editingTour || !editingTour.numero || !editingTour.saisonId || !editingTour.entrepriseId) return;

    try {
      if (editingTour.id) {
        await mettreAJourTour(editingTour.id, editingTour as Tour);
      } else {
        await ajouterTour(editingTour as Omit<Tour, 'id'>);
      }
      onToursUpdated();
      setEditingTour(null);
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  const handleAddLigne = () => {
    if (!editingTour || !newLigne) return;
    setEditingTour({
      ...editingTour,
      lignesDestinations: [...(editingTour.lignesDestinations || []), newLigne]
    });
    setNewLigne('');
  };

  const handleRemoveLigne = (ligne: string) => {
    if (!editingTour) return;
    setEditingTour({
      ...editingTour,
      lignesDestinations: (editingTour.lignesDestinations || []).filter(l => l !== ligne)
    });
  };

  if (editingTour) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center',
        alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px',
          width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
          color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <h2>{editingTour.id ? 'Modifier' : 'Ajouter'} un tour</h2>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Numéro</label>
            <input
              type="text"
              value={editingTour.numero || ''}
              onChange={(e) => setEditingTour({...editingTour, numero: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Entreprise</label>
            <select
              value={editingTour.entrepriseId || rdtpmId}
              onChange={(e) => setEditingTour({...editingTour, entrepriseId: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            >
              {entreprises.map(e => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Saison</label>
            <select
              value={editingTour.saisonId || ''}
              onChange={(e) => setEditingTour({...editingTour, saisonId: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            >
              <option value="">-- Sélectionner une saison --</option>
              {/* À compléter avec tes saisons */}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Heure de prise de service</label>
            <input
              type="time"
              value={editingTour.heurePriseService || ''}
              onChange={(e) => setEditingTour({...editingTour, heurePriseService: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Heure de fin de service</label>
            <input
              type="time"
              value={editingTour.heureFinService || ''}
              onChange={(e) => setEditingTour({...editingTour, heureFinService: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Lignes de destination</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '8px' }}>
              {(editingTour.lignesDestinations || []).map(ligne => (
                <div key={ligne} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span>{ligne}</span>
                  <button
                    onClick={() => handleRemoveLigne(ligne)}
                    style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newLigne}
                onChange={(e) => setNewLigne(e.target.value)}
                placeholder="Nouvelle ligne"
                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              />
              <button
                onClick={handleAddLigne}
                style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
              >
                + Ajouter
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => setEditingTour(null)}
              style={{ backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
            >
              {editingTour.id ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tours-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Gestion des tours</h2>
        <button
          onClick={handleAddTour}
          style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
        >
          + Ajouter un tour
        </button>
      </div>

      {tours.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="tour-card"
              style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => handleEdit(tour)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'white' }}>Tour {tour.numero}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                    {entreprises.find(e => e.id === tour.entrepriseId)?.nom || 'Entreprise inconnue'} -
                    Heures: {tour.heurePriseService} - {tour.heureFinService}
                  </p>
                  {tour.lignesDestinations.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#aaa' }}>Lignes:</strong>
                      <span style={{ marginLeft: '8px' }}>{tour.lignesDestinations.join(', ')}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(tour); }}
                  style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#aaa' }}>Aucun tour trouvé.</p>
          <button
            onClick={handleAddTour}
            style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', marginTop: '10px' }}
          >
            + Ajouter votre premier tour
          </button>
        </div>
      )}
    </div>
  );
};
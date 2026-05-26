// src/components/ToursList.tsx
import { useState, useEffect } from 'react';
import { ajouterTour, mettreAJourTour, supprimerTour } from '../services/tours';
import { getSaisons } from '../services/saisons';
import { getEntreprises } from '../services/entreprises';

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
  primes: string[];
  estActif: boolean;
};

type ToursListProps = {
  tours: Tour[];
  onToursUpdated: () => void;
  entreprises: any[];
  rdtpmId: string;
};

// Fonction pour calculer la durée en heures décimales
const calculerDureeDecimale = (tour: Tour): number => {
  const [priseH, priseM] = tour.heurePriseService.split(':').map(Number);
  const [finH, finM] = tour.heureFinService.split(':').map(Number);

  let totalMinutes = (finH * 60 + finM) - (priseH * 60 + priseM);

  if (tour.heureDepartPause && tour.heureReprise) {
    const [pauseH, pauseM] = tour.heureDepartPause.split(':').map(Number);
    const [repriseH, repriseM] = tour.heureReprise.split(':').map(Number);
    totalMinutes -= (repriseH * 60 + repriseM) - (pauseH * 60 + pauseM);
  }

  return totalMinutes / 60;
};

// Fonction pour calculer la durée en format HH:MM
const calculerDureeHHMM = (tour: Tour): string => {
  const dureeDecimale = calculerDureeDecimale(tour);
  const heures = Math.floor(dureeDecimale);
  const minutes = Math.round((dureeDecimale - heures) * 60);
  return `${heures}h${minutes > 0 ? ` ${minutes}min` : ''}`;
};

export const ToursList = ({ tours, onToursUpdated, entreprises, rdtpmId }: ToursListProps) => {
  const [editingTour, setEditingTour] = useState<Partial<Tour> & { id?: string } | null>(null);
  const [saisons, setSaisons] = useState<any[]>([]);
  const [rdtpm, setRdtpm] = useState<any>(null);
  const [selectedSaisonId, setSelectedSaisonId] = useState<string>('');
  const [showOnlyActifs, setShowOnlyActifs] = useState<boolean>(false);

  // Charge les saisons et RDTPM au montage
  useEffect(() => {
    const loadData = async () => {
      const [saisonsData, entreprisesData] = await Promise.all([
        getSaisons(),
        getEntreprises()
      ]);
      setSaisons(saisonsData);
      const rdtpmEntreprise = entreprisesData.find(e => e.id === rdtpmId);
      setRdtpm(rdtpmEntreprise);
    };
    loadData();
  }, [rdtpmId]);

  // Fonction pour basculer le statut Actif/Ancien directement depuis la liste
  const handleToggleActifInList = async (tour: Tour) => {
    try {
      await mettreAJourTour(tour.id, { estActif: !tour.estActif });
      onToursUpdated();
    } catch (error) {
      alert(`Erreur lors de la mise à jour du statut: ${error}`);
    }
  };

  const handleAddTour = () => {
    setEditingTour({
      numero: '',
      saisonId: selectedSaisonId || saisons[0]?.id || '',
      entrepriseId: rdtpmId,
      heurePriseService: '08:00',
      heureFinService: '16:00',
      lignesDestinations: '',
      primes: [],
      estActif: true
    });
  };

  const handleEdit = (tour: Tour) => {
    setEditingTour({
      ...tour,
      lignesDestinations: tour.lignesDestinations || ''
    });
  };

  const handleSave = async () => {
    if (!editingTour || !editingTour.numero || !editingTour.saisonId) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
const tourData: Partial<Tour> = {
  numero: editingTour.numero,
  saisonId: editingTour.saisonId,
  entrepriseId: rdtpmId,
  heurePriseService: editingTour.heurePriseService,
  heureFinService: editingTour.heureFinService,
  // ✅ Toujours stocker comme tableau
  lignesDestinations: editingTour.lignesDestinations
    ? editingTour.lignesDestinations.split(',').map((l: string) => l.trim())
    : [],
  primes: editingTour.primes || [],
  estActif: editingTour.estActif ?? true
};

      if (editingTour.heureDepartPause && editingTour.heureReprise) {
        tourData.heureDepartPause = editingTour.heureDepartPause;
        tourData.heureReprise = editingTour.heureReprise;
      }

      if (editingTour.id) {
        await mettreAJourTour(editingTour.id, tourData);
      } else {
        await ajouterTour(tourData as Omit<Tour, 'id'>);
      }
      onToursUpdated();
      setEditingTour(null);
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce tour ?")) {
      try {
        await supprimerTour(id);
        onToursUpdated();
      } catch (error) {
        alert(`Erreur lors de la suppression: ${error}`);
      }
    }
  };

  const handleTogglePrime = (primeId: string) => {
    if (!editingTour) return;
    const primes = editingTour.primes || [];
    if (primes.includes(primeId)) {
      setEditingTour({
        ...editingTour,
        primes: primes.filter(id => id !== primeId)
      });
    } else {
      setEditingTour({
        ...editingTour,
        primes: [...primes, primeId]
      });
    }
  };

  // Tours filtrés par saison et statut
  const filteredTours = tours
    .filter(tour => !selectedSaisonId || tour.saisonId === selectedSaisonId)
    .filter(tour => !showOnlyActifs || tour.estActif);

  if (editingTour) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        overflowY: 'auto',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '20px',
          borderRadius: '10px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <h2>{editingTour.id ? 'Modifier' : 'Ajouter'} un tour</h2>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Numéro</label>
            <input
              type="text"
              value={editingTour.numero || ''}
              onChange={(e) => setEditingTour({...editingTour, numero: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              placeholder="Ex: 1, 2, A..."
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Saison</label>
            <select
              value={editingTour.saisonId || ''}
              onChange={(e) => setEditingTour({...editingTour, saisonId: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            >
              <option value="">-- Sélectionner une saison --</option>
              {saisons.map(saison => (
                <option key={saison.id} value={saison.id}>
                  {saison.nom} ({new Date(saison.dateDebut).toLocaleDateString('fr-FR')} - {new Date(saison.dateFin).toLocaleDateString('fr-FR')})
                </option>
              ))}
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
            <label style={{ display: 'block', marginBottom: '4px' }}>
              <input
                type="checkbox"
                checked={!!editingTour.heureDepartPause}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditingTour({
                      ...editingTour,
                      heureDepartPause: '12:00',
                      heureReprise: '13:00'
                    });
                  } else {
                    setEditingTour({
                      ...editingTour,
                      heureDepartPause: undefined,
                      heureReprise: undefined
                    });
                  }
                }}
                style={{ marginRight: '8px' }}
              />
              Avec pause
            </label>
            {editingTour.heureDepartPause && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Départ en pause</label>
                  <input
                    type="time"
                    value={editingTour.heureDepartPause}
                    onChange={(e) => setEditingTour({...editingTour, heureDepartPause: e.target.value})}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Reprise</label>
                  <input
                    type="time"
                    value={editingTour.heureReprise || ''}
                    onChange={(e) => setEditingTour({...editingTour, heureReprise: e.target.value})}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                  />
                </div>
              </div>
            )}
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
            <input
              type="text"
              value={editingTour.lignesDestinations || ''}
              onChange={(e) => setEditingTour({...editingTour, lignesDestinations: e.target.value})}
              placeholder="Ex: 28M, 8M, L1..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          {rdtpm && rdtpm.primes?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Primes associées</label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '8px',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px'
              }}>
                {rdtpm.primes.map(prime => (
                  <label key={prime.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(editingTour.primes || []).includes(prime.id)}
                      onChange={() => handleTogglePrime(prime.id)}
                      style={{ marginRight: '8px' }}
                    />
                    <span>{prime.nom} (+{prime.montant}€)</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filtre par saison */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '12px', fontWeight: 'bold' }}>Saison:</label>
          <select
            value={selectedSaisonId}
            onChange={(e) => setSelectedSaisonId(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
          >
            <option value="">Toutes les saisons</option>
            {saisons.map(saison => (
              <option key={saison.id} value={saison.id}>
                {saison.nom} ({new Date(saison.dateDebut).toLocaleDateString('fr-FR')} - {new Date(saison.dateFin).toLocaleDateString('fr-FR')})
              </option>
            ))}
          </select>
        </div>

        {/* Switch pour filtrer les actifs */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '12px', fontWeight: 'bold' }}>Statut:</span>
          <div
            onClick={() => setShowOnlyActifs(!showOnlyActifs)}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ marginRight: '6px', fontSize: '12px' }}>Tous</span>
            <div style={{
              width: '40px',
              height: '20px',
              backgroundColor: showOnlyActifs ? '#0078d4' : '#555',
              borderRadius: '10px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                left: showOnlyActifs ? 'calc(100% - 18px)' : '2px',
                transition: 'left 0.2s'
              }}></div>
            </div>
            <span style={{ marginLeft: '6px', fontSize: '12px' }}>Actifs</span>
          </div>
        </div>
      </div>

      {filteredTours.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTours.map((tour) => (
            <div
              key={tour.id}
              className="tour-card"
              style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '8px',
                opacity: tour.estActif ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, color: 'white' }}>Tour {tour.numero}</h3>
                    <div style={{ marginLeft: '12px', display: 'flex', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: '#0078d4'
                      }}>
                        {calculerDureeHHMM(tour)} {/* Format HH:MM */}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: '#0078d4'
                      }}>
                        {calculerDureeDecimale(tour).toFixed(2)}h {/* Format décimal */}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                    Heures: {tour.heurePriseService} - {tour.heureFinService}
                    {tour.heureDepartPause && ` | Pause: ${tour.heureDepartPause} - ${tour.heureReprise}`}
                  </p>
                  {tour.lignesDestinations && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#aaa' }}>Lignes:</strong>
                      <span style={{ marginLeft: '8px' }}>{tour.lignesDestinations}</span>
                    </div>
                  )}
                  {tour.primes?.length > 0 && rdtpm && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#aaa' }}>Primes:</strong>
                      <div style={{ marginTop: '4px' }}>
                        {tour.primes.map(primeId => {
                          const prime = rdtpm.primes.find(p => p.id === primeId);
                          return prime ? (
                            <span key={primeId} style={{ marginRight: '8px', color: '#ddd', fontSize: '14px' }}>
                              {prime.nom} (+{prime.montant}€)
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Switch Actif/Ancien directement dans la liste */}
                  <div
                    onClick={(e) => { e.stopPropagation(); handleToggleActifInList(tour); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '20px',
                      backgroundColor: tour.estActif ? '#0078d4' : '#555',
                      borderRadius: '10px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: tour.estActif ? 'calc(100% - 18px)' : '2px',
                        transition: 'left 0.2s'
                      }}></div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(tour); }}
                    style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(tour.id); }}
                    style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#aaa' }}>
            Aucun tour trouvé pour {selectedSaisonId ? `la saison sélectionnée` : `aucune saison`}
            {showOnlyActifs ? ' (actifs uniquement)' : ''}.
          </p>
          <button
            onClick={handleAddTour}
            style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', marginTop: '10px' }}
          >
            + Ajouter un tour
          </button>
        </div>
      )}
    </div>
  );
};
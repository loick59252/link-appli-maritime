// src/components/ToursList.tsx
import { useState, useEffect, useMemo } from 'react';
import { ajouterTour, mettreAJourTour, supprimerTour } from '../services/tours';
import { getSaisons } from '../services/saisons';
import { calculerMinutesJournee, formatDureeHHMM } from '../utils/calculs';
import type { Tour, Saison, Entreprise, Journee } from '../types';

type ToursListProps = {
  tours: Tour[];
  onToursUpdated: () => void;
  entreprises: Entreprise[];
  rdtpmId: string;
};

/** Adapte un tour en pseudo-journée pour calculer la durée */
const tourToJournee = (tour: Tour): Pick<Journee, 'heurePriseService' | 'heureFinService' | 'heureDepartPause' | 'heureReprise'> => ({
  heurePriseService: tour.heurePriseService,
  heureFinService: tour.heureFinService,
  heureDepartPause: tour.heureDepartPause ?? null,
  heureReprise: tour.heureReprise ?? null,
});

/** Composant switch réutilisable */
const Switch = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div
    onClick={() => onChange(!value)}
    role="switch"
    aria-checked={value}
    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
  >
    <div style={{
      width: '40px', height: '20px', borderRadius: '10px', position: 'relative',
      backgroundColor: value ? '#0078d4' : '#555', transition: 'background-color 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%',
        position: 'absolute', top: '2px', transition: 'left 0.2s',
        left: value ? 'calc(100% - 18px)' : '2px',
      }} />
    </div>
  </div>
);

const NOUVEAU_TOUR: Partial<Tour> = {
  numero: '',
  heurePriseService: '08:00',
  heureFinService: '16:00',
  lignesDestinations: [],
  primes: [],
  estActif: true,
};

export const ToursList = ({ tours, onToursUpdated, entreprises, rdtpmId }: ToursListProps) => {
  const [editingTour, setEditingTour] = useState<Partial<Tour> & { id?: string } | null>(null);
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [selectedSaisonId, setSelectedSaisonId] = useState('');
  const [showOnlyActifs, setShowOnlyActifs] = useState(false);

  const rdtpm = useMemo(() => entreprises.find(e => e.id === rdtpmId), [entreprises, rdtpmId]);

  useEffect(() => {
    getSaisons().then(setSaisons);
  }, []);

  const filteredTours = useMemo(() =>
    tours
      .filter(t => !selectedSaisonId || t.saisonId === selectedSaisonId)
      .filter(t => !showOnlyActifs || t.estActif),
    [tours, selectedSaisonId, showOnlyActifs]
  );

  const handleToggleActif = async (tour: Tour) => {
    try {
      await mettreAJourTour(tour.id, { estActif: !tour.estActif });
      onToursUpdated();
    } catch (error) {
      alert(`Erreur : ${error}`);
    }
  };

  const handleSave = async () => {
    if (!editingTour?.numero || !editingTour?.saisonId) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const lignesRaw = editingTour.lignesDestinations;
    const tourData: Omit<Tour, 'id'> = {
      numero: editingTour.numero!,
      saisonId: editingTour.saisonId!,
      entrepriseId: rdtpmId,
      heurePriseService: editingTour.heurePriseService ?? '08:00',
      heureFinService: editingTour.heureFinService ?? '16:00',
      heureDepartPause: editingTour.heureDepartPause,
      heureReprise: editingTour.heureReprise,
      lignesDestinations: typeof lignesRaw === 'string'
        ? lignesRaw.split(',').map((l: string) => l.trim()).filter(Boolean)
        : (lignesRaw ?? []),
      primes: editingTour.primes ?? [],
      estActif: editingTour.estActif ?? true,
    };

    try {
      if (editingTour.id) {
        await mettreAJourTour(editingTour.id, tourData);
      } else {
        await ajouterTour(tourData);
      }
      onToursUpdated();
      setEditingTour(null);
    } catch (error) {
      alert(`Erreur : ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce tour ?')) return;
    try {
      await supprimerTour(id);
      onToursUpdated();
    } catch (error) {
      alert(`Erreur : ${error}`);
    }
  };

  const handleTogglePrime = (primeId: string) => {
    if (!editingTour) return;
    const primes = editingTour.primes ?? [];
    setEditingTour({
      ...editingTour,
      primes: primes.includes(primeId)
        ? primes.filter(id => id !== primeId)
        : [...primes, primeId],
    });
  };

  // ────── Formulaire modal ──────
  if (editingTour) {
    const lignesValue = Array.isArray(editingTour.lignesDestinations)
      ? editingTour.lignesDestinations.join(', ')
      : editingTour.lignesDestinations ?? '';

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <h2>{editingTour.id ? 'Modifier' : 'Ajouter'} un tour</h2>

          <div className="form-group">
            <label>Numéro</label>
            <input
              type="text"
              value={editingTour.numero ?? ''}
              onChange={e => setEditingTour({ ...editingTour, numero: e.target.value })}
              className="modal-input"
              placeholder="Ex: 1, 2, A…"
            />
          </div>

          <div className="form-group">
            <label>Saison</label>
            <select
              value={editingTour.saisonId ?? ''}
              onChange={e => setEditingTour({ ...editingTour, saisonId: e.target.value })}
              className="modal-input"
            >
              <option value="">— Sélectionner une saison —</option>
              {saisons.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({new Date(s.dateDebut + 'T12:00:00').toLocaleDateString('fr-FR')} – {new Date(s.dateFin + 'T12:00:00').toLocaleDateString('fr-FR')})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Prise de service</label>
            <input type="time" value={editingTour.heurePriseService ?? ''} onChange={e => setEditingTour({ ...editingTour, heurePriseService: e.target.value })} className="modal-input" />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!editingTour.heureDepartPause}
                onChange={e => setEditingTour({
                  ...editingTour,
                  heureDepartPause: e.target.checked ? '12:00' : undefined,
                  heureReprise: e.target.checked ? '13:00' : undefined,
                })}
              />
              Avec pause
            </label>
            {editingTour.heureDepartPause && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px' }}>Départ pause</label>
                  <input type="time" value={editingTour.heureDepartPause} onChange={e => setEditingTour({ ...editingTour, heureDepartPause: e.target.value })} className="modal-input" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px' }}>Reprise</label>
                  <input type="time" value={editingTour.heureReprise ?? ''} onChange={e => setEditingTour({ ...editingTour, heureReprise: e.target.value })} className="modal-input" />
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Fin de service</label>
            <input type="time" value={editingTour.heureFinService ?? ''} onChange={e => setEditingTour({ ...editingTour, heureFinService: e.target.value })} className="modal-input" />
          </div>

          <div className="form-group">
            <label>Lignes de destination</label>
            <input
              type="text"
              value={lignesValue}
              onChange={e => setEditingTour({ ...editingTour, lignesDestinations: e.target.value as any })}
              className="modal-input"
              placeholder="Ex: 28M, 8M, L1…"
            />
          </div>

          {rdtpm && rdtpm.primes?.length > 0 && (
            <div className="form-group">
              <label>Primes associées</label>
              <div className="primes-checkbox-group">
                {rdtpm.primes.map(prime => (
                  <label key={prime.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(editingTour.primes ?? []).includes(prime.id)}
                      onChange={() => handleTogglePrime(prime.id)}
                    />
                    {prime.nom} (+{prime.montant}€)
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="submit-button" onClick={handleSave}>
              {editingTour.id ? 'Enregistrer' : 'Ajouter'}
            </button>
            <button className="cancel-button" onClick={() => setEditingTour(null)}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────── Liste des tours ──────
  return (
    <div className="tours-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Gestion des tours</h2>
        <button className="add-journee-button" onClick={() => setEditingTour({ ...NOUVEAU_TOUR, saisonId: saisons[0]?.id ?? '' })}>
          + Ajouter un tour
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 'bold' }}>Saison :</label>
          <select
            value={selectedSaisonId}
            onChange={e => setSelectedSaisonId(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
          >
            <option value="">Toutes les saisons</option>
            {saisons.map(s => (
              <option key={s.id} value={s.id}>
                {s.nom} ({new Date(s.dateDebut + 'T12:00:00').toLocaleDateString('fr-FR')} – {new Date(s.dateFin + 'T12:00:00').toLocaleDateString('fr-FR')})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 'bold' }}>Statut :</label>
          <span style={{ fontSize: '12px' }}>Tous</span>
          <Switch value={showOnlyActifs} onChange={setShowOnlyActifs} />
          <span style={{ fontSize: '12px' }}>Actifs</span>
        </div>
      </div>

      {filteredTours.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTours.map(tour => {
            const minutes = calculerMinutesJournee(tourToJournee(tour) as Journee);
            const saison = saisons.find(s => s.id === tour.saisonId);
            return (
              <div key={tour.id} className="tour-card" style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', opacity: tour.estActif ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0 }}>Tour {tour.numero}</h3>
                      {saison && <span style={{ fontSize: '12px', color: '#aaa' }}>{saison.nom}</span>}
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#0078d4' }}>
                        {formatDureeHHMM(minutes)} ({(minutes / 60).toFixed(2)}h)
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
                      {tour.heurePriseService} – {tour.heureFinService}
                      {tour.heureDepartPause && ` | Pause : ${tour.heureDepartPause} – ${tour.heureReprise}`}
                    </p>
                    {tour.lignesDestinations?.length > 0 && (
                      <p style={{ margin: '4px 0 0', color: '#ddd', fontSize: '13px' }}>
                        Lignes : {Array.isArray(tour.lignesDestinations) ? tour.lignesDestinations.join(', ') : tour.lignesDestinations}
                      </p>
                    )}
                    {tour.primes?.length > 0 && rdtpm && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#ddd' }}>
                        Primes : {tour.primes.map(pid => rdtpm.primes.find(p => p.id === pid)?.nom).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Switch value={tour.estActif} onChange={() => handleToggleActif(tour)} />
                    <button onClick={e => { e.stopPropagation(); setEditingTour({ ...tour, lignesDestinations: tour.lignesDestinations ?? [] }); }} style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>✏️</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(tour.id); }} style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#aaa' }}>Aucun tour trouvé{showOnlyActifs ? ' (actifs uniquement)' : ''}.</p>
          <button className="add-journee-button" onClick={() => setEditingTour({ ...NOUVEAU_TOUR, saisonId: saisons[0]?.id ?? '' })} style={{ marginTop: '10px' }}>
            + Ajouter un tour
          </button>
        </div>
      )}
    </div>
  );
};

// src/components/ToursList.tsx
import { useMemo, useState } from 'react';
import { ajouterTour, mettreAJourTour, supprimerTour } from '../services/tours';
import { calculerMinutesJournee, formatDureeHHMM } from '../utils/calculs';
import { useAppDialog } from './AppDialog';
import type { Entreprise, Journee, Saison, Tour } from '../types';
import { libelleEntreprise, trierEntreprisesAvecFavoris } from '../utils/entreprises';

type ToursListProps = {
  tours: Tour[];
  saisons: Saison[];
  onToursUpdated: () => void;
  entreprises: Entreprise[];
};

const tourToJournee = (tour: Tour): Pick<Journee, 'heurePriseService' | 'heureFinService' | 'heureDepartPause' | 'heureReprise'> => ({
  heurePriseService: tour.heurePriseService,
  heureFinService: tour.heureFinService,
  heureDepartPause: tour.heureDepartPause ?? null,
  heureReprise: tour.heureReprise ?? null,
});

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

const utiliseTours = (entreprise: Entreprise) =>
  entreprise.fonctionnalites?.utiliseTours ?? entreprise.nom === 'RDTPM';

const dateFr = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('fr-FR');

export const ToursList = ({ tours, saisons, onToursUpdated, entreprises }: ToursListProps) => {
  const { alert, confirm } = useAppDialog();
  const entreprisesAvecTours = useMemo(
    () => trierEntreprisesAvecFavoris(entreprises.filter(utiliseTours)),
    [entreprises]
  );
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState(entreprisesAvecTours[0]?.id ?? '');
  const [selectedSaisonId, setSelectedSaisonId] = useState('');
  const [showOnlyActifs, setShowOnlyActifs] = useState(false);
  const [editingTour, setEditingTour] = useState<Partial<Tour> & { id?: string } | null>(null);

  const entrepriseCouranteId = selectedEntrepriseId || entreprisesAvecTours[0]?.id || '';
  const entrepriseCourante = entreprises.find(e => e.id === entrepriseCouranteId);

  const saisonsEntreprise = useMemo(
    () => saisons
      .filter(s => s.entrepriseId === entrepriseCouranteId || (!s.entrepriseId && entrepriseCourante?.nom === 'RDTPM'))
      .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)),
    [saisons, entrepriseCouranteId, entrepriseCourante]
  );

  const filteredTours = useMemo(
    () => tours
      .filter(t => t.entrepriseId === entrepriseCouranteId)
      .filter(t => !selectedSaisonId || t.saisonId === selectedSaisonId)
      .filter(t => !showOnlyActifs || t.estActif)
      .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true })),
    [tours, entrepriseCouranteId, selectedSaisonId, showOnlyActifs]
  );

  const handleToggleActif = async (tour: Tour) => {
    try {
      await mettreAJourTour(tour.id, { estActif: !tour.estActif });
      onToursUpdated();
    } catch (error) {
      await alert(`Erreur : ${error}`, { title: 'Erreur' });
    }
  };

  const handleAddTour = () => {
    if (!entrepriseCouranteId) {
      void alert('Activez les tours sur une entreprise avant d’en ajouter.');
      return;
    }
    setEditingTour({
      ...NOUVEAU_TOUR,
      entrepriseId: entrepriseCouranteId,
      saisonId: selectedSaisonId || saisonsEntreprise[0]?.id || '',
    });
  };

  const handleSave = async () => {
    if (!editingTour?.numero || !editingTour?.entrepriseId) {
      await alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const lignesRaw = editingTour.lignesDestinations as string[] | string | undefined;
    const tourData: Omit<Tour, 'id'> = {
      numero: editingTour.numero,
      saisonId: editingTour.saisonId || '',
      entrepriseId: editingTour.entrepriseId,
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
      await alert(`Erreur : ${error}`, { title: 'Erreur' });
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm('Supprimer ce tour ?', {
      title: 'Supprimer le tour',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!shouldDelete) return;
    try {
      await supprimerTour(id);
      onToursUpdated();
    } catch (error) {
      await alert(`Erreur : ${error}`, { title: 'Erreur' });
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

  if (entreprisesAvecTours.length === 0) {
    return (
      <div className="tours-container">
        <h2>Gestion des tours</h2>
        <p style={{ color: '#aaa' }}>
          Aucune entreprise n’utilise les tours. Activez l’option dans le formulaire d’entreprise.
        </p>
      </div>
    );
  }

  if (editingTour) {
    const lignesValue = Array.isArray(editingTour.lignesDestinations)
      ? editingTour.lignesDestinations.join(', ')
      : editingTour.lignesDestinations ?? '';
    const entrepriseEdition = entreprises.find(e => e.id === editingTour.entrepriseId);
    const saisonsEdition = saisons.filter(s => s.entrepriseId === editingTour.entrepriseId || (!s.entrepriseId && entrepriseEdition?.nom === 'RDTPM'));

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <h2>{editingTour.id ? 'Modifier' : 'Ajouter'} un tour</h2>

          <div className="form-group">
            <label>Entreprise</label>
            <select
              value={editingTour.entrepriseId || entrepriseCouranteId}
              onChange={e => setEditingTour({ ...editingTour, entrepriseId: e.target.value, saisonId: '' })}
              className="modal-input"
            >
              {entreprisesAvecTours.map(entreprise => (
                <option key={entreprise.id} value={entreprise.id}>{libelleEntreprise(entreprise)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Numéro</label>
            <input
              type="text"
              value={editingTour.numero ?? ''}
              onChange={e => setEditingTour({ ...editingTour, numero: e.target.value })}
              className="modal-input"
              placeholder="Ex: 1, 2, A..."
            />
          </div>

          <div className="form-group">
            <label>Saison</label>
            <select
              value={editingTour.saisonId ?? ''}
              onChange={e => setEditingTour({ ...editingTour, saisonId: e.target.value })}
              className="modal-input"
            >
              <option value="">Aucune saison</option>
              {saisonsEdition.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({dateFr(s.dateDebut)} - {dateFr(s.dateFin)})
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
              placeholder="Ex: 28M, 8M, L1..."
            />
          </div>

          {entrepriseEdition && entrepriseEdition.primes?.length > 0 && (
            <div className="form-group">
              <label>Primes associées</label>
              <div className="primes-checkbox-group">
                {entrepriseEdition.primes.map(prime => (
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

  return (
    <div className="tours-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Gestion des tours</h2>
        <button className="add-journee-button" onClick={handleAddTour}>
          + Ajouter un tour
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 'bold' }}>Entreprise :</label>
          <select
            value={entrepriseCouranteId}
            onChange={e => {
              setSelectedEntrepriseId(e.target.value);
              setSelectedSaisonId('');
            }}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
          >
            {entreprisesAvecTours.map(entreprise => (
              <option key={entreprise.id} value={entreprise.id}>{libelleEntreprise(entreprise)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 'bold' }}>Saison :</label>
          <select
            value={selectedSaisonId}
            onChange={e => setSelectedSaisonId(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
          >
            <option value="">Toutes les saisons</option>
            {saisonsEntreprise.map(s => (
              <option key={s.id} value={s.id}>
                {s.nom} ({dateFr(s.dateDebut)} - {dateFr(s.dateFin)})
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0 }}>Tour {tour.numero}</h3>
                      {saison && <span style={{ fontSize: '12px', color: '#aaa' }}>{saison.nom}</span>}
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#0078d4' }}>
                        {formatDureeHHMM(minutes)} ({(minutes / 60).toFixed(2)}h)
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
                      {tour.heurePriseService} - {tour.heureFinService}
                      {tour.heureDepartPause && ` | Pause : ${tour.heureDepartPause} - ${tour.heureReprise}`}
                    </p>
                    {tour.lignesDestinations?.length > 0 && (
                      <p style={{ margin: '4px 0 0', color: '#ddd', fontSize: '13px' }}>
                        Lignes : {Array.isArray(tour.lignesDestinations) ? tour.lignesDestinations.join(', ') : tour.lignesDestinations}
                      </p>
                    )}
                    {tour.primes?.length > 0 && entrepriseCourante && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#ddd' }}>
                        Primes : {tour.primes.map(pid => entrepriseCourante.primes.find(p => p.id === pid)?.nom).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Switch value={tour.estActif} onChange={() => handleToggleActif(tour)} />
                    <button onClick={e => { e.stopPropagation(); setEditingTour({ ...tour, lignesDestinations: tour.lignesDestinations ?? [] }); }} className="edit-action-button">Modifier</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(tour.id); }} className="delete-button">Supprimer</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#aaa' }}>Aucun tour trouvé{showOnlyActifs ? ' (actifs uniquement)' : ''}.</p>
          <button className="add-journee-button" onClick={handleAddTour} style={{ marginTop: '10px' }}>
            + Ajouter un tour
          </button>
        </div>
      )}
    </div>
  );
};

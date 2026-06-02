// src/components/JourneeForm.tsx
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { ajouterJournee, mettreAJourJournee } from '../services/journees';
import { useAppDialog } from './AppDialog';
import type { Entreprise, Journee, Saison, StatutJournee, Tour } from '../types';
import { libelleEntreprise, trierEntreprisesAvecFavoris } from '../utils/entreprises';
import { STATUTS_JOURNEE, STATUTS_JOURNEE_OPTIONS, estJourneeTravaillee } from '../utils/statutsJournee';

type JourneeFormProps = {
  onClose: () => void;
  onJourneeAjoutee: () => void;
  date: string;
  journeeToEdit: Journee | null;
  entreprises: Entreprise[];
  tours: Tour[];
  saisons: Saison[];
};

type SearchableOption = {
  id: string;
  label: string;
  searchText: string;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder: string;
  emptyOptionLabel?: string;
  noResultsLabel?: string;
};

const SearchableSelect = ({ value, onChange, options, placeholder, emptyOptionLabel, noResultsLabel = 'Aucun resultat' }: SearchableSelectProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedOption = options.find(option => option.id === value);
  const search = query.trim().toLowerCase();
  const visibleOptions = search
    ? options.filter(option => option.searchText.toLowerCase().includes(search))
    : options;
  const menuOptions = emptyOptionLabel && !search
    ? [{ id: '', label: emptyOptionLabel, searchText: emptyOptionLabel }, ...visibleOptions]
    : visibleOptions;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, options]);

  const selectOption = (option: SearchableOption) => {
    onChange(option.id);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(current => Math.min(current + 1, Math.max(menuOptions.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(current => Math.max(current - 1, 0));
      return;
    }
    if (e.key === 'Enter' && isOpen && menuOptions[activeIndex]) {
      e.preventDefault();
      selectOption(menuOptions[activeIndex]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="search"
        value={query}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={selectedOption?.label || placeholder}
        style={{ width: '100%', padding: value || query ? '8px 34px 8px 8px' : '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
      />
      {(value || query) && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange('');
            setQuery('');
            setIsOpen(false);
          }}
          title="Effacer"
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            padding: 0,
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#aaa'
          }}
        >
          x
        </button>
      )}
      {isOpen && (
        <div style={{
          position: 'absolute',
          zIndex: 1002,
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          maxHeight: '210px',
          overflowY: 'auto',
          border: '1px solid #444',
          borderRadius: '4px',
          backgroundColor: '#1a1a1a',
          boxShadow: '0 8px 20px rgba(0,0,0,0.35)'
        }}>
          {menuOptions.length > 0 ? menuOptions.map((option, index) => (
            <button
              key={option.id || 'empty'}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                selectOption(option);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px',
                backgroundColor: index === activeIndex || option.id === value ? '#2f4f6f' : '#1a1a1a',
                color: 'white',
                borderRadius: 0
              }}
            >
              {option.label}
            </button>
          )) : (
            <div style={{ padding: '8px', color: '#888', fontSize: '14px' }}>{noResultsLabel}</div>
          )}
        </div>
      )}
    </div>
  );
};

const calculerDureeHHMM = (tour: Tour): string => {
  const [priseH, priseM] = tour.heurePriseService.split(':').map(Number);
  const [finH, finM] = tour.heureFinService.split(':').map(Number);
  let totalMinutes = (finH * 60 + finM) - (priseH * 60 + priseM);

  if (tour.heureDepartPause && tour.heureReprise) {
    const [pauseH, pauseM] = tour.heureDepartPause.split(':').map(Number);
    const [repriseH, repriseM] = tour.heureReprise.split(':').map(Number);
    totalMinutes -= (repriseH * 60 + repriseM) - (pauseH * 60 + pauseM);
  }

  const heures = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${heures}h${minutes > 0 ? ` ${minutes}min` : ''}`;
};

const entrepriseUtiliseSaisons = (entreprise?: Entreprise) =>
  entreprise?.fonctionnalites?.utiliseSaisons ?? entreprise?.nom === 'RDTPM';

const entrepriseUtiliseTours = (entreprise?: Entreprise) =>
  entreprise?.fonctionnalites?.utiliseTours ?? entreprise?.nom === 'RDTPM';

export const JourneeForm = ({
  onClose,
  onJourneeAjoutee,
  date: initialDate,
  journeeToEdit,
  entreprises,
  tours,
  saisons,
}: JourneeFormProps) => {
  const { alert } = useAppDialog();
  const defaultEntrepriseId = journeeToEdit?.entrepriseId || trierEntreprisesAvecFavoris(entreprises)[0]?.id || '';
  const [date, setDate] = useState<string>(
    journeeToEdit?.date ||
    (initialDate ? new Date(initialDate).toISOString().split('T')[0] : '')
  );
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string>(defaultEntrepriseId);
  const [selectedTourId, setSelectedTourId] = useState<string>(journeeToEdit?.tourId || '');
  const [selectedSaisonId, setSelectedSaisonId] = useState<string>(journeeToEdit?.saisonId || '');
  const [statut, setStatut] = useState<StatutJournee>(journeeToEdit?.statut ?? 'travaille');
  const [role, setRole] = useState<'Matelot' | 'Capitaine'>(journeeToEdit?.role || 'Matelot');
  const [heurePriseService, setHeurePriseService] = useState<string>(journeeToEdit?.heurePriseService || '08:00');
  const [heureDepartPause, setHeureDepartPause] = useState<string>(journeeToEdit?.heureDepartPause || '');
  const [heureReprise, setHeureReprise] = useState<string>(journeeToEdit?.heureReprise || '');
  const [heureFinService, setHeureFinService] = useState<string>(journeeToEdit?.heureFinService || '16:00');
  const [lignesDestinations, setLignesDestinations] = useState<string>(journeeToEdit?.lignesDestinations?.join(', ') || '');
  const [primesSelectionnees, setPrimesSelectionnees] = useState<string[]>((journeeToEdit?.primes || []) as string[]);
  const [primesSpeciales, setPrimesSpeciales] = useState<any[]>([]);
  const [notes, setNotes] = useState<string>(journeeToEdit?.notes || '');
  const isEditMode = !!journeeToEdit;
  const isJourneeAvecTravail = estJourneeTravaillee({ statut });

  const entreprisesOrdonnees = useMemo(
    () => trierEntreprisesAvecFavoris(entreprises),
    [entreprises]
  );

  const entrepriseSelectionnee = useMemo(
    () => entreprises.find(e => e.id === selectedEntrepriseId),
    [entreprises, selectedEntrepriseId]
  );

  const utiliseSaisons = entrepriseUtiliseSaisons(entrepriseSelectionnee);
  const utiliseTours = entrepriseUtiliseTours(entrepriseSelectionnee);

  const saisonsEntreprise = useMemo(
    () => saisons
      .filter(s => s.entrepriseId === selectedEntrepriseId || (!s.entrepriseId && entrepriseSelectionnee?.nom === 'RDTPM'))
      .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)),
    [saisons, selectedEntrepriseId, entrepriseSelectionnee]
  );

  const saisonOptions = useMemo(
    () => saisonsEntreprise.map(saison => {
      const label = `${saison.nom} (${new Date(saison.dateDebut + 'T12:00:00').toLocaleDateString('fr-FR')} - ${new Date(saison.dateFin + 'T12:00:00').toLocaleDateString('fr-FR')})`;
      return {
        id: saison.id,
        label,
        searchText: `${label} ${saison.dateDebut} ${saison.dateFin}`,
      };
    }),
    [saisonsEntreprise]
  );

  const filteredTours = useMemo(
    () => tours
      .filter(t => t.entrepriseId === selectedEntrepriseId)
      .filter(t => t.estActif !== false)
      .filter(t => !selectedSaisonId || t.saisonId === selectedSaisonId)
      .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true })),
    [tours, selectedEntrepriseId, selectedSaisonId]
  );

  const tourOptions = useMemo(
    () => filteredTours.map(tour => {
      const lignes = Array.isArray(tour.lignesDestinations)
        ? tour.lignesDestinations.join(', ')
        : tour.lignesDestinations || 'Aucune ligne';
      const label = `Tour ${tour.numero} - ${lignes} - ${calculerDureeHHMM(tour)}`;
      return {
        id: tour.id,
        label,
        searchText: tour.numero,
      };
    }),
    [filteredTours]
  );

  const primesEntreprise = entrepriseSelectionnee?.primes || [];
  const selectedTour = filteredTours.find(t => t.id === selectedTourId);

  useEffect(() => {
    if (!selectedEntrepriseId && entreprisesOrdonnees[0]?.id) {
      setSelectedEntrepriseId(entreprisesOrdonnees[0].id);
    }
  }, [entreprisesOrdonnees, selectedEntrepriseId]);

  useEffect(() => {
    if (!utiliseSaisons) {
      setSelectedSaisonId('');
      return;
    }
    if (journeeToEdit?.saisonId && selectedSaisonId) return;

    const dateObj = new Date(date + 'T12:00:00');
    const saisonTrouvee = saisonsEntreprise.find(s =>
      new Date(s.dateDebut + 'T12:00:00') <= dateObj &&
      new Date(s.dateFin + 'T12:00:00') >= dateObj
    );
    setSelectedSaisonId(saisonTrouvee?.id || saisonsEntreprise[0]?.id || '');
  }, [date, selectedEntrepriseId, saisonsEntreprise, utiliseSaisons]);

  useEffect(() => {
    if (!utiliseTours) {
      setSelectedTourId('');
      return;
    }
    if (selectedTourId && !filteredTours.some(t => t.id === selectedTourId)) {
      setSelectedTourId('');
    }
  }, [filteredTours, selectedTourId, utiliseTours]);

  useEffect(() => {
    if (!selectedTour) return;
    setHeurePriseService(selectedTour.heurePriseService);
    setHeureFinService(selectedTour.heureFinService);
    setLignesDestinations(Array.isArray(selectedTour.lignesDestinations)
      ? selectedTour.lignesDestinations.join(', ')
      : selectedTour.lignesDestinations || '');
    setHeureDepartPause(selectedTour.heureDepartPause || '');
    setHeureReprise(selectedTour.heureReprise || '');
    setPrimesSelectionnees(selectedTour.primes || []);
  }, [selectedTour]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEntrepriseId || (isJourneeAvecTravail && (!heurePriseService || !heureFinService))) {
      await alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const nouvelleJournee: any = {
      date,
      statut,
      entrepriseId: selectedEntrepriseId,
      role,
      heurePriseService: isJourneeAvecTravail ? heurePriseService : '00:00',
      heureFinService: isJourneeAvecTravail ? heureFinService : '00:00',
      primes: isJourneeAvecTravail ? [...primesSelectionnees, ...primesSpeciales] : [],
      notes: notes || '',
      tourId: isJourneeAvecTravail && utiliseTours && selectedTourId ? selectedTourId : null,
      saisonId: isJourneeAvecTravail && utiliseSaisons && selectedSaisonId ? selectedSaisonId : null,
      heureDepartPause: isJourneeAvecTravail ? heureDepartPause || null : null,
      heureReprise: isJourneeAvecTravail ? heureReprise || null : null,
      lignesDestinations: isJourneeAvecTravail && lignesDestinations
        ? lignesDestinations.split(',').map((l: string) => l.trim()).filter(Boolean)
        : null,
    };

    try {
      if (isEditMode && journeeToEdit) {
        await mettreAJourJournee(journeeToEdit.id, nouvelleJournee);
        await alert('Journée modifiée avec succès !');
      } else {
        await ajouterJournee(nouvelleJournee);
        await alert('Journée ajoutée avec succès !');
      }
      onJourneeAjoutee();
      onClose();
    } catch (error) {
      await alert(`Erreur: ${error}`, { title: 'Erreur' });
    }
  };

  const handleAddPrimeSpeciale = () => {
    setPrimesSpeciales([...primesSpeciales, { id: Date.now().toString(), nom: '', montant: 0 }]);
  };

  const handleRemovePrimeSpeciale = (id: string) => {
    setPrimesSpeciales(primesSpeciales.filter(prime => prime.id !== id));
  };

  const handleChangePrimeSpeciale = (id: string, field: string, value: any) => {
    setPrimesSpeciales(primesSpeciales.map(prime =>
      prime.id === id ? { ...prime, [field]: value } : prime
    ));
  };

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
        <h2>{isEditMode ? 'Modifier une journée' : 'Ajouter une journée'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Type de journee</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStatut('travaille')}
                style={{
                  backgroundColor: statut === 'travaille' ? '#0078d4' : '#1a1a1a',
                  color: 'white',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  padding: '8px 12px'
                }}
              >
                Travail
              </button>
              {STATUTS_JOURNEE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatut(option.value)}
                  style={{
                    backgroundColor: statut === option.value ? '#0078d4' : '#1a1a1a',
                    color: 'white',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    padding: '8px 12px'
                  }}
                >
                  {option.icone && <span style={{ marginRight: '6px' }}>{option.icone}</span>}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Entreprise</label>
            <select
              value={selectedEntrepriseId}
              onChange={(e) => {
                setSelectedEntrepriseId(e.target.value);
                setSelectedTourId('');
                setSelectedSaisonId('');
                setPrimesSelectionnees([]);
                setPrimesSpeciales([]);
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              required
            >
              {entreprisesOrdonnees.map((e) => (
                <option key={e.id} value={e.id} style={{ color: e.favori ? '#f5c542' : undefined }}>
                  {libelleEntreprise(e)}
                </option>
              ))}
            </select>
          </div>

          {!isJourneeAvecTravail && (
            <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '4px', backgroundColor: '#1a1a1a', color: '#ddd', border: '1px solid #444' }}>
              {STATUTS_JOURNEE[statut].icone && <span style={{ marginRight: '8px' }}>{STATUTS_JOURNEE[statut].icone}</span>}
              {STATUTS_JOURNEE[statut].label} : les horaires, tours et primes ne seront pas comptabilises.
            </div>
          )}

          {isJourneeAvecTravail && (
          <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Rôle</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                <input type="radio" name="role" value="Matelot" checked={role === 'Matelot'} onChange={() => setRole('Matelot')} style={{ marginRight: '6px' }} />
                Matelot
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                <input type="radio" name="role" value="Capitaine" checked={role === 'Capitaine'} onChange={() => setRole('Capitaine')} style={{ marginRight: '6px' }} />
                Capitaine
              </label>
            </div>
          </div>

          {utiliseSaisons && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Saison</label>
              <SearchableSelect
                value={selectedSaisonId}
                onChange={setSelectedSaisonId}
                options={saisonOptions}
                placeholder="Rechercher ou choisir une saison"
                emptyOptionLabel="Aucune saison"
              />
            </div>
          )}

          {utiliseTours && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Tour de service</label>
              <SearchableSelect
                value={selectedTourId}
                onChange={setSelectedTourId}
                options={tourOptions}
                placeholder="Rechercher ou choisir un tour"
                emptyOptionLabel="Aucun tour"
              />
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de prise de service</label>
            <input type="time" value={heurePriseService} onChange={(e) => setHeurePriseService(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }} required />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de départ en pause</label>
            <input type="time" value={heureDepartPause} onChange={(e) => setHeureDepartPause(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de reprise</label>
            <input type="time" value={heureReprise} onChange={(e) => setHeureReprise(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de fin de service</label>
            <input type="time" value={heureFinService} onChange={(e) => setHeureFinService(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }} required />
          </div>

          {utiliseTours && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Lignes de destination</label>
              <input
                type="text"
                value={lignesDestinations}
                onChange={(e) => setLignesDestinations(e.target.value)}
                placeholder="Ex: 28M, 8M"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #444', padding: '8px', borderRadius: '4px', backgroundColor: '#1a1a1a' }}>
              {primesEntreprise.length > 0 ? (
                primesEntreprise.map((prime) => {
                  const isFromTour = (selectedTour?.primes || []).includes(prime.id);
                  return (
                    <div key={prime.id} style={{ marginBottom: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={primesSelectionnees.includes(prime.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrimesSelectionnees([...primesSelectionnees, prime.id]);
                            } else {
                              setPrimesSelectionnees(primesSelectionnees.filter(p => p !== prime.id));
                            }
                          }}
                          style={{ marginRight: '6px' }}
                        />
                        {prime.nom} (+{prime.montant} €)
                        {isFromTour && <span style={{ marginLeft: '8px', color: '#0078d4', fontSize: '12px' }}>(Tour)</span>}
                      </label>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#888', fontSize: '14px' }}>
                  {selectedEntrepriseId ? 'Aucune prime définie.' : 'Sélectionnez une entreprise.'}
                </p>
              )}
            </div>
            {selectedTour && selectedTour.primes?.length > 0 && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                Les primes du tour sont pré-sélectionnées.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes spéciales</label>
            {primesSpeciales.map((prime) => (
              <div key={prime.id} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                <input type="text" value={prime.nom} onChange={(e) => handleChangePrimeSpeciale(prime.id, 'nom', e.target.value)} placeholder="Nom" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', marginRight: '4px' }} />
                <input type="number" value={prime.montant} onChange={(e) => handleChangePrimeSpeciale(prime.id, 'montant', Number(e.target.value))} placeholder="€" style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', marginRight: '4px' }} />
                <button type="button" onClick={() => handleRemovePrimeSpeciale(prime.id)} style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddPrimeSpeciale} style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '14px', marginTop: '6px' }}>
              + Prime spéciale
            </button>
          </div>

          </>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', minHeight: '50px' }}
              placeholder="Ex: Échange de tour avec Jean"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}>
              Annuler
            </button>
            <button type="submit" style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}>
              {isEditMode ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JourneeForm;

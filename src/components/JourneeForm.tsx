// src/components/JourneeForm.tsx
import { useState, useEffect } from 'react';
import { getToursParSaison } from './../services/tours';
import { getSaisons } from './../services/saisons';
import { ajouterJournee, mettreAJourJournee } from './../services/journees';
import { RDTPM_ID } from './../App';

type Entreprise = {
  id: string;
  nom: string;
  couleur?: string;
  primes?: { id: string; nom: string; montant: number }[];
};

type Saison = { id: string; nom: string; dateDebut: string; dateFin: string };
type Tour = {
  id: string;
  numero: string;
  saisonId: string;
  heurePriseService: string;
  heureDepartPause?: string;
  heureReprise?: string;
  heureFinService: string;
  lignesDestinations: string[];
  primes?: { id: string; nom: string; montant: number }[];
};
type Prime = { id: string; nom: string; montant: number };

type JourneeFormProps = {
  onClose: () => void;
  onJourneeAjoutee: () => void;
  date?: string;
  journeeToEdit?: any;
  entreprises: Entreprise[];
  tours: Tour[];
};

export const JourneeForm = ({ onClose, onJourneeAjoutee, date: initialDate, journeeToEdit, entreprises, tours: allTours }: JourneeFormProps) => {
  // États
  const [localDate, setLocalDate] = useState<string>(journeeToEdit?.date || initialDate || new Date().toISOString().split('T')[0]);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string>(journeeToEdit?.entrepriseId || entreprises[0]?.id || '');
  const [selectedTourId, setSelectedTourId] = useState<string>(journeeToEdit?.tourId || '');
  const [role, setRole] = useState<'Matelot' | 'Capitaine'>(journeeToEdit?.role || 'Matelot');
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [selectedSaisonId, setSelectedSaisonId] = useState<string>('');
  const [heurePriseService, setHeurePriseService] = useState<string>(journeeToEdit?.heurePriseService || '');
  const [heureDepartPause, setHeureDepartPause] = useState<string>(journeeToEdit?.heureDepartPause || '');
  const [heureReprise, setHeureReprise] = useState<string>(journeeToEdit?.heureReprise || '');
  const [heureFinService, setHeureFinService] = useState<string>(journeeToEdit?.heureFinService || '');
  const [lignesDestinations, setLignesDestinations] = useState<string>(journeeToEdit?.lignesDestinations?.join(', ') || '');
  const [primesSelectionnees, setPrimesSelectionnees] = useState<Prime[]>(journeeToEdit?.primes || []);
  const [primesEntreprise, setPrimesEntreprise] = useState<Prime[]>([]);
  const [primesSpeciales, setPrimesSpeciales] = useState<Prime[]>([]);
  const [notes, setNotes] = useState<string>(journeeToEdit?.notes || '');
  const [tourSearch, setTourSearch] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(!!journeeToEdit);

  // Charge les saisons et les primes de l'entreprise sélectionnée
  useEffect(() => {
    const loadData = async () => {
      try {
        const saisons = await getSaisons();
        setSaisons(saisons);

        // Détermine la saison automatique en fonction de la date
        const dateToCheck = new Date(journeeToEdit?.date || initialDate || new Date());
        const saisonTrouvee = saisons.find(saison => {
          const debut = new Date(saison.dateDebut);
          const fin = new Date(saison.dateFin);
          return dateToCheck >= debut && dateToCheck <= fin;
        });

        if (saisonTrouvee) {
          setSelectedSaisonId(saisonTrouvee.id);
          const tours = allTours.filter(t => t.saisonId === saisonTrouvee.id)
            .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
          setTours(tours);
          setFilteredTours(tours);
        } else if (saisons.length > 0) {
          setSelectedSaisonId(saisons[0].id);
          const tours = allTours.filter(t => t.saisonId === saisons[0].id)
            .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
          setTours(tours);
          setFilteredTours(tours);
        }

        // Charge les primes de l'entreprise sélectionnée
        if (selectedEntrepriseId) {
          const entreprise = entreprises.find(e => e.id === selectedEntrepriseId);
          if (entreprise) setPrimesEntreprise(entreprise.primes || []);
        } else if (entreprises.length > 0) {
          setSelectedEntrepriseId(entreprises[0].id);
          setPrimesEntreprise(entreprises[0].primes || []);
        }
      } catch (error) {
        console.error("Erreur de chargement:", error);
      }
    };
    loadData();
  }, [selectedEntrepriseId, entreprises, journeeToEdit, initialDate, allTours]);

  // Charge les tours quand la saison change
  useEffect(() => {
    if (selectedSaisonId) {
      const tours = allTours.filter(t => t.saisonId === selectedSaisonId)
        .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
      setTours(tours);
      setFilteredTours(tours);
    }
  }, [selectedSaisonId, allTours]);

  // Filtre les tours en fonction de la recherche
  useEffect(() => {
    if (tourSearch === '') {
      setFilteredTours(tours);
    } else {
      const filtered = tours.filter(tour =>
        tour.numero.toLowerCase().includes(tourSearch.toLowerCase()) ||
        tour.lignesDestinations.some(ligne => ligne.toLowerCase().includes(tourSearch.toLowerCase()))
      );
      setFilteredTours(filtered);
    }
  }, [tourSearch, tours]);

  // Remplit les horaires et primes si un tour est sélectionné
  useEffect(() => {
    if (selectedTourId && tours.length > 0) {
      const tour = tours.find(t => t.id === selectedTourId);
      if (tour) {
        setHeurePriseService(tour.heurePriseService);
        setHeureDepartPause(tour.heureDepartPause || '');
        setHeureReprise(tour.heureReprise || '');
        setHeureFinService(tour.heureFinService);
        setLignesDestinations(tour.lignesDestinations.join(', '));
        // Ajoute les primes du tour aux primes sélectionnées (sans doublons)
        setPrimesSelectionnees(prev => {
          const tourPrimesIds = new Set(tour.primes?.map(p => p.id) || []);
          return [...prev.filter(p => !tourPrimesIds.has(p.id)), ...(tour.primes || [])];
        });
      }
    }
  }, [selectedTourId, tours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntrepriseId || !heurePriseService || !heureFinService) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const nouvelleJournee: any = {
      date: localDate,
      entrepriseId: selectedEntrepriseId,
      role,
      heurePriseService,
      heureFinService,
      primes: [...primesSelectionnees, ...primesSpeciales],
      notes: notes || "",
    };

    if (selectedEntrepriseId === RDTPM_ID && selectedTourId) {
      nouvelleJournee.tourId = selectedTourId;
    }
    if (heureDepartPause) nouvelleJournee.heureDepartPause = heureDepartPause;
    if (heureReprise) nouvelleJournee.heureReprise = heureReprise;
    if (lignesDestinations) nouvelleJournee.lignesDestinations = lignesDestinations.split(',').map(l => l.trim());
    if (selectedSaisonId) nouvelleJournee.saisonId = selectedSaisonId;

    try {
      if (isEditMode && journeeToEdit) {
        await mettreAJourJournee(journeeToEdit.id, nouvelleJournee);
        alert("Journée modifiée avec succès !");
      } else {
        await ajouterJournee(nouvelleJournee);
        alert("Journée ajoutée avec succès !");
      }
      onJourneeAjoutee();
      onClose();
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  // Trie les entreprises pour mettre RDTPM en premier
  const entreprisesOrdonnees = [
    ...entreprises.filter(e => e.id === RDTPM_ID),
    ...entreprises.filter(e => e.id !== RDTPM_ID)
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px',
        width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        color: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h2>{isEditMode ? 'Modifier une journée' : 'Ajouter une journée'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Date */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Date</label>
            <input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            />
          </div>

          {/* Entreprise (affichage nom + couleur) */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Entreprise</label>
            <select
              value={selectedEntrepriseId}
              onChange={(e) => {
                setSelectedEntrepriseId(e.target.value);
                setSelectedTourId('');
                setPrimesSelectionnees([]);
                setPrimesSpeciales([]);
              }}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            >
              {entreprisesOrdonnees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} {e.couleur && `(${e.couleur})`}
                </option>
              ))}
            </select>
          </div>

          {/* Rôle (Boutons radio) */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Rôle</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="role"
                  value="Matelot"
                  checked={role === 'Matelot'}
                  onChange={() => setRole('Matelot')}
                  style={{ marginRight: '6px' }}
                />
                Matelot
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="role"
                  value="Capitaine"
                  checked={role === 'Capitaine'}
                  onChange={() => setRole('Capitaine')}
                  style={{ marginRight: '6px' }}
                />
                Capitaine
              </label>
            </div>
          </div>

          {/* Section pour RDTPM: Tour (affichage "Tour X - destination") */}
          {selectedEntrepriseId === RDTPM_ID && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Tour de service</label>
                <input
                  type="text"
                  placeholder="Rechercher un tour..."
                  value={tourSearch}
                  onChange={(e) => setTourSearch(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', marginBottom: '4px', fontSize: '14px' }}
                />
                <select
                  value={selectedTourId}
                  onChange={(e) => setSelectedTourId(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
                  required
                >
                  <option value="">-- Sélectionner un tour --</option>
                  {filteredTours.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tour {t.numero} - {t.lignesDestinations.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Heures */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de prise de service</label>
            <input
              type="time"
              value={heurePriseService}
              onChange={(e) => setHeurePriseService(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de départ en pause</label>
            <input
              type="time"
              value={heureDepartPause}
              onChange={(e) => setHeureDepartPause(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de reprise</label>
            <input
              type="time"
              value={heureReprise}
              onChange={(e) => setHeureReprise(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de fin de service</label>
            <input
              type="time"
              value={heureFinService}
              onChange={(e) => setHeureFinService(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            />
          </div>

          {/* Lignes de destination (uniquement pour RDTPM) */}
          {selectedEntrepriseId === RDTPM_ID && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Lignes de destination</label>
              <input
                type="text"
                value={lignesDestinations}
                onChange={(e) => setLignesDestinations(e.target.value)}
                placeholder="Ex: Ligne 1, Ligne 2"
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              />
            </div>
          )}

          {/* Primes */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes</label>

            {/* Primes de l'entreprise */}
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px' }}>Primes de l'entreprise :</strong>
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #444', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                {primesEntreprise.length > 0 ? (
                  primesEntreprise.map((prime) => (
                    <div key={prime.id} style={{ marginBottom: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={primesSelectionnees.some(p => p.id === prime.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrimesSelectionnees([...primesSelectionnees, prime]);
                            } else {
                              setPrimesSelectionnees(primesSelectionnees.filter(p => p.id !== prime.id));
                            }
                          }}
                          style={{ marginRight: '6px' }}
                        />
                        {prime.nom} (+{prime.montant} €)
                      </label>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#888', fontSize: '14px' }}>Aucune prime définie pour cette entreprise.</p>
                )}
              </div>
            </div>

            {/* Primes du tour (si un tour est sélectionné) */}
            {selectedTourId && (
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px' }}>Primes du tour sélectionné :</strong>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #444', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                  {tours.find(t => t.id === selectedTourId)?.primes?.length > 0 ? (
                    tours.find(t => t.id === selectedTourId)?.primes?.map((prime: any) => (
                      <div key={prime.id} style={{ marginBottom: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            checked={primesSelectionnees.some(p => p.id === prime.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPrimesSelectionnees([...primesSelectionnees, prime]);
                              } else {
                                setPrimesSelectionnees(primesSelectionnees.filter(p => p.id !== prime.id));
                              }
                            }}
                            style={{ marginRight: '6px' }}
                          />
                          {prime.nom} (+{prime.montant} €)
                        </label>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#888', fontSize: '14px' }}>Aucune prime associée à ce tour.</p>
                  )}
                </div>
              </div>
            )}

            {/* Primes spéciales */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes spéciales</label>
              {primesSpeciales.map((prime, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={prime.nom}
                    onChange={(e) => {
                      const newPrimes = [...primesSpeciales];
                      newPrimes[index].nom = e.target.value;
                      setPrimesSpeciales(newPrimes);
                    }}
                    placeholder="Nom"
                    style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px', marginRight: '4px' }}
                  />
                  <input
                    type="number"
                    value={prime.montant}
                    onChange={(e) => {
                      const newPrimes = [...primesSpeciales];
                      newPrimes[index].montant = Number(e.target.value);
                      setPrimesSpeciales(newPrimes);
                    }}
                    placeholder="€"
                    style={{ width: '80px', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px', marginRight: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setPrimesSpeciales(primesSpeciales.filter((_, i) => i !== index))}
                    style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPrimesSpeciales([...primesSpeciales, { id: Date.now().toString(), nom: '', montant: 0 }])}
                style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '14px', marginTop: '6px' }}
              >
                + Prime spéciale
              </button>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', minHeight: '50px', fontSize: '14px' }}
              placeholder="Ex: Échange de tour avec Jean"
            />
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}
            >
              {isEditMode ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
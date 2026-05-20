// src/components/JourneeForm.tsx
import { useState, useEffect, useMemo } from 'react';
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
  entrepriseId?: string;
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

const JourneeForm = ({ onClose, onJourneeAjoutee, date: initialDate, journeeToEdit, entreprises, tours: allTours }: JourneeFormProps) => {
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
  const [primesSelectionnees, setPrimesSelectionnees] = useState<Prime[]>([]);
  const [primesEntreprise, setPrimesEntreprise] = useState<Prime[]>([]);
  const [primesTour, setPrimesTour] = useState<Prime[]>([]);
  const [primesSpeciales, setPrimesSpeciales] = useState<Prime[]>([]);
  const [notes, setNotes] = useState<string>(journeeToEdit?.notes || '');
  const [tourSearch, setTourSearch] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(!!journeeToEdit);

  // Charge les saisons, tours et primes
  useEffect(() => {
    const loadData = async () => {
      try {
        const saisons = await getSaisons();
        setSaisons(saisons);

        // Détermine la saison automatique
        const dateToCheck = new Date(journeeToEdit?.date || initialDate || new Date());
        const saisonTrouvee = saisons.find(saison => {
          const debut = new Date(saison.dateDebut);
          const fin = new Date(saison.dateFin);
          return dateToCheck >= debut && dateToCheck <= fin;
        });

        if (saisonTrouvee) {
          setSelectedSaisonId(saisonTrouvee.id);
          const tours = allTours.filter(t =>
            t.saisonId === saisonTrouvee.id &&
            (t.entrepriseId === RDTPM_ID || !t.entrepriseId)
          ).sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
          setTours(tours);
          setFilteredTours(tours);
        } else if (saisons.length > 0) {
          setSelectedSaisonId(saisons[0].id);
          const tours = allTours.filter(t =>
            t.saisonId === saisons[0].id &&
            (t.entrepriseId === RDTPM_ID || !t.entrepriseId)
          ).sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
          setTours(tours);
          setFilteredTours(tours);
        }

        // Charge les primes de l'entreprise sélectionnée
        if (selectedEntrepriseId) {
          const entreprise = entreprises.find(e => e.id === selectedEntrepriseId);
          if (entreprise) {
            setPrimesEntreprise(entreprise.primes || []);
            // ✅ NE PAS PRÉ-SÉLECTIONNER LES PRIMES DE L'ENTREPRISE
          }
        } else if (entreprises.length > 0) {
          setSelectedEntrepriseId(entreprises[0].id);
          setPrimesEntreprise(entreprises[0].primes || []);
          // ✅ NE PAS PRÉ-SÉLECTIONNER LES PRIMES DE L'ENTREPRISE
        }

        // Charge les primes sélectionnées depuis journeeToEdit
        if (journeeToEdit?.primes) {
          setPrimesSelectionnees(journeeToEdit.primes);
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
      const tours = allTours.filter(t =>
        t.saisonId === selectedSaisonId &&
        (t.entrepriseId === RDTPM_ID || !t.entrepriseId)
      ).sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
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

  // ✅ Charge les primes du tour sélectionné et DÉSÉLECTIONNE TOUT, puis coche UNIQUEMENT celles du tour
  useEffect(() => {
    if (selectedTourId && tours.length > 0) {
      const tour = tours.find(t => t.id === selectedTourId);
      if (tour) {
        setHeurePriseService(tour.heurePriseService);
        setHeureDepartPause(tour.heureDepartPause || '');
        setHeureReprise(tour.heureReprise || '');
        setHeureFinService(tour.heureFinService);
        setLignesDestinations(tour.lignesDestinations?.join(', ') || '');
        setPrimesTour(tour.primes || []);
        // ✅ DÉSÉLECTIONNE TOUTES LES PRIMES, puis coche UNIQUEMENT celles du tour
        setPrimesSelectionnees(tour.primes || []);
      }
    } else {
      // ✅ Si aucun tour sélectionné, désélectionne tout
      setPrimesTour([]);
      setPrimesSelectionnees([]);
    }
  }, [selectedTourId, tours]);

  // Fusionne primes entreprise + primes tour (sans doublons)
  const allPrimes = useMemo(() => {
    const primesMap = new Map<string, Prime>();
    primesEntreprise.forEach(prime => primesMap.set(prime.id, prime));
    primesTour.forEach(prime => primesMap.set(prime.id, prime));
    return Array.from(primesMap.values());
  }, [primesEntreprise, primesTour]);

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

          {/* Entreprise */}
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

          {/* Rôle */}
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

          {/* Tour (uniquement pour RDTPM) */}
          {selectedEntrepriseId === RDTPM_ID && (
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
              >
                <option value="">-- Sélectionner un tour --</option>
                {filteredTours.map((t) => (
                  <option key={t.id} value={t.id}>
                    Tour {t.numero} - {t.lignesDestinations?.join(', ') || 'Aucune ligne'}
                  </option>
                ))}
              </select>
            </div>
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
                placeholder="Ex: 28M puis 8M"
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              />
            </div>
          )}

          {/* Primes regroupées (entreprise + tour) */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes</label>
            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              border: '1px solid #444',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: '#1a1a1a'
            }}>
              {allPrimes.length > 0 ? (
                allPrimes.map((prime) => {
                  const isFromTour = primesTour.some(p => p.id === prime.id);
                  return (
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
                        {isFromTour && (
                          <span style={{ marginLeft: '8px', color: '#0078d4', fontSize: '12px' }}>
                            (Tour)
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#888', fontSize: '14px' }}>
                  {selectedEntrepriseId ? "Aucune prime définie." : "Sélectionnez une entreprise."}
                </p>
              )}
            </div>
            {selectedTourId && primesTour.length > 0 && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                ⚠️ Seules les primes du tour sont pré-sélectionnées.
              </p>
            )}
          </div>

          {/* Primes spéciales */}
          <div style={{ marginBottom: '12px' }}>
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

export default JourneeForm;
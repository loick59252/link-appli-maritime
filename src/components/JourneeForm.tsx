// src/components/JourneeForm.tsx
import { useState, useEffect } from 'react';
import { ajouterJournee, mettreAJourJournee } from '../services/journees';
import { getSaisons } from '../services/saisons';

type JourneeFormProps = {
  onClose: () => void;
  onJourneeAjoutee: () => void;
  date: string;
  journeeToEdit: any;
  entreprises: any[];
  tours: any[];
  rdtpmId: string;
};

export const JourneeForm = ({ onClose, onJourneeAjoutee, date, journeeToEdit, entreprises, tours, rdtpmId }: JourneeFormProps) => {
  const [localDate, setLocalDate] = useState<string>(journeeToEdit?.date || date);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string>(journeeToEdit?.entrepriseId || rdtpmId);
  const [selectedTourId, setSelectedTourId] = useState<string>(journeeToEdit?.tourId || '');
  const [role, setRole] = useState<'Matelot' | 'Capitaine'>(journeeToEdit?.role || 'Matelot');
  const [setTours] = useState<any[]>([]);
  const [filteredTours, setFilteredTours] = useState<any[]>([]);
  const [saisons, setSaisons] = useState<any[]>([]);
  const [selectedSaisonId, setSelectedSaisonId] = useState<string>('');
  const [heurePriseService, setHeurePriseService] = useState<string>(journeeToEdit?.heurePriseService || '08:00');
  const [heureDepartPause, setHeureDepartPause] = useState<string>(journeeToEdit?.heureDepartPause || '');
  const [heureReprise, setHeureReprise] = useState<string>(journeeToEdit?.heureReprise || '');
  const [heureFinService, setHeureFinService] = useState<string>(journeeToEdit?.heureFinService || '16:00');
  const [lignesDestinations, setLignesDestinations] = useState<string>(journeeToEdit?.lignesDestinations?.join(', ') || '');
  const [primesSelectionnees, setPrimesSelectionnees] = useState<any[]>(journeeToEdit?.primes || []);
  const [primesEntreprise, setPrimesEntreprise] = useState<any[]>([]);
  const [primesTour, setPrimesTour] = useState<any[]>([]);
  const [primesSpeciales, setPrimesSpeciales] = useState<any[]>(journeeToEdit?.primesSpeciales || []);
  const [notes, setNotes] = useState<string>(journeeToEdit?.notes || '');
  const [tourSearch, setTourSearch] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(!!journeeToEdit);

  // Charge les saisons et les tours au montage
  useEffect(() => {
    const loadData = async () => {
      const saisonsData = await getSaisons();
      setSaisons(saisonsData);

      // Filtre les tours pour l'entreprise sélectionnée
      updateToursForEntreprise(selectedEntrepriseId, saisonsData);
    };
    loadData();
  }, []);

  // Met à jour les tours quand l'entreprise change
  useEffect(() => {
    const loadTours = async () => {
      const saisonsData = saisons.length > 0 ? saisons : await getSaisons();
      updateToursForEntreprise(selectedEntrepriseId, saisonsData);
    };
    loadTours();
  }, [selectedEntrepriseId, saisons]);

  // Met à jour les tours en fonction de l'entreprise et de la saison
  const updateToursForEntreprise = (entrepriseId: string, saisonsData: any[]) => {
    if (entrepriseId) {
      const entreprise = entreprises.find(e => e.id === entrepriseId);
      if (!entreprise) return;

      // Pour RDTPM, on filtre les tours par saison
      if (entrepriseId === rdtpmId && selectedSaisonId) {
        const filtered = tours.filter(t =>
          t.entrepriseId === rdtpmId &&
          t.saisonId === selectedSaisonId
        ).sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
        setTours(filtered);
        setFilteredTours(filtered);
      } else {
        // Pour les autres entreprises, on prend tous les tours
        const filtered = tours.filter(t => t.entrepriseId === entrepriseId);
        setTours(filtered);
        setFilteredTours(filtered);
      }

      // Met à jour les primes de l'entreprise
      setPrimesEntreprise(entreprise.primes || []);
      setPrimesSelectionnees(journeeToEdit?.primes || []);
    }
  };

  // Met à jour les tours quand la saison change (uniquement pour RDTPM)
  useEffect(() => {
    if (selectedEntrepriseId === rdtpmId) {
      const filtered = tours.filter(t =>
        t.entrepriseId === rdtpmId &&
        t.saisonId === selectedSaisonId
      ).sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
      setTours(filtered);
      setFilteredTours(filtered);
      setSelectedTourId(''); // Réinitialise le tour sélectionné
    }
  }, [selectedSaisonId, tours, rdtpmId, selectedEntrepriseId]);

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

  // Charge les primes du tour sélectionné
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
        setPrimesSelectionnees(tour.primes || []);
      }
    } else {
      setPrimesTour([]);
      setPrimesSelectionnees([]);
    }
  }, [selectedTourId, tours]);

  // Trie les entreprises pour mettre RDTPM en premier
  const entreprisesOrdonnees = [
    ...entreprises.filter(e => e.id === rdtpmId),
    ...entreprises.filter(e => e.id !== rdtpmId)
  ];

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

    if (selectedEntrepriseId === rdtpmId && selectedTourId) {
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
              onChange={(e) => {
                setLocalDate(e.target.value);
                setSelectedTourId('');
              }}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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

          {/* Saison (uniquement pour RDTPM) */}
          {selectedEntrepriseId === rdtpmId && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Saison</label>
              <select
                value={selectedSaisonId}
                onChange={(e) => setSelectedSaisonId(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                required
              >
                <option value="">-- Sélectionner une saison --</option>
                {saisons.map(saison => (
                  <option key={saison.id} value={saison.id}>
                    {saison.nom} ({new Date(saison.dateDebut).toLocaleDateString('fr-FR')} - {new Date(saison.dateFin).toLocaleDateString('fr-FR')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tour (uniquement pour RDTPM) */}
          {selectedEntrepriseId === rdtpmId && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Tour de service</label>
              <input
                type="text"
                placeholder="Rechercher un tour..."
                value={tourSearch}
                onChange={(e) => setTourSearch(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', marginBottom: '4px' }}
              />
              <select
                value={selectedTourId}
                onChange={(e) => setSelectedTourId(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de départ en pause</label>
            <input
              type="time"
              value={heureDepartPause}
              onChange={(e) => setHeureDepartPause(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de reprise</label>
            <input
              type="time"
              value={heureReprise}
              onChange={(e) => setHeureReprise(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de fin de service</label>
            <input
              type="time"
              value={heureFinService}
              onChange={(e) => setHeureFinService(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              required
            />
          </div>

          {/* Lignes de destination (uniquement pour RDTPM) */}
          {selectedEntrepriseId === rdtpmId && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Lignes de destination</label>
              <input
                type="text"
                value={lignesDestinations}
                onChange={(e) => setLignesDestinations(e.target.value)}
                placeholder="Ex: 28M, 8M"
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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
              {primesEntreprise.length > 0 ? (
                primesEntreprise.map((prime) => {
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
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', marginRight: '4px' }}
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
                  style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', marginRight: '4px' }}
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
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', minHeight: '50px' }}
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
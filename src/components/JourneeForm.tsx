// src/components/JourneeForm.tsx
import { useState, useEffect } from 'react';
import { ajouterJournee, mettreAJourJournee } from '../services/journees';
import { getToursParEntreprise } from '../services/tours';
import { getSaisons } from '../services/saisons';

type JourneeFormProps = {
  onClose: () => void;
  onJourneeAjoutee: () => void;
  date: string;
  journeeToEdit: any;
  entreprises: any[];
  tours: any[];
  rdtpmId: string;
  setTours: (tours: any[]) => void;
};

export const JourneeForm = ({
  onClose,
  onJourneeAjoutee,
  date,
  journeeToEdit,
  entreprises,
  tours,
  rdtpmId,
  setTours
}: JourneeFormProps) => {
  // États pour le formulaire
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string>(journeeToEdit?.entrepriseId || rdtpmId);
  const [selectedTourId, setSelectedTourId] = useState<string>(journeeToEdit?.tourId || '');
  const [role, setRole] = useState<'Matelot' | 'Capitaine'>(journeeToEdit?.role || 'Matelot');
  const [saisons, setSaisons] = useState<any[]>([]);
  const [selectedSaisonId, setSelectedSaisonId] = useState<string>(journeeToEdit?.saisonId || '');
  const [heurePriseService, setHeurePriseService] = useState<string>(journeeToEdit?.heurePriseService || '08:00');
  const [heureDepartPause, setHeureDepartPause] = useState<string>(journeeToEdit?.heureDepartPause || '');
  const [heureReprise, setHeureReprise] = useState<string>(journeeToEdit?.heureReprise || '');
  const [heureFinService, setHeureFinService] = useState<string>(journeeToEdit?.heureFinService || '16:00');
  const [lignesDestinations, setLignesDestinations] = useState<string>(journeeToEdit?.lignesDestinations?.join(', ') || '');
  const [primesSelectionnees, setPrimesSelectionnees] = useState<any[]>(journeeToEdit?.primes || []);
  const [primesSpeciales, setPrimesSpeciales] = useState<any[]>(journeeToEdit?.primesSpeciales || []);
  const [notes, setNotes] = useState<string>(journeeToEdit?.notes || '');
  const [isEditMode, setIsEditMode] = useState<boolean>(!!journeeToEdit);
  const [filteredTours, setFilteredTours] = useState<any[]>([]);

  // Charge les saisons au montage
  useEffect(() => {
    const loadSaisons = async () => {
      try {
        const saisonsData = await getSaisons();
        setSaisons(saisonsData);
        // Si on est en mode édition et qu'une saison est déjà sélectionnée, on ne change pas
        if (!selectedSaisonId && saisonsData.length > 0 && !journeeToEdit?.saisonId) {
          setSelectedSaisonId(saisonsData[0].id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des saisons:", error);
      }
    };
    loadSaisons();
  }, []);

  // Charge les tours pour l'entreprise sélectionnée
  useEffect(() => {
    const loadTours = async () => {
      try {
        if (selectedEntrepriseId === rdtpmId) {
          const toursData = await getToursParEntreprise(rdtpmId);
          // Filtre les tours par saison si une saison est sélectionnée
          const filtered = selectedSaisonId
            ? toursData.filter(t => t.saisonId === selectedSaisonId)
            : toursData;
          setFilteredTours(filtered.sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true })));
          setTours(filtered); // Met à jour les tours dans App.tsx
        } else {
          // Pour les autres entreprises, on prend tous les tours
          setFilteredTours(tours.filter(t => t.entrepriseId === selectedEntrepriseId));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des tours:", error);
      }
    };

    loadTours();
  }, [selectedEntrepriseId, selectedSaisonId, rdtpmId, tours]);

  // Met à jour le tour sélectionné quand les tours changent
  useEffect(() => {
    if (filteredTours.length > 0 && selectedTourId && !filteredTours.some(t => t.id === selectedTourId)) {
      setSelectedTourId('');
    }
  }, [filteredTours, selectedTourId]);

  // Met à jour les heures de pause/reprise si un tour est sélectionné
  useEffect(() => {
  if (selectedTourId && filteredTours.length > 0) {
    const tour = filteredTours.find(t => t.id === selectedTourId);
    if (tour) {
      setHeurePriseService(tour.heurePriseService);
      setHeureFinService(tour.heureFinService);
      // ✅ Correction ici
      setLignesDestinations(Array.isArray(tour.lignesDestinations)
        ? tour.lignesDestinations.join(', ')
        : tour.lignesDestinations || '');
      if (tour.heureDepartPause) {
        setHeureDepartPause(tour.heureDepartPause);
      } else {
        setHeureDepartPause('');
      }
      if (tour.heureReprise) {
        setHeureReprise(tour.heureReprise);
      } else {
        setHeureReprise('');
      }
      setPrimesSelectionnees(tour.primes || []);
    }
  } else {
    setPrimesSelectionnees([]);
  }
}, [selectedTourId, filteredTours]);


  // Trie les entreprises pour mettre RDTPM en premier
  const entreprisesOrdonnees = [
    ...entreprises.filter(e => e.id === rdtpmId),
    ...entreprises.filter(e => e.id !== rdtpmId)
  ];

  // Gère l'entreprise sélectionnée
  useEffect(() => {
    if (selectedEntrepriseId !== rdtpmId) {
      setSelectedTourId(''); // Réinitialise le tour si l'entreprise change (sauf pour RDTPM)
      setPrimesSelectionnees([]);
    }
  }, [selectedEntrepriseId, rdtpmId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntrepriseId || !heurePriseService || !heureFinService) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const nouvelleJournee: any = {
      date: date,
      entrepriseId: selectedEntrepriseId,
      role,
      heurePriseService,
      heureFinService,
      primes: [...primesSelectionnees, ...primesSpeciales],
      notes: notes || "",
    };

    // Ajoute les champs optionnels
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

  // Gère l'ajout d'une prime spéciale
  const handleAddPrimeSpeciale = () => {
    setPrimesSpeciales([...primesSpeciales, { id: Date.now().toString(), nom: '', montant: 0 }]);
  };

  // Gère la suppression d'une prime spéciale
  const handleRemovePrimeSpeciale = (id: string) => {
    setPrimesSpeciales(primesSpeciales.filter(prime => prime.id !== id));
  };

  // Gère le changement de prime spéciale
  const handleChangePrimeSpeciale = (id: string, field: string, value: any) => {
    setPrimesSpeciales(primesSpeciales.map(prime =>
      prime.id === id ? { ...prime, [field]: value } : prime
    ));
  };

  // Récupère les primes de l'entreprise sélectionnée
  const entrepriseSelectionnee = entreprises.find(e => e.id === selectedEntrepriseId);
  const primesEntreprise = entrepriseSelectionnee?.primes || [];

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
          {/* Date */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {}}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              disabled
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
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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
              <select
  value={selectedTourId}
  onChange={(e) => setSelectedTourId(e.target.value)}
  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
>
  <option value="">-- Sélectionner un tour --</option>
  {filteredTours.map((t) => {
    // ✅ Correction ici
    const lignes = Array.isArray(t.lignesDestinations)
      ? t.lignesDestinations.join(', ')
      : t.lignesDestinations || 'Aucune ligne';
    return (
      <option key={t.id} value={t.id}>
        Tour {t.numero} - {lignes} - {calculerDureeHHMM(t)}
      </option>
    );
  })}
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
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de départ en pause</label>
            <input
              type="time"
              value={heureDepartPause}
              onChange={(e) => setHeureDepartPause(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de reprise</label>
            <input
              type="time"
              value={heureReprise}
              onChange={(e) => setHeureReprise(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Heure de fin de service</label>
            <input
              type="time"
              value={heureFinService}
              onChange={(e) => setHeureFinService(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
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
                  const isFromTour = (filteredTours.find(t => t.id === selectedTourId)?.primes || []).includes(prime.id);
                  return (
                    <div key={prime.id} style={{ marginBottom: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={primesSelectionnees.some(p => p.id === prime.id || p === prime.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrimesSelectionnees([...primesSelectionnees, prime.id]);
                            } else {
                              setPrimesSelectionnees(primesSelectionnees.filter(p => p.id !== prime.id && p !== prime.id));
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
            {selectedTourId && (filteredTours.find(t => t.id === selectedTourId)?.primes || []).length > 0 && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#888' }}>
                ⚠️ Les primes du tour sont pré-sélectionnées.
              </p>
            )}
          </div>

          {/* Primes spéciales */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes spéciales</label>
            {primesSpeciales.map((prime, index) => (
              <div key={prime.id} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={prime.nom}
                  onChange={(e) => handleChangePrimeSpeciale(prime.id, 'nom', e.target.value)}
                  placeholder="Nom"
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', marginRight: '4px' }}
                />
                <input
                  type="number"
                  value={prime.montant}
                  onChange={(e) => handleChangePrimeSpeciale(prime.id, 'montant', Number(e.target.value))}
                  placeholder="€"
                  style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', marginRight: '4px' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePrimeSpeciale(prime.id)}
                  style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPrimeSpeciale}
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

  // Fonction pour calculer la durée d'un tour
  function calculerDureeHHMM(tour: any): string {
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
  }
};

export default JourneeForm;
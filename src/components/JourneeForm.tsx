// src/components/JourneeForm.tsx
import { useState, useEffect } from 'react';
import { ajouterJournee, mettreAJourJournee } from '../services/journees';
import { getTours } from '../services/tours';

interface JourneeFormProps {
  onClose: () => void;
  onJourneeAjoutee: () => void;
  date: string;
  journeeToEdit: any;
  entreprises: any[];
  tours: any[];
  rdtpmId: string;
  setTours: (tours: any[]) => void;
}

export default function JourneeForm({
  onClose,
  onJourneeAjoutee,
  date,
  journeeToEdit,
  entreprises,
  tours,
  rdtpmId,
  setTours
}: JourneeFormProps) {
  // États pour les champs du formulaire
  const [entrepriseId, setEntrepriseId] = useState<string>(journeeToEdit?.entrepriseId || '');
  const [role, setRole] = useState<'Matelot' | 'Capitaine'>(journeeToEdit?.role || 'Matelot');
  const [heurePriseService, setHeurePriseService] = useState<string>(journeeToEdit?.heurePriseService || '08:00');
  const [heureFinService, setHeureFinService] = useState<string>(journeeToEdit?.heureFinService || '17:00');
  const [hasPause, setHasPause] = useState<boolean>(!!journeeToEdit?.heureDepartPause);
  const [heureDepartPause, setHeureDepartPause] = useState<string>(journeeToEdit?.heureDepartPause || '12:00');
  const [heureReprise, setHeureReprise] = useState<string>(journeeToEdit?.heureReprise || '13:00');
  const [lignesDestinations, setLignesDestinations] = useState<string[]>(journeeToEdit?.lignesDestinations || []);
  const [tourId, setTourId] = useState<string>(journeeToEdit?.tourId || '');
  const [primes, setPrimes] = useState<string[]>(journeeToEdit?.primes || []);
  const [notes, setNotes] = useState<string>(journeeToEdit?.notes || '');
  const [saisonId, setSaisonId] = useState<string>(journeeToEdit?.saisonId || '');
  const [availableTours, setAvailableTours] = useState<any[]>([]);

  // Charge les tours disponibles quand l'entreprise ou la saison change
// Dans JourneeForm.tsx, remplace le useEffect par :
useEffect(() => {
  const fetchTours = async () => {
    if (entrepriseId && saisonId) {
      try {
        const allTours = await getTours();
        const filteredTours = allTours.filter(tour =>
          tour.entrepriseId === entrepriseId && tour.saisonId === saisonId
        );
        setAvailableTours(filteredTours);
      } catch (error) {
        console.error("Erreur lors du chargement des tours:", error);
      }
    } else {
      setAvailableTours([]);
    }
  };
  fetchTours();
}, [entrepriseId, saisonId]);

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const journeeData = {
      date,
      entrepriseId,
      role,
      heurePriseService,
      heureFinService,
      heureDepartPause: hasPause ? heureDepartPause : null,
      heureReprise: hasPause ? heureReprise : null,
      lignesDestinations: lignesDestinations.length > 0 ? lignesDestinations : null,
      tourId: tourId || null,
      primes: primes.length > 0 ? primes : null,
      notes: notes || null,
      saisonId: saisonId || null
    };

    try {
      if (journeeToEdit) {
        await mettreAJourJournee(journeeToEdit.id, journeeData);
      } else {
        await ajouterJournee(journeeData);
      }
      onJourneeAjoutee();
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert(`Erreur lors de l'enregistrement: ${error}`);
    }
  };

  // Entreprise sélectionnée
  const selectedEntreprise = entreprises.find(e => e.id === entrepriseId);
  const availablePrimes = selectedEntreprise?.primes || [];

  // Gestion des lignes de destinations
  const handleLignesDestinationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setLignesDestinations(values);
  };

  // Gestion des primes
  const handlePrimeChange = (primeId: string, isChecked: boolean) => {
    if (isChecked) {
      setPrimes([...primes, primeId]);
    } else {
      setPrimes(primes.filter(p => p !== primeId));
    }
  };

  // Gestion de la pause
  const handlePauseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasPause(e.target.checked);
    if (!e.target.checked) {
      setHeureDepartPause('12:00');
      setHeureReprise('13:00');
    }
  };

  // Vérifie si RDTPM est sélectionnée
  const isRDTPM = entrepriseId === rdtpmId;

  return (
    <div className="journee-form">
      <div className="journee-form-container">
        <h2>{journeeToEdit ? 'Modifier une journée' : 'Ajouter une journée'}</h2>

        <form onSubmit={handleSubmit}>
          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Entreprise */}
          <div className="form-group">
            <label htmlFor="entreprise">Entreprise</label>
            <select
              id="entreprise"
              value={entrepriseId}
              onChange={(e) => {
                setEntrepriseId(e.target.value);
                setSaisonId(''); // Réinitialise la saison quand l'entreprise change
                setTourId('');   // Réinitialise le tour
              }}
              required
            >
              <option value="">Sélectionnez une entreprise</option>
              {entreprises.map(entreprise => (
                <option key={entreprise.id} value={entreprise.id}>
                  {entreprise.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Rôle */}
          <div className="form-group">
            <label>Rôle</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="Matelot"
                  checked={role === 'Matelot'}
                  onChange={() => setRole('Matelot')}
                />
                Matelot
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="Capitaine"
                  checked={role === 'Capitaine'}
                  onChange={() => setRole('Capitaine')}
                />
                Capitaine
              </label>
            </div>
          </div>

          {/* Heures de service */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="heurePriseService">Heure de prise de service</label>
              <input
                id="heurePriseService"
                type="time"
                value={heurePriseService}
                onChange={(e) => setHeurePriseService(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="heureFinService">Heure de fin de service</label>
              <input
                id="heureFinService"
                type="time"
                value={heureFinService}
                onChange={(e) => setHeureFinService(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Pause */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasPause}
                onChange={handlePauseChange}
              />
              Avec pause
            </label>
            {hasPause && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="heureDepartPause">Départ en pause</label>
                  <input
                    id="heureDepartPause"
                    type="time"
                    value={heureDepartPause}
                    onChange={(e) => setHeureDepartPause(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="heureReprise">Reprise</label>
                  <input
                    id="heureReprise"
                    type="time"
                    value={heureReprise}
                    onChange={(e) => setHeureReprise(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section spécifique à RDTPM */}
          {isRDTPM && (
            <>
              <div className="form-group">
                <label htmlFor="saison">Saison</label>
                <select
                  id="saison"
                  value={saisonId}
                  onChange={(e) => {
                    setSaisonId(e.target.value);
                    setTourId(''); // Réinitialise le tour quand la saison change
                  }}
                  required
                >
                  <option value="">Sélectionnez une saison</option>
                  {saisons.map(saison => (
                    <option key={saison.id} value={saison.id}>
                      {saison.nom}
                    </option>
                  ))}
                </select>
              </div>

              {saisonId && (
                <div className="form-group">
                  <label htmlFor="tour">Tour</label>
                  <select
                    id="tour"
                    value={tourId}
                    onChange={(e) => setTourId(e.target.value)}
                  >
                    <option value="">Aucun tour</option>
                    {availableTours.map(tour => (
                      <option key={tour.id} value={tour.id}>
                        Tour {tour.numero}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="lignesDestinations">Lignes de destinations</label>
                <input
                  id="lignesDestinations"
                  type="text"
                  value={lignesDestinations.join(', ')}
                  onChange={handleLignesDestinationsChange}
                  placeholder="Ex: 8M, 12B, 3D"
                />
              </div>
            </>
          )}

          {/* Primes */}
          <div className="form-group">
            <label>Primes</label>
            <div className="primes-checkbox-group">
              {availablePrimes.length > 0 ? (
                availablePrimes.map(prime => (
                  <label key={prime.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={primes.includes(prime.id)}
                      onChange={(e) => handlePrimeChange(prime.id, e.target.checked)}
                    />
                    {prime.nom} (+{prime.montant}€)
                  </label>
                ))
              ) : (
                <p className="no-primes">Aucune prime disponible pour cette entreprise</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ajoutez des notes si nécessaire"
            />
          </div>

          {/* Boutons */}
          <div className="form-actions">
            <button type="submit" className="submit-button">
              {journeeToEdit ? 'Modifier' : 'Ajouter'}
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
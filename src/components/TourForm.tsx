// src/components/TourForm.tsx
import { useState, useEffect } from 'react';
import { getSaisons } from './../services/saisons';
import { ajouterTour, mettreAJourTour } from './../services/tours';
import { getPrimes } from './../services/primes'; // ✅ Ajout pour récupérer les primes

type TourFormProps = {
  onClose: () => void;
  onTourAjoute: () => void;
  tourToEdit?: any;
};

export const TourForm = ({ onClose, onTourAjoute, tourToEdit }: TourFormProps) => {
  const [numero, setNumero] = useState<string>(tourToEdit?.numero || '');
  const [saisonId, setSaisonId] = useState<string>(tourToEdit?.saisonId || '');
  const [heurePriseService, setHeurePriseService] = useState<string>(tourToEdit?.heurePriseService || '');
  const [heureDepartPause, setHeureDepartPause] = useState<string>(tourToEdit?.heureDepartPause || '');
  const [heureReprise, setHeureReprise] = useState<string>(tourToEdit?.heureReprise || '');
  const [heureFinService, setHeureFinService] = useState<string>(tourToEdit?.heureFinService || '');
  const [lignesDestinations, setLignesDestinations] = useState<string>(tourToEdit?.lignesDestinations?.join(', ') || '');
  const [saisons, setSaisons] = useState<any[]>([]);
  const [primes, setPrimes] = useState<any[]>([]); // ✅ État pour les primes
  const [selectedPrimes, setSelectedPrimes] = useState<any[]>(tourToEdit?.primes || []); // ✅ Primes sélectionnées
  const [isEditMode, setIsEditMode] = useState<boolean>(!!tourToEdit);

  useEffect(() => {
    const loadData = async () => {
      const [saisonsData, primesData] = await Promise.all([
        getSaisons(),
        getPrimes() // ✅ Charge les primes
      ]);
      setSaisons(saisonsData);
      setPrimes(primesData);
      if (saisonsData.length > 0 && !saisonId) {
        setSaisonId(saisonsData[0].id);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero || !saisonId || !heurePriseService || !heureFinService) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const tourData: any = {
      numero,
      saisonId,
      heurePriseService,
      heureFinService,
      lignesDestinations: lignesDestinations.split(',').map(l => l.trim()),
      primes: selectedPrimes // ✅ Ajoute les primes sélectionnées
    };

    if (heureDepartPause) tourData.heureDepartPause = heureDepartPause;
    if (heureReprise) tourData.heureReprise = heureReprise;

    try {
      if (isEditMode && tourToEdit) {
        await mettreAJourTour(tourToEdit.id, tourData);
        alert("Tour modifié avec succès !");
      } else {
        await ajouterTour(tourData);
        alert("Tour ajouté avec succès !");
      }
      onTourAjoute();
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
        <h2>{isEditMode ? 'Modifier un tour' : 'Ajouter un tour'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Numéro */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Numéro du tour</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 1, A, B"
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            />
          </div>

          {/* Saison */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Saison</label>
            <select
              value={saisonId}
              onChange={(e) => setSaisonId(e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            >
              {saisons.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>

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

          {/* Lignes de destination */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Lignes de destination</label>
            <input
              type="text"
              value={lignesDestinations}
              onChange={(e) => setLignesDestinations(e.target.value)}
              placeholder="Ex: Ligne 1, Ligne 2, Ligne 3"
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            />
          </div>

          {/* Primes (cases à cocher) */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes associées</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #444', padding: '8px', borderRadius: '4px' }}>
              {primes.length > 0 ? (
                primes.map((prime) => (
                  <div key={prime.id} style={{ marginBottom: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={selectedPrimes.some(p => p.id === prime.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPrimes([...selectedPrimes, prime]);
                          } else {
                            setSelectedPrimes(selectedPrimes.filter(p => p.id !== prime.id));
                          }
                        }}
                        style={{ marginRight: '6px' }}
                      />
                      {prime.nom} (+{prime.montant} €)
                    </label>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888', fontSize: '14px' }}>Aucune prime disponible.</p>
              )}
            </div>
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
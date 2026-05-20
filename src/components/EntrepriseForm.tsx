// src/components/EntrepriseForm.tsx
import { useState, useEffect } from 'react';
import { ajouterEntreprise, mettreAJourEntreprise } from './../services/entreprises';
import { getPrimes } from './../services/primes'; // ✅ Import des primes

type EntrepriseFormProps = {
  onClose: () => void;
  onEntrepriseAjoutee: () => void;
  entrepriseToEdit?: any;
};

const COULEURS_DISPONIBLES = [
  '#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3',
  '#33FFF3', '#8A2BE2', '#FF7F50', '#6495ED', '#DC143C'
];

export const EntrepriseForm = ({ onClose, onEntrepriseAjoutee, entrepriseToEdit }: EntrepriseFormProps) => {
  const [nom, setNom] = useState<string>(entrepriseToEdit?.nom || '');
  const [salaireMatelot, setSalaireMatelot] = useState<number>(entrepriseToEdit?.salaireMatelot || 0);
  const [salaireCapitaine, setSalaireCapitaine] = useState<number>(entrepriseToEdit?.salaireCapitaine || 0);
  const [couleur, setCouleur] = useState<string>(entrepriseToEdit?.couleur || COULEURS_DISPONIBLES[0]);
  const [allPrimes, setAllPrimes] = useState<any[]>([]); // ✅ Toutes les primes disponibles
  const [selectedPrimes, setSelectedPrimes] = useState<any[]>(entrepriseToEdit?.primes || []); // ✅ Primes sélectionnées
  const [isEditMode, setIsEditMode] = useState<boolean>(!!entrepriseToEdit);

  // ✅ Charge les primes AU DÉMARRAGE du composant
  useEffect(() => {
    const loadPrimes = async () => {
      try {
        const primes = await getPrimes();
        setAllPrimes(primes);
        console.log("Primes chargées:", primes); // ✅ Debug: vérifie que les primes sont bien chargées
      } catch (error) {
        console.error("Erreur lors du chargement des primes:", error);
      }
    };
    loadPrimes();
  }, []); // ✅ useEffect sans dépendances pour charger une seule fois

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom) {
      alert("Veuillez remplir le nom de l'entreprise.");
      return;
    }

    const entrepriseData = {
      nom,
      salaireMatelot,
      salaireCapitaine,
      couleur,
      primes: selectedPrimes // ✅ Inclut les primes sélectionnées
    };

    try {
      if (isEditMode) {
        await mettreAJourEntreprise(entrepriseToEdit.id, entrepriseData);
        alert("Entreprise modifiée avec succès !");
      } else {
        await ajouterEntreprise(entrepriseData);
        alert("Entreprise ajoutée avec succès !");
      }
      onEntrepriseAjoutee();
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
        width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
        color: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h2>{isEditMode ? 'Modifier une entreprise' : 'Ajouter une entreprise'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Nom */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de l'entreprise"
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
              required
            />
          </div>

          {/* Salaires */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Salaire Matelot (€/jour)</label>
            <input
              type="number"
              value={salaireMatelot}
              onChange={(e) => setSalaireMatelot(Number(e.target.value))}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Salaire Capitaine (€/jour)</label>
            <input
              type="number"
              value={salaireCapitaine}
              onChange={(e) => setSalaireCapitaine(Number(e.target.value))}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '14px' }}
            />
          </div>

          {/* Couleur */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Couleur</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {COULEURS_DISPONIBLES.map((color) => (
                <div
                  key={color}
                  onClick={() => setCouleur(color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: couleur === color ? '2px solid white' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* ✅ PRIMES DE L'ENTREPRISE */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Primes de l'entreprise</label>
            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              border: '1px solid #444',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: '#1a1a1a'
            }}>
              {allPrimes.length > 0 ? (
                allPrimes.map((prime) => (
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
                <p style={{ color: '#888', fontSize: '14px' }}>
                  {allPrimes.length === 0 ? "Aucune prime dans la base de données." : "Chargement des primes..."}
                </p>
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

export default EntrepriseForm; // ✅ Export par défaut
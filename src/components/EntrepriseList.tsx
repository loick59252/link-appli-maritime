// src/components/EntrepriseList.tsx
import { useState } from 'react';
import { mettreAJourEntreprise, ajouterEntreprise } from '../services/entreprises';

type Entreprise = {
  id: string;
  nom: string;
  couleur: string;
  logo?: string;
  salaires: {
    matelot: { montant: number; isBrut: boolean; };
    capitaine: { montant: number; isBrut: boolean; };
  };
  primes: {
    id: string;
    nom: string;
    montant: number;
    isBrut: boolean;
    applicableA: 'Matelot' | 'Capitaine' | 'Tous';
  }[];
};

type EntrepriseListProps = {
  entreprises: Entreprise[];
  onEntreprisesUpdated: () => void;
  rdtpmId: string;
  setRdtpmId: (id: string) => void;
};

// Nouvelle entreprise par défaut
const nouvelleEntrepriseVide = (): Omit<Entreprise, 'id'> => ({
  nom: '',
  couleur: '#0078d4',
  salaires: {
    matelot: { montant: 0, isBrut: true },
    capitaine: { montant: 0, isBrut: true }
  },
  primes: []
});

export const EntrepriseList = ({ entreprises, onEntreprisesUpdated, rdtpmId, setRdtpmId }: EntrepriseListProps) => {
  const [editingEntreprise, setEditingEntreprise] = useState<Partial<Entreprise> & { id?: string } | null>(null);
  const [newPrimeNom, setNewPrimeNom] = useState('');
  const [newPrimeMontant, setNewPrimeMontant] = useState(0);
  const [newPrimeApplicableA, setNewPrimeApplicableA] = useState<'Matelot' | 'Capitaine' | 'Tous'>('Tous');
  const [newPrimeIsBrut, setNewPrimeIsBrut] = useState(true);

  const handleAddEntreprise = () => {
    setEditingEntreprise({ ...nouvelleEntrepriseVide(), id: undefined });
  };

  const handleEdit = (entreprise: Entreprise) => setEditingEntreprise({ ...entreprise });

const handleSave = async () => {
  if (!editingEntreprise || !editingEntreprise.nom) return;

  try {
    // ✅ On crée une copie sans l'ID pour l'ajout
    const entrepriseData = { ...editingEntreprise };

    // ✅ On supprime l'ID si on est en mode ajout
    if (!editingEntreprise.id) {
      delete entrepriseData.id;
    }

    if (editingEntreprise.id) {
      // Mise à jour
      await mettreAJourEntreprise(editingEntreprise.id, entrepriseData);
      // Si c'est RDTPM, met à jour l'ID
      if (editingEntreprise.nom === "RDTPM" && editingEntreprise.id !== rdtpmId) {
        setRdtpmId(editingEntreprise.id);
        localStorage.setItem('RDTPM_ID', editingEntreprise.id);
      }
    } else {
      // Ajout
      const newId = await ajouterEntreprise(entrepriseData);
      if (editingEntreprise.nom === "RDTPM") {
        setRdtpmId(newId);
        localStorage.setItem('RDTPM_ID', newId);
      }
    }
    onEntreprisesUpdated();
    setEditingEntreprise(null);
  } catch (error) {
    alert(`Erreur: ${error}`);
  }
};
  
  // Dans le composant EntrepriseList, dans la partie où tu gères editingEntreprise
const handleAddPrime = () => {
  if (!editingEntreprise || !newPrimeNom || newPrimeMontant <= 0) return;
  const newPrime = {
    id: Date.now().toString(), // ✅ ID généré automatiquement
    nom: newPrimeNom,
    montant: newPrimeMontant,
    isBrut: newPrimeIsBrut,
    applicableA: newPrimeApplicableA,
  };
  setEditingEntreprise({
    ...editingEntreprise,
    primes: [...(editingEntreprise.primes || []), newPrime], // ✅ Gestion du cas où primes est undefined
  });
  setNewPrimeNom(''); setNewPrimeMontant(0); setNewPrimeApplicableA('Tous'); setNewPrimeIsBrut(true);
};

  const handleRemovePrime = (primeId: string) => {
    if (!editingEntreprise) return;
    setEditingEntreprise({
      ...editingEntreprise,
      primes: (editingEntreprise.primes || []).filter(p => p.id !== primeId),
    });
  };

  if (editingEntreprise !== null) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center',
        alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px',
          width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
          color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <h2>{editingEntreprise.id ? 'Modifier' : 'Ajouter'} une entreprise</h2>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Nom</label>
            <input
              type="text"
              value={editingEntreprise.nom || ''}
              onChange={(e) => setEditingEntreprise({...editingEntreprise, nom: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Couleur</label>
            <input
              type="color"
              value={editingEntreprise.couleur || '#0078d4'}
              onChange={(e) => setEditingEntreprise({...editingEntreprise, couleur: e.target.value})}
              style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Salaires</label>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Matelot</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  value={editingEntreprise.salaires?.matelot?.montant || 0}
                  onChange={(e) => setEditingEntreprise({
                    ...editingEntreprise,
                    salaires: {
                      ...editingEntreprise.salaires,
                      matelot: {
                        ...editingEntreprise.salaires?.matelot,
                        montant: Number(e.target.value)
                      }
                    }
                  })}
                  style={{ flex: '1', minWidth: '150px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                />
                <select
                  value={(editingEntreprise.salaires?.matelot?.isBrut) ? 'brut' : 'net'}
                  onChange={(e) => setEditingEntreprise({
                    ...editingEntreprise,
                    salaires: {
                      ...editingEntreprise.salaires,
                      matelot: {
                        ...editingEntreprise.salaires?.matelot,
                        isBrut: e.target.value === 'brut'
                      }
                    }
                  })}
                  style={{ flex: '0 0 120px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                >
                  <option value="brut">Brut</option>
                  <option value="net">Net</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Capitaine</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  value={editingEntreprise.salaires?.capitaine?.montant || 0}
                  onChange={(e) => setEditingEntreprise({
                    ...editingEntreprise,
                    salaires: {
                      ...editingEntreprise.salaires,
                      capitaine: {
                        ...editingEntreprise.salaires?.capitaine,
                        montant: Number(e.target.value)
                      }
                    }
                  })}
                  style={{ flex: '1', minWidth: '150px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                />
                <select
                  value={(editingEntreprise.salaires?.capitaine?.isBrut) ? 'brut' : 'net'}
                  onChange={(e) => setEditingEntreprise({
                    ...editingEntreprise,
                    salaires: {
                      ...editingEntreprise.salaires,
                      capitaine: {
                        ...editingEntreprise.salaires?.capitaine,
                        isBrut: e.target.value === 'brut'
                      }
                    }
                  })}
                  style={{ flex: '0 0 120px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                >
                  <option value="brut">Brut</option>
                  <option value="net">Net</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Primes</label>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '8px' }}>
              {(editingEntreprise.primes || []).map((prime, index) => (
                <div key={prime.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={prime.nom || ''}
                    onChange={(e) => {
                      const newPrimes = [...(editingEntreprise.primes || [])];
                      newPrimes[index].nom = e.target.value;
                      setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                    }}
                    placeholder="Nom"
                    style={{ flex: '1', minWidth: '120px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                  />
                  <input
                    type="number"
                    value={prime.montant || 0}
                    onChange={(e) => {
                      const newPrimes = [...(editingEntreprise.primes || [])];
                      newPrimes[index].montant = Number(e.target.value);
                      setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                    }}
                    placeholder="Montant"
                    style={{ flex: '0 0 100px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                  />
                  <select
                    value={prime.applicableA || 'Tous'}
                    onChange={(e) => {
                      const newPrimes = [...(editingEntreprise.primes || [])];
                      newPrimes[index].applicableA = e.target.value as 'Matelot' | 'Capitaine' | 'Tous';
                      setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                    }}
                    style={{ flex: '0 0 120px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                  >
                    <option value="Tous">Tous</option>
                    <option value="Matelot">Matelot</option>
                    <option value="Capitaine">Capitaine</option>
                  </select>
                  <select
                    value={(prime.isBrut) ? 'brut' : 'net'}
                    onChange={(e) => {
                      const newPrimes = [...(editingEntreprise.primes || [])];
                      newPrimes[index].isBrut = e.target.value === 'brut';
                      setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                    }}
                    style={{ flex: '0 0 100px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
                  >
                    <option value="brut">Brut</option>
                    <option value="net">Net</option>
                  </select>
                  <button
                    onClick={() => handleRemovePrime(prime.id)}
                    style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', flex: '0 0 30px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newPrimeNom}
                onChange={(e) => setNewPrimeNom(e.target.value)}
                placeholder="Nom"
                style={{ flex: '1', minWidth: '120px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              />
              <input
                type="number"
                value={newPrimeMontant}
                onChange={(e) => setNewPrimeMontant(Number(e.target.value))}
                placeholder="Montant"
                style={{ flex: '0 0 100px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              />
              <select
                value={newPrimeApplicableA}
                onChange={(e) => setNewPrimeApplicableA(e.target.value as 'Matelot' | 'Capitaine' | 'Tous')}
                style={{ flex: '0 0 120px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              >
                <option value="Tous">Tous</option>
                <option value="Matelot">Matelot</option>
                <option value="Capitaine">Capitaine</option>
              </select>
              <select
                value={newPrimeIsBrut ? 'brut' : 'net'}
                onChange={(e) => setNewPrimeIsBrut(e.target.value === 'brut')}
                style={{ flex: '0 0 100px', padding: '6px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white' }}
              >
                <option value="brut">Brut</option>
                <option value="net">Net</option>
              </select>
              <button
                onClick={handleAddPrime}
                style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', flex: '0 0 auto' }}
              >
                + Ajouter
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setEditingEntreprise(null)}
              style={{ backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
            >
              {editingEntreprise.id ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="entreprises-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Gestion des entreprises</h2>
        <button
          onClick={handleAddEntreprise}
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          + Ajouter une entreprise
        </button>
      </div>

      {entreprises.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="entreprise-card"
              style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '8px',
                borderLeft: `4px solid ${entreprise.couleur}`,
                cursor: 'pointer'
              }}
              onClick={() => handleEdit(entreprise)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'white' }}>{entreprise.nom}</h3>
                  <div style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                    <p>Matelot: {entreprise.salaires.matelot.montant}€ ({entreprise.salaires.matelot.isBrut ? 'Brut' : 'Net'})</p>
                    <p>Capitaine: {entreprise.salaires.capitaine.montant}€ ({entreprise.salaires.capitaine.isBrut ? 'Brut' : 'Net'})</p>
                  </div>
                  {entreprise.primes.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#aaa' }}>Primes:</strong>
                      <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                        {entreprise.primes.map(prime => (
                          <li key={prime.id} style={{ color: '#ddd', fontSize: '14px' }}>
                            {prime.nom}: {prime.montant}€ ({prime.isBrut ? 'Brut' : 'Net'}) - {prime.applicableA}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(entreprise); }}
                  style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#aaa' }}>Aucune entreprise trouvée.</p>
          <button
            onClick={handleAddEntreprise}
            style={{
              backgroundColor: '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            + Ajouter votre première entreprise
          </button>
        </div>
      )}
    </div>
  );
};
// src/components/EntrepriseList.tsx
import { useState } from 'react';
import { mettreAJourEntreprise, ajouterEntreprise, supprimerEntreprise } from '../services/entreprises';

type Entreprise = {
  id: string;
  nom: string;
  couleur: string;
  logo?: string;
  salaires: {
    matelot: { montant: number; isBrut: boolean };
    capitaine: { montant: number; isBrut: boolean };
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

// ✅ État initial pour une NOUVELLE entreprise
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
  // ✅ État initial corrigé : Partial<Entreprise> + id optionnel
  const [editingEntreprise, setEditingEntreprise] = useState<Partial<Entreprise> & { id?: string } | null>(null);
  const [newPrimeNom, setNewPrimeNom] = useState('');
  const [newPrimeMontant, setNewPrimeMontant] = useState(0);
  const [newPrimeApplicableA, setNewPrimeApplicableA] = useState<'Matelot' | 'Capitaine' | 'Tous'>('Tous');
  const [newPrimeIsBrut, setNewPrimeIsBrut] = useState(true);

  const refreshList = () => {
    onEntreprisesUpdated();
  };

  const handleAddEntreprise = () => {
    // ✅ Initialisation complète avec toutes les propriétés
    setEditingEntreprise({
      ...nouvelleEntrepriseVide(),
      id: undefined // ✅ Pas d'ID pour une nouvelle entreprise
    });
  };

  const handleEdit = (entreprise: Entreprise) => {
    setEditingEntreprise({ ...entreprise });
  };

  const handleDeleteEntreprise = async (id: string, nom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${nom}" ?`)) {
      try {
        await supprimerEntreprise(id);
        if (id === rdtpmId) {
          setRdtpmId('');
          localStorage.removeItem('RDTPM_ID');
        }
        refreshList();
      } catch (error) {
        alert(`Erreur lors de la suppression: ${error}`);
      }
    }
  };

  const handleSave = async () => {
    if (!editingEntreprise?.nom) {
      alert("Le nom de l'entreprise est obligatoire.");
      return;
    }

    try {
      // ✅ Nettoyage complet des données avec valeurs par défaut
      const entrepriseData: Omit<Entreprise, 'id'> = {
        nom: editingEntreprise.nom || '',
        couleur: editingEntreprise.couleur || '#0078d4',
        salaires: {
          matelot: {
            montant: Number(editingEntreprise.salaires?.matelot?.montant) || 0,
            isBrut: editingEntreprise.salaires?.matelot?.isBrut ?? true
          },
          capitaine: {
            montant: Number(editingEntreprise.salaires?.capitaine?.montant) || 0,
            isBrut: editingEntreprise.salaires?.capitaine?.isBrut ?? true
          }
        },
        primes: (editingEntreprise.primes || []).map(prime => ({
          id: prime.id || Date.now().toString(),
          nom: prime.nom || '',
          montant: Number(prime.montant) || 0,
          isBrut: prime.isBrut ?? true,
          applicableA: prime.applicableA || 'Tous'
        }))
      };

      if (editingEntreprise.id) {
        await mettreAJourEntreprise(editingEntreprise.id, entrepriseData);
        if (editingEntreprise.nom === "RDTPM" && editingEntreprise.id !== rdtpmId) {
          setRdtpmId(editingEntreprise.id);
          localStorage.setItem('RDTPM_ID', editingEntreprise.id);
        }
      } else {
        const newId = await ajouterEntreprise(entrepriseData);
        if (editingEntreprise.nom === "RDTPM") {
          setRdtpmId(newId);
          localStorage.setItem('RDTPM_ID', newId);
        }
      }
      refreshList();
      setEditingEntreprise(null);
    } catch (error) {
      console.error("Erreur complète:", error);
      alert(`Erreur: ${error}`);
    }
  };

  const handleAddPrime = () => {
    if (!editingEntreprise || !newPrimeNom || newPrimeMontant <= 0) return;
    const newPrime = {
      id: Date.now().toString(),
      nom: newPrimeNom,
      montant: Number(newPrimeMontant),
      isBrut: newPrimeIsBrut,
      applicableA: newPrimeApplicableA,
    };
    setEditingEntreprise({
      ...editingEntreprise,
      primes: [...(editingEntreprise.primes || []), newPrime],
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

  // ✅ AFFICHAGE DU FORMULAIRE (corrigé)
  if (editingEntreprise !== null) {
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
          <h2>{editingEntreprise.id ? 'Modifier' : 'Ajouter'} une entreprise</h2>

          {/* Nom */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Nom</label>
            <input
              type="text"
              value={editingEntreprise.nom || ''}
              onChange={(e) => setEditingEntreprise({...editingEntreprise, nom: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#1a1a1a',
                color: 'white'
              }}
              placeholder="Nom de l'entreprise"
            />
          </div>

          {/* Couleur */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Couleur</label>
            <input
              type="color"
              value={editingEntreprise.couleur || '#0078d4'}
              onChange={(e) => setEditingEntreprise({...editingEntreprise, couleur: e.target.value})}
              style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px' }}
            />
          </div>

          {/* Salaires */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Salaires</label>

            {/* Matelot */}
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
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: 'white'
                  }}
                />
                <select
                  value={editingEntreprise.salaires?.matelot?.isBrut ? 'brut' : 'net'}
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
                  style={{
                    flex: '0 0 120px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: 'white'
                  }}
                >
                  <option value="brut">Brut</option>
                  <option value="net">Net</option>
                </select>
              </div>
            </div>

            {/* Capitaine */}
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
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: 'white'
                  }}
                />
                <select
                  value={editingEntreprise.salaires?.capitaine?.isBrut ? 'brut' : 'net'}
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
                  style={{
                    flex: '0 0 120px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: 'white'
                  }}
                >
                  <option value="brut">Brut</option>
                  <option value="net">Net</option>
                </select>
              </div>
            </div>
          </div>

          {/* Primes */}
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
                    style={{
                      flex: '1',
                      minWidth: '120px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
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
                    style={{
                      flex: '0 0 100px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  />
                  <select
                    value={prime.applicableA || 'Tous'}
                    onChange={(e) => {
                      const newPrimes = [...(editingEntreprise.primes || [])];
                      newPrimes[index].applicableA = e.target.value as 'Matelot' | 'Capitaine' | 'Tous';
                      setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                    }}
                    style={{
                      flex: '0 0 120px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  >
                    <option value="Tous">Tous</option>
                    <option value="Matelot">Matelot</option>
                    <option value="Capitaine">Capitaine</option>
                  </select>
                  <select
                    value={prime.isBrut ? 'brut' : 'net'}
                    onChange={(e) => {
                      const newPrimes = [...(editingEntreprise.primes || [])];
                      newPrimes[index].isBrut = e.target.value === 'brut';
                      setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                    }}
                    style={{
                      flex: '0 0 100px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  >
                    <option value="brut">Brut</option>
                    <option value="net">Net</option>
                  </select>
                  <button
                    onClick={() => handleRemovePrime(prime.id)}
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      flex: '0 0 30px'
                    }}
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
                style={{
                  flex: '1',
                  minWidth: '120px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <input
                type="number"
                value={newPrimeMontant}
                onChange={(e) => setNewPrimeMontant(Number(e.target.value))}
                placeholder="Montant"
                style={{
                  flex: '0 0 100px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <select
                value={newPrimeApplicableA}
                onChange={(e) => setNewPrimeApplicableA(e.target.value as 'Matelot' | 'Capitaine' | 'Tous')}
                style={{
                  flex: '0 0 120px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              >
                <option value="Tous">Tous</option>
                <option value="Matelot">Matelot</option>
                <option value="Capitaine">Capitaine</option>
              </select>
              <select
                value={newPrimeIsBrut ? 'brut' : 'net'}
                onChange={(e) => setNewPrimeIsBrut(e.target.value === 'brut')}
                style={{
                  flex: '0 0 100px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              >
                <option value="brut">Brut</option>
                <option value="net">Net</option>
              </select>
              <button
                onClick={handleAddPrime}
                style={{
                  backgroundColor: '#0078d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  flex: '0 0 auto'
                }}
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => setEditingEntreprise(null)}
              style={{
                backgroundColor: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              {editingEntreprise.id ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ AFFICHAGE DE LA LISTE (inchangé)
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
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(entreprise); }}
                    style={{
                      backgroundColor: '#0078d4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteEntreprise(entreprise.id, entreprise.nom); }}
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
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
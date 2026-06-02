// src/components/EntrepriseList.tsx
import { useState } from 'react';
import { mettreAJourEntreprise, ajouterEntreprise, supprimerEntreprise } from '../services/entreprises';
import { useAppDialog } from './AppDialog';
import { trierEntreprisesAvecFavoris } from '../utils/entreprises';

type Entreprise = {
  id: string;
  nom: string;
  couleur: string;
  favori?: boolean;
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
  heuresSupplementaires?: {
    id: string;
    nom: string;
    seuilHebdomadaire: number;
    tauxMajoration: number;
    applicableA: 'Matelot' | 'Capitaine' | 'Tous';
  }[];
  modulation?: {
    id: string;
    nom: string;
    debutHebdomadaire: number;
    finHebdomadaire: number;
    applicableA: 'Matelot' | 'Capitaine' | 'Tous';
  }[];
  fonctionnalites?: {
    utiliseSaisons: boolean;
    utiliseTours: boolean;
    utiliseModulation: boolean;
    utiliseHeuresSupplementaires: boolean;
  };
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
  favori: false,
  salaires: {
    matelot: { montant: 0, isBrut: true },
    capitaine: { montant: 0, isBrut: true }
  },
  primes: [],
  fonctionnalites: {
    utiliseSaisons: false,
    utiliseTours: false,
    utiliseModulation: false,
    utiliseHeuresSupplementaires: false
  },
  heuresSupplementaires: [],
  modulation: []
});

export const EntrepriseList = ({ entreprises, onEntreprisesUpdated, rdtpmId, setRdtpmId }: EntrepriseListProps) => {
  const { alert, confirm } = useAppDialog();
  // ✅ État initial corrigé : Partial<Entreprise> + id optionnel
  const [editingEntreprise, setEditingEntreprise] = useState<Partial<Entreprise> & { id?: string } | null>(null);
  const [newPrimeNom, setNewPrimeNom] = useState('');
  const [newPrimeMontant, setNewPrimeMontant] = useState(0);
  const [newPrimeApplicableA, setNewPrimeApplicableA] = useState<'Matelot' | 'Capitaine' | 'Tous'>('Tous');
  const [newPrimeIsBrut, setNewPrimeIsBrut] = useState(true);
  const [newHeuresSuppNom, setNewHeuresSuppNom] = useState('');
  const [newHeuresSuppSeuil, setNewHeuresSuppSeuil] = useState(35);
  const [newHeuresSuppTaux, setNewHeuresSuppTaux] = useState(25);
  const [newHeuresSuppApplicableA, setNewHeuresSuppApplicableA] = useState<'Matelot' | 'Capitaine' | 'Tous'>('Tous');
  const [newModulationNom, setNewModulationNom] = useState('');
  const [newModulationDebut, setNewModulationDebut] = useState(35);
  const [newModulationFin, setNewModulationFin] = useState(39);
  const [newModulationApplicableA, setNewModulationApplicableA] = useState<'Matelot' | 'Capitaine' | 'Tous'>('Tous');

  const entreprisesOrdonnees = trierEntreprisesAvecFavoris(entreprises);

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
    setEditingEntreprise({
      ...entreprise,
      fonctionnalites: {
        utiliseSaisons: entreprise.fonctionnalites?.utiliseSaisons ?? entreprise.nom === 'RDTPM',
        utiliseTours: entreprise.fonctionnalites?.utiliseTours ?? entreprise.nom === 'RDTPM',
        utiliseModulation: entreprise.fonctionnalites?.utiliseModulation ?? (entreprise.modulation || []).length > 0,
        utiliseHeuresSupplementaires: entreprise.fonctionnalites?.utiliseHeuresSupplementaires ?? (entreprise.heuresSupplementaires || []).length > 0,
      }
    });
  };

  const handleDeleteEntreprise = async (id: string, nom: string) => {
    const shouldDelete = await confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${nom}" ?`, {
      title: 'Supprimer l’entreprise',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!shouldDelete) return;

    try {
      await supprimerEntreprise(id);
      if (id === rdtpmId) {
        setRdtpmId('');
        localStorage.removeItem('RDTPM_ID');
      }
      refreshList();
    } catch (error) {
      await alert(`Erreur lors de la suppression: ${error}`, { title: 'Erreur' });
    }
  };

  const handleToggleFavori = async (entreprise: Entreprise) => {
    try {
      await mettreAJourEntreprise(entreprise.id, { favori: !entreprise.favori });
      refreshList();
    } catch (error) {
      await alert(`Erreur lors de la mise a jour du favori: ${error}`, { title: 'Erreur' });
    }
  };

  const handleSave = async () => {
    if (!editingEntreprise?.nom) {
      await alert("Le nom de l'entreprise est obligatoire.");
      return;
    }

    try {
      // ✅ Nettoyage complet des données avec valeurs par défaut
      const entrepriseData: Omit<Entreprise, 'id'> = {
        nom: editingEntreprise.nom || '',
        couleur: editingEntreprise.couleur || '#0078d4',
        favori: editingEntreprise.favori ?? false,
        fonctionnalites: {
          utiliseSaisons: editingEntreprise.fonctionnalites?.utiliseSaisons ?? false,
          utiliseTours: editingEntreprise.fonctionnalites?.utiliseTours ?? false,
          utiliseModulation: editingEntreprise.fonctionnalites?.utiliseModulation ?? false,
          utiliseHeuresSupplementaires: editingEntreprise.fonctionnalites?.utiliseHeuresSupplementaires ?? false,
        },
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
        })),
        heuresSupplementaires: (editingEntreprise.heuresSupplementaires || []).map(regle => ({
          id: regle.id || Date.now().toString(),
          nom: regle.nom || '',
          seuilHebdomadaire: Number(regle.seuilHebdomadaire) || 0,
          tauxMajoration: Number(regle.tauxMajoration) || 0,
          applicableA: regle.applicableA || 'Tous'
        })),
        modulation: (editingEntreprise.modulation || []).map(regle => ({
          id: regle.id || Date.now().toString(),
          nom: regle.nom || '',
          debutHebdomadaire: Number(regle.debutHebdomadaire) || 0,
          finHebdomadaire: Number(regle.finHebdomadaire) || 0,
          applicableA: regle.applicableA || 'Tous'
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
      await alert(`Erreur: ${error}`, { title: 'Erreur' });
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

  const handleAddHeuresSupp = () => {
    if (!editingEntreprise || !newHeuresSuppNom || newHeuresSuppSeuil < 0 || newHeuresSuppTaux <= 0) return;
    const newRegle = {
      id: Date.now().toString(),
      nom: newHeuresSuppNom,
      seuilHebdomadaire: Number(newHeuresSuppSeuil),
      tauxMajoration: Number(newHeuresSuppTaux),
      applicableA: newHeuresSuppApplicableA,
    };
    setEditingEntreprise({
      ...editingEntreprise,
      heuresSupplementaires: [...(editingEntreprise.heuresSupplementaires || []), newRegle],
    });
    setNewHeuresSuppNom('');
    setNewHeuresSuppSeuil(35);
    setNewHeuresSuppTaux(25);
    setNewHeuresSuppApplicableA('Tous');
  };

  const handleRemoveHeuresSupp = (regleId: string) => {
    if (!editingEntreprise) return;
    setEditingEntreprise({
      ...editingEntreprise,
      heuresSupplementaires: (editingEntreprise.heuresSupplementaires || []).filter(regle => regle.id !== regleId),
    });
  };

  const handleAddModulation = () => {
    if (!editingEntreprise || !newModulationNom || newModulationDebut < 0 || newModulationFin <= newModulationDebut) return;
    const newRegle = {
      id: Date.now().toString(),
      nom: newModulationNom,
      debutHebdomadaire: Number(newModulationDebut),
      finHebdomadaire: Number(newModulationFin),
      applicableA: newModulationApplicableA,
    };
    setEditingEntreprise({
      ...editingEntreprise,
      modulation: [...(editingEntreprise.modulation || []), newRegle],
    });
    setNewModulationNom('');
    setNewModulationDebut(35);
    setNewModulationFin(39);
    setNewModulationApplicableA('Tous');
  };

  const handleRemoveModulation = (regleId: string) => {
    if (!editingEntreprise) return;
    setEditingEntreprise({
      ...editingEntreprise,
      modulation: (editingEntreprise.modulation || []).filter(regle => regle.id !== regleId),
    });
  };

  const updateFonctionnalite = (
    key: keyof NonNullable<Entreprise['fonctionnalites']>,
    value: boolean
  ) => {
    if (!editingEntreprise) return;
    setEditingEntreprise({
      ...editingEntreprise,
      fonctionnalites: {
        utiliseSaisons: editingEntreprise.fonctionnalites?.utiliseSaisons ?? false,
        utiliseTours: editingEntreprise.fonctionnalites?.utiliseTours ?? false,
        utiliseModulation: editingEntreprise.fonctionnalites?.utiliseModulation ?? false,
        utiliseHeuresSupplementaires: editingEntreprise.fonctionnalites?.utiliseHeuresSupplementaires ?? false,
        [key]: value,
      },
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editingEntreprise.favori ?? false}
                onChange={(e) => setEditingEntreprise({ ...editingEntreprise, favori: e.target.checked })}
              />
              Mettre cette entreprise en favori
            </label>
          </div>

          {/* Fonctionnalités */}
          <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid #444', borderRadius: '6px', backgroundColor: '#222' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Fonctionnalités</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingEntreprise.fonctionnalites?.utiliseSaisons ?? false}
                  onChange={(e) => updateFonctionnalite('utiliseSaisons', e.target.checked)}
                />
                Utilise les saisons
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingEntreprise.fonctionnalites?.utiliseTours ?? false}
                  onChange={(e) => updateFonctionnalite('utiliseTours', e.target.checked)}
                />
                Utilise les tours
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingEntreprise.fonctionnalites?.utiliseModulation ?? false}
                  onChange={(e) => updateFonctionnalite('utiliseModulation', e.target.checked)}
                />
                Utilise la modulation
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingEntreprise.fonctionnalites?.utiliseHeuresSupplementaires ?? false}
                  onChange={(e) => updateFonctionnalite('utiliseHeuresSupplementaires', e.target.checked)}
                />
                Utilise les heures supplémentaires
              </label>
            </div>
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

          {/* Modulation */}
          {(editingEntreprise.fonctionnalites?.utiliseModulation ?? false) && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Modulation</label>
            <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '8px' }}>
              {(editingEntreprise.modulation || []).map((regle, index) => (
                <div key={regle.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={regle.nom || ''}
                    onChange={(e) => {
                      const newRegles = [...(editingEntreprise.modulation || [])];
                      newRegles[index].nom = e.target.value;
                      setEditingEntreprise({...editingEntreprise, modulation: newRegles});
                    }}
                    placeholder="Nom"
                    style={{
                      flex: '1',
                      minWidth: '140px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  />
                  <input
                    type="number"
                    value={regle.debutHebdomadaire || 0}
                    onChange={(e) => {
                      const newRegles = [...(editingEntreprise.modulation || [])];
                      newRegles[index].debutHebdomadaire = Number(e.target.value);
                      setEditingEntreprise({...editingEntreprise, modulation: newRegles});
                    }}
                    placeholder="Début h/sem"
                    style={{
                      flex: '0 0 110px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  />
                  <input
                    type="number"
                    value={regle.finHebdomadaire || 0}
                    onChange={(e) => {
                      const newRegles = [...(editingEntreprise.modulation || [])];
                      newRegles[index].finHebdomadaire = Number(e.target.value);
                      setEditingEntreprise({...editingEntreprise, modulation: newRegles});
                    }}
                    placeholder="Fin h/sem"
                    style={{
                      flex: '0 0 110px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ddd', fontSize: '13px', flex: '0 0 190px' }}>
                    <input
                      type="checkbox"
                      checked={(regle.applicableA || 'Tous') === 'Tous'}
                      onChange={(e) => {
                        const newRegles = [...(editingEntreprise.modulation || [])];
                        newRegles[index].applicableA = e.target.checked ? 'Tous' : 'Matelot';
                        setEditingEntreprise({...editingEntreprise, modulation: newRegles});
                      }}
                    />
                    Commun a tous les roles
                  </label>
                  {(regle.applicableA || 'Tous') !== 'Tous' && (
                    <select
                      value={regle.applicableA || 'Matelot'}
                      onChange={(e) => {
                        const newRegles = [...(editingEntreprise.modulation || [])];
                        newRegles[index].applicableA = e.target.value as 'Matelot' | 'Capitaine';
                        setEditingEntreprise({...editingEntreprise, modulation: newRegles});
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
                      <option value="Matelot">Matelot</option>
                      <option value="Capitaine">Capitaine</option>
                    </select>
                  )}
                  <button
                    onClick={() => handleRemoveModulation(regle.id)}
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
                value={newModulationNom}
                onChange={(e) => setNewModulationNom(e.target.value)}
                placeholder="Ex: Modulation RDTPM"
                style={{
                  flex: '1',
                  minWidth: '140px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <input
                type="number"
                value={newModulationDebut}
                onChange={(e) => setNewModulationDebut(Number(e.target.value))}
                placeholder="Début h/sem"
                style={{
                  flex: '0 0 110px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <input
                type="number"
                value={newModulationFin}
                onChange={(e) => setNewModulationFin(Number(e.target.value))}
                placeholder="Fin h/sem"
                style={{
                  flex: '0 0 110px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ddd', fontSize: '13px', flex: '0 0 190px' }}>
                <input
                  type="checkbox"
                  checked={newModulationApplicableA === 'Tous'}
                  onChange={(e) => setNewModulationApplicableA(e.target.checked ? 'Tous' : 'Matelot')}
                />
                Commun a tous les roles
              </label>
              {newModulationApplicableA !== 'Tous' && (
                <select
                  value={newModulationApplicableA}
                  onChange={(e) => setNewModulationApplicableA(e.target.value as 'Matelot' | 'Capitaine')}
                  style={{
                    flex: '0 0 120px',
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#1a1a1a',
                    color: 'white'
                  }}
                >
                  <option value="Matelot">Matelot</option>
                  <option value="Capitaine">Capitaine</option>
                </select>
              )}
              <button
                onClick={handleAddModulation}
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
          )}

          {/* Heures supplémentaires */}
          {(editingEntreprise.fonctionnalites?.utiliseHeuresSupplementaires ?? false) && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Heures supplémentaires</label>
            <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '8px' }}>
              {(editingEntreprise.heuresSupplementaires || []).map((regle, index) => (
                <div key={regle.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={regle.nom || ''}
                    onChange={(e) => {
                      const newRegles = [...(editingEntreprise.heuresSupplementaires || [])];
                      newRegles[index].nom = e.target.value;
                      setEditingEntreprise({...editingEntreprise, heuresSupplementaires: newRegles});
                    }}
                    placeholder="Nom"
                    style={{
                      flex: '1',
                      minWidth: '140px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  />
                  <input
                    type="number"
                    value={regle.seuilHebdomadaire || 0}
                    onChange={(e) => {
                      const newRegles = [...(editingEntreprise.heuresSupplementaires || [])];
                      newRegles[index].seuilHebdomadaire = Number(e.target.value);
                      setEditingEntreprise({...editingEntreprise, heuresSupplementaires: newRegles});
                    }}
                    placeholder="Seuil h/sem"
                    style={{
                      flex: '0 0 110px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  />
                  <input
                    type="number"
                    value={regle.tauxMajoration || 0}
                    onChange={(e) => {
                      const newRegles = [...(editingEntreprise.heuresSupplementaires || [])];
                      newRegles[index].tauxMajoration = Number(e.target.value);
                      setEditingEntreprise({...editingEntreprise, heuresSupplementaires: newRegles});
                    }}
                    placeholder="Majoration %"
                    style={{
                      flex: '0 0 120px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #444',
                      backgroundColor: '#1a1a1a',
                      color: 'white'
                    }}
                  />
                  <select
                    value={regle.applicableA || 'Tous'}
                    onChange={(e) => {
                      const newRegles = [...(editingEntreprise.heuresSupplementaires || [])];
                      newRegles[index].applicableA = e.target.value as 'Matelot' | 'Capitaine' | 'Tous';
                      setEditingEntreprise({...editingEntreprise, heuresSupplementaires: newRegles});
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
                  <button
                    onClick={() => handleRemoveHeuresSupp(regle.id)}
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
                value={newHeuresSuppNom}
                onChange={(e) => setNewHeuresSuppNom(e.target.value)}
                placeholder="Ex: 35h à 43h"
                style={{
                  flex: '1',
                  minWidth: '140px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <input
                type="number"
                value={newHeuresSuppSeuil}
                onChange={(e) => setNewHeuresSuppSeuil(Number(e.target.value))}
                placeholder="Seuil h/sem"
                style={{
                  flex: '0 0 110px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <input
                type="number"
                value={newHeuresSuppTaux}
                onChange={(e) => setNewHeuresSuppTaux(Number(e.target.value))}
                placeholder="Majoration %"
                style={{
                  flex: '0 0 120px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <select
                value={newHeuresSuppApplicableA}
                onChange={(e) => setNewHeuresSuppApplicableA(e.target.value as 'Matelot' | 'Capitaine' | 'Tous')}
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
              <button
                onClick={handleAddHeuresSupp}
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
          )}

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
          {entreprisesOrdonnees.map((entreprise) => (
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
                  <h3 style={{ margin: 0, color: 'white' }}>
                    {entreprise.favori && <span style={{ color: '#f5c542', marginRight: '6px' }}>*</span>}
                    {entreprise.nom}
                  </h3>
                  <div style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                    <p>Matelot: {entreprise.salaires.matelot.montant}€ ({entreprise.salaires.matelot.isBrut ? 'Brut' : 'Net'})</p>
                    <p>Capitaine: {entreprise.salaires.capitaine.montant}€ ({entreprise.salaires.capitaine.isBrut ? 'Brut' : 'Net'})</p>
                  </div>
                  {entreprise.fonctionnalites && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {entreprise.fonctionnalites.utiliseSaisons && <span style={{ color: '#ddd', fontSize: '12px', backgroundColor: '#1a1a1a', padding: '3px 8px', borderRadius: '4px' }}>Saisons</span>}
                      {entreprise.fonctionnalites.utiliseTours && <span style={{ color: '#ddd', fontSize: '12px', backgroundColor: '#1a1a1a', padding: '3px 8px', borderRadius: '4px' }}>Tours</span>}
                      {entreprise.fonctionnalites.utiliseModulation && <span style={{ color: '#ddd', fontSize: '12px', backgroundColor: '#1a1a1a', padding: '3px 8px', borderRadius: '4px' }}>Modulation</span>}
                      {entreprise.fonctionnalites.utiliseHeuresSupplementaires && <span style={{ color: '#ddd', fontSize: '12px', backgroundColor: '#1a1a1a', padding: '3px 8px', borderRadius: '4px' }}>Heures supp</span>}
                    </div>
                  )}
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
                  {(entreprise.modulation || []).length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#aaa' }}>Modulation:</strong>
                      <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                        {(entreprise.modulation || []).map(regle => (
                          <li key={regle.id} style={{ color: '#ddd', fontSize: '14px' }}>
                            {regle.nom}: {regle.debutHebdomadaire}h à {regle.finHebdomadaire}h/sem - {regle.applicableA}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(entreprise.heuresSupplementaires || []).length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#aaa' }}>Heures supplémentaires:</strong>
                      <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                        {(entreprise.heuresSupplementaires || []).map(regle => (
                          <li key={regle.id} style={{ color: '#ddd', fontSize: '14px' }}>
                            {regle.nom}: au-delà de {regle.seuilHebdomadaire}h/sem, +{regle.tauxMajoration}% - {regle.applicableA}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFavori(entreprise); }}
                    className={`favorite-button${entreprise.favori ? ' is-favorite' : ''}`}
                    title={entreprise.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    ★
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(entreprise); }}
                    className="edit-action-button"
                    title="Modifier"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteEntreprise(entreprise.id, entreprise.nom); }}
                    className="delete-button"
                    title="Supprimer"
                  >
                    Supprimer
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

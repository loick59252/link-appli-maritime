// src/components/EntrepriseList.tsx
import { useState } from 'react';
import { mettreAJourEntreprise } from '../services/entreprises';

type Entreprise = {
  id: string;
  nom: string;
  couleur: string;
  salaires: { // ✅ Remplace salaireBase
    matelot: {
      montant: number;
      isBrut: boolean;
    };
    capitaine: {
      montant: number;
      isBrut: boolean;
    };
  };
  primes: {
    id: string;
    nom: string;
    montant: number;
    isBrut: boolean;
    applicableA: 'Matelot' | 'Capitaine' | 'Tous'; // ✅ Nouveau
  }[];
};

type EntrepriseListProps = {
  entreprises: Entreprise[];
  onEntreprisesUpdated: () => void;
};

export const EntrepriseList = ({ entreprises, onEntreprisesUpdated }: EntrepriseListProps) => {
  const [editingEntreprise, setEditingEntreprise] = useState<Entreprise | null>(null);
  const [newPrimeNom, setNewPrimeNom] = useState('');
  const [newPrimeMontant, setNewPrimeMontant] = useState(0);

  const handleEdit = (entreprise: Entreprise) => {
    setEditingEntreprise({ ...entreprise });
  };

  const handleSave = async () => {
    if (!editingEntreprise) return;
    try {
      await mettreAJourEntreprise(editingEntreprise.id, editingEntreprise);
      onEntreprisesUpdated();
      setEditingEntreprise(null);
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  const handleAddPrime = () => {
    if (!editingEntreprise || !newPrimeNom || newPrimeMontant <= 0) return;
    const newPrime = {
      id: Date.now().toString(),
      nom: newPrimeNom,
      montant: newPrimeMontant,
      isBrut: true, // Par défaut en brut
    };
    setEditingEntreprise({
      ...editingEntreprise,
      primes: [...editingEntreprise.primes, newPrime],
    });
    setNewPrimeNom('');
    setNewPrimeMontant(0);
  };

  const handleRemovePrime = (primeId: string) => {
    if (!editingEntreprise) return;
    setEditingEntreprise({
      ...editingEntreprise,
      primes: editingEntreprise.primes.filter(p => p.id !== primeId),
    });
  };

  if (editingEntreprise) {
    // Dans le return de la modal (quand editingEntreprise existe)
return (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    overflowY: 'auto', // ✅ Permet le scroll si nécessaire
    padding: '20px'
  }}>
    <div style={{
      backgroundColor: '#2a2a2a',
      padding: '20px',
      borderRadius: '10px',
      width: '90%',
      maxWidth: '800px', // ✅ Largeur maximale raisonnable
      maxHeight: '90vh', // ✅ Hauteur maximale
      overflowY: 'auto', // ✅ Scroll interne si nécessaire
      color: 'white',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}>
      <h2>Modifier {editingEntreprise.nom}</h2>

      {/* Nom */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Nom</label>
        <input
          type="text"
          value={editingEntreprise.nom}
          onChange={(e) => setEditingEntreprise({...editingEntreprise, nom: e.target.value})}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #444',
            backgroundColor: '#1a1a1a',
            color: 'white'
          }}
        />
      </div>

      {/* Couleur */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Couleur</label>
        <input
          type="color"
          value={editingEntreprise.couleur}
          onChange={(e) => setEditingEntreprise({...editingEntreprise, couleur: e.target.value})}
          style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px' }}
        />
      </div>

      {/* Salaire de base + switch Brut/Net */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Salaire de base</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}> {/* ✅ flexWrap pour éviter le débordement */}
          <input
            type="number"
            value={editingEntreprise.salaireBase}
            onChange={(e) => setEditingEntreprise({...editingEntreprise, salaireBase: Number(e.target.value)})}
            style={{
              flex: '1',
              minWidth: '150px', // ✅ Largeur minimale
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #444',
              backgroundColor: '#1a1a1a',
              color: 'white'
            }}
          />
          <select
            value={editingEntreprise.isSalaireBrut ? 'brut' : 'net'}
            onChange={(e) => setEditingEntreprise({...editingEntreprise, isSalaireBrut: e.target.value === 'brut'})}
            style={{
              flex: '0 0 120px', // ✅ Largeur fixe pour le select
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

      {/* Primes */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>Primes</label>
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '8px' }}> {/* ✅ Conteneur scrollable pour les primes */}
          {editingEntreprise.primes.map((prime, index) => (
            <div
              key={prime.id}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '8px',
                flexWrap: 'wrap' // ✅ Permet aux éléments de passer à la ligne
              }}
            >
              <input
                type="text"
                value={prime.nom}
                onChange={(e) => {
                  const newPrimes = [...editingEntreprise.primes];
                  newPrimes[index].nom = e.target.value;
                  setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                }}
                placeholder="Nom de la prime"
                style={{
                  flex: '1',
                  minWidth: '120px', // ✅ Largeur minimale
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <input
                type="number"
                value={prime.montant}
                onChange={(e) => {
                  const newPrimes = [...editingEntreprise.primes];
                  newPrimes[index].montant = Number(e.target.value);
                  setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                }}
                placeholder="Montant"
                style={{
                  flex: '0 0 100px', // ✅ Largeur fixe
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                }}
              />
              <select
                value={prime.isBrut ? 'brut' : 'net'}
                onChange={(e) => {
                  const newPrimes = [...editingEntreprise.primes];
                  newPrimes[index].isBrut = e.target.value === 'brut';
                  setEditingEntreprise({...editingEntreprise, primes: newPrimes});
                }}
                style={{
                  flex: '0 0 100px', // ✅ Largeur fixe
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
                  flex: '0 0 30px' // ✅ Largeur fixe
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Ajouter une prime */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}> {/* ✅ flexWrap */}
          <input
            type="text"
            value={newPrimeNom}
            onChange={(e) => setNewPrimeNom(e.target.value)}
            placeholder="Nom de la prime"
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
            value="brut" // Par défaut
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
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '16px',
        flexWrap: 'wrap' // ✅ Pour les petits écrans
      }}>
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
          Enregistrer
        </button>
      </div>
    </div>
  </div>
);
  }

  return (
    <div className="entreprises-container">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Gestion des entreprises</h2>
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
                <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                  Salaire de base: {entreprise.salaireBase} € ({entreprise.isSalaireBrut ? 'Brut' : 'Net'})
                </p>
                {entreprise.primes.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <strong style={{ color: '#aaa' }}>Primes:</strong>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                      {entreprise.primes.map(prime => (
                        <li key={prime.id} style={{ color: '#ddd', fontSize: '14px' }}>
                          {prime.nom}: {prime.montant} € ({prime.isBrut ? 'Brut' : 'Net'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(entreprise);
                }}
                style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
              >
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
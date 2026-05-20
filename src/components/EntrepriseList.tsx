// src/components/EntrepriseList.tsx
import { useState, useEffect } from 'react';
import { getEntreprises, supprimerEntreprise } from './../services/entreprises';
import { EntrepriseForm } from './EntrepriseForm';

export const EntrepriseList = () => {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [showEntrepriseForm, setShowEntrepriseForm] = useState(false);
  const [entrepriseToEdit, setEntrepriseToEdit] = useState<any>(null);

  useEffect(() => {
    const loadEntreprises = async () => {
      const entreprises = await getEntreprises();
      setEntreprises(entreprises);
    };
    loadEntreprises();
  }, []);

  const handleDeleteEntreprise = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
      try {
        await supprimerEntreprise(id);
        setEntreprises(entreprises.filter(e => e.id !== id));
        alert("Entreprise supprimée avec succès !");
      } catch (error) {
        alert(`Erreur: ${error}`);
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            setEntrepriseToEdit(null);
            setShowEntrepriseForm(true);
          }}
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          Ajouter une entreprise
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {entreprises.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2a2a2a' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Nom</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Couleur</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Salaire Matelot</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Salaire Capitaine</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #444' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entreprises.map((entreprise) => (
                <tr key={entreprise.id} style={{ borderBottom: '1px solid #444' }}>
                  <td style={{ padding: '8px' }}>{entreprise.nom}</td>
                  <td style={{ padding: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: entreprise.couleur || '#0078d4',
                      borderRadius: '50%',
                      display: 'inline-block'
                    }}></div>
                  </td>
                  <td style={{ padding: '8px' }}>{entreprise.salaireMatelot} €</td>
                  <td style={{ padding: '8px' }}>{entreprise.salaireCapitaine} €</td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => {
                        setEntrepriseToEdit(entreprise);
                        setShowEntrepriseForm(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#0078d4', cursor: 'pointer', marginRight: '10px', fontSize: '14px' }}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteEntreprise(entreprise.id)}
                      style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '14px' }}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#888' }}>Aucune entreprise trouvée.</p>
        )}
      </div>

      {showEntrepriseForm && (
        <EntrepriseForm
          onClose={() => {
            setShowEntrepriseForm(false);
            setEntrepriseToEdit(null);
          }}
          onEntrepriseAjoutee={() => {
            getEntreprises().then(setEntreprises);
          }}
          entrepriseToEdit={entrepriseToEdit}
        />
      )}
    </div>
  );
};
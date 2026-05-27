// src/components/SaisonsList.tsx
import { useState } from 'react';
import {
  ajouterSaison,
  mettreAJourSaison,
  supprimerSaison,
  getSaisons
} from '../services/saisons';

type Saison = {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
};

type SaisonsListProps = {
  saisons: Saison[];
  onSaisonsUpdated: () => void;
};

export const SaisonsList = ({ saisons, onSaisonsUpdated }: SaisonsListProps) => {
  const [editingSaison, setEditingSaison] = useState<Partial<Saison> & { id?: string } | null>(null);

  const handleAddSaison = () => {
    setEditingSaison({
      nom: '',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: new Date().toISOString().split('T')[0]
    });
  };

  const handleEdit = (saison: Saison) => {
    setEditingSaison({ ...saison });
  };

  const handleSave = async () => {
    if (!editingSaison || !editingSaison.nom || !editingSaison.dateDebut || !editingSaison.dateFin) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      if (editingSaison.id) {
        await mettreAJourSaison(editingSaison.id, editingSaison as Partial<Saison>);
      } else {
        await ajouterSaison(editingSaison as Omit<Saison, 'id'>);
      }
      onSaisonsUpdated();
      setEditingSaison(null);
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette saison ?")) {
      try {
        await supprimerSaison(id);  // ✅ Utilisation de la fonction
        onSaisonsUpdated();
      } catch (error) {
        alert(`Erreur lors de la suppression: ${error}`);
      }
    }
  };

  if (editingSaison) {
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
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '20px',
          borderRadius: '10px',
          width: '90%',
          maxWidth: '500px',
          color: 'white'
        }}>
          <h2>{editingSaison.id ? 'Modifier' : 'Ajouter'} une saison</h2>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Nom</label>
            <input
              type="text"
              value={editingSaison.nom || ''}
              onChange={(e) => setEditingSaison({...editingSaison, nom: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#1a1a1a',
                color: 'white'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Date de début</label>
            <input
              type="date"
              value={editingSaison.dateDebut || ''}
              onChange={(e) => setEditingSaison({...editingSaison, dateDebut: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#1a1a1a',
                color: 'white'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Date de fin</label>
            <input
              type="date"
              value={editingSaison.dateFin || ''}
              onChange={(e) => setEditingSaison({...editingSaison, dateFin: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#1a1a1a',
                color: 'white'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => setEditingSaison(null)}
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
              {editingSaison.id ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="saisons-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Gestion des saisons</h2>
        <button
          onClick={handleAddSaison}
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          + Ajouter une saison
        </button>
      </div>

      {saisons.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {saisons.map((saison) => (
            <div
              key={saison.id}
              className="saison-card"
              style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => handleEdit(saison)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'white' }}>{saison.nom}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                    Du {new Date(saison.dateDebut).toLocaleDateString('fr-FR')} au {new Date(saison.dateFin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(saison); }}
                    style={{
                      backgroundColor: '#0078d4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(saison.id); }}
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
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
          <p style={{ color: '#aaa' }}>Aucune saison trouvée.</p>
          <button
            onClick={handleAddSaison}
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
            + Ajouter votre première saison
          </button>
        </div>
      )}
    </div>
  );
};
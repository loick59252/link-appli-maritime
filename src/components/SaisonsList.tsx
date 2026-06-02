// src/components/SaisonsList.tsx
import { useMemo, useState } from 'react';
import {
  ajouterSaison,
  mettreAJourSaison,
  supprimerSaison
} from '../services/saisons';
import { useAppDialog } from './AppDialog';
import type { Entreprise, Saison, Tour } from '../types';
import { libelleEntreprise, trierEntreprisesAvecFavoris } from '../utils/entreprises';

type SaisonsListProps = {
  saisons: Saison[];
  tours: Tour[];
  entreprises: Entreprise[];
  onSaisonsUpdated: () => void;
};

const dateFr = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('fr-FR');

const utiliseSaisons = (entreprise: Entreprise) =>
  entreprise.fonctionnalites?.utiliseSaisons ?? entreprise.nom === 'RDTPM';

export const SaisonsList = ({ saisons, tours, entreprises, onSaisonsUpdated }: SaisonsListProps) => {
  const { alert, confirm } = useAppDialog();
  const entreprisesAvecSaisons = useMemo(
    () => trierEntreprisesAvecFavoris(entreprises.filter(utiliseSaisons)),
    [entreprises]
  );
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState(entreprisesAvecSaisons[0]?.id ?? '');
  const [editingSaison, setEditingSaison] = useState<Partial<Saison> & { id?: string } | null>(null);

  const entrepriseCouranteId = selectedEntrepriseId || entreprisesAvecSaisons[0]?.id || '';
  const entrepriseCourante = entreprises.find(e => e.id === entrepriseCouranteId);
  const saisonsEntreprise = useMemo(
    () => saisons
      .filter(s => s.entrepriseId === entrepriseCouranteId || (!s.entrepriseId && entrepriseCourante?.nom === 'RDTPM'))
      .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)),
    [saisons, entrepriseCouranteId, entrepriseCourante]
  );

  const handleAddSaison = () => {
    if (!entrepriseCouranteId) {
      void alert('Activez les saisons sur une entreprise avant d’en ajouter.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setEditingSaison({
      entrepriseId: entrepriseCouranteId,
      nom: '',
      dateDebut: today,
      dateFin: today
    });
  };

  const handleEdit = (saison: Saison) => {
    setEditingSaison({ ...saison, entrepriseId: saison.entrepriseId || entrepriseCouranteId });
  };

  const handleSave = async () => {
    if (!editingSaison || !editingSaison.entrepriseId || !editingSaison.nom || !editingSaison.dateDebut || !editingSaison.dateFin) {
      await alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const saisonData: Omit<Saison, 'id'> = {
      entrepriseId: editingSaison.entrepriseId,
      nom: editingSaison.nom,
      dateDebut: editingSaison.dateDebut,
      dateFin: editingSaison.dateFin,
    };

    try {
      if (editingSaison.id) {
        await mettreAJourSaison(editingSaison.id, saisonData);
      } else {
        await ajouterSaison(saisonData);
      }
      onSaisonsUpdated();
      setEditingSaison(null);
    } catch (error) {
      await alert(`Erreur: ${error}`, { title: 'Erreur' });
    }
  };

  const handleDelete = async (id: string) => {
    const toursLies = tours.filter(tour => tour.saisonId === id);
    if (toursLies.length > 0) {
      await alert(
        `Impossible de supprimer cette saison : ${toursLies.length} tour${toursLies.length > 1 ? 's sont rattachés' : ' est rattaché'} à cette saison. Supprimez ou modifiez d'abord les tours concernés.`
      );
      return;
    }

    const shouldDelete = await confirm('Êtes-vous sûr de vouloir supprimer cette saison ?', {
      title: 'Supprimer la saison',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!shouldDelete) return;
    try {
      await supprimerSaison(id);
      onSaisonsUpdated();
    } catch (error) {
      await alert(`Erreur lors de la suppression: ${error}`, { title: 'Erreur' });
    }
  };

  if (entreprisesAvecSaisons.length === 0) {
    return (
      <div className="saisons-container">
        <h2>Gestion des saisons</h2>
        <p style={{ color: '#aaa' }}>
          Aucune entreprise n’utilise les saisons. Activez l’option dans le formulaire d’entreprise.
        </p>
      </div>
    );
  }

  if (editingSaison) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <h2>{editingSaison.id ? 'Modifier' : 'Ajouter'} une saison</h2>

          <div className="form-group">
            <label>Entreprise</label>
            <select
              value={editingSaison.entrepriseId || entrepriseCouranteId}
              onChange={(e) => setEditingSaison({ ...editingSaison, entrepriseId: e.target.value })}
              className="modal-input"
            >
              {entreprisesAvecSaisons.map(entreprise => (
                <option key={entreprise.id} value={entreprise.id}>{libelleEntreprise(entreprise)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              value={editingSaison.nom || ''}
              onChange={(e) => setEditingSaison({ ...editingSaison, nom: e.target.value })}
              className="modal-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Date de début</label>
            <input
              type="date"
              value={editingSaison.dateDebut || ''}
              onChange={(e) => setEditingSaison({ ...editingSaison, dateDebut: e.target.value })}
              className="modal-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={editingSaison.dateFin || ''}
              onChange={(e) => setEditingSaison({ ...editingSaison, dateFin: e.target.value })}
              className="modal-input"
              required
            />
          </div>

          <div className="form-actions">
            <button className="cancel-button" onClick={() => setEditingSaison(null)}>Annuler</button>
            <button className="submit-button" onClick={handleSave}>
              {editingSaison.id ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="saisons-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Gestion des saisons</h2>
        <button className="add-journee-button" onClick={handleAddSaison}>
          + Ajouter une saison
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 'bold' }}>Entreprise :</label>
        <select
          value={entrepriseCouranteId}
          onChange={(e) => setSelectedEntrepriseId(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white' }}
        >
          {entreprisesAvecSaisons.map(entreprise => (
            <option key={entreprise.id} value={entreprise.id}>{libelleEntreprise(entreprise)}</option>
          ))}
        </select>
      </div>

      {saisonsEntreprise.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {saisonsEntreprise.map((saison) => (
            <div
              key={saison.id}
              className="saison-card"
              style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => handleEdit(saison)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'white' }}>{saison.nom}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                    Du {dateFr(saison.dateDebut)} au {dateFr(saison.dateFin)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(saison); }} className="edit-action-button">
                    Modifier
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(saison.id); }} className="delete-button">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#aaa' }}>Aucune saison pour cette entreprise.</p>
          <button className="add-journee-button" onClick={handleAddSaison} style={{ marginTop: '10px' }}>
            + Ajouter votre première saison
          </button>
        </div>
      )}
    </div>
  );
};

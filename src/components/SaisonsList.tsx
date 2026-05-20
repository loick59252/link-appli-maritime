// src/components/SaisonsList.tsx
import { useState, useEffect } from 'react';
import { getSaisons, ajouterSaison, supprimerSaison } from '../services/saisons';

// Types locaux
type Saison = {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
};

export const SaisonsList = () => {
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [nouvelleSaison, setNouvelleSaison] = useState<Omit<Saison, 'id'>>({
    nom: '',
    dateDebut: '',
    dateFin: '',
  });

  useEffect(() => {
    const chargerSaisons = async () => {
      const saisons = await getSaisons();
      setSaisons(saisons);
    };
    chargerSaisons();
  }, []);

  const handleAjouterSaison = async () => {
    if (!nouvelleSaison.nom || !nouvelleSaison.dateDebut || !nouvelleSaison.dateFin) {
      alert("Veuillez remplir tous les champs (nom, date de début, date de fin).");
      return;
    }
    await ajouterSaison(nouvelleSaison);
    setNouvelleSaison({ nom: '', dateDebut: '', dateFin: '' });
    const saisons = await getSaisons();
    setSaisons(saisons);
    alert("Saison ajoutée avec succès !");
  };

  return (
    <div style={{ margin: '20px', backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
      <h2>Gestion des saisons</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Nom de la saison (ex: Hiver 2025-2026)"
          value={nouvelleSaison.nom}
          onChange={(e) => setNouvelleSaison({ ...nouvelleSaison, nom: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: 'none', flex: 1, minWidth: '200px' }}
          required
        />
        <input
          type="date"
          value={nouvelleSaison.dateDebut}
          onChange={(e) => setNouvelleSaison({ ...nouvelleSaison, dateDebut: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: 'none' }}
          required
        />
        <input
          type="date"
          value={nouvelleSaison.dateFin}
          onChange={(e) => setNouvelleSaison({ ...nouvelleSaison, dateFin: e.target.value })}
          style={{ padding: '8px', borderRadius: '4px', border: 'none' }}
          required
        />
        <button
          onClick={handleAjouterSaison}
          style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 15px', cursor: 'pointer' }}
        >
          Ajouter
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {saisons.map((saison) => (
          <div key={saison.id} style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{saison.nom}</h3>
            <p>Du {saison.dateDebut} au {saison.dateFin}</p>
            <button
              onClick={async () => {
                await supprimerSaison(saison.id);
                setSaisons(saisons.filter(s => s.id !== saison.id));
              }}
              style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
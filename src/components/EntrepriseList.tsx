// src/components/EntrepriseList.tsx
import { useState, useEffect } from 'react';
import { getEntreprises, supprimerEntreprise, mettreAJourEntreprise, ajouterEntreprise } from '../services/entreprises';

// Types définis localement
type Prime = {
  id: string;
  nom: string;
  montant: number;
};

type Entreprise = {
  id: string;
  nom: string;
  salaireMatelot: number;
  salaireCapitaine: number;
  primes: Prime[];
};

type EntrepriseFormProps = {
  onClose: () => void;
  onEntrepriseAjoutee: () => void;
  entreprise?: Entreprise; // Ajout pour la modification
};

export const EntrepriseList = () => {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [entrepriseAModifier, setEntrepriseAModifier] = useState<Entreprise | null>(null);

  useEffect(() => {
    rafraichirListe();
  }, []);

  const rafraichirListe = async () => {
    const entreprises = await getEntreprises();
    setEntreprises(entreprises);
  };

  const handleModifier = (entreprise: Entreprise) => {
    setEntrepriseAModifier(entreprise);
    setShowForm(true);
  };

  return (
    <div style={{ margin: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Liste des entreprises</h2>
        <button
          onClick={() => {
            setEntrepriseAModifier(null);
            setShowForm(true);
          }}
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 15px',
            cursor: 'pointer'
          }}
        >
          Ajouter une entreprise
        </button>
      </div>

      {showForm && (
        <EntrepriseForm
          onClose={() => setShowForm(false)}
          onEntrepriseAjoutee={rafraichirListe}
          entreprise={entrepriseAModifier || undefined}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {entreprises.map((entreprise) => (
          <div key={entreprise.id} style={{
            backgroundColor: '#2a2a2a',
            padding: '15px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <h3>{entreprise.nom}</h3>
            <p>Salaire Matelot: {entreprise.salaireMatelot} €/h</p>
            <p>Salaire Capitaine: {entreprise.salaireCapitaine} €/h</p>
            <div style={{ marginTop: '10px' }}>
              <strong>Primes:</strong>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {entreprise.primes.map((prime, index) => (
                  <li key={index}>{prime.nom}: {prime.montant} €</li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => handleModifier(entreprise)}
                style={{
                  backgroundColor: '#0078d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
              >
                Modifier
              </button>
              <button
                onClick={async () => {
                  await supprimerEntreprise(entreprise.id);
                  rafraichirListe();
                }}
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Déplace la définition de EntrepriseForm ici (ou importe-la correctement)
export const EntrepriseForm = ({ onClose, onEntrepriseAjoutee, entreprise }: EntrepriseFormProps) => {
  const [nom, setNom] = useState(entreprise?.nom || "");
  const [salaireMatelot, setSalaireMatelot] = useState<number>(entreprise?.salaireMatelot || 0);
  const [salaireCapitaine, setSalaireCapitaine] = useState<number>(entreprise?.salaireCapitaine || 0);
  const [primes, setPrimes] = useState<Prime[]>(entreprise?.primes || [{ id: Date.now().toString(), nom: "", montant: 0 }]);

  const ajouterPrime = () => {
    setPrimes([...primes, { id: Date.now().toString(), nom: "", montant: 0 }]);
  };

  const mettreAJourPrime = (id: string, champ: keyof Prime, valeur: string | number) => {
    setPrimes(primes.map(prime =>
      prime.id === id ? { ...prime, [champ]: valeur } : prime
    ));
  };

  const supprimerPrime = (id: string) => {
    setPrimes(primes.filter(prime => prime.id !== id));
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom) return;

    const nouvelleEntreprise: Omit<Entreprise, 'id'> = {
      nom,
      salaireMatelot,
      salaireCapitaine,
      primes: primes.filter(p => p.nom && p.montant > 0)
    };

    if (entreprise) {
      // Mise à jour
      await mettreAJourEntreprise(entreprise.id, nouvelleEntreprise);
    } else {
      // Ajout
      await ajouterEntreprise(nouvelleEntreprise);
    }
    onEntrepriseAjoutee();
    onClose();
  };

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
        padding: '30px',
        borderRadius: '10px',
        width: '500px',
        maxWidth: '90%',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}>
        <h2>{entreprise ? 'Modifier une entreprise' : 'Ajouter une entreprise'}</h2>
        <form onSubmit={soumettre}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Nom de l'entreprise</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none' }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Salaire horaire Matelot (€)</label>
            <input
              type="number"
              value={salaireMatelot}
              onChange={(e) => setSalaireMatelot(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none' }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Salaire horaire Capitaine (€)</label>
            <input
              type="number"
              value={salaireCapitaine}
              onChange={(e) => setSalaireCapitaine(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none' }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Primes spécifiques</label>
            {primes.map((prime) => (
              <div key={prime.id} style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={prime.nom}
                  onChange={(e) => mettreAJourPrime(prime.id, 'nom', e.target.value)}
                  placeholder="Nom de la prime"
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', marginRight: '5px' }}
                />
                <input
                  type="number"
                  value={prime.montant}
                  onChange={(e) => mettreAJourPrime(prime.id, 'montant', Number(e.target.value))}
                  placeholder="Montant (€)"
                  style={{ width: '100px', padding: '8px', borderRadius: '4px', border: 'none', marginRight: '5px' }}
                />
                <button
                  type="button"
                  onClick={() => supprimerPrime(prime.id)}
                  style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px' }}
                >
                  Supprimer
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={ajouterPrime}
              style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 15px' }}
            >
              Ajouter une prime
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 15px' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 15px' }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
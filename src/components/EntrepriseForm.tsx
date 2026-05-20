// src/components/EntrepriseForm.tsx
import { useState } from 'react';
import { ajouterEntreprise } from '../services/entreprises';

type EntrepriseFormProps = {
  onClose: () => void;
  onEntrepriseAjoutee: () => void;
};

export const EntrepriseForm = ({ onClose, onEntrepriseAjoutee }: EntrepriseFormProps) => {
  const [nom, setNom] = useState("");
  const [salaireMatelot, setSalaireMatelot] = useState<number>(0);
  const [salaireCapitaine, setSalaireCapitaine] = useState<number>(0);
  const [primes, setPrimes] = useState<Prime[]>([{ id: Date.now().toString(), nom: "", montant: 0 }]);

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

    await ajouterEntreprise(nouvelleEntreprise);
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '20px',
        borderRadius: '8px',
        width: '500px',
        maxWidth: '90%',
        color: 'white'
      }}>
        <h2>Ajouter une entreprise</h2>
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
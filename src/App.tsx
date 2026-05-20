// src/App.tsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import { EntrepriseList } from './components/EntrepriseList';
import { SaisonsList } from './components/SaisonsList';
import { ToursList } from './components/ToursList';
import { JourneeForm } from './components/JourneeForm';
import { getJourneesParDate, supprimerJournee } from './services/journees';
import { getEntreprises } from './services/entreprises';
import { getTours } from './services/tours';

// ID réel de RDTPM dans Firebase
export const RDTPM_ID = "8TcUp0MYz2WsPq7aT2KP";

function App() {
  const [ongletActif, setOngletActif] = useState<'planning' | 'entreprises' | 'saisons' | 'tours'>('planning');
  const [showJourneeForm, setShowJourneeForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journees, setJournees] = useState<any[]>([]);
  const [journeeToEdit, setJourneeToEdit] = useState<any>(null);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);

  // Charge les données initiales
  useEffect(() => {
    const loadData = async () => {
      const [entreprisesData, toursData] = await Promise.all([
        getEntreprises(),
        getTours()
      ]);
      setEntreprises(entreprisesData);
      setTours(toursData);
      const dateISO = selectedDate.toISOString().split('T')[0];
      const journeesData = await getJourneesParDate(dateISO);
      setJournees(journeesData);
    };
    loadData();
  }, []);

  // Recharge les journées quand la date change
  useEffect(() => {
    const loadJournees = async () => {
      const dateISO = selectedDate.toISOString().split('T')[0];
      const journeesData = await getJourneesParDate(dateISO);
      setJournees(journeesData);
    };
    loadJournees();
  }, [selectedDate]);

  const handleDeleteJournee = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette journée ?")) {
      try {
        await supprimerJournee(id);
        const dateISO = selectedDate.toISOString().split('T')[0];
        const updatedJournees = await getJourneesParDate(dateISO);
        setJournees(updatedJournees);
        alert("Journée supprimée avec succès !");
      } catch (error) {
        alert(`Erreur: ${error}`);
      }
    }
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚢 Planning Maritime</h1>

      {/* Onglets */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '5px' }}>
        <button
          onClick={() => setOngletActif('planning')}
          style={{
            padding: '10px 20px',
            backgroundColor: ongletActif === 'planning' ? '#0078d4' : '#2a2a2a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Planning
        </button>
        <button
          onClick={() => setOngletActif('entreprises')}
          style={{
            padding: '10px 20px',
            backgroundColor: ongletActif === 'entreprises' ? '#0078d4' : '#2a2a2a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Entreprises
        </button>
        <button
          onClick={() => setOngletActif('saisons')}
          style={{
            padding: '10px 20px',
            backgroundColor: ongletActif === 'saisons' ? '#0078d4' : '#2a2a2a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Saisons
        </button>
        <button
          onClick={() => setOngletActif('tours')}
          style={{
            padding: '10px 20px',
            backgroundColor: ongletActif === 'tours' ? '#0078d4' : '#2a2a2a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Tours
        </button>
      </div>

      {/* Bouton pour ajouter une journée */}
      {ongletActif === 'planning' && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => {
              setJourneeToEdit(null);
              setShowJourneeForm(true);
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
            Ajouter une journée
          </button>
        </div>
      )}

      {/* Contenu des onglets */}
      {ongletActif === 'planning' && (
        <div>
          <Calendar
            onChange={(date) => setSelectedDate(date)}
            value={selectedDate}
            locale="fr-FR"
          />
          <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
            <h3>Journées pour le {selectedDate.toLocaleDateString('fr-FR')}</h3>
            {journees.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {journees.map((journee) => {
                  const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
                  const tour = tours.find(t => t.id === journee.tourId);
                  return (
                    <div
                      key={journee.id}
                      style={{
                        padding: '15px',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${entreprise?.couleur || '#0078d4'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ color: entreprise?.couleur || '#0078d4' }}>
                            {entreprise?.nom || journee.entrepriseId}
                          </strong>
                          <span style={{ marginLeft: '15px' }}>{journee.role}</span>
                          {tour && <span style={{ marginLeft: '15px' }}>Tour {tour.numero} - {tour.lignesDestinations.join(', ')}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              setJourneeToEdit(journee);
                              setShowJourneeForm(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#0078d4',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteJournee(journee.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ff4444',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <span>🕒 {journee.heurePriseService} - {journee.heureFinService}</span>
                        {journee.heureDepartPause && <span> | Pause: {journee.heureDepartPause} - {journee.heureReprise}</span>}
                      </div>
                      {journee.lignesDestinations && (
                        <div style={{ marginTop: '10px' }}>
                          <strong>Lignes:</strong> {journee.lignesDestinations.join(', ')}
                        </div>
                      )}
                      {journee.notes && <div style={{ marginTop: '10px', fontStyle: 'italic' }}>📝 {journee.notes}</div>}
                      {journee.primes && journee.primes.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <strong>Primes:</strong>
                          <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                            {journee.primes.map((prime: any, index: number) => (
                              <li key={index}>{prime.nom}: {prime.montant} €</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#888' }}>Aucune journée enregistrée pour cette date.</p>
            )}
          </div>
        </div>
      )}

      {ongletActif === 'entreprises' && <EntrepriseList />}
      {ongletActif === 'saisons' && <SaisonsList />}
      {ongletActif === 'tours' && <ToursList />}

      {/* Formulaire d'ajout/modification de journée */}
      {showJourneeForm && (
        <JourneeForm
          onClose={() => {
            setShowJourneeForm(false);
            setJourneeToEdit(null);
          }}
          onJourneeAjoutee={() => {
            const dateISO = selectedDate.toISOString().split('T')[0];
            getJourneesParDate(dateISO).then(setJournees);
          }}
          date={selectedDate.toISOString().split('T')[0]}
          journeeToEdit={journeeToEdit}
          entreprises={entreprises}
          tours={tours}
        />
      )}
    </div>
  );
}

export default App;
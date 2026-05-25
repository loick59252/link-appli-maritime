// src/App.tsx
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getJourneesParMois, supprimerJournee } from './services/journees';
import { getEntreprises } from './services/entreprises';
import { getTours } from './services/tours';
import { getSaisons } from './services/saisons';
import JourneeForm from './components/JourneeForm';
import { ToursList } from './components/ToursList';
import { EntrepriseList } from './components/EntrepriseList';
import { SaisonsList } from './components/SaisonsList';

// ID réel de RDTPM dans Firebase
export const RDTPM_ID = "8TcUp0MYz2WsPq7aT2KP";

function App() {
  // États
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journees, setJournees] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [saisons, setSaisons] = useState<any[]>([]);
  const [showJourneeForm, setShowJourneeForm] = useState(false);
  const [journeeToEdit, setJourneeToEdit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'Planning' | 'Entreprises' | 'Saisons' | 'Tours'>('Planning');

  // Charge les données initiales
  useEffect(() => {
    const loadData = async () => {
      const [entreprisesData, toursData, saisonsData] = await Promise.all([
        getEntreprises(),
        getTours(),
        getSaisons()
      ]);
      setEntreprises(entreprisesData);
      setTours(toursData);
      setSaisons(saisonsData);
    };
    loadData();
  }, []);

  // Charge les journées pour le mois sélectionné
  useEffect(() => {
    const loadJournees = async () => {
      const journeesData = await getJourneesParMois(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
      setJournees(journeesData);
    };
    loadJournees();
  }, [selectedDate, showJourneeForm]);

  // Fonction pour obtenir la couleur d'une journée
  const getJourneeCouleur = (journee: any) => {
    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
    return entreprise?.couleur || '#555';
  };

  // Fonction pour obtenir les dates avec couleurs
  const getDatesWithColors = () => {
    const dates: { [key: string]: string } = {};
    journees.forEach(journee => {
      const dateStr = new Date(journee.date).toDateString();
      dates[dateStr] = getJourneeCouleur(journee);
    });
    return dates;
  };
  const datesWithColors = getDatesWithColors();

  // Fonction pour supprimer une journée
  const handleDeleteJournee = async (journeeId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette journée ?")) {
      try {
        await supprimerJournee(journeeId);
        // Recharge les journées pour le mois en cours
        const journeesData = await getJourneesParMois(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
        setJournees(journeesData);
        alert("Journée supprimée avec succès !");
      } catch (error) {
        alert(`Erreur lors de la suppression: ${error}`);
      }
    }
  };

  // Gestion des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      // src/App.tsx (partie modifiée dans renderTabContent > case 'Planning')
case 'Planning':
  return (
    <div className="planning-container">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Planning Maritime</h2>

      <button
        className="add-journee-button"
        onClick={() => {
          setJourneeToEdit(null);
          setShowJourneeForm(true);
        }}
      >
        Ajouter une journée
      </button>

      {/* Calendrier */}
      <div className="calendar-container">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          locale="fr-FR"
          tileContent={({ date, view }) => {
            if (view === 'month') {
              const dateStr = date.toDateString();
              if (datesWithColors[dateStr]) {
                return (
                  <div style={{
                    height: '100%',
                    width: '100%',
                    backgroundColor: datesWithColors[dateStr],
                    borderRadius: '4px',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: 0.3,
                    zIndex: 1
                  }}></div>
                );
              }
            }
          }}
          className="react-calendar-custom"
        />
      </div>

      {/* Liste des journées */}
      <div style={{ marginTop: '20px' }}>
        <h3>Journée du {selectedDate.toLocaleDateString('fr-FR')}</h3><br></br>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {journees
            .filter(j => new Date(j.date).toDateString() === selectedDate.toDateString())
            .length > 0 ? (
              journees
                .filter(j => new Date(j.date).toDateString() === selectedDate.toDateString())
                .map((journee) => {
                  const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
                  const couleur = entreprise?.couleur || '#555';
                  const tour = journee.tourId ? tours.find(t => t.id === journee.tourId) : null;

                  return (
                    <div
                      key={journee.id}
                      className="journee-card"
                      style={{ borderLeft: `3px solid ${couleur}` }}
                    >
                      <div className="journee-card-header">
                        {entreprise?.logo && (
                          <img
                            src={entreprise.logo}
                            alt={entreprise.nom}
                            style={{ width: '20px', height: '20px', marginRight: '8px', borderRadius: '3px' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="couleur-entreprise" style={{ backgroundColor: couleur }}></div>
                        <strong>{entreprise?.nom || 'Entreprise inconnue'}</strong>
                        <span style={{ color: '#aaa' }}>{journee.role}</span>
                        {tour && <span> - Tour {tour.numero}</span>}
                        {journee.lignesDestinations?.length > 0 && (
                          <span> - {journee.lignesDestinations.join(', ')}</span>
                        )}
                      </div>

                      <div className="journee-card-info">
                        <div>
                          <span>⏰ {journee.heurePriseService} - {journee.heureFinService}</span>
                          {journee.heureDepartPause && (
                            <span> | Pause: {journee.heureDepartPause} - {journee.heureReprise}</span>
                          )}
                        </div>

                        {journee.primes?.length > 0 && (
                          <div style={{ marginTop: '6px' }}>
                            <strong>Primes:</strong>
                            <ul className="primes-list">
                              {journee.primes.map((prime: any) => (
                                <li key={prime.id}>{prime.nom} (+{prime.montant} €)</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {journee.notes && (
                          <div style={{ marginTop: '6px', fontSize: '13px', color: '#aaa' }}>
                            📝 {journee.notes}
                          </div>
                        )}
                      </div>

                      <div className="journee-card-actions">
                        <button
                          className="edit-button"
                          onClick={() => {
                            setJourneeToEdit(journee);
                            setShowJourneeForm(true);
                          }}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteJournee(journee.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
            ) : (
              // ✅ NOUVEAU: Carte pour journée non travaillée
              <div className="journee-card journee-non-travaillee">
                <div className="journee-card-header">
                  <div className="couleur-entreprise" style={{ backgroundColor: '#666' }}></div>
                  <strong>Journée non travaillée</strong>
                </div>
                <div className="journee-card-info">
                  <p style={{ color: '#aaa', fontStyle: 'italic' }}>
                    Aucune journée enregistrée pour cette date.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      {showJourneeForm && (
        <JourneeForm
          onClose={() => {
            setShowJourneeForm(false);
            setJourneeToEdit(null);
          }}
          onJourneeAjoutee={() => {
            getJourneesParMois(selectedDate.getFullYear(), selectedDate.getMonth() + 1).then(setJournees);
          }}
          date={selectedDate.toISOString().split('T')[0]}
          journeeToEdit={journeeToEdit}
          entreprises={entreprises}
          tours={tours}
        />
      )}
    </div>
  );

      case 'Entreprises':
        return <EntrepriseList entreprises={entreprises} onEntreprisesUpdated={() => {}} />;

      case 'Saisons':
        return <SaisonsList saisons={saisons} onSaisonsUpdated={() => {}} />;

      case 'Tours':
        return <ToursList tours={tours} onToursUpdated={() => {}} entreprises={entreprises} />;

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Barre de navigation */}
      <div className="app-header">
       <img
          src="/logo-bouee.png"
          alt="Logo"
          className="app-logo"
/>
        <h1>Dashboard Maritime</h1>
      </div>

      {/* Onglets */}
      <div className="tabs-container">
        {['Planning', 'Entreprises', 'Saisons', 'Tours'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="main-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;
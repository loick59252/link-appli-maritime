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
import { RecapTab } from './components/RecapTab';

function App() {
  // États
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journees, setJournees] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [saisons, setSaisons] = useState<any[]>([]);
  const [showJourneeForm, setShowJourneeForm] = useState(false);
  const [journeeToEdit, setJourneeToEdit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'Planning' | 'Semaines' | 'Récap' | 'Entreprises' | 'Saisons' | 'Tours'>('Planning');
  const [rdtpmId, setRdtpmId] = useState<string>(localStorage.getItem('RDTPM_ID') || "");

  // Fonction pour rafraîchir TOUTES les données
  const refreshAllData = async () => {
    try {
      const [entreprisesData, toursData, saisonsData] = await Promise.all([
        getEntreprises(),
        getTours(),
        getSaisons()
      ]);

      setEntreprises(entreprisesData);
      setTours(toursData);
      setSaisons(saisonsData);

      // Rafraîchit les journées du mois en cours
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const journeesData = await getJourneesParMois(year, month);
      setJournees(journeesData);

      // Met à jour l'ID de RDTPM si trouvé
      const rdtpm = entreprisesData.find(e => e.nom === "RDTPM");
      if (rdtpm?.id && rdtpm.id !== rdtpmId) {
        setRdtpmId(rdtpm.id);
        localStorage.setItem('RDTPM_ID', rdtpm.id);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
    }
  };

  // Charge les données initiales
  useEffect(() => {
    refreshAllData();
  }, []);

  // Met à jour rdtpmId si les entreprises changent
  useEffect(() => {
    const rdtpm = entreprises.find(e => e.nom === "RDTPM");
    if (rdtpm?.id && rdtpm.id !== rdtpmId) {
      setRdtpmId(rdtpm.id);
      localStorage.setItem('RDTPM_ID', rdtpm.id);
    }
  }, [entreprises, rdtpmId]);

  // Charge les journées pour le mois sélectionné
  useEffect(() => {
    const loadJournees = async () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const journeesData = await getJourneesParMois(year, month);
      setJournees(journeesData);
    };
    loadJournees();
  }, [selectedDate]);

  // Fonction pour obtenir la couleur d'une journée
  const getJourneeCouleur = (journee: any) => {
    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
    return entreprise?.couleur || '#555';
  };

  // Fonction pour obtenir le lundi d'une semaine
  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Fonction pour supprimer une journée
  const handleDeleteJournee = async (journeeId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette journée ?")) {
      try {
        await supprimerJournee(journeeId);
        refreshAllData();
      } catch (error) {
        alert(`Erreur lors de la suppression: ${error}`);
      }
    }
  };

  // Composant pour afficher une semaine
  const SemaineView = ({ dateDebut, onDeleteJournee }: {
    dateDebut: Date;
    onDeleteJournee: (id: string) => void;
  }) => {
    const jours = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(dateDebut);
      date.setDate(date.getDate() + i);
      jours.push(date);
    }

    const getJourneeForDate = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return journees.find(j => j.date === dateStr);
    };

    return (
      <div className="semaine-view">
        <h3>{dateDebut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
        <div className="semaine-jours">
          {jours.map((date) => {
            const journee = getJourneeForDate(date);
            const dateStr = date.toISOString().split('T')[0];
            const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' }).charAt(0).toUpperCase() +
                               date.toLocaleDateString('fr-FR', { weekday: 'long' }).slice(1);

            let heuresTotales = 0;
            if (journee) {
              const [priseH, priseM] = journee.heurePriseService.split(':').map(Number);
              const [finH, finM] = journee.heureFinService.split(':').map(Number);
              let totalMinutes = (finH * 60 + finM) - (priseH * 60 + priseM);
              if (journee.heureDepartPause && journee.heureReprise) {
                const [pauseH, pauseM] = journee.heureDepartPause.split(':').map(Number);
                const [repriseH, repriseM] = journee.heureReprise.split(':').map(Number);
                totalMinutes -= (repriseH * 60 + repriseM) - (pauseH * 60 + pauseM);
              }
              heuresTotales = totalMinutes / 60;
            }

            return (
              <div key={dateStr} className="semaine-jour">
                <div className="semaine-jour-header">
                  <strong>{jourSemaine}</strong>
                  <span>{date.toLocaleDateString('fr-FR')}</span>
                </div>
                {journee ? (
                  <div className="journee-card semaine-journee-card" style={{ borderLeft: `3px solid ${getJourneeCouleur(journee)}` }}>
                    <div className="journee-card-header">
                      {entreprises.find(e => e.id === journee.entrepriseId)?.logo && (
                        <img src={entreprises.find(e => e.id === journee.entrepriseId).logo} alt="" style={{ width: '16px', height: '16px', marginRight: '6px', borderRadius: '3px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      <div className="couleur-entreprise" style={{ backgroundColor: getJourneeCouleur(journee), width: '12px', height: '12px' }}></div>
                      <strong style={{ fontSize: '13px' }}>{entreprises.find(e => e.id === journee.entrepriseId)?.nom || 'Entreprise'}</strong>
                      <span style={{ color: '#aaa', fontSize: '12px' }}>
                        {journee.role}
                      </span>
                    </div>
                    <div className="journee-card-info" style={{ fontSize: '12px' }}>
                      <div><span>⏰ {journee.heurePriseService} - {journee.heureFinService}</span></div>
                      <div style={{ marginTop: '4px' }}><span>Total: {heuresTotales.toFixed(2)} h</span></div>
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
                      <button className="delete-button" onClick={() => onDeleteJournee(journee.id)} title="Supprimer" style={{ fontSize: '12px' }}>🗑️</button>
                    </div>
                  </div>
                ) : (
                  <div className="journee-card journee-non-travaillee semaine-journee-card">
                    <div className="journee-card-header" style={{ justifyContent: 'center' }}><strong style={{ fontSize: '13px' }}>En repos</strong></div>
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>0 h</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Gestion des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Récap':
        return <RecapTab journees={journees} entreprises={entreprises} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;

      case 'Planning':
        return (
          <div className="planning-container">
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Planning Maritime</h2>
            <button className="add-journee-button" onClick={() => {
              setJourneeToEdit(null);
              setShowJourneeForm(true);
            }}>Ajouter une journée</button>

            <div className="calendar-container">
              <Calendar
                onChange={(date) => {
                  setSelectedDate(date);
                }}
                value={selectedDate}
                locale="fr-FR"
                tileContent={({ date, view }) => {
  if (view === 'month') {
    // ✅ Utilise le même format que dans Firebase (YYYY-MM-DD)
    const dateStr = date.toISOString().split('T')[0];
    const journee = journees.find(j => j.date === dateStr);
    if (journee) {
      const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
      return (
        <div style={{
          height: '100%',
          width: '100%',
          backgroundColor: entreprise?.couleur || '#555',
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

            <div style={{ marginTop: '20px' }}>
              <h3>Journée du {selectedDate.toLocaleDateString('fr-FR')}</h3><br />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {journees.filter(j => j.date === selectedDate.toISOString().split('T')[0]).length > 0 ? (
                  journees.filter(j => j.date === selectedDate.toISOString().split('T')[0]).map((journee) => {
                    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
                    const couleur = entreprise?.couleur || '#555';
                    const tour = journee.tourId ? tours.find(t => t.id === journee.tourId) : null;
                    const [h1, m1] = journee.heurePriseService.split(':').map(Number);
                    const [h2, m2] = journee.heureFinService.split(':').map(Number);
                    let totalMins = (h2 * 60 + m2) - (h1 * 60 + m1);
                    if (journee.heureDepartPause && journee.heureReprise) {
                      const [ph, pm] = journee.heureDepartPause.split(':').map(Number);
                      const [rh, rm] = journee.heureReprise.split(':').map(Number);
                      totalMins -= (rh * 60 + rm) - (ph * 60 + pm);
                    }
                    const heures = totalMins / 60;

                    return (
                      <div key={journee.id} className="journee-card" style={{ borderLeft: `3px solid ${couleur}` }}>
                        <div className="journee-card-header">
                          {entreprise?.logo && <img src={entreprise.logo} alt="" style={{ width: '20px', height: '20px', marginRight: '8px', borderRadius: '3px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                          <div className="couleur-entreprise" style={{ backgroundColor: couleur }}></div>
                          <strong>{entreprise?.nom || 'Entreprise'}</strong>
                          <span style={{ color: '#aaa' }}>
                            {journee.role}
                          </span>
                          {tour && <span> - Tour {tour.numero}</span>}
                          {journee.lignesDestinations?.length > 0 && <span> - {Array.isArray(journee.lignesDestinations) ? journee.lignesDestinations.join(', ') : journee.lignesDestinations}</span>}
                        </div>
                        <div className="journee-card-info">
                          <div>
                            <span>⏰ {journee.heurePriseService} - {journee.heureFinService}</span>
                            {journee.heureDepartPause && <span> | Pause: {journee.heureDepartPause} - {journee.heureReprise}</span>}
                          </div>
                          <div style={{ marginTop: '4px' }}><span>Total: {heures.toFixed(2)} h</span></div>
                          {journee.primes?.length > 0 && (
                            <div style={{ marginTop: '6px' }}>
                              <strong>Primes:</strong>
                              <ul className="primes-list">
                                {journee.primes.map((prime: any) => {
                                  const primeObj = entreprises.find(e => e.id === journee.entrepriseId)?.primes?.find(p => p.id === prime.id || p.id === prime);
                                  return <li key={prime.id || prime}>{primeObj?.nom || prime} (+{primeObj?.montant || prime.montant}€)</li>;
                                })}
                              </ul>
                            </div>
                          )}
                          {journee.notes && <div style={{ marginTop: '6px', fontSize: '13px', color: '#aaa' }}>📝 {journee.notes}</div>}
                        </div>
                        <div className="journee-card-actions">
                          <button className="edit-button" onClick={() => { setJourneeToEdit(journee); setShowJourneeForm(true); }} title="Modifier">✏️</button>
                          <button className="delete-button" onClick={() => handleDeleteJournee(journee.id)} title="Supprimer">🗑️</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="journee-card journee-non-travaillee">
                    <div className="journee-card-header"><div className="couleur-entreprise" style={{ backgroundColor: '#666' }}></div><strong>Journée non travaillée</strong></div>
                    <div className="journee-card-info"><p style={{ color: '#aaa', fontStyle: 'italic' }}>Aucune journée enregistrée pour cette date.</p></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'Semaines':
        return (
          <div className="semaines-container">
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Semaines à venir</h2>
            <SemaineView dateDebut={getStartOfWeek(new Date())} onDeleteJournee={handleDeleteJournee} />
            <SemaineView dateDebut={getStartOfWeek(new Date(new Date().setDate(new Date().getDate() + 7)))} onDeleteJournee={handleDeleteJournee} />
          </div>
        );

      case 'Entreprises':
        return <EntrepriseList entreprises={entreprises} onEntreprisesUpdated={refreshAllData} rdtpmId={rdtpmId} setRdtpmId={setRdtpmId} />;

      case 'Saisons':
        return <SaisonsList saisons={saisons} onSaisonsUpdated={refreshAllData} />;

      case 'Tours':
        return <ToursList tours={tours} onToursUpdated={refreshAllData} entreprises={entreprises} rdtpmId={rdtpmId} />;

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Dashboard Maritime</h1>
      </div>
      <div className="tabs-container">
        {['Planning', 'Semaines', 'Récap', 'Entreprises', 'Saisons', 'Tours'].map((tab) => (
          <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as any)}>{tab}</button>
        ))}
      </div>
      <div className="main-content">
        {renderTabContent()}
        {showJourneeForm && (
  <JourneeForm
    onClose={() => { setShowJourneeForm(false); setJourneeToEdit(null); }}
    onJourneeAjoutee={refreshAllData}
    date={selectedDate.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .split('/')
      .reverse()
      .join('-')} // ✅ Format YYYY-MM-DD local
    journeeToEdit={journeeToEdit}
    entreprises={entreprises}
    tours={tours}
    rdtpmId={rdtpmId}
    setTours={setTours}
  />
)}
      </div>
    </div>
  );
}

export default App;
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

      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const journeesData = await getJourneesParMois(year, month);
      setJournees(journeesData);

      const rdtpm = entreprisesData.find(e => e.nom === "RDTPM");
      if (rdtpm?.id && rdtpm.id !== rdtpmId) {
        setRdtpmId(rdtpm.id);
        localStorage.setItem('RDTPM_ID', rdtpm.id);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  useEffect(() => {
    const loadJourneesForMonth = async () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const journeesData = await getJourneesParMois(year, month);
      setJournees(journeesData);
    };
    loadJourneesForMonth();
  }, [selectedDate]);

  useEffect(() => {
    const rdtpm = entreprises.find(e => e.nom === "RDTPM");
    if (rdtpm?.id && rdtpm.id !== rdtpmId) {
      setRdtpmId(rdtpm.id);
      localStorage.setItem('RDTPM_ID', rdtpm.id);
    }
  }, [entreprises, rdtpmId]);

  // Fonction pour obtenir la couleur d'une entreprise
  const getJourneeCouleur = (entrepriseId: string) => {
    const entreprise = entreprises.find(e => e.id === entrepriseId);
    return entreprise?.couleur || '#555';
  };

  // Fonction pour obtenir la classe CSS d'une entreprise
  const getEntrepriseClass = (entrepriseId: string) => {
    const entreprise = entreprises.find(e => e.id === entrepriseId);
    return entreprise?.nom.toLowerCase().replace(/\s+/g, '-') || '';
  };

  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const handleDeleteJournee = async (journeeId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette journée ?")) {
      try {
        await supprimerJournee(journeeId);
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const journeesData = await getJourneesParMois(year, month);
        setJournees(journeesData);
      } catch (error) {
        alert(`Erreur lors de la suppression: ${error}`);
      }
    }
  };

  // Composant pour afficher une semaine
  const SemaineView = ({ dateDebut, onDeleteJournee, title = '' }: {
    dateDebut: Date;
    onDeleteJournee: (id: string) => void;
    title?: string;
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

    const journeesSemaine = jours
      .map(day => getJourneeForDate(day))
      .filter(j => j !== undefined);

    let totalMinutesSemaine = 0;
    const entreprisesSemaine: Record<string, { jours: number; minutes: number }> = {};

    journeesSemaine.forEach(journee => {
      const [h1, m1] = journee.heurePriseService.split(':').map(Number);
      const [h2, m2] = journee.heureFinService.split(':').map(Number);
      let mins = (h2 * 60 + m2) - (h1 * 60 + m1);

      if (journee.heureDepartPause && journee.heureReprise) {
        const [ph, pm] = journee.heureDepartPause.split(':').map(Number);
        const [rh, rm] = journee.heureReprise.split(':').map(Number);
        mins -= (rh * 60 + rm) - (ph * 60 + pm);
      }
      totalMinutesSemaine += mins;

      const entrepriseId = journee.entrepriseId;
      if (!entreprisesSemaine[entrepriseId]) {
        entreprisesSemaine[entrepriseId] = { jours: 0, minutes: 0 };
      }
      entreprisesSemaine[entrepriseId].jours += 1;
      entreprisesSemaine[entrepriseId].minutes += mins;
    });

    const heuresSemaine = Math.floor(totalMinutesSemaine / 60);
    const minutesSemaine = totalMinutesSemaine % 60;

    return (
      <div className="semaine-view">
        <h3>{title}</h3>
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

            const entrepriseClass = journee ? getEntrepriseClass(journee.entrepriseId) : '';

            return (
              <div key={dateStr} className={`semaine-jour ${journee ? `has-${entrepriseClass}` : ''}`}>
                <div className="semaine-jour-header">
                  <strong>{jourSemaine}</strong>
                  <span>{date.toLocaleDateString('fr-FR')}</span>
                </div>
                {journee ? (
                  <div className="journee-card semaine-journee-card" style={{ borderLeftColor: getJourneeCouleur(journee.entrepriseId) }}>
                    <div className="journee-card-header">
                      {entreprises.find(e => e.id === journee.entrepriseId)?.logo && (
                        <img
                          src={entreprises.find(e => e.id === journee.entrepriseId).logo}
                          alt=""
                          className="entreprise-logo"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <strong>{entreprises.find(e => e.id === journee.entrepriseId)?.nom || 'Entreprise'}</strong>
                      <span>{journee.role}</span>
                    </div>
                    <div className="journee-card-info">
                      <div>⏰ {journee.heurePriseService} - {journee.heureFinService}</div>
                      <div>Total: {heuresTotales.toFixed(2)} h</div>
                    </div>
                    <div className="journee-card-actions">
                      <button className="edit-button" onClick={() => { setJourneeToEdit(journee); setShowJourneeForm(true); }}>✏️</button>
                      <button className="delete-button" onClick={() => onDeleteJournee(journee.id)}>🗑️</button>
                    </div>
                  </div>
                ) : (
                  <div className="journee-card journee-non-travaillee semaine-journee-card">
                    <div className="journee-card-header"><strong>En repos</strong></div>
                    <div>0 h</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="week-recap">
          <h4>Récapitulatif de la semaine</h4>
          <div>
            <div>
              <div className="stat-box">
                <span>Jours travaillés:</span>
                <strong>{journeesSemaine.length}</strong>
              </div>
              <div className="stat-box">
                <span>Heures totales:</span>
                <strong>{heuresSemaine}h{minutesSemaine > 0 ? ` ${minutesSemaine}min` : ''} ({(totalMinutesSemaine / 60).toFixed(2)}h)</strong>
              </div>
            </div>
          </div>
          <div>
            <h4>Par entreprise</h4>
            {Object.entries(entreprisesSemaine).length > 0 ? (
              Object.entries(entreprisesSemaine).map(([entrepriseId, stats]) => {
                const entreprise = entreprises.find(e => e.id === entrepriseId);
                if (!entreprise) return null;
                const heures = Math.floor(stats.minutes / 60);
                const minutes = stats.minutes % 60;
                const entrepriseClass = getEntrepriseClass(entrepriseId);
                return (
                  <div key={entrepriseId} className={`entreprise-recap ${entrepriseClass}`} style={{ borderLeftColor: entreprise.couleur || '#555' }}>
                    <strong>{entreprise.nom}</strong>
                    <div>Jours: {stats.jours} | Heures: {heures}h{minutes > 0 ? ` ${minutes}min` : ''} ({(stats.minutes / 60).toFixed(2)}h)</div>
                  </div>
                );
              })
            ) : (
              <div className="journee-card journee-non-travaillee">
                <div className="journee-card-header"><strong>Aucune journée enregistrée pour cette semaine</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Récap':
        return <RecapTab journees={journees} entreprises={entreprises} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case 'Planning':
        return (
          <div className="planning-container">
            <h2>Planning Maritime</h2>
            <button className="add-journee-button" onClick={() => { setJourneeToEdit(null); setShowJourneeForm(true); }}>
              Ajouter une journée
            </button>
            <div className="calendar-container">
              <Calendar
                onChange={(date) => setSelectedDate(date as Date)}
                value={selectedDate}
                locale="fr-FR"
                tileClassName={({ date, view }) => {
                  if (view === 'month') {
                    const dateStr = date.toISOString().split('T')[0];
                    const journee = journees.find(j => j.date === dateStr);
                    if (journee) {
                      const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
                      if (entreprise) {
                        return `calendar-tile-${entreprise.nom.toLowerCase().replace(/\s+/g, '-')}`;
                      }
                    }
                  }
                  return null;
                }}
                className="react-calendar-custom"
              />
            </div>
            <div>
              <h3>Journée du {selectedDate.toLocaleDateString('fr-FR')}</h3>
              <div>
                {journees.filter(j => j.date === selectedDate.toISOString().split('T')[0]).length > 0 ? (
                  journees.filter(j => j.date === selectedDate.toISOString().split('T')[0]).map((journee) => {
                    const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
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
                    const entrepriseClass = getEntrepriseClass(journee.entrepriseId);
                    return (
                      <div key={journee.id} className={`journee-card ${entrepriseClass}`} style={{ borderLeftColor: getJourneeCouleur(journee.entrepriseId) }}>
                        <div className="journee-card-header">
                          {entreprise?.logo && <img src={entreprise.logo} alt="" className="entreprise-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          <strong>{entreprise?.nom || 'Entreprise'}</strong>
                          <span>{journee.role}</span>
                          {tour && <span> - Tour {tour.numero}</span>}
                          {journee.lignesDestinations?.length > 0 && <span> - {Array.isArray(journee.lignesDestinations) ? journee.lignesDestinations.join(', ') : journee.lignesDestinations}</span>}
                        </div>
                        <div className="journee-card-info">
                          <div>⏰ {journee.heurePriseService} - {journee.heureFinService}{journee.heureDepartPause && ` | Pause: ${journee.heureDepartPause} - ${journee.heureReprise}`}</div>
                          <div>Total: {heures.toFixed(2)} h</div>
                          {journee.primes?.length > 0 && (
                            <div>
                              <strong>Primes:</strong>
                              <ul className="primes-list">
                                {journee.primes.map((prime: any) => {
                                  const primeObj = entreprises.find(e => e.id === journee.entrepriseId)?.primes?.find(p => p.id === prime.id || p.id === prime);
                                  return <li key={prime.id || prime}>{primeObj?.nom || prime} (+{primeObj?.montant || prime.montant}€)</li>;
                                })}
                              </ul>
                            </div>
                          )}
                          {journee.notes && <div>📝 {journee.notes}</div>}
                        </div>
                        <div className="journee-card-actions">
                          <button className="edit-button" onClick={() => { setJourneeToEdit(journee); setShowJourneeForm(true); }}>✏️</button>
                          <button className="delete-button" onClick={() => handleDeleteJournee(journee.id)}>🗑️</button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="journee-card journee-non-travaillee">
                    <div className="journee-card-header"><strong>Journée non travaillée</strong></div>
                    <div>Aucune journée enregistrée pour cette date.</div>
                  </div>
                )}
              </div>
              <div className="month-recap">
                <h3>Récapitulatif du mois de {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                <div>
                  <h4>Global</h4>
                  <div>
                    <div className="stat-box">
                      <span>Jours travaillés:</span>
                      <strong>{journees.filter(j => new Date(j.date).getMonth() === selectedDate.getMonth()).length}</strong>
                    </div>
                    <div className="stat-box">
                      <span>Heures totales:</span>
                      <strong>
                        {(() => {
                          let totalMinutes = 0;
                          journees.filter(j => new Date(j.date).getMonth() === selectedDate.getMonth()).forEach(j => {
                            const [h1, m1] = j.heurePriseService.split(':').map(Number);
                            const [h2, m2] = j.heureFinService.split(':').map(Number);
                            let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
                            if (j.heureDepartPause && j.heureReprise) {
                              const [ph, pm] = j.heureDepartPause.split(':').map(Number);
                              const [rh, rm] = j.heureReprise.split(':').map(Number);
                              mins -= (rh * 60 + rm) - (ph * 60 + pm);
                            }
                            totalMinutes += mins;
                          });
                          const heures = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          return `${heures}h${minutes > 0 ? ` ${minutes}min` : ''} (${(totalMinutes / 60).toFixed(2)}h)`;
                        })()}
                      </strong>
                    </div>
                  </div>
                </div>
                <div>
                  <h4>Par entreprise</h4>
                  {(() => {
                    const entreprisesAvecJournees = entreprises.filter(entreprise =>
                      journees.some(j => j.entrepriseId === entreprise.id && new Date(j.date).getMonth() === selectedDate.getMonth())
                    );
                    if (entreprisesAvecJournees.length === 0) {
                      return <div className="journee-card journee-non-travaillee"><div className="journee-card-header"><strong>Aucune journée enregistrée pour ce mois</strong></div></div>;
                    }
                    return entreprisesAvecJournees.map(entreprise => {
                      // ✅ Définition correcte de journeesEntreprise dans ce contexte
                      const journeesEntreprise = journees.filter(j =>
                        j.entrepriseId === entreprise.id &&
                        new Date(j.date).getMonth() === selectedDate.getMonth()
                      );
                      let totalMinutes = 0;
                      journeesEntreprise.forEach(j => {
                        const [h1, m1] = j.heurePriseService.split(':').map(Number);
                        const [h2, m2] = j.heureFinService.split(':').map(Number);
                        let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
                        if (j.heureDepartPause && j.heureReprise) {
                          const [ph, pm] = j.heureDepartPause.split(':').map(Number);
                          const [rh, rm] = j.heureReprise.split(':').map(Number);
                          mins -= (rh * 60 + rm) - (ph * 60 + pm);
                        }
                        totalMinutes += mins;
                      });
                      const heures = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      const entrepriseClass = getEntrepriseClass(entreprise.id);
                      return (
                        <div key={entreprise.id} className={`entreprise-recap ${entrepriseClass}`} style={{ borderLeftColor: entreprise.couleur || '#555' }}>
                          <strong>{entreprise.nom}</strong>
                          <div>Jours: {journeesEntreprise.length} | Heures: {heures}h{minutes > 0 ? ` ${minutes}min` : ''} ({(totalMinutes / 60).toFixed(2)}h)</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      case 'Semaines':
        return (
          <div className="semaines-container">
            <h2>Semaines à venir</h2>
            <SemaineView dateDebut={getStartOfWeek(new Date())} onDeleteJournee={handleDeleteJournee} title="Semaine en cours" />
            <SemaineView dateDebut={getStartOfWeek(new Date(new Date().setDate(new Date().getDate() + 7)))} onDeleteJournee={handleDeleteJournee} title="Semaine prochaine" />
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
            date={new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]}
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
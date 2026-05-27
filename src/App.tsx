// src/App.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { calculerMinutesJournee, formatDureeHHMM } from './utils/calculs';
import type { Journee, Entreprise, Tour, Saison } from './types';

type Tab = 'Planning' | 'Semaines' | 'Récap' | 'Entreprises' | 'Saisons' | 'Tours';

const TABS: Tab[] = ['Planning', 'Semaines', 'Récap', 'Entreprises', 'Saisons', 'Tours'];

// ────── Helpers ──────

const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

// ────── Composant SemaineView (extrait de App) ──────

type SemaineViewProps = {
  dateDebut: Date;
  title: string;
  journees: Journee[];
  entreprises: Entreprise[];
  onEdit: (journee: Journee) => void;
  onDelete: (id: string) => void;
};

const SemaineView = ({ dateDebut, title, journees, entreprises, onEdit, onDelete }: SemaineViewProps) => {
  const jours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(dateDebut);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getJourneeForDate = (date: Date) =>
    journees.find(j => j.date === toLocalDateStr(date));

  const journeesSemaine = jours.map(getJourneeForDate).filter(Boolean) as Journee[];

  const minutesSemaine = journeesSemaine.reduce((acc, j) => acc + calculerMinutesJournee(j), 0);

  const entreprisesStats = useMemo(() => {
    const map: Record<string, { jours: number; minutes: number }> = {};
    for (const j of journeesSemaine) {
      if (!map[j.entrepriseId]) map[j.entrepriseId] = { jours: 0, minutes: 0 };
      map[j.entrepriseId].jours++;
      map[j.entrepriseId].minutes += calculerMinutesJournee(j);
    }
    return map;
  }, [journeesSemaine]);

  const getEntreprise = (id: string) => entreprises.find(e => e.id === id);

  return (
    <div className="semaine-view">
      <h3>{title}</h3>
      <div className="semaine-jours">
        {jours.map(date => {
          const journee = getJourneeForDate(date);
          const dateStr = toLocalDateStr(date);
          const jourLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
          const entreprise = journee ? getEntreprise(journee.entrepriseId) : null;
          const minutes = journee ? calculerMinutesJournee(journee) : 0;

          return (
            <div key={dateStr} className={`semaine-jour${journee ? ` has-journee` : ''}`}>
              <div className="semaine-jour-header">
                <strong style={{ textTransform: 'capitalize' }}>{jourLabel}</strong>
              </div>
              {journee ? (
                <div
                  className="journee-card semaine-journee-card"
                  style={{ borderLeftColor: entreprise?.couleur ?? '#555' }}
                >
                  <div className="journee-card-header">
                    {entreprise?.logo && (
                      <img src={entreprise.logo} alt="" className="entreprise-logo" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <strong>{entreprise?.nom ?? 'Entreprise'}</strong>
                    <span>{journee.role}</span>
                  </div>
                  <div className="journee-card-info">
                    <div>⏰ {journee.heurePriseService} – {journee.heureFinService}</div>
                    <div>{formatDureeHHMM(minutes)} ({(minutes / 60).toFixed(2)}h)</div>
                  </div>
                  <div className="journee-card-actions">
                    <button className="edit-button" onClick={() => onEdit(journee)}>✏️</button>
                    <button className="delete-button" onClick={() => onDelete(journee.id)}>🗑️</button>
                  </div>
                </div>
              ) : (
                <div className="journee-card journee-non-travaillee semaine-journee-card">
                  <div className="journee-card-header"><strong>En repos</strong></div>
                  <div>—</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="week-recap">
        <h4>Récapitulatif de la semaine</h4>
        <div className="stat-box">
          <span>Jours travaillés :</span>
          <strong>{journeesSemaine.length}</strong>
        </div>
        <div className="stat-box">
          <span>Heures totales :</span>
          <strong>{formatDureeHHMM(minutesSemaine)} ({(minutesSemaine / 60).toFixed(2)}h)</strong>
        </div>
        <h4 style={{ marginTop: '12px' }}>Par entreprise</h4>
        {Object.keys(entreprisesStats).length > 0 ? (
          Object.entries(entreprisesStats).map(([id, stats]) => {
            const e = getEntreprise(id);
            if (!e) return null;
            return (
              <div key={id} className="entreprise-recap" style={{ borderLeftColor: e.couleur ?? '#555' }}>
                <strong>{e.nom}</strong>
                <div>Jours : {stats.jours} | {formatDureeHHMM(stats.minutes)} ({(stats.minutes / 60).toFixed(2)}h)</div>
              </div>
            );
          })
        ) : (
          <p style={{ color: '#aaa' }}>Aucune journée cette semaine.</p>
        )}
      </div>
    </div>
  );
};

// ────── App ──────

function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journees, setJournees] = useState<Journee[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [showJourneeForm, setShowJourneeForm] = useState(false);
  const [journeeToEdit, setJourneeToEdit] = useState<Journee | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Planning');
  const [rdtpmId, setRdtpmId] = useState<string>(localStorage.getItem('RDTPM_ID') ?? '');

  // Rafraîchit toutes les données
  const refreshAllData = useCallback(async () => {
    const [entreprisesData, toursData, saisonsData] = await Promise.all([
      getEntreprises(),
      getTours(),
      getSaisons(),
    ]);
    setEntreprises(entreprisesData);
    setTours(toursData);
    setSaisons(saisonsData);

    const rdtpm = entreprisesData.find(e => e.nom === 'RDTPM');
    if (rdtpm?.id && rdtpm.id !== rdtpmId) {
      setRdtpmId(rdtpm.id);
      localStorage.setItem('RDTPM_ID', rdtpm.id);
    }
  }, [rdtpmId]);

  // Charge les journées du mois affiché
  const loadJourneesForMonth = useCallback(async (date: Date) => {
    const journeesData = await getJourneesParMois(date.getFullYear(), date.getMonth() + 1);
    setJournees(journeesData);
  }, []);

  useEffect(() => { refreshAllData(); }, []);
  useEffect(() => { loadJourneesForMonth(selectedDate); }, [selectedDate]);

  // Sync rdtpmId si les entreprises changent
  useEffect(() => {
    const rdtpm = entreprises.find(e => e.nom === 'RDTPM');
    if (rdtpm?.id && rdtpm.id !== rdtpmId) {
      setRdtpmId(rdtpm.id);
      localStorage.setItem('RDTPM_ID', rdtpm.id);
    }
  }, [entreprises]);

  const getEntrepriseCouleur = useCallback((id: string) =>
    entreprises.find(e => e.id === id)?.couleur ?? '#555',
    [entreprises]
  );

  const getEntrepriseClass = useCallback((id: string) =>
    entreprises.find(e => e.id === id)?.nom.toLowerCase().replace(/\s+/g, '-') ?? '',
    [entreprises]
  );

  const handleDeleteJournee = useCallback(async (journeeId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette journée ?')) return;
    await supprimerJournee(journeeId);
    await loadJourneesForMonth(selectedDate);
  }, [selectedDate, loadJourneesForMonth]);

  const handleEditJournee = useCallback((journee: Journee) => {
    setJourneeToEdit(journee);
    setShowJourneeForm(true);
  }, []);

  // Journées du mois courant pour le récap
  const journeesDuMois = useMemo(() =>
    journees.filter(j => {
      const d = new Date(j.date + 'T12:00:00');
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    }),
    [journees, selectedDate]
  );

  const journeesDuJour = useMemo(() =>
    journees.filter(j => j.date === toLocalDateStr(selectedDate)),
    [journees, selectedDate]
  );

  // ────── Onglets ──────

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
                onChange={date => setSelectedDate(date as Date)}
                value={selectedDate}
                locale="fr-FR"
                tileClassName={({ date, view }) => {
                  if (view !== 'month') return null;
                  const journee = journees.find(j => j.date === toLocalDateStr(date));
                  if (!journee) return null;
                  const e = entreprises.find(en => en.id === journee.entrepriseId);
                  return e ? `calendar-tile-${e.nom.toLowerCase().replace(/\s+/g, '-')}` : null;
                }}
                className="react-calendar-custom"
              />
            </div>

            <h3>Journée du {selectedDate.toLocaleDateString('fr-FR')}</h3>

            {journeesDuJour.length > 0 ? journeesDuJour.map(journee => {
              const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
              const tour = journee.tourId ? tours.find(t => t.id === journee.tourId) : null;
              const minutes = calculerMinutesJournee(journee);
              return (
                <div key={journee.id} className={`journee-card ${getEntrepriseClass(journee.entrepriseId)}`} style={{ borderLeftColor: getEntrepriseCouleur(journee.entrepriseId) }}>
                  <div className="journee-card-header">
                    {entreprise?.logo && <img src={entreprise.logo} alt="" className="entreprise-logo" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <strong>{entreprise?.nom ?? 'Entreprise'}</strong>
                    <span>{journee.role}</span>
                    {tour && <span> – Tour {tour.numero}</span>}
                    {journee.lignesDestinations?.length && (
                      <span> – {journee.lignesDestinations.join(', ')}</span>
                    )}
                  </div>
                  <div className="journee-card-info">
                    <div>⏰ {journee.heurePriseService} – {journee.heureFinService}
                      {journee.heureDepartPause && ` | Pause : ${journee.heureDepartPause} – ${journee.heureReprise}`}
                    </div>
                    <div>{formatDureeHHMM(minutes)} ({(minutes / 60).toFixed(2)}h)</div>
                    {journee.notes && <div>📝 {journee.notes}</div>}
                  </div>
                  <div className="journee-card-actions">
                    <button className="edit-button" onClick={() => handleEditJournee(journee)}>✏️</button>
                    <button className="delete-button" onClick={() => handleDeleteJournee(journee.id)}>🗑️</button>
                  </div>
                </div>
              );
            }) : (
              <div className="journee-card journee-non-travaillee">
                <div className="journee-card-header"><strong>Journée non travaillée</strong></div>
              </div>
            )}

            {/* Récap mensuel */}
            <div className="month-recap">
              <h3>Récapitulatif — {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
              <div className="stat-box">
                <span>Jours travaillés :</span>
                <strong>{journeesDuMois.length}</strong>
              </div>
              <div className="stat-box">
                <span>Heures totales :</span>
                <strong>
                  {(() => {
                    const total = journeesDuMois.reduce((acc, j) => acc + calculerMinutesJournee(j), 0);
                    return `${formatDureeHHMM(total)} (${(total / 60).toFixed(2)}h)`;
                  })()}
                </strong>
              </div>
              <h4>Par entreprise</h4>
              {entreprises
                .filter(e => journeesDuMois.some(j => j.entrepriseId === e.id))
                .map(entreprise => {
                  const jMois = journeesDuMois.filter(j => j.entrepriseId === entreprise.id);
                  const total = jMois.reduce((acc, j) => acc + calculerMinutesJournee(j), 0);
                  return (
                    <div key={entreprise.id} className={`entreprise-recap ${getEntrepriseClass(entreprise.id)}`} style={{ borderLeftColor: entreprise.couleur ?? '#555' }}>
                      <strong>{entreprise.nom}</strong>
                      <div>Jours : {jMois.length} | {formatDureeHHMM(total)} ({(total / 60).toFixed(2)}h)</div>
                    </div>
                  );
                })}
            </div>
          </div>
        );

      case 'Semaines': {
        const debutSemaine = getStartOfWeek(new Date());
        const debutSemaineSuivante = new Date(debutSemaine);
        debutSemaineSuivante.setDate(debutSemaineSuivante.getDate() + 7);
        return (
          <div className="semaines-container">
            <h2>Semaines</h2>
            <SemaineView dateDebut={debutSemaine} title="Semaine en cours" journees={journees} entreprises={entreprises} onEdit={handleEditJournee} onDelete={handleDeleteJournee} />
            <SemaineView dateDebut={debutSemaineSuivante} title="Semaine prochaine" journees={journees} entreprises={entreprises} onEdit={handleEditJournee} onDelete={handleDeleteJournee} />
          </div>
        );
      }

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
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="main-content">
        {renderTabContent()}

        {showJourneeForm && (
          <JourneeForm
            onClose={() => { setShowJourneeForm(false); setJourneeToEdit(null); }}
            onJourneeAjoutee={async () => { await loadJourneesForMonth(selectedDate); }}
            date={toLocalDateStr(selectedDate)}
            journeeToEdit={journeeToEdit}
            entreprises={entreprises}
            tours={tours}
            saisons={saisons}
            rdtpmId={rdtpmId}
            setTours={setTours}
          />
        )}
      </div>
    </div>
  );
}

export default App;

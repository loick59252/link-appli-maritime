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
import { useAppDialog } from './components/AppDialog';
import { calculerMinutesJournee, formatDureeHHMM } from './utils/calculs';
import { estJourneeTravaillee, getConfigStatutJournee } from './utils/statutsJournee';
import type { Journee, Entreprise, Tour, Saison } from './types';

type Tab = 'Planning' | 'Semaines' | 'RÃ©cap' | 'Entreprises';
type EntrepriseSubTab = 'Liste' | 'Saisons' | 'Tours';

const TABS: Tab[] = ['Planning', 'Semaines', 'RÃ©cap', 'Entreprises'];
const ENTREPRISE_SUB_TABS: EntrepriseSubTab[] = ['Liste', 'Saisons', 'Tours'];

// â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€

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

const getMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const hexToRgba = (hex: string | undefined, opacity: number): string | undefined => {
  if (!hex) return undefined;
  const normalized = hex.replace('#', '');
  if (!/^[\dA-Fa-f]{6}$/.test(normalized)) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// â”€â”€â”€â”€â”€â”€ Composant SemaineView (extrait de App) â”€â”€â”€â”€â”€â”€

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
  const journeesTravailleesSemaine = journeesSemaine.filter(estJourneeTravaillee);

  const minutesSemaine = journeesTravailleesSemaine.reduce((acc, j) => acc + calculerMinutesJournee(j), 0);

  const entreprisesStats = useMemo(() => {
    const map: Record<string, { jours: number; minutes: number }> = {};
    for (const j of journeesTravailleesSemaine) {
      if (!map[j.entrepriseId]) map[j.entrepriseId] = { jours: 0, minutes: 0 };
      map[j.entrepriseId].jours++;
      map[j.entrepriseId].minutes += calculerMinutesJournee(j);
    }
    return map;
  }, [journeesTravailleesSemaine]);

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
          const isTravail = journee ? estJourneeTravaillee(journee) : false;
          const statutConfig = journee ? getConfigStatutJournee(journee) : null;

          return (
            <div
              key={dateStr}
              className={`semaine-jour${journee ? ' has-journee' : ''}`}
              style={journee ? {
                backgroundColor: hexToRgba(entreprise?.couleur, 0.16),
                borderColor: entreprise?.couleur ?? '#555',
              } : undefined}
            >
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
                    {isTravail ? (
                      <>
                        <strong>{entreprise?.nom ?? 'Entreprise'}</strong>
                        <span>{journee.role}</span>
                      </>
                    ) : (
                      <strong>{statutConfig?.icone} {statutConfig?.label}</strong>
                    )}
                  </div>
                  <div className="journee-card-info">
                    <div>{isTravail ? `${journee.heurePriseService} - ${journee.heureFinService}` : journee.notes || 'Journee non travaillee'}</div>
                    {isTravail && <div>{formatDureeHHMM(minutes)} ({(minutes / 60).toFixed(2)}h)</div>}
                  </div>
                  <div className="journee-card-actions">
                    <button className="edit-button" onClick={() => onEdit(journee)}>âœï¸</button>
                    <button className="delete-button" onClick={() => onDelete(journee.id)}>ðŸ—‘ï¸</button>
                  </div>
                </div>
              ) : (
                <div className="journee-card journee-non-travaillee semaine-journee-card">
                  <div className="journee-card-header"><strong>En repos</strong></div>
                  <div>â€”</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="week-recap">
        <h4>RÃ©capitulatif de la semaine</h4>
        <div className="stat-box">
          <span>Jours travaillÃ©s :</span>
          <strong>{journeesTravailleesSemaine.length}</strong>
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
          <p style={{ color: '#aaa' }}>Aucune journÃ©e cette semaine.</p>
        )}
      </div>
    </div>
  );
};

// â”€â”€â”€â”€â”€â”€ App â”€â”€â”€â”€â”€â”€

function App() {
  const { confirm } = useAppDialog();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [journees, setJournees] = useState<Journee[]>([]);
  const [journeesSemaines, setJourneesSemaines] = useState<Journee[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [showJourneeForm, setShowJourneeForm] = useState(false);
  const [journeeToEdit, setJourneeToEdit] = useState<Journee | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Planning');
  const [activeEntrepriseSubTab, setActiveEntrepriseSubTab] = useState<EntrepriseSubTab>('Liste');
  const [rdtpmId, setRdtpmId] = useState<string>(localStorage.getItem('RDTPM_ID') ?? '');

  // RafraÃ®chit toutes les donnÃ©es
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

  // Charge les journÃ©es du mois affichÃ©
  const loadJourneesForMonth = useCallback(async (date: Date) => {
    const journeesData = await getJourneesParMois(date.getFullYear(), date.getMonth() + 1);
    setJournees(journeesData);
  }, []);

  const loadJourneesForWeeks = useCallback(async () => {
    const debutSemaine = getStartOfWeek(new Date());
    const moisACharger = new Map<string, Date>();

    for (let i = 0; i < 14; i++) {
      const date = new Date(debutSemaine);
      date.setDate(date.getDate() + i);
      moisACharger.set(getMonthKey(date), date);
    }

    const journeesParMois = await Promise.all(
      [...moisACharger.values()].map(date =>
        getJourneesParMois(date.getFullYear(), date.getMonth() + 1)
      )
    );

    const uniques = new Map<string, Journee>();
    journeesParMois.flat().forEach(journee => uniques.set(journee.id, journee));
    setJourneesSemaines([...uniques.values()]);
  }, []);

  useEffect(() => { refreshAllData(); }, []);
  useEffect(() => { loadJourneesForMonth(selectedDate); }, [selectedDate]);
  useEffect(() => { loadJourneesForWeeks(); }, [loadJourneesForWeeks]);

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

  const handleDeleteJournee = useCallback(async (journeeId: string) => {
    const shouldDelete = await confirm('ÃŠtes-vous sÃ»r de vouloir supprimer cette journÃ©e ?', {
      title: 'Supprimer la journÃ©e',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!shouldDelete) return;
    await supprimerJournee(journeeId);
    await Promise.all([
      loadJourneesForMonth(selectedDate),
      loadJourneesForWeeks(),
    ]);
  }, [confirm, selectedDate, loadJourneesForMonth, loadJourneesForWeeks]);

  const handleEditJournee = useCallback((journee: Journee) => {
    setJourneeToEdit(journee);
    setShowJourneeForm(true);
  }, []);

  // JournÃ©es du mois courant pour le rÃ©cap
  const journeesDuMois = useMemo(() =>
    journees.filter(j => {
      const d = new Date(j.date + 'T12:00:00');
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    }),
    [journees, selectedDate]
  );

  const journeesTravailleesDuMois = useMemo(
    () => journeesDuMois.filter(estJourneeTravaillee),
    [journeesDuMois]
  );

  const journeesDuJour = useMemo(() =>
    journees.filter(j => j.date === toLocalDateStr(selectedDate)),
    [journees, selectedDate]
  );

  const getJourneeCalendarInfo = useCallback((date: Date) => {
    const journee = journees.find(j => j.date === toLocalDateStr(date));
    const entreprise = journee ? entreprises.find(e => e.id === journee.entrepriseId) : null;
    return { journee, entreprise };
  }, [journees, entreprises]);

  // â”€â”€â”€â”€â”€â”€ Onglets â”€â”€â”€â”€â”€â”€

  const renderTabContent = () => {
    switch (activeTab) {
      case 'RÃ©cap':
        return <RecapTab journees={journees} entreprises={entreprises} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;

      case 'Planning':
        return (
          <div className="planning-container">
            <h2>Planning Maritime</h2>
            <button className="add-journee-button" onClick={() => { setJourneeToEdit(null); setShowJourneeForm(true); }}>
              Ajouter une journÃ©e
            </button>

            <div className="calendar-container">
              <Calendar
                onChange={date => setSelectedDate(date as Date)}
                value={selectedDate}
                locale="fr-FR"
                tileClassName={({ date, view }) => {
                  if (view !== 'month') return null;
                  const { journee } = getJourneeCalendarInfo(date);
                  if (!journee) return null;
                  return 'calendar-tile-has-journee';
                }}
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const { entreprise } = getJourneeCalendarInfo(date);
                  if (!entreprise) return null;
                  return (
                    <span
                      className="calendar-day-color"
                      style={{
                        backgroundColor: hexToRgba(entreprise.couleur, 0.22) ?? 'rgba(85, 85, 85, 0.22)',
                        borderColor: entreprise.couleur ?? '#555',
                      }}
                      aria-hidden="true"
                    />
                  );
                }}
                className="react-calendar-custom"
              />
            </div>

            <h3>JournÃ©e du {selectedDate.toLocaleDateString('fr-FR')}</h3>

            {journeesDuJour.length > 0 ? journeesDuJour.map(journee => {
              const entreprise = entreprises.find(e => e.id === journee.entrepriseId);
              const tour = journee.tourId ? tours.find(t => t.id === journee.tourId) : null;
              const minutes = calculerMinutesJournee(journee);
              const isTravail = estJourneeTravaillee(journee);
              const statutConfig = getConfigStatutJournee(journee);
              return (
                <div key={journee.id} className="journee-card" style={{ borderLeftColor: getEntrepriseCouleur(journee.entrepriseId) }}>
                  <div className="journee-card-header">
                    {entreprise?.logo && <img src={entreprise.logo} alt="" className="entreprise-logo" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    {isTravail ? (
                      <>
                        <strong>{entreprise?.nom ?? 'Entreprise'}</strong>
                        <span>{journee.role}</span>
                      </>
                    ) : (
                      <strong>{statutConfig.icone} {statutConfig.label}</strong>
                    )}
                    {isTravail && tour && <span> - Tour {tour.numero}</span>}
                    {isTravail && journee.lignesDestinations?.length && (
                      <span> - {journee.lignesDestinations.join(', ')}</span>
                    )}
                  </div>
                  <div className="journee-card-info">
                    {isTravail ? (
                      <>
                        <div>{journee.heurePriseService} - {journee.heureFinService}{journee.heureDepartPause && ` | Pause : ${journee.heureDepartPause} - ${journee.heureReprise}`}</div>
                        <div>{formatDureeHHMM(minutes)} ({(minutes / 60).toFixed(2)}h)</div>
                      </>
                    ) : (
                      <div>{journee.notes || 'Journee non travaillee'}</div>
                    )}
                    {isTravail && journee.notes && <div>{journee.notes}</div>}
                  </div>
                  <div className="journee-card-actions">
                    <button className="edit-button" onClick={() => handleEditJournee(journee)}>âœï¸</button>
                    <button className="delete-button" onClick={() => handleDeleteJournee(journee.id)}>ðŸ—‘ï¸</button>
                  </div>
                </div>
              );
            }) : (
              <div className="journee-card journee-non-travaillee">
                <div className="journee-card-header"><strong>JournÃ©e non travaillÃ©e</strong></div>
              </div>
            )}

            {/* RÃ©cap mensuel */}
            <div className="month-recap">
              <h3>RÃ©capitulatif â€” {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
              <div className="stat-box">
                <span>Jours travaillÃ©s :</span>
                <strong>{journeesTravailleesDuMois.length}</strong>
              </div>
              <div className="stat-box">
                <span>Heures totales :</span>
                <strong>
                  {(() => {
                    const total = journeesTravailleesDuMois.reduce((acc, j) => acc + calculerMinutesJournee(j), 0);
                    return `${formatDureeHHMM(total)} (${(total / 60).toFixed(2)}h)`;
                  })()}
                </strong>
              </div>
              <h4>Par entreprise</h4>
              {entreprises
                .filter(e => journeesTravailleesDuMois.some(j => j.entrepriseId === e.id))
                .map(entreprise => {
                  const jMois = journeesTravailleesDuMois.filter(j => j.entrepriseId === entreprise.id);
                  const total = jMois.reduce((acc, j) => acc + calculerMinutesJournee(j), 0);
                  return (
                    <div key={entreprise.id} className="entreprise-recap" style={{ borderLeftColor: entreprise.couleur ?? '#555' }}>
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
            <SemaineView dateDebut={debutSemaine} title="Semaine en cours" journees={journeesSemaines} entreprises={entreprises} onEdit={handleEditJournee} onDelete={handleDeleteJournee} />
            <SemaineView dateDebut={debutSemaineSuivante} title="Semaine prochaine" journees={journeesSemaines} entreprises={entreprises} onEdit={handleEditJournee} onDelete={handleDeleteJournee} />
          </div>
        );
      }

      case 'Entreprises':
        return (
          <div className="entreprises-section">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
              {ENTREPRISE_SUB_TABS.map(tab => (
                <button
                  key={tab}
                  className={`tab-button ${activeEntrepriseSubTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveEntrepriseSubTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {activeEntrepriseSubTab === 'Liste' && (
              <EntrepriseList entreprises={entreprises} onEntreprisesUpdated={refreshAllData} rdtpmId={rdtpmId} setRdtpmId={setRdtpmId} />
            )}
            {activeEntrepriseSubTab === 'Saisons' && (
              <SaisonsList saisons={saisons} tours={tours} entreprises={entreprises} onSaisonsUpdated={refreshAllData} />
            )}
            {activeEntrepriseSubTab === 'Tours' && (
              <ToursList tours={tours} saisons={saisons} onToursUpdated={refreshAllData} entreprises={entreprises} />
            )}
          </div>
        );

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
            onJourneeAjoutee={async () => {
              await Promise.all([
                loadJourneesForMonth(selectedDate),
                loadJourneesForWeeks(),
              ]);
            }}
            date={toLocalDateStr(selectedDate)}
            journeeToEdit={journeeToEdit}
            entreprises={entreprises}
            tours={tours}
            saisons={saisons}
          />
        )}
      </div>
    </div>
  );
}

export default App;

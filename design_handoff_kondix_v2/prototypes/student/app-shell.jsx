// Student App Shell — mini-router con bottom nav.
// Props: variant = 'hero' | 'minimal' | 'ritual' (solo afecta al Home)

const { useState: useStateA, useEffect: useEffectA, useCallback: useCallbackA, useMemo: useMemoA } = React;

const TABS = [
  { key: 'home', label: 'Hoy', icon: 'home' },
  { key: 'calendar', label: 'Calendario', icon: 'calendar' },
  { key: 'progress', label: 'Progreso', icon: 'trendingUp' },
  { key: 'profile', label: 'Perfil', icon: 'user' },
];

const StudentApp = ({ variant = 'hero', initialScreen = 'home', showActiveBanner = false, id }) => {
  const [screen, setScreen] = useStateA(initialScreen);
  const [params, setParams] = useStateA({});
  const [toast, setToast] = useStateA(null);
  // completed: { 'eid:sid': {weight, reps, isPR, note?} }
  // exerciseFeedback: { eid: { rpe, note } }
  // sessionFeedback: { mood, note }
  // recoveringFrom: ISO date string or null — when set, este entreno recupera ese día
  const [exerciseState, setExerciseState] = useStateA({
    exIndex: 0, completed: {},
    exerciseFeedback: {}, sessionFeedback: { mood: null, note: '' },
    recoveringFrom: null,
  });
  const [hasActive, setHasActive] = useStateA(showActiveBanner);

  const nav = useCallbackA((next, p = {}) => {
    setParams(p);
    setScreen(next);
  }, []);

  const pushToast = useCallbackA((t) => setToast(t), []);

  // startWorkout({ recoveringFrom: '2025-11-14' }) o startWorkout() para hoy
  const startWorkout = useCallbackA((opts = {}) => {
    setExerciseState({
      exIndex: 0, completed: {},
      exerciseFeedback: {}, sessionFeedback: { mood: null, note: '' },
      recoveringFrom: opts.recoveringFrom || null,
    });
    setHasActive(true);
    nav('overview');
  }, [nav]);

  const enterExecute = () => {
    nav('execute');
    // auto PR demo: if variant hero, show toast after 1.5s
    setTimeout(() => {
      if (variant === 'hero' && screen !== 'execute') return; // guard
    }, 0);
  };

  const finishWorkout = () => {
    setHasActive(false);
    nav('complete');
  };

  // Rutina actualmente activa: si estás recuperando, la rutina del día perdido; si no, la de hoy
  const activeRoutine = useMemoA(() => {
    if (exerciseState.recoveringFrom) {
      const sess = DS.SESSIONS.find(s => s.date === exerciseState.recoveringFrom);
      if (sess?.routineId === 'r-legs') return DS.LEGS_ROUTINE;
      return { ...DS.TODAY_ROUTINE, name: sess?.routineName || DS.TODAY_ROUTINE.name };
    }
    return DS.TODAY_ROUTINE;
  }, [exerciseState.recoveringFrom]);
  const navActive = ['home','calendar','progress','profile'].includes(screen) ? screen : null;
  const hideBottomNav = ['execute', 'complete'].includes(screen);

  // ensure active tab routes to correct tab
  const handleTab = (k) => {
    if (k === 'home') setScreen('home');
    else setScreen(k);
  };

  const screenContent = (() => {
    switch (screen) {
      case 'home':       return <HomeScreen variant={variant} nav={nav} onStartToday={startWorkout} hasActiveSession={hasActive} />;
      case 'calendar':   return <CalendarScreen nav={nav} />;
      case 'dayDetail':  return <DayDetailScreen date={params.date || DS.TODAY_DATE} nav={nav} onStart={startWorkout} />;
      case 'overview':   return <OverviewScreen routine={activeRoutine} recoveringFrom={exerciseState.recoveringFrom} nav={nav} onStart={enterExecute} />;
      case 'execute':    return <ExecuteScreen routine={activeRoutine} recoveringFrom={exerciseState.recoveringFrom} state={exerciseState} setState={setExerciseState} nav={nav} onFinish={finishWorkout} pushToast={pushToast} />;
      case 'complete':   return <CompleteScreen routine={activeRoutine} recoveringFrom={exerciseState.recoveringFrom} state={exerciseState} setState={setExerciseState} nav={nav} />;
      case 'progress':   return <ProgressScreen nav={nav} />;
      case 'profile':    return <ProfileScreen nav={nav} />;
      default:           return null;
    }
  })();

  // execute = layout especial: pantalla maneja su propio scroll para que sticky CTA quede fijo al viewport del frame
  const isExecuteLayout = screen === 'execute';

  const SCREEN_LABELS = {
    home: 'Alumno · Home',
    calendar: 'Alumno · Calendario',
    dayDetail: 'Alumno · Detalle de día',
    overview: 'Alumno · Vista previa rutina',
    execute: 'Alumno · Logging',
    complete: 'Alumno · Entreno completado',
    progress: 'Alumno · Progreso',
    profile: 'Alumno · Perfil',
  };

  return (
    <div data-screen-label={SCREEN_LABELS[screen] || `Alumno · ${screen}`} style={{
      width: '100%', height: '100%', background: 'var(--color-bg)',
      color: 'var(--color-text)', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {isExecuteLayout ? (
        // execute renderiza directo sin scroll wrapper externo
        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {screenContent}
        </div>
      ) : (
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
          paddingBottom: hideBottomNav ? 16 : 80,
          scrollbarWidth: 'none',
        }} className="scroll-thin">
          <style>{`.scroll-thin::-webkit-scrollbar { display: none; }`}</style>
          {screenContent}
        </div>
      )}

      {/* active session banner (only on tabs, not execute/complete) */}
      {hasActive && !hideBottomNav && screen !== 'overview' && (
        <KActiveSessionBanner
          routineName={activeRoutine.name}
          completedSets={Object.keys(exerciseState.completed).length}
          totalSets={activeRoutine.exercises.reduce((a, e) => a + e.sets.length, 0)}
          onResume={() => nav('execute')}
          isRecovery={!!exerciseState.recoveringFrom}
        />
      )}

      {/* bottom nav */}
      {!hideBottomNav && (
        <KBottomNav tabs={TABS} active={navActive} onTab={handleTab} />
      )}

      {/* Toast */}
      <KToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};

window.StudentApp = StudentApp;

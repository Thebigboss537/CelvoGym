// Main app — wires routine state, sidebar, day panel. Mobile-aware.

function App({ embedded, routine: externalRoutine, onRoutineChange }) {
  const controlled = externalRoutine != null;
  const [internalRoutine, setInternalRoutine] = React.useState(() => {
    if (controlled) return externalRoutine;
    try {
      const saved = localStorage.getItem('kondix-routine-v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return seedRoutine();
  });
  const routine = controlled ? externalRoutine : internalRoutine;
  const setRoutine = (updater) => {
    if (controlled) {
      const next = typeof updater === 'function' ? updater(externalRoutine) : updater;
      onRoutineChange?.(next);
    } else {
      setInternalRoutine(updater);
    }
  };

  const [activeDayId, setActiveDayId] = React.useState(routine.days[0]?.id);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 860);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [confirm, confirmDialog] = useConfirm();

  React.useEffect(() => {
    if (!controlled) localStorage.setItem('kondix-routine-v2', JSON.stringify(routine));
  }, [routine, controlled]);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const patch = (p) => setRoutine(r => ({ ...r, ...p }));
  const activeDay = routine.days.find(d => d.id === activeDayId) || routine.days[0];

  const patchDay = (id, nd) => patch({ days: routine.days.map(d => d.id === id ? nd : d) });

  const addDay = () => {
    const nd = newDay(`Día ${routine.days.length + 1}`);
    patch({ days: [...routine.days, nd] });
    setActiveDayId(nd.id);
    if (isMobile) setMobileDrawerOpen(false);
  };

  const deleteDay = (id) => {
    if (routine.days.length <= 1) return;
    const day = routine.days.find(d => d.id === id);
    confirm({
      title: 'Eliminar día',
      message: `¿Eliminar "${day?.name || 'este día'}" y todos sus ejercicios? Esta acción no se puede deshacer.`,
      onConfirm: () => {
        const idx = routine.days.findIndex(d => d.id === id);
        const nextDays = routine.days.filter(d => d.id !== id);
        patch({ days: nextDays });
        if (activeDayId === id) setActiveDayId(nextDays[Math.max(0, idx - 1)].id);
      },
    });
  };

  const reorderDays = (from, to) => {
    const days = [...routine.days];
    const [m] = days.splice(from, 1);
    days.splice(to, 0, m);
    patch({ days });
  };

  const routineWithPatch = { ...routine, _patch: patch };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: embedded ? '100%' : '100vh',
      width: embedded ? '100%' : '100vw',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header style={{
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 18px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        gap: 12,
      }}>
        {isMobile && !embedded && (
          <IconButton icon="menu" size="md" onClick={() => setMobileDrawerOpen(true)} />
        )}
        {!embedded && <>
          <KondixLogo size={18} />
          <span style={{ color: 'var(--color-border)', fontSize: 18, fontWeight: 200 }}>/</span>
        </>}
        {embedded && isMobile && (
          <IconButton icon="menu" size="md" onClick={() => setMobileDrawerOpen(true)} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="k-overline" style={{ color: 'var(--color-text-muted)', lineHeight: 1 }}>
            Rutinas · Editor
          </span>
          <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 140 : 360 }}>
            {routine.name}
          </span>
        </div>
        <span style={{ flex: 1 }} />
        {!isMobile && (
          <>
            <Button variant="ghost" size="sm" icon="eye">Vista alumno</Button>
            <Button variant="outline" size="sm" icon="users">Asignar</Button>
          </>
        )}
        <Button variant="primary" size="sm" icon="save">Guardar</Button>
      </header>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {!isMobile && (
          <DaysSidebar
            routine={routineWithPatch}
            activeDayId={activeDay?.id}
            onSelectDay={setActiveDayId}
            onReorder={reorderDays}
            onAddDay={addDay}
            onDeleteDay={deleteDay}
          />
        )}

        {isMobile && mobileDrawerOpen && (
          <>
            <div
              onClick={() => setMobileDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)', zIndex: 30,
              }}
            />
            <div style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: '85%', maxWidth: 320,
              background: 'var(--color-bg)',
              borderRight: '1px solid var(--color-border)',
              zIndex: 31,
              display: 'flex', flexDirection: 'column',
            }} className="k-slide-in-left">
              <DaysSidebar
                isMobile
                onMobileClose={() => setMobileDrawerOpen(false)}
                routine={routineWithPatch}
                activeDayId={activeDay?.id}
                onSelectDay={(id) => { setActiveDayId(id); setMobileDrawerOpen(false); }}
                onReorder={reorderDays}
                onAddDay={addDay}
                onDeleteDay={deleteDay}
              />
            </div>
          </>
        )}

        {/* Day content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--color-bg-deep)',
        }} className="scroll-thin">
          <div style={{
            maxWidth: 920,
            margin: '0 auto',
            padding: isMobile ? '20px 16px 120px' : '36px 48px 120px',
          }}>
            {activeDay && (
              <DayPanel
                key={activeDay.id}
                day={activeDay}
                onChange={(nd) => patchDay(activeDay.id, nd)}
                onDelete={() => deleteDay(activeDay.id)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom day nav */}
      {isMobile && routine.days.length > 1 && (
        <nav style={{
          flexShrink: 0,
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          display: 'flex',
          overflowX: 'auto',
          padding: '8px 12px',
          gap: 6,
        }} className="scroll-thin">
          {routine.days.map((d, i) => {
            const active = d.id === activeDayId;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDayId(d.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  background: active ? 'var(--color-primary)' : 'var(--color-card)',
                  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 8,
                  color: active ? '#fff' : 'var(--color-text-secondary)',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.8 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {d.name || 'Sin nombre'}
              </button>
            );
          })}
        </nav>
      )}
      {confirmDialog}
    </div>
  );
}

window.App = App;

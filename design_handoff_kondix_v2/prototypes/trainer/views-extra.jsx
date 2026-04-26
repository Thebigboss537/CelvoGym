// Placeholder views for unbuilt routes (Dashboard, Programs, Students) + app root wiring

function RoutinesView() {
  const [routines, setRoutines] = React.useState(() => {
    try {
      const saved = localStorage.getItem('kondix-routines-list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return seedRoutinesList();
  });
  const [editingId, setEditingId] = React.useState(null);
  const [confirm, confirmDialog] = useConfirm();

  React.useEffect(() => {
    try { localStorage.setItem('kondix-routines-list', JSON.stringify(routines)); } catch {}
  }, [routines]);

  if (editingId) {
    const routine = routines.find(r => r.id === editingId);
    if (!routine) { setEditingId(null); return null; }
    return (
      <RoutineEditorWrapper
        routine={routine}
        onBack={() => setEditingId(null)}
        onChange={(nr) => setRoutines(rs => rs.map(r => r.id === nr.id ? nr : r))}
      />
    );
  }

  const createRoutine = () => {
    const nr = seedRoutine();
    nr.id = uid('rt');
    nr.name = 'Nueva rutina';
    nr.description = '';
    nr.days = [newDay('Día 1')];
    nr.tags = [];
    nr.createdAt = new Date().toISOString();
    setRoutines([nr, ...routines]);
    setEditingId(nr.id);
  };

  const duplicateRoutine = (r) => {
    const nr = JSON.parse(JSON.stringify(r));
    nr.id = uid('rt');
    nr.name = r.name + ' (copia)';
    nr.createdAt = new Date().toISOString();
    setRoutines([nr, ...routines]);
  };

  const deleteRoutine = (r) => {
    confirm({
      title: 'Eliminar rutina',
      message: `¿Eliminar "${r.name}"? Se perderán todos los días y ejercicios. Esta acción no se puede deshacer.`,
      onConfirm: () => setRoutines(rs => rs.filter(x => x.id !== r.id)),
    });
  };

  return (
    <div style={{ padding: '28px 36px 120px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        overline="Plantillas"
        title="Rutinas"
        subtitle={`${routines.length} rutinas. Crea nuevas plantillas y asígnalas luego a tus estudiantes.`}
        actions={
          <Button variant="primary" icon="plus" onClick={createRoutine}>Crear rutina</Button>
        }
      />

      {routines.length === 0 ? (
        <EmptyState
          title="Aún no tienes rutinas"
          description="Crea tu primera rutina para empezar a asignarla a tus estudiantes."
          icon="clipboard"
          actionLabel="Crear rutina"
          onAction={createRoutine}
        />
      ) : (
        <div style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 14,
        }}>
          {routines.map(r => (
            <RoutineCard
              key={r.id}
              routine={r}
              onOpen={() => setEditingId(r.id)}
              onDuplicate={() => duplicateRoutine(r)}
              onDelete={() => deleteRoutine(r)}
            />
          ))}
        </div>
      )}

      {confirmDialog}
    </div>
  );
}

function RoutineEditorWrapper({ routine, onBack, onChange }) {
  // Wraps the App editor with a back button banner
  const [local, setLocal] = React.useState(routine);
  React.useEffect(() => { onChange(local); }, [local]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        flexShrink: 0,
        padding: '10px 18px',
        borderBottom: '1px solid var(--color-border-light)',
        background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Button variant="ghost" size="sm" icon="arrowLeft" onClick={onBack}>Volver a rutinas</Button>
        <span style={{ color: 'var(--color-border)' }}>·</span>
        <span className="k-overline">Editando</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <App embedded routine={local} onRoutineChange={setLocal} />
      </div>
    </div>
  );
}

function RoutineCard({ routine, onOpen, onDuplicate, onDelete }) {
  const [hover, setHover] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const days = routine.days?.length || 0;
  const totalExercises = (routine.days || []).reduce((a, d) => a + (d.groups || []).reduce((b, g) => b + (g.exercises?.length || 0), 0), 0);
  const category = routine.category || 'Otro';
  const catColor = {
    'Hipertrofia': '#E62639',
    'Fuerza': '#f59e0b',
    'Resistencia': '#22c55e',
    'Funcional': '#60a5fa',
    'Otro': '#78787f',
  }[category] || '#78787f';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${hover ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color .15s, transform .15s',
        transform: hover ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}
    >
      {/* Category strip */}
      <div style={{
        height: 80,
        background: `linear-gradient(135deg, ${catColor}22 0%, #0a0a0b 80%)`,
        position: 'relative',
        borderBottom: '1px solid var(--color-border-light)',
      }}>
        <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 6 }}>
          <Badge tone="primary" style={{ background: catColor + '30', color: catColor, borderColor: catColor + '55' }}>{category}</Badge>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <IconButton
            icon="more" size="sm"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          {menuOpen && (
            <>
              <div onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{
                position: 'absolute', right: 0, top: 32,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8, padding: 4, minWidth: 160,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 11,
              }} onClick={(e) => e.stopPropagation()}>
                <div onClick={() => { onDuplicate(); setMenuOpen(false); }} className="k-menu-item" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--color-text)',
                }}>
                  <Icon name="copy" size={13} />Duplicar
                </div>
                <div onClick={() => { onDelete(); setMenuOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--color-danger)',
                }}>
                  <Icon name="trash" size={13} />Eliminar
                </div>
              </div>
            </>
          )}
        </div>
        <div style={{
          position: 'absolute', bottom: 10, right: 14,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--color-text-muted)',
        }}>
          {String(days).padStart(2, '0')} DÍAS · {String(totalExercises).padStart(2, '0')} EJ
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', lineHeight: 1.15 }}>
          {routine.name}
        </div>
        {routine.description && (
          <p style={{
            fontSize: 12, color: 'var(--color-text-muted)',
            margin: '6px 0 0', lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {routine.description}
          </p>
        )}

        {routine.tags && routine.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
            {routine.tags.slice(0, 3).map(t => <Badge key={t} tone="outline">{t}</Badge>)}
          </div>
        )}

        <div style={{
          marginTop: 12, paddingTop: 10,
          borderTop: '1px solid var(--color-border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {routine.assignedCount ? `${routine.assignedCount} asignaciones` : 'Sin asignar'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: hover ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, transition: 'color .12s' }}>
            Editar<Icon name="arrowRight" size={11} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, icon, actionLabel, onAction }) {
  return (
    <div style={{
      marginTop: 40,
      background: 'var(--color-card)',
      border: '1px dashed var(--color-border)',
      borderRadius: 14,
      padding: '64px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: 'var(--color-primary-subtle)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon name={icon} size={22} style={{ color: 'var(--color-primary)' }} />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 420, margin: '10px auto 16px', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionLabel && <Button variant="primary" icon="plus" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

// Seed a small list of routines
function seedRoutinesList() {
  const base = seedRoutine();
  const tpl = (overrides) => ({ ...JSON.parse(JSON.stringify(base)), id: uid('rt'), createdAt: '2026-04-10', ...overrides });
  return [
    tpl({ name: 'Hipertrofia — Upper / Lower', description: 'Rutina de 4 días orientada a hipertrofia, volumen moderado con progresión semanal.', category: 'Hipertrofia', tags: ['8 semanas', 'Intermedio', '4 días/sem'], assignedCount: 4 }),
    tpl({ name: 'Fuerza 5x5', description: 'Fuerza básica, 3 días por semana. Progresión lineal simple sobre los 3 movimientos principales.', category: 'Fuerza', tags: ['12 semanas', 'Todos los niveles', '3 días/sem'], assignedCount: 2, days: base.days.slice(0, 2) }),
    tpl({ name: 'Full Body Principiante', description: 'Cuerpo completo, 3 días por semana. Énfasis en técnica y adaptación.', category: 'Funcional', tags: ['6 semanas', 'Principiante', '3 días/sem'], assignedCount: 1, days: base.days.slice(0, 1) }),
    tpl({ name: 'Push Pull Legs', description: 'Clásico PPL para ganar volumen. 6 días a la semana, alto volumen.', category: 'Hipertrofia', tags: ['10 semanas', 'Avanzado', '6 días/sem'], assignedCount: 0 }),
  ];
}

function DashboardView({ onNavigate }) {
  const students = React.useMemo(() => seedStudents(), []);
  const activity = React.useMemo(() => seedActivity(), []);
  const library = React.useMemo(() => seedLibrary(), []);
  const programs = React.useMemo(() => seedPrograms(), []);

  const activeStudents = students.filter(s => s.status === 'active');
  const avgAdherence = Math.round(activeStudents.reduce((a, s) => a + s.adherence, 0) / activeStudents.length);
  const totalSessionsWeek = students.reduce((a, s) => a + s.sessionsThisWeek, 0);
  const needAttention = students.filter(s => s.lastSessionDays >= 4 || s.adherence < 60);

  return (
    <div style={{ padding: '28px 36px 120px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        overline="Resumen"
        title="Dashboard"
        subtitle="Un vistazo rápido al estado de tus estudiantes y programas."
      />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 22 }}>
        <KpiCard label="Estudiantes activos" value={activeStudents.length} trend={`+2 este mes`} icon="users" />
        <KpiCard label="Adherencia media" value={`${avgAdherence}%`} trend="+4% vs mes pasado" icon="trendingUp" accent />
        <KpiCard label="Sesiones esta semana" value={totalSessionsWeek} trend={`Meta: ${activeStudents.length * 4}`} icon="clipboard" />
        <KpiCard label="Programas activos" value={programs.filter(p => p.status === 'active').length} trend={`${programs.length} totales`} icon="folder" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20, marginTop: 24 }} className="k-dash-grid">
        {/* Activity feed */}
        <section style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: 0, letterSpacing: '-0.02em' }}>Actividad reciente</h2>
            <Badge tone="primary">En vivo</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activity.map(a => {
              const student = students.find(s => s.id === a.studentId);
              const icon = a.type === 'pr' ? 'sparkles' : a.type === 'comment' ? 'note' : a.type === 'session_started' ? 'play' : 'clipboard';
              const color = a.type === 'pr' ? 'var(--color-warning)' : a.type === 'comment' ? 'var(--color-text-muted)' : 'var(--color-primary)';
              return (
                <div key={a.id} style={{ display: 'flex', gap: 12, padding: '10px 6px', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border-light)' }}>
                  <img src={student?.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text)' }}>
                      <strong style={{ fontWeight: 600 }}>{student?.name}</strong>
                      <span style={{ color: 'var(--color-text-muted)' }}>{' · '}{a.routine || 'PR'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>{a.detail}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Icon name={icon} size={13} style={{ color }} />
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{a.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Needs attention */}
        <section style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '18px 20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: '0 0 14px', letterSpacing: '-0.02em' }}>Requiere atención</h2>
          {needAttention.length === 0 ? (
            <div style={{ padding: 18, color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>Todo en orden ✓</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {needAttention.map(s => (
                <div key={s.id} style={{ display: 'flex', gap: 10, padding: 10, background: 'var(--color-bg-raised)', borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
                  <img src={s.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {s.lastSessionDays >= 4 ? `Sin actividad ${s.lastSessionDays}d` : `Adherencia ${s.adherence}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Acciones rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <QuickAction icon="clipboard" label="Crear rutina" detail="Diseña una nueva rutina" onClick={() => onNavigate('routines')} />
          <QuickAction icon="folder" label="Crear programa" detail="Agrupa rutinas en programa" onClick={() => onNavigate('programs')} />
          <QuickAction icon="dumbbell" label="Añadir ejercicio" detail={`${library.length} en biblioteca`} onClick={() => onNavigate('library')} />
          <QuickAction icon="users" label="Asignar programa" detail={`${activeStudents.length} estudiantes`} onClick={() => onNavigate('students')} />
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .k-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ label, value, trend, icon, accent }) {
  return (
    <div style={{
      background: 'var(--color-card)',
      border: `1px solid ${accent ? 'rgba(230,38,57,0.35)' : 'var(--color-border)'}`,
      borderRadius: 12, padding: '16px 18px',
      position: 'relative', overflow: 'hidden',
    }}>
      {accent && <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle at top right, rgba(230,38,57,0.15), transparent 70%)', pointerEvents: 'none' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="k-overline">{label}</span>
        <Icon name={icon} size={14} style={{ color: accent ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>{trend}</div>
    </div>
  );
}

function QuickAction({ icon, label, detail, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: hover ? 'var(--color-card-hover)' : 'var(--color-card)',
        border: `1px solid ${hover ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        transition: 'background .12s, border-color .12s',
        fontFamily: 'var(--font-sans)', color: 'var(--color-text)',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'var(--color-primary-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} size={16} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{detail}</div>
      </div>
      <Icon name="arrowRight" size={14} style={{ color: 'var(--color-text-muted)' }} />
    </button>
  );
}

function PlaceholderView({ title, overline, description, icon }) {
  return (
    <div style={{ padding: '28px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader overline={overline} title={title} subtitle={description} />
      <div style={{
        marginTop: 40,
        background: 'var(--color-card)',
        border: '1px dashed var(--color-border)',
        borderRadius: 14,
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: 'var(--color-primary-subtle)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <Icon name={icon} size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, letterSpacing: '-0.02em' }}>Próximamente</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 420, margin: '10px auto 0', lineHeight: 1.5 }}>
          Esta vista está en el roadmap. De momento explora las otras secciones del producto.
        </p>
      </div>
    </div>
  );
}

window.RoutinesView = RoutinesView;
window.DashboardView = DashboardView;
window.PlaceholderView = PlaceholderView;

// Students view — list, search, filters, detail drawer, program assignment

function StudentsView() {
  const [students, setStudents] = React.useState(() => {
    try {
      const saved = localStorage.getItem('kondix-students');
      if (saved) return JSON.parse(saved);
    } catch {}
    return seedStudents();
  });
  const programs = React.useMemo(() => seedPrograms(), []);
  const [detailId, setDetailId] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all'); // all | active | inactive | attention
  const [filterObjective, setFilterObjective] = React.useState('Todos');
  const [showInvite, setShowInvite] = React.useState(false);
  const [confirm, confirmDialog] = useConfirm();

  React.useEffect(() => {
    try { localStorage.setItem('kondix-students', JSON.stringify(students)); } catch {}
    window.__allStudents = students;
  }, [students]);

  const filtered = students.filter(s => {
    if (search && !(`${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterStatus === 'active' && s.status !== 'active') return false;
    if (filterStatus === 'inactive' && s.status !== 'inactive') return false;
    if (filterStatus === 'attention' && !(s.lastSessionDays >= 4 || s.adherence < 60)) return false;
    if (filterObjective !== 'Todos' && s.objective !== filterObjective) return false;
    return true;
  });

  const activeCount = students.filter(s => s.status === 'active').length;
  const attentionCount = students.filter(s => s.lastSessionDays >= 4 || s.adherence < 60).length;

  const deleteStudent = (s) => {
    confirm({
      title: 'Eliminar estudiante',
      message: `¿Eliminar a ${s.name}? Se perderá su historial y asignaciones. Esta acción no se puede deshacer.`,
      onConfirm: () => {
        setStudents(sts => sts.filter(x => x.id !== s.id));
        setDetailId(null);
      },
    });
  };

  const patchStudent = (id, patch) => {
    setStudents(sts => sts.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addStudent = (data) => {
    const ns = {
      id: uid('stu'),
      name: data.name || 'Nuevo estudiante',
      email: data.email || '',
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      objective: data.objective || 'Ganar masa',
      level: data.level || 'Principiante',
      startDate: new Date().toISOString().slice(0, 10),
      notes: [],
      phone: data.phone || '',
      status: 'active',
      lastSessionDays: 0,
      sessionsThisWeek: 0,
      adherence: 0,
      bodyWeight: data.bodyWeight || null,
      activeProgramId: null,
      currentWeek: null,
    };
    setStudents([ns, ...students]);
    setShowInvite(false);
    setDetailId(ns.id);
  };

  const detail = detailId ? students.find(s => s.id === detailId) : null;

  return (
    <div style={{ padding: '28px 36px 120px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        overline="Gestión"
        title="Estudiantes"
        subtitle={`${students.length} en total · ${activeCount} activos${attentionCount > 0 ? ` · ${attentionCount} requieren atención` : ''}.`}
        actions={
          <Button variant="primary" icon="plus" onClick={() => setShowInvite(true)}>Añadir estudiante</Button>
        }
      />

      {/* Filters bar */}
      <div style={{
        marginTop: 22,
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 220 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar estudiante…"
            style={{
              width: '100%',
              padding: '0 12px 0 36px',
              height: 38,
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <SegmentedFilter
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'all', label: 'Todos', count: students.length },
            { value: 'active', label: 'Activos', count: activeCount },
            { value: 'attention', label: 'Atención', count: attentionCount, accent: 'warning' },
            { value: 'inactive', label: 'Inactivos', count: students.length - activeCount },
          ]}
        />

        <SelectField
          value={filterObjective}
          onChange={setFilterObjective}
          options={['Todos', ...OBJECTIVES].map(o => ({ value: o, label: o }))}
          style={{ minWidth: 160 }}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          marginTop: 40,
          padding: '60px 24px',
          textAlign: 'center',
          background: 'var(--color-card)',
          border: '1px dashed var(--color-border)',
          borderRadius: 12,
          color: 'var(--color-text-muted)',
        }}>
          <Icon name="users" size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            {students.length === 0 ? 'Aún no tienes estudiantes' : 'Ningún estudiante coincide con los filtros'}
          </div>
          <div style={{ fontSize: 12 }}>
            {students.length === 0 ? 'Añade tu primer estudiante para empezar a asignar programas.' : 'Prueba ajustando la búsqueda o los filtros.'}
          </div>
        </div>
      ) : (
        <div style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(s => (
            <StudentCard
              key={s.id}
              student={s}
              program={programs.find(p => p.id === s.activeProgramId)}
              onClick={() => setDetailId(s.id)}
            />
          ))}
        </div>
      )}

      {detail && (
        <StudentDetailDrawer
          student={detail}
          programs={programs}
          onClose={() => setDetailId(null)}
          onPatch={(patch) => patchStudent(detail.id, patch)}
          onDelete={() => deleteStudent(detail)}
        />
      )}

      {showInvite && (
        <InviteStudentModal
          onClose={() => setShowInvite(false)}
          onCreate={addStudent}
        />
      )}

      {confirmDialog}
    </div>
  );
}

// ============================================================
// Segmented filter
// ============================================================
function SegmentedFilter({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: 3,
    }}>
      {options.map(opt => {
        const active = value === opt.value;
        const accentColor = opt.accent === 'warning' && opt.count > 0 ? 'var(--color-warning)' : null;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0 12px',
              height: 30,
              border: 'none',
              background: active ? 'var(--color-bg-raised)' : 'transparent',
              color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background .12s, color .12s',
            }}
          >
            <span>{opt.label}</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 10,
              background: active ? 'var(--color-border)' : 'transparent',
              color: accentColor || (active ? 'var(--color-text-secondary)' : 'var(--color-text-muted)'),
            }}>{opt.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Student card
// ============================================================
function StudentCard({ student: s, program, onClick }) {
  const [hover, setHover] = React.useState(false);

  const needsAttention = s.lastSessionDays >= 4 || s.adherence < 60;
  const statusColor = s.status === 'inactive'
    ? 'var(--color-text-muted)'
    : needsAttention
      ? 'var(--color-warning)'
      : '#22c55e';
  const statusLabel = s.status === 'inactive'
    ? 'Inactivo'
    : needsAttention
      ? (s.lastSessionDays >= 4 ? `Sin sesión ${s.lastSessionDays}d` : `Adh. ${s.adherence}%`)
      : `Activo · ${s.sessionsThisWeek} ses/sem`;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${hover ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 12,
        padding: '16px 16px 14px',
        cursor: 'pointer',
        transition: 'border-color .15s, transform .15s, background .15s',
        transform: hover ? 'translateY(-2px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status dot */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 8, height: 8, borderRadius: '50%',
        background: statusColor,
        boxShadow: `0 0 0 3px color-mix(in oklch, ${statusColor} 25%, transparent)`,
      }} />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={s.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.name}
          </div>
          <div style={{ fontSize: 10, color: statusColor, fontFamily: 'var(--font-mono)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {statusLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <Badge tone="primary">{s.objective}</Badge>
        <Badge tone="outline">{s.level}</Badge>
      </div>

      {/* Program + adherence */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid var(--color-border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {program ? (
            <>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Programa</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {program.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                Sem {s.currentWeek}/{program.durationWeeks}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Sin programa asignado
            </div>
          )}
        </div>
        <AdherenceRing value={s.adherence} />
      </div>
    </div>
  );
}

function AdherenceRing({ value }) {
  const R = 18;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : 'var(--color-danger)';
  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={R} fill="none" stroke="var(--color-border)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (pct / 100) * C}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
        fontFamily: 'var(--font-mono)',
      }}>{pct}%</div>
    </div>
  );
}

// ============================================================
// Student detail drawer
// ============================================================
function StudentDetailDrawer({ student: s, programs, onClose, onPatch, onDelete }) {
  const [tab, setTab] = React.useState('overview'); // overview | program | progress | notes
  const [progressInitialFilter, setProgressInitialFilter] = React.useState(null);
  // Expose students globally so progress tab can seed deterministically
  React.useEffect(() => { window.__allStudents = window.__allStudents || []; }, []);
  const library = React.useMemo(() => (window.__library = window.__library || seedLibrary()), []);
  const program = programs.find(p => p.id === s.activeProgramId);
  const [showAssign, setShowAssign] = React.useState(false);

  // Count recent (≤ 14 days) sessions with student feedback (notes / mood / set notes / exercise notes)
  const recentFeedbackCount = React.useMemo(() => {
    const all = window.__studentProgress || (window.__studentProgress = seedStudentProgress(window.__allStudents || []));
    const sessions = (all[s.id]?.sessions) || [];
    return sessions.filter(sess => {
      if (sess.status !== 'completed') return false;
      if ((sess.dayOffset ?? 99) > 14) return false;
      if (sess.note && sess.note.trim()) return true;
      return (sess.exercises || []).some(ex => (ex.note && ex.note.trim()) || (ex.sets || []).some(set => set.note && set.note.trim()));
    }).length;
  }, [s.id]);

  const openFeedback = () => {
    setProgressInitialFilter('with-notes');
    setTab('progress');
  };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div className="k-slide-in-right scroll-thin" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(560px, 100vw)',
        background: 'var(--color-bg)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 101, overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 2,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="k-overline" style={{ color: 'var(--color-primary)' }}>Ficha del estudiante</div>
            <IconButton icon="x" size="sm" onClick={onClose} />
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <img src={s.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                <EditableText value={s.name} onChange={(name) => onPatch({ name })} placeholder="Nombre…" />
              </h1>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                {s.email || <span style={{ fontStyle: 'italic' }}>sin email</span>}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 16, borderBottom: '1px solid var(--color-border-light)', marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24, marginBottom: -18 }}>
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'program', label: 'Programa' },
              { id: 'progress', label: 'Progreso', badge: recentFeedbackCount },
              { id: 'notes', label: 'Notas' },
            ].map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); if (t.id !== 'progress') setProgressInitialFilter(null); }}
                  style={{
                    padding: '10px 14px',
                    border: 'none',
                    background: 'transparent',
                    color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
                    marginBottom: -1,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {t.label}
                  {t.badge ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 17, height: 17, padding: '0 5px',
                      borderRadius: 999,
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontSize: 10, fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 1,
                    }}>{t.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 80px' }}>
          {tab === 'overview' && (
            <OverviewTab student={s} program={program} onPatch={onPatch} feedbackCount={recentFeedbackCount} onOpenFeedback={openFeedback} />
          )}
          {tab === 'program' && (
            <ProgramTab student={s} program={program} programs={programs} onPatch={onPatch} onOpenAssign={() => setShowAssign(true)} />
          )}
          {tab === 'progress' && (
            <ProgressTab student={s} library={library} initialFilter={progressInitialFilter} />
          )}
          {tab === 'notes' && (
            <NotesTab student={s} onPatch={onPatch} />
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          padding: '12px 24px',
          display: 'flex', justifyContent: 'space-between', gap: 10,
        }}>
          <Button variant="ghost" icon="trash" onClick={onDelete} style={{ color: 'var(--color-danger)' }}>Eliminar</Button>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>

      {showAssign && (
        <AssignProgramModal
          student={s}
          programs={programs}
          onClose={() => setShowAssign(false)}
          onAssign={(programId) => {
            onPatch({ activeProgramId: programId, currentWeek: 1 });
            setShowAssign(false);
          }}
        />
      )}
    </>
  );
}

// ============================================================
// Overview tab
// ============================================================
function OverviewTab({ student: s, program, onPatch, feedbackCount = 0, onOpenFeedback }) {
  const needsAttention = s.lastSessionDays >= 4 || s.adherence < 60;

  // Fake 12-week adherence sparkline (deterministic from id hash)
  const sparkData = React.useMemo(() => {
    let seed = 0; for (const c of s.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const data = [];
    let v = s.adherence;
    for (let i = 0; i < 12; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const drift = ((seed % 30) - 15);
      v = Math.max(20, Math.min(100, v + drift));
      data.push(v);
    }
    data[data.length - 1] = s.adherence;
    return data;
  }, [s.id, s.adherence]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Alert banner if attention */}
      {needsAttention && (
        <div style={{
          padding: '10px 12px',
          background: 'color-mix(in oklch, var(--color-warning) 12%, transparent)',
          border: '1px solid color-mix(in oklch, var(--color-warning) 40%, transparent)',
          borderRadius: 10,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="alert" size={15} style={{ color: 'var(--color-warning)', marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
            {s.lastSessionDays >= 4 ? (
              <>No ha entrenado en <strong>{s.lastSessionDays} días</strong>. Considera contactar para retomar la rutina.</>
            ) : (
              <>Adherencia baja (<strong>{s.adherence}%</strong>). Revisa si el plan está funcionando.</>
            )}
          </div>
        </div>
      )}

      {/* Feedback recent banner */}
      {feedbackCount > 0 && (
        <button
          onClick={onOpenFeedback}
          style={{
            padding: '12px 14px',
            background: 'var(--color-primary-subtle)',
            border: '1px solid color-mix(in oklch, var(--color-primary) 35%, transparent)',
            borderRadius: 10,
            display: 'flex', gap: 12, alignItems: 'center',
            cursor: 'pointer', textAlign: 'left',
            fontFamily: 'inherit', color: 'inherit',
            transition: 'background .15s, border-color .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in oklch, var(--color-primary) 18%, transparent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary-subtle)'; }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: 'var(--color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="note" size={15} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              {feedbackCount} {feedbackCount === 1 ? 'sesión reciente con feedback' : 'sesiones recientes con feedback'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {s.name.split(' ')[0]} ha dejado notas, RPE o estado de ánimo · Revisa qué piensa de su entreno
            </div>
          </div>
          <Icon name="chevronRight" size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        </button>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <StatTile label="Adherencia" value={`${s.adherence}%`} hint="Últimas 4 semanas" accent={s.adherence >= 80} />
        <StatTile label="Sesiones / semana" value={s.sessionsThisWeek} hint="Meta: 4" />
        <StatTile label="Última sesión" value={s.lastSessionDays === 0 ? 'Hoy' : `${s.lastSessionDays}d`} hint={s.lastSessionDays >= 4 ? 'Revisar' : 'Al día'} />
        <StatTile label="Peso" value={s.bodyWeight ? `${s.bodyWeight} kg` : '—'} hint="Último registro" />
      </div>

      {/* Adherence chart */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, margin: 0, letterSpacing: '-0.01em' }}>Adherencia · 12 semanas</h3>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            media {Math.round(sparkData.reduce((a, b) => a + b, 0) / sparkData.length)}%
          </span>
        </div>
        <AdherenceChart data={sparkData} />
      </section>

      {/* Profile data */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, margin: '0 0 10px', letterSpacing: '-0.01em' }}>Perfil</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DetailRow label="Objetivo">
            <select
              value={s.objective}
              onChange={(e) => onPatch({ objective: e.target.value })}
              style={miniSelectStyle}
            >
              {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </DetailRow>
          <DetailRow label="Nivel">
            <select
              value={s.level}
              onChange={(e) => onPatch({ level: e.target.value })}
              style={miniSelectStyle}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </DetailRow>
          <DetailRow label="Peso corporal">
            <input
              type="number"
              value={s.bodyWeight ?? ''}
              onChange={(e) => onPatch({ bodyWeight: e.target.value === '' ? null : parseFloat(e.target.value) })}
              placeholder="kg"
              style={miniInputStyle}
            />
          </DetailRow>
          <DetailRow label="Teléfono">
            <EditableText
              value={s.phone || ''}
              onChange={(phone) => onPatch({ phone })}
              placeholder="Añadir…"
            />
          </DetailRow>
          <DetailRow label="Fecha de inicio">
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{s.startDate}</span>
          </DetailRow>
          <DetailRow label="Estado">
            <button
              onClick={() => onPatch({ status: s.status === 'active' ? 'inactive' : 'active' })}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                border: `1px solid ${s.status === 'active' ? 'rgba(34,197,94,0.4)' : 'var(--color-border)'}`,
                background: s.status === 'active' ? 'rgba(34,197,94,0.15)' : 'var(--color-card-hover)',
                color: s.status === 'active' ? '#22c55e' : 'var(--color-text-muted)',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              {s.status === 'active' ? '● Activo' : '○ Inactivo'}
            </button>
          </DetailRow>
        </div>
      </section>
    </div>
  );
}

const miniSelectStyle = {
  padding: '6px 10px',
  background: 'var(--color-card-hover)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  outline: 'none',
  cursor: 'pointer',
  minWidth: 140,
};

const miniInputStyle = {
  padding: '6px 10px',
  background: 'var(--color-card-hover)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  outline: 'none',
  width: 100,
};

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 32 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: 'var(--color-text)' }}>{children}</div>
    </div>
  );
}

function StatTile({ label, value, hint, accent }) {
  return (
    <div style={{
      background: 'var(--color-card)',
      border: `1px solid ${accent ? 'rgba(230,38,57,0.3)' : 'var(--color-border)'}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, color: accent ? 'var(--color-primary)' : 'var(--color-text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>
    </div>
  );
}

// ============================================================
// Adherence sparkline chart
// ============================================================
function AdherenceChart({ data }) {
  const W = 480, H = 90, PAD_X = 6, PAD_Y = 8;
  const maxV = 100, minV = 0;
  const xs = data.map((_, i) => PAD_X + (i / (data.length - 1)) * (W - 2 * PAD_X));
  const ys = data.map(v => PAD_Y + (1 - (v - minV) / (maxV - minV)) * (H - 2 * PAD_Y));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const fillPath = `${path} L ${xs[xs.length - 1].toFixed(1)} ${H - PAD_Y} L ${xs[0].toFixed(1)} ${H - PAD_Y} Z`;

  // threshold line at 80
  const thresholdY = PAD_Y + (1 - (80 - minV) / (maxV - minV)) * (H - 2 * PAD_Y);

  return (
    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 10 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 90, display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* threshold dashed line */}
        <line x1={PAD_X} x2={W - PAD_X} y1={thresholdY} y2={thresholdY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" />
        <text x={W - PAD_X - 2} y={thresholdY - 4} fill="var(--color-text-muted)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">80%</text>

        <path d={fillPath} fill="url(#sparkFill)" />
        <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 3 : 1.6} fill={i === xs.length - 1 ? 'var(--color-primary)' : 'var(--color-bg)'} stroke="var(--color-primary)" strokeWidth="1.2" />
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// Program tab
// ============================================================
function ProgramTab({ student: s, program, programs, onPatch, onOpenAssign }) {
  if (!program) {
    return (
      <div style={{
        padding: '30px 20px',
        textAlign: 'center',
        background: 'var(--color-card)',
        border: '1px dashed var(--color-border)',
        borderRadius: 12,
      }}>
        <Icon name="folder" size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.5, marginBottom: 10 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Sin programa asignado</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 14 }}>
          Asigna un programa para que {s.name.split(' ')[0]} empiece a seguir un plan.
        </div>
        <Button variant="primary" icon="plus" onClick={onOpenAssign}>Asignar programa</Button>
      </div>
    );
  }

  const pct = program.durationWeeks > 0 ? Math.round(((s.currentWeek || 1) / program.durationWeeks) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="k-overline" style={{ color: 'var(--color-primary)', marginBottom: 4 }}>{program.category}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{program.name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
              {program.description}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Semana {s.currentWeek || 1} de {program.durationWeeks}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ marginTop: 6, height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', transition: 'width .3s ease' }} />
        </div>

        {/* Week dots */}
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: `repeat(${program.durationWeeks}, 1fr)`, gap: 3 }}>
          {Array.from({ length: program.durationWeeks }).map((_, i) => {
            const cw = s.currentWeek || 1;
            const state = i + 1 < cw ? 'done' : i + 1 === cw ? 'current' : 'todo';
            return (
              <div
                key={i}
                title={`Semana ${i + 1}`}
                style={{
                  height: 6,
                  borderRadius: 2,
                  background: state === 'done' ? 'var(--color-primary)' : state === 'current' ? 'color-mix(in oklch, var(--color-primary) 60%, transparent)' : 'var(--color-border)',
                }}
              />
            );
          })}
        </div>
      </section>

      {/* Week controls */}
      <section style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <IconButton icon="chevronLeft" size="sm" onClick={() => onPatch({ currentWeek: Math.max(1, (s.currentWeek || 1) - 1) })} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          Ajustar semana actual
        </div>
        <IconButton icon="chevronRight" size="sm" onClick={() => onPatch({ currentWeek: Math.min(program.durationWeeks, (s.currentWeek || 1) + 1) })} />
      </section>

      {/* Actions */}
      <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="secondary" icon="edit" onClick={onOpenAssign}>Cambiar programa</Button>
        <Button variant="ghost" icon="unlink" onClick={() => onPatch({ activeProgramId: null, currentWeek: null })}>Desasignar</Button>
      </section>
    </div>
  );
}

// ============================================================
// Notes tab
// ============================================================
function NotesTab({ student: s, onPatch }) {
  const [draft, setDraft] = React.useState('');
  const notes = s.notes || [];

  const addNote = () => {
    if (!draft.trim()) return;
    const note = {
      id: uid('note'),
      text: draft.trim(),
      date: new Date().toISOString(),
    };
    onPatch({ notes: [note, ...notes] });
    setDraft('');
  };

  const deleteNote = (id) => {
    onPatch({ notes: notes.filter(n => n.id !== id) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Composer */}
      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 12,
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe una nota: sesión de hoy, medidas, lesiones, sensaciones…"
          rows={3}
          style={{
            width: '100%',
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.5,
            outline: 'none',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="primary" size="sm" icon="plus" onClick={addNote} disabled={!draft.trim()}>Añadir nota</Button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div style={{
          padding: '28px 20px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 12,
          background: 'var(--color-card)',
          border: '1px dashed var(--color-border)',
          borderRadius: 10,
        }}>
          <Icon name="note" size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
          <div>Aún no hay notas para este estudiante.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(n => (
            <div key={n.id} style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Icon name="note" size={13} style={{ color: 'var(--color-primary)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.text}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  {formatNoteDate(n.date)}
                </div>
              </div>
              <IconButton icon="trash" size="xs" onClick={() => deleteNote(n.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNoteDate(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'ahora mismo';
    if (diff < 60) return `hace ${diff} min`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// ============================================================
// Assign program modal
// ============================================================
function AssignProgramModal({ student: s, programs, onClose, onAssign }) {
  const [selected, setSelected] = React.useState(s.activeProgramId || null);
  const actives = programs.filter(p => p.status === 'active');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          width: 'min(540px, 100%)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="k-overline" style={{ color: 'var(--color-primary)' }}>Asignar programa</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '4px 0 0', letterSpacing: '-0.02em' }}>
            A {s.name}
          </h2>
        </div>

        <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
          {actives.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
              No hay programas activos. Crea uno en la sección Programas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {actives.map(p => {
                const color = (window.OBJECTIVE_COLORS && window.OBJECTIVE_COLORS[p.category]) || '#E62639';
                const active = selected === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      background: active ? 'color-mix(in oklch, var(--color-primary) 10%, var(--color-card))' : 'var(--color-card)',
                      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex', gap: 12, alignItems: 'center',
                      fontFamily: 'var(--font-sans)', color: 'var(--color-text)',
                    }}
                  >
                    <div style={{
                      width: 4, alignSelf: 'stretch',
                      background: color, borderRadius: 2, minHeight: 40,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', gap: 10 }}>
                        <span>{p.durationWeeks} semanas</span>
                        <span>·</span>
                        <span>{p.category}</span>
                        <span>·</span>
                        <span>{p.studentsAssigned} asignados</span>
                      </div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {active && <Icon name="check" size={10} style={{ color: 'white' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon="check"
            disabled={!selected}
            onClick={() => selected && onAssign(selected)}
          >Asignar</Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Invite / new student modal
// ============================================================
function InviteStudentModal({ onClose, onCreate }) {
  const [form, setForm] = React.useState({
    name: '', email: '', phone: '',
    objective: 'Ganar masa', level: 'Principiante',
    bodyWeight: '',
  });

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    if (!form.name.trim()) return;
    onCreate({
      ...form,
      bodyWeight: form.bodyWeight === '' ? null : parseFloat(form.bodyWeight),
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          width: 'min(500px, 100%)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="k-overline" style={{ color: 'var(--color-primary)' }}>Nuevo estudiante</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '4px 0 0', letterSpacing: '-0.02em' }}>
            Añade a tu roster
          </h2>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre completo">
            <TextField
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Ej. María García"
              autoFocus
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Email">
              <TextField
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder="maria@email.com"
                type="email"
              />
            </Field>
            <Field label="Teléfono">
              <TextField
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+34 ..."
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Objetivo">
              <SelectField
                value={form.objective}
                onChange={(v) => setForm({ ...form, objective: v })}
                options={OBJECTIVES.map(o => ({ value: o, label: o }))}
              />
            </Field>
            <Field label="Nivel">
              <SelectField
                value={form.level}
                onChange={(v) => setForm({ ...form, level: v })}
                options={LEVELS.map(l => ({ value: l, label: l }))}
              />
            </Field>
            <Field label="Peso (kg)">
              <TextField
                value={form.bodyWeight}
                onChange={(v) => setForm({ ...form, bodyWeight: v })}
                type="number"
                placeholder="—"
              />
            </Field>
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon="check" disabled={!form.name.trim()} onClick={submit}>Crear estudiante</Button>
        </div>
      </div>
    </div>
  );
}

window.StudentsView = StudentsView;

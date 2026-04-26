// Progress tab — sessions timeline, PRs, body metrics + photos

// ============================================================
// Local exercise thumb (mirrors student/ui.jsx KExerciseThumb but
// adapted to the trainer light theme — and self-contained so this
// file doesn't depend on the student bundle).
// ============================================================
const _MUSCLE_HUES = {
  'Pecho':       { bg: 'oklch(0.95 0.04 25)',  border: 'oklch(0.85 0.10 25)',  fg: 'oklch(0.50 0.18 25)' },
  'Espalda':     { bg: 'oklch(0.95 0.04 230)', border: 'oklch(0.85 0.10 230)', fg: 'oklch(0.45 0.18 230)' },
  'Hombros':     { bg: 'oklch(0.95 0.05 75)',  border: 'oklch(0.85 0.12 75)',  fg: 'oklch(0.50 0.16 75)' },
  'Hombro':      { bg: 'oklch(0.95 0.05 75)',  border: 'oklch(0.85 0.12 75)',  fg: 'oklch(0.50 0.16 75)' },
  'Bíceps':      { bg: 'oklch(0.95 0.04 295)', border: 'oklch(0.85 0.10 295)', fg: 'oklch(0.50 0.18 295)' },
  'Tríceps':     { bg: 'oklch(0.95 0.04 340)', border: 'oklch(0.85 0.10 340)', fg: 'oklch(0.50 0.18 340)' },
  'Piernas':     { bg: 'oklch(0.95 0.05 145)', border: 'oklch(0.85 0.12 145)', fg: 'oklch(0.45 0.16 145)' },
  'Cuádriceps':  { bg: 'oklch(0.95 0.05 145)', border: 'oklch(0.85 0.12 145)', fg: 'oklch(0.45 0.16 145)' },
  'Glúteos':     { bg: 'oklch(0.95 0.04 350)', border: 'oklch(0.85 0.10 350)', fg: 'oklch(0.50 0.18 350)' },
  'Glúteo':      { bg: 'oklch(0.95 0.04 350)', border: 'oklch(0.85 0.10 350)', fg: 'oklch(0.50 0.18 350)' },
  'Core':        { bg: 'oklch(0.95 0.05 55)',  border: 'oklch(0.85 0.12 55)',  fg: 'oklch(0.50 0.16 55)' },
  'Pantorrilla': { bg: 'oklch(0.95 0.05 125)', border: 'oklch(0.85 0.12 125)', fg: 'oklch(0.45 0.16 125)' },
  'Antebrazo':   { bg: 'oklch(0.95 0.03 200)', border: 'oklch(0.85 0.08 200)', fg: 'oklch(0.50 0.12 200)' },
};
const _DEFAULT_HUE = { bg: 'var(--color-bg-muted)', border: 'var(--color-border-light)', fg: 'var(--color-text-muted)' };

function ExerciseThumbLocal({ name, muscleGroup, photoUrl, size = 36 }) {
  const hue = _MUSCLE_HUES[muscleGroup] || _DEFAULT_HUE;
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const radius = Math.round(size * 0.27);

  if (photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid var(--color-border-light)',
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: hue.bg, border: `1px solid ${hue.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: Math.round(size * 0.36),
      color: hue.fg,
      letterSpacing: '-0.02em',
    }}>{initials}</div>
  );
}

function ProgressTab({ student: s, library, initialFilter }) {
  const progress = React.useMemo(() => {
    const all = window.__studentProgress || (window.__studentProgress = seedStudentProgress(window.__allStudents || []));
    return all[s.id] || { sessions: [], prs: [], metrics: [], photos: [] };
  }, [s.id]);

  const { sessions, prs, metrics, photos } = progress;
  const completedSessions = sessions.filter(x => x.status === 'completed');

  // Library lookup for muscle group + photo
  const exByName = React.useMemo(() => {
    const m = {};
    for (const e of (library || [])) m[e.name.toLowerCase()] = e;
    return m;
  }, [library]);

  // ---------- Sessions filter ----------
  const [sessionFilter, setSessionFilter] = React.useState(initialFilter || 'all'); // all | completed | skipped | with-notes
  React.useEffect(() => {
    if (initialFilter) setSessionFilter(initialFilter);
  }, [initialFilter]);

  const filteredSessions = sessions.filter(sess => {
    if (sessionFilter === 'completed') return sess.status === 'completed';
    if (sessionFilter === 'skipped') return sess.status === 'skipped';
    if (sessionFilter === 'with-notes') {
      if (sess.note) return true;
      return (sess.exercises || []).some(ex => ex.note || (ex.sets || []).some(set => set.note));
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ─────────────────────── KPI strip ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <ProgKpi label="Sesiones" value={completedSessions.length} hint="Últimas 10 sem" />
        <ProgKpi label="Records" value={prs.length} hint="PRs alcanzados" accent />
        <ProgKpi
          label="RPE medio"
          value={completedSessions.length ? (completedSessions.reduce((a, b) => a + (b.rpeAvg || 0), 0) / completedSessions.length).toFixed(1) : '—'}
          hint="Esfuerzo percibido"
        />
      </div>

      {/* ─────────────────────── Sessions timeline ─────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
            Historial de sesiones
          </h3>
          <SegmentedFilter
            value={sessionFilter}
            onChange={setSessionFilter}
            options={[
              { id: 'all', label: 'Todas' },
              { id: 'completed', label: 'Hechas' },
              { id: 'skipped', label: 'Saltadas' },
              { id: 'with-notes', label: 'Con notas' },
            ]}
          />
        </div>

        {filteredSessions.length === 0 && (
          <EmptyMini text="No hay sesiones que coincidan con el filtro." />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          {filteredSessions.map((sess, i) => (
            <SessionRow key={sess.id} session={sess} exByName={exByName} />
          ))}
        </div>
      </section>

      {/* ─────────────────────── Personal records ─────────────────────── */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 10px' }}>
          Records personales
          {prs.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{prs.length}</span>}
        </h3>

        {prs.length === 0 ? (
          <EmptyMini text="Aún no hay records registrados." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...prs].reverse().slice(0, 8).map(pr => (
              <PrRow key={pr.id} pr={pr} ex={exByName[pr.exerciseName.toLowerCase()]} />
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────── Body metrics ─────────────────────── */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 10px' }}>
          Medidas corporales
        </h3>
        <BodyMetrics metrics={metrics} />
      </section>

      {/* ─────────────────────── Progress photos ─────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
            Fotos de progreso
          </h3>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {photos.length} fotos
          </span>
        </div>
        <PhotosStrip photos={photos} />
      </section>
    </div>
  );
}

// ============================================================
// Session row — collapsible
// ============================================================
function SessionRow({ session: sess, exByName }) {
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const isSkipped = sess.status === 'skipped';

  const moodEmoji = { great: '🔥', good: '✅', ok: '😐', tough: '😮‍💨' }[sess.mood] || '';
  const moodColor = { great: 'var(--color-success)', good: 'var(--color-text)', ok: 'var(--color-text-muted)', tough: 'var(--color-warning)' }[sess.mood] || 'var(--color-text-muted)';

  const adherencePct = sess.totalSets > 0 ? Math.round(sess.completedSets / sess.totalSets * 100) : 0;
  const lowAdherence = !isSkipped && adherencePct < 75;
  const hasContent = !!sess.note || (sess.exercises || []).some(ex => ex.note || (ex.sets || []).some(set => set.note));

  // Visual states
  const bg = isSkipped
    ? 'rgba(245,158,11,0.05)'
    : open
      ? 'var(--color-bg-raised)'
      : hover
        ? 'var(--color-card-hover)'
        : 'var(--color-card)';
  const borderCol = open
    ? 'var(--color-primary)'
    : isSkipped
      ? 'rgba(245,158,11,0.25)'
      : 'var(--color-border)';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${borderCol}`,
        borderRadius: 8,
        background: bg,
        overflow: 'hidden',
        boxShadow: open ? '0 0 0 1px var(--color-primary), 0 4px 14px rgba(230,38,57,0.15)' : 'none',
        transition: 'background .15s, border-color .15s, box-shadow .15s',
      }}
    >
      <button
        onClick={() => !isSkipped && setOpen(o => !o)}
        disabled={isSkipped}
        style={{
          width: '100%', padding: '11px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'transparent', border: 'none',
          cursor: isSkipped ? 'default' : 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          color: 'var(--color-text)',
        }}
      >
        {/* Date pill */}
        <div style={{
          width: 42, flexShrink: 0,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          opacity: isSkipped ? 0.55 : 1,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
            {fmtDay(sess.date)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.05em' }}>
            {fmtMonth(sess.date)}
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--color-border-light)' }} />

        {/* Routine + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isSkipped ? 'var(--color-text-muted)' : 'var(--color-text)',
              textDecoration: isSkipped ? 'line-through' : 'none',
            }}>
              {sess.routineName}
            </span>
            {isSkipped && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 3,
                background: 'rgba(245,158,11,0.15)',
                color: 'var(--color-warning)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}>Saltada</span>
            )}
            {hasContent && !isSkipped && (
              <span title="Tiene notas del alumno" style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 3,
                background: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(230,38,57,0.3)',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)' }} />
                Notas
              </span>
            )}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            {!isSkipped && (
              <>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{sess.durationMin} min</span>
                <span>·</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: lowAdherence ? 'var(--color-warning)' : 'inherit' }}>
                  {sess.completedSets}/{sess.totalSets} series
                </span>
                {sess.rpeAvg !== null && (
                  <>
                    <span>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>RPE {sess.rpeAvg}</span>
                  </>
                )}
              </>
            )}
            {isSkipped && sess.note && <span style={{ fontStyle: 'italic' }}>"{sess.note}"</span>}
          </div>
        </div>

        {/* Mood + expand cue */}
        {!isSkipped && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {sess.mood && (
              <span style={{ fontSize: 16, color: moodColor }} title={`Estado: ${sess.mood}`}>{moodEmoji}</span>
            )}
            {/* Disclosure pill — clearly clickable */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
              background: open ? 'var(--color-primary)' : (hover ? 'var(--color-bg-raised)' : 'transparent'),
              border: `1px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color: open ? '#fff' : 'var(--color-text-muted)',
              fontSize: 10, fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.02em',
              transition: 'all .15s',
            }}>
              {open ? 'Cerrar' : 'Detalle'}
              <Icon
                name="chevron-down"
                size={12}
                style={{
                  transition: 'transform 0.2s',
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </span>
          </div>
        )}
      </button>

      {/* Expanded body */}
      {open && !isSkipped && (
        <div style={{
          padding: '0 14px 16px',
          borderTop: '1px solid var(--color-border-light)',
          background: 'var(--color-bg)',
        }}>
          {/* Session-level note */}
          {sess.note && (
            <div style={{
              marginTop: 14,
              padding: 12,
              background: 'var(--color-primary-subtle)',
              border: '1px solid rgba(230,38,57,0.25)',
              borderRadius: 8,
              borderLeft: '3px solid var(--color-primary)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--color-primary)', marginBottom: 6,
              }}>
                <Icon name="message-square" size={11} />
                Nota del alumno
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.55, fontStyle: 'italic' }}>
                "{sess.note}"
              </div>
            </div>
          )}

          {/* Exercise list header */}
          <div style={{
            marginTop: 14, marginBottom: 8,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}>
            Ejercicios · {sess.exercises?.length || 0}
          </div>

          {/* Exercise list */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(sess.exercises || []).map((ex, idx) => {
              const libEx = exByName[ex.name.toLowerCase()];
              const muscleGroup = libEx?.muscleGroup || '';
              return (
                <div key={idx} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: idx < sess.exercises.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                }}>
                  {/* Thumb */}
                  <div style={{ flexShrink: 0 }}>
                    <ExerciseThumbLocal
                      name={ex.name}
                      muscleGroup={muscleGroup}
                      photoUrl={libEx?.photoUrl}
                      size={36}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{ex.name}</span>
                      <span style={{
                        fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)',
                        padding: '1px 5px', borderRadius: 3,
                        background: 'var(--color-bg-raised)',
                      }}>RPE {ex.rpe}</span>
                    </div>
                    {/* Sets table */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {ex.sets.map((set, k) => (
                        <SetChip key={k} set={set} idx={k + 1} />
                      ))}
                    </div>
                    {ex.note && (
                      <div style={{
                        fontSize: 11, color: 'var(--color-text-secondary, var(--color-text))',
                        marginTop: 6,
                        padding: '5px 8px',
                        background: 'var(--color-bg-raised)',
                        borderRadius: 4,
                        borderLeft: '2px solid var(--color-text-muted)',
                      }}>
                        <span style={{ opacity: 0.6, marginRight: 4 }}>💬</span>
                        <span style={{ fontStyle: 'italic' }}>{ex.note}</span>
                      </div>
                    )}
                    {/* Set-level notes */}
                    {ex.sets.some(set => set.note) && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {ex.sets.filter(set => set.note).map((set, k) => (
                          <div key={'setnote_' + k} style={{
                            fontSize: 11, color: 'var(--color-text-muted)',
                            paddingLeft: 8,
                            borderLeft: '2px solid var(--color-border)',
                          }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text)' }}>Serie {ex.sets.indexOf(set) + 1}:</span> <span style={{ fontStyle: 'italic' }}>"{set.note}"</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SetChip({ set, idx }) {
  const isPR = set.isPR;
  const isCardio = set.weight === 0;
  return (
    <div
      title={set.note || ''}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 5,
        fontSize: 11, fontFamily: 'var(--font-mono)',
        background: isPR ? 'rgba(34,197,94,0.12)' : 'var(--color-bg-raised)',
        border: `1px solid ${isPR ? 'rgba(34,197,94,0.4)' : 'var(--color-border)'}`,
        color: isPR ? '#4ade80' : 'var(--color-text)',
        fontWeight: isPR ? 700 : 500,
      }}
    >
      <span style={{ opacity: 0.5 }}>{idx}</span>
      <span>{isCardio ? `${set.reps}s` : `${set.weight}×${set.reps}`}</span>
      {isPR && <span style={{ fontSize: 10 }}>★</span>}
    </div>
  );
}

// ============================================================
// PR row
// ============================================================
function PrRow({ pr, ex }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: 10,
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      background: 'var(--color-card)',
    }}>
      <ExerciseThumbLocal
        name={pr.exerciseName}
        muscleGroup={ex?.muscleGroup || ''}
        photoUrl={ex?.photoUrl}
        size={36}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, color: 'var(--color-text)' }}>{pr.exerciseName}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {fmtRelDate(pr.dayOffset)}
        </div>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: '#4ade80',
          letterSpacing: '-0.02em',
        }}>
          {pr.weight === 0 ? `${pr.reps} reps` : `${pr.weight}kg`}
        </div>
        {pr.weight > 0 && (
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            × {pr.reps} reps
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Body metrics — sparkline + values
// ============================================================
function BodyMetrics({ metrics }) {
  if (!metrics || metrics.length === 0) return <EmptyMini text="Sin medidas registradas." />;

  const [activeMetric, setActiveMetric] = React.useState('weightKg');
  const metricDefs = {
    weightKg: { label: 'Peso', unit: 'kg', color: 'var(--color-primary)' },
    bodyFatPct: { label: '% Grasa', unit: '%', color: 'oklch(0.65 0.18 30)' },
    waistCm: { label: 'Cintura', unit: 'cm', color: 'oklch(0.6 0.15 200)' },
  };

  const def = metricDefs[activeMetric];
  const values = metrics.map(m => m[activeMetric]);
  const last = values[values.length - 1];
  const first = values[0];
  const delta = last - first;

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: 14,
      background: 'var(--color-card)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {Object.entries(metricDefs).map(([k, d]) => {
          const active = k === activeMetric;
          return (
            <button
              key={k}
              onClick={() => setActiveMetric(k)}
              style={{
                padding: '5px 10px', borderRadius: 4,
                border: '1px solid ' + (active ? 'var(--color-text)' : 'var(--color-border-light)'),
                background: active ? 'var(--color-text)' : 'transparent',
                color: active ? 'var(--color-bg)' : 'var(--color-text-muted)',
                fontSize: 11, fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Big number + delta */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
          color: def.color,
        }}>
          {last}<span style={{ fontSize: 14, color: 'var(--color-text-muted)', marginLeft: 4 }}>{def.unit}</span>
        </span>
        <span style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: delta > 0 ? '#4ade80' : delta < 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
        }}>
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta).toFixed(1)}{def.unit} desde inicio
        </span>
      </div>

      {/* Sparkline */}
      <MetricSpark values={values} color={def.color} />
    </div>
  );
}

function MetricSpark({ values, color }) {
  const W = 480, H = 70, PAD = 6;
  const maxV = Math.max(...values), minV = Math.min(...values);
  const range = maxV - minV || 1;
  const points = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - minV) / range) * (H - PAD * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const fillPath = path + ` L${points[points.length - 1][0]},${H - PAD} L${points[0][0]},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 70, display: 'block' }}>
      <path d={fillPath} fill={color} opacity="0.1" />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 3 : 1.5} fill={color} />
      ))}
    </svg>
  );
}

// ============================================================
// Photos strip
// ============================================================
function PhotosStrip({ photos }) {
  const [zoomIdx, setZoomIdx] = React.useState(null);
  if (photos.length === 0) return <EmptyMini text="Sin fotos cargadas." />;

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${photos.length}, 1fr)`,
        gap: 6,
      }}>
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setZoomIdx(i)}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'var(--color-bg-muted)',
              position: 'relative',
              aspectRatio: '3 / 4',
            }}
          >
            <img
              src={p.url}
              alt={p.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '12px 6px 4px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              color: '#fff', fontSize: 10, fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              textAlign: 'left',
            }}>
              <div>{p.label}</div>
              <div style={{ opacity: 0.7, fontWeight: 400 }}>{fmtRelDate(p.dayOffset)}</div>
            </div>
          </button>
        ))}
      </div>

      {zoomIdx !== null && (
        <div
          onClick={() => setZoomIdx(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 40,
          }}
        >
          <img
            src={photos[zoomIdx].url}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }}
            alt=""
          />
        </div>
      )}
    </>
  );
}

// ============================================================
// Helpers
// ============================================================
function ProgKpi({ label, value, hint, accent }) {
  return (
    <div style={{
      padding: 10,
      border: `1px solid ${accent ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
      borderRadius: 8,
      background: accent ? 'rgba(34,197,94,0.08)' : 'var(--color-card)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
        color: accent ? '#4ade80' : 'var(--color-text)',
      }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>
    </div>
  );
}

function SegmentedFilter({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex',
      border: '1px solid var(--color-border)',
      borderRadius: 6,
      padding: 2,
      background: 'var(--color-bg-muted)',
    }}>
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              padding: '4px 8px', borderRadius: 4,
              border: 'none',
              background: active ? 'var(--color-bg)' : 'transparent',
              color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontSize: 10, fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              boxShadow: active ? 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.04))' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyMini({ text }) {
  return (
    <div style={{
      padding: '20px 14px',
      border: '1px dashed var(--color-border-light)',
      borderRadius: 8,
      textAlign: 'center',
      fontSize: 12,
      color: 'var(--color-text-muted)',
    }}>{text}</div>
  );
}

// ============================================================
// Date helpers
// ============================================================
function fmtDay(iso) {
  return new Date(iso).getDate();
}
function fmtMonth(iso) {
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return months[new Date(iso).getMonth()];
}
function fmtRelDate(dayOffset) {
  if (dayOffset === 0) return 'Hoy';
  if (dayOffset === 1) return 'Ayer';
  if (dayOffset < 7) return `Hace ${dayOffset} días`;
  if (dayOffset < 14) return 'Hace 1 sem';
  if (dayOffset < 30) return `Hace ${Math.floor(dayOffset / 7)} sem`;
  return `Hace ${Math.floor(dayOffset / 30)} mes`;
}

Object.assign(window, { ProgressTab });

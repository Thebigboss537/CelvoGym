// Screens: Calendar, DayDetail, Overview, Execute, Complete, Progress, Profile.
const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS, useRef: useRefS } = React;
const DS = window.KONDIX_DATA;

const formatDateESS = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};
const formatDateShortS = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// ============================================================
// CALENDAR
// ============================================================
const CalendarScreen = ({ nav }) => {
  const [month, setMonth] = useStateS({ y: 2025, m: 11 }); // noviembre 2025
  const sessionsByDate = useMemoS(() => {
    const map = {};
    DS.SESSIONS.forEach(s => { map[s.date] = s; });
    return map;
  }, []);

  const firstDow = new Date(month.y, month.m - 1, 1).getDay(); // 0=Dom
  const firstDowMonFirst = (firstDow + 6) % 7; // 0=Lunes
  const daysInMonth = new Date(month.y, month.m, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDowMonFirst; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const iso = (d) => `${month.y}-${String(month.m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isToday = (d) => iso(d) === DS.TODAY_DATE;
  const isSuggested = (d) => {
    if (!d) return false;
    const dow = new Date(month.y, month.m - 1, d).getDay();
    return DS.PROGRAM.suggestedDays.includes(dow);
  };

  const monthName = new Date(month.y, month.m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const changeMonth = (dir) => {
    let m = month.m + dir, y = month.y;
    if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
    setMonth({ y, m });
  };

  const monthSessions = DS.SESSIONS.filter(s => s.date.startsWith(`${month.y}-${String(month.m).padStart(2,'0')}`));
  const completed = monthSessions.filter(s => s.status === 'completed').length;

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <KHeaderTop title="Calendario" subtitle="Tu programa" />

      {/* month picker */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 12, padding: 6, marginBottom: 14,
      }}>
        <button onClick={() => changeMonth(-1)} style={nudgeBtn}><Icon name="chevronLeft" size={16} /></button>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-text)',
          textTransform: 'capitalize' }}>{monthName}</div>
        <button onClick={() => changeMonth(1)} style={nudgeBtn}><Icon name="chevronRight" size={16} /></button>
      </div>

      {/* Month stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <KStatCard label="Completados" value={completed} valueColor="#22C55E" />
        <KStatCard label="Pendientes" value={monthSessions.filter(s => s.status === 'missed' && s.isPendingRecovery).length} valueColor="#F59E0B" />
        <KStatCard label="Adherencia" value={`${Math.round(completed / Math.max(1, monthSessions.length) * 100)}%`} valueColor="#E62639" />
      </div>

      {/* Grid */}
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: 12, marginBottom: 16,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700,
              letterSpacing: 0.08, color: 'var(--color-text-muted)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const sess = sessionsByDate[iso(d)];
            const suggested = isSuggested(d);
            const today = isToday(d);
            const done = sess?.status === 'completed';
            const skipped = sess?.status === 'skipped';
            const missed = sess?.status === 'missed';
            const pendingRecovery = missed && sess?.isPendingRecovery;
            return (
              <button key={i} onClick={() => nav('dayDetail', { date: iso(d) })} style={{
                aspectRatio: 1, padding: 0, borderRadius: 10, position: 'relative',
                background: done
                  ? '#E62639'
                  : pendingRecovery
                    ? 'rgba(245,158,11,0.14)'
                    : today
                      ? 'rgba(230,38,57,0.12)'
                      : 'transparent',
                border: today
                  ? '1.5px solid #E62639'
                  : pendingRecovery
                    ? '1.5px solid rgba(245,158,11,0.55)'
                    : skipped || missed
                      ? '1px dashed rgba(239,68,68,0.35)'
                      : '1px solid transparent',
                color: done
                  ? '#fff'
                  : today
                    ? '#F14D5E'
                    : pendingRecovery
                      ? '#FBBF24'
                      : suggested ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontSize: 13, fontWeight: today || done || pendingRecovery ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: done ? '0 3px 10px rgba(230,38,57,0.35)' : 'none',
              }}>
                {d}
                {suggested && !done && !today && !missed && (
                  <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: 999, background: '#F14D5E', opacity: 0.7 }} />
                )}
                {pendingRecovery && (
                  <span style={{ position: 'absolute', top: 3, right: 3, fontSize: 9, color: '#F59E0B',
                    fontWeight: 700, lineHeight: 1 }}>!</span>
                )}
                {(skipped || (missed && !pendingRecovery)) && (
                  <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 8, color: '#EF4444' }}>✕</span>
                )}
              </button>
            );
          })}
        </div>
        {/* leyenda */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 10,
          borderTop: '1px solid var(--color-border-light)', flexWrap: 'wrap', fontSize: 10, color: 'var(--color-text-muted)' }}>
          <Legend dot="#E62639" label="Hecho" />
          <Legend ring label="Sugerido" />
          <Legend pending label="Pendiente" />
          <Legend cross label="Faltado" />
          <Legend today label="Hoy" />
        </div>
      </div>

      {/* lista reciente */}
      <SectionHeaderS title="Historial reciente" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {monthSessions.slice().reverse().slice(0, 5).map(s => {
          const isMissedPending = s.status === 'missed' && s.isPendingRecovery;
          const isFailed = s.status === 'skipped' || (s.status === 'missed' && !s.isPendingRecovery);
          const tone = s.status === 'completed'
            ? { bg: 'rgba(34,197,94,0.12)', fg: '#22C55E', icon: 'check' }
            : isMissedPending
              ? { bg: 'rgba(245,158,11,0.12)', fg: '#F59E0B', icon: 'alarmClock' }
              : { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444', icon: 'x' };
          return (
            <div key={s.date} onClick={() => nav('dayDetail', { date: s.date })} style={{
              background: 'var(--color-card)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10,
                background: tone.bg, color: tone.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={tone.icon} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{s.routineName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                  {formatDateShortS(s.date)}
                  {isMissedPending && <span style={{ color: '#F59E0B', fontWeight: 600 }}> · Pendiente recuperar</span>}
                </div>
              </div>
              {s.durationMin && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.durationMin} min</span>}
              {isMissedPending && <Icon name="chevronRight" size={14} style={{ color: '#F59E0B' }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const nudgeBtn = { width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none',
  color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const Legend = ({ dot, ring, cross, today, pending, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    {dot && <span style={{ width: 10, height: 10, borderRadius: 3, background: dot }} />}
    {ring && <span style={{ width: 10, height: 10, borderRadius: 3, background: 'transparent',
      border: '1px solid var(--color-border)', position: 'relative' }}>
      <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
        width: 3, height: 3, borderRadius: 999, background: '#F14D5E' }} />
    </span>}
    {pending && <span style={{ width: 10, height: 10, borderRadius: 3,
      background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.55)',
      position: 'relative', color: '#F59E0B', fontSize: 7, fontWeight: 700,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      paddingTop: 0, paddingRight: 1, lineHeight: 1 }}>!</span>}
    {cross && <span style={{ width: 10, height: 10, borderRadius: 3, background: 'transparent',
      border: '1px dashed rgba(239,68,68,0.5)', color: '#EF4444', fontSize: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</span>}
    {today && <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(230,38,57,0.12)', border: '1px solid #E62639' }} />}
    <span>{label}</span>
  </div>
);

// ============================================================
// DAY DETAIL
// ============================================================
const DayDetailScreen = ({ date = DS.TODAY_DATE, nav, onStart }) => {
  const sess = DS.SESSIONS.find(s => s.date === date);
  const [py, pm, pd] = date.split('-').map(Number);
  const dow = new Date(py, pm - 1, pd).getDay();
  const isTraining = DS.PROGRAM.suggestedDays.includes(dow) || !!sess;
  const isToday = date === DS.TODAY_DATE;
  const isPast = date < DS.TODAY_DATE;
  const isMissedPending = sess?.status === 'missed' && sess?.isPendingRecovery;
  // Resuelve la rutina mostrada según routineId de la sesión
  const routine = sess?.routineId === 'r-legs' ? DS.LEGS_ROUTINE : DS.TODAY_ROUTINE;
  const pct = sess ? Math.round(((sess.completedSets || 0) / Math.max(1, sess.totalSets || routine.exercises.reduce((a,e)=>a+e.sets.length,0))) * 100) : 0;

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <KHeaderTop onBack={() => nav('calendar')} title={formatDateESS(date)} subtitle={isToday ? 'Hoy' : 'Detalle'} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <KBadge text={`Semana ${DS.PROGRAM.currentWeek}/${DS.PROGRAM.totalWeeks}`} variant="neutral" />
        {isTraining
          ? <KBadge text="Día de entrenamiento" variant="info" dot />
          : <KBadge text="Día de descanso" variant="neutral" />}
        {sess?.status === 'completed' && <KBadge text="✓ Completado" variant="success" />}
        {sess?.status === 'skipped' && <KBadge text="Faltado" variant="danger" />}
        {isMissedPending && <KBadge text="⚠ Pendiente recuperar" variant="warning" />}
      </div>

      {!isTraining && (
        <KEmptyState title="Día de descanso" subtitle="Aprovecha para recuperar. Sin entreno programado." icon={<Icon name="moon" size={28} />} />
      )}

      {isTraining && (
        <div style={{
          background: isMissedPending
            ? 'linear-gradient(135deg, #1f1409 0%, #16161A 100%)'
            : 'linear-gradient(135deg, #1a0a0d 0%, #16161A 100%)',
          border: isMissedPending
            ? '1.5px solid rgba(245,158,11,0.45)'
            : '1px solid rgba(230,38,57,0.35)',
          borderRadius: 18,
          padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.1, textTransform: 'uppercase',
            color: isMissedPending ? '#FBBF24' : '#F14D5E', marginBottom: 4 }}>
            {isMissedPending ? 'Rutina pendiente · plazo domingo' : 'Rutina asignada'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{routine.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>Programa: {DS.PROGRAM.name}</div>

          {sess && sess.status === 'completed' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <MiniTile label="Series" value={`${sess.completedSets}/${sess.totalSets}`} />
                {sess.durationMin && <MiniTile label="Duración" value={`${sess.durationMin}m`} />}
                <MiniTile label="Semana" value={`${DS.PROGRAM.currentWeek}/${DS.PROGRAM.totalWeeks}`} />
              </div>
              <KProgressBar percentage={pct} label={`${sess.completedSets} de ${sess.totalSets} series`} showLabel size="md" />
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <MiniTile label="Ejercicios" value={routine.exercises.length} />
              <MiniTile label="Series" value={routine.exercises.reduce((a,e)=>a+e.sets.length,0)} />
              <MiniTile label="Estimado" value={`${routine.estimatedMinutes}'`} />
            </div>
          )}

          {/* CTA recuperar — disponible si es pendiente, hoy también vale */}
          {isMissedPending && (
            <button onClick={() => onStart({ recoveringFrom: date })} style={{
              width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 12,
              background: '#F59E0B', color: '#0A0A0B', border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
            }}>
              <Icon name="rotateCw" size={16} />
              Recuperar este entreno
            </button>
          )}

          {/* CTA empezar — solo hoy y no pendiente */}
          {isToday && !isMissedPending && (
            <button onClick={() => onStart()} style={{
              width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 12,
              background: '#E62639', color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 6px 20px rgba(230,38,57,0.4)',
            }}>
              <Icon name="play" size={16} />
              {sess?.status === 'in_progress' ? 'Continuar entreno' : 'Empezar entreno'}
            </button>
          )}
          {!isToday && !sess && !isPast && (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
              Este día aún no ha llegado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const MiniTile = ({ label, value }) => (
  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
  </div>
);
const SectionHeaderS = ({ title, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{title}</div>
    {right}
  </div>
);

// ============================================================
// OVERVIEW — vista previa de rutina antes de empezar
// ============================================================
const OverviewScreen = ({ routine, recoveringFrom, nav, onStart }) => {
  const r = routine || DS.TODAY_ROUTINE;
  const totalSets = r.exercises.reduce((a, e) => a + e.sets.length, 0);
  const isRecovery = !!recoveringFrom;
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <KHeaderTop onBack={() => nav('home')} title={isRecovery ? 'Recuperar entreno' : 'Vista previa'} subtitle={isRecovery ? 'Pendiente del viernes' : 'Antes de empezar'} />

      {/* Banner recuperando */}
      {isRecovery && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.04) 100%)',
          border: '1px solid rgba(245,158,11,0.45)', borderRadius: 12,
          padding: '10px 12px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.18)',
            color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="rotateCw" size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24' }}>Recuperando viernes 14 nov</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Esta sesión cuenta como tu entreno de Legs pendiente</div>
          </div>
        </div>
      )}

      {/* hero */}
      <div style={{
        background: isRecovery
          ? 'linear-gradient(135deg, #1f1409 0%, #16161A 100%)'
          : 'linear-gradient(135deg, #2A0F14 0%, #16161A 100%)',
        border: isRecovery
          ? '1px solid rgba(245,158,11,0.40)'
          : '1px solid rgba(230,38,57,0.35)',
        borderRadius: 18, padding: 16, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: isRecovery ? 'rgba(245,158,11,0.20)' : 'rgba(230,38,57,0.2)',
            color: isRecovery ? '#FBBF24' : '#F14D5E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
          }}>{r.letter}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{r.focus}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <MiniTile label="Ejercicios" value={r.exercises.length} />
          <MiniTile label="Series" value={totalSets} />
          <MiniTile label="Min" value={r.estimatedMinutes} />
        </div>
      </div>

      {/* coach note */}
      {DS.COACH_NOTES[r.id] && (
        <div style={{
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: 12, marginBottom: 14, display: 'flex', gap: 10,
        }}>
          <KAvatar initials={DS.COACH.initials} size={30} color="#71717A" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{DS.COACH.name}</span>
              <KBadge text="Coach" variant="info" size="sm" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              {DS.COACH_NOTES[r.id]}
            </div>
          </div>
        </div>
      )}

      {/* exercises list */}
      <SectionHeaderS title="Ejercicios" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 90 }}>
        {r.exercises.map((ex, i) => (
          <div key={ex.id} style={{
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <KExerciseThumb name={ex.name} muscleGroup={ex.muscleGroup} photoUrl={ex.photoUrl} size={44} />
                <div style={{
                  position: 'absolute', top: -4, left: -4,
                  width: 18, height: 18, borderRadius: 6,
                  background: 'var(--color-card)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)',
                }}>
                  {i + 1}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{ex.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {ex.muscleGroup} · {ex.equipment} · {ex.sets.length} series
                </div>
              </div>
              <Icon name="chevronRight" size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            {/* set dots */}
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {ex.sets.map(s => {
                const meta = SET_TYPE_META[s.type];
                return <div key={s.id} style={{ width: 18, height: 4, borderRadius: 2, background: meta.dot, opacity: 0.9 }} />;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* sticky CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 64,
        background: 'linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.95) 30%)',
        padding: '20px 16px 16px',
      }}>
        <button onClick={onStart} style={{
          width: '100%', padding: '15px 16px', borderRadius: 12,
          background: isRecovery ? '#F59E0B' : '#E62639',
          color: isRecovery ? '#0A0A0B' : '#fff', border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: isRecovery ? '0 8px 24px rgba(245,158,11,0.45)' : '0 8px 24px rgba(230,38,57,0.45)',
        }}>
          <Icon name={isRecovery ? 'rotateCw' : 'play'} size={16} />
          {isRecovery ? 'Recuperar ahora' : 'Empezar ahora'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EXECUTE — logging de series con rest timer
// ============================================================
const ExecuteScreen = ({ routine, recoveringFrom, state, setState, nav, onFinish, pushToast }) => {
  const r = routine || DS.TODAY_ROUTINE;
  const isRecovery = !!recoveringFrom;
  const ex = r.exercises[state.exIndex];
  const [restOpen, setRestOpen] = useStateS(false);
  const [restSec, setRestSec] = useStateS(90);
  const [restTotal, setRestTotal] = useStateS(90);
  const [moreOpen, setMoreOpen] = useStateS(false);
  const [confirmFinish, setConfirmFinish] = useStateS(false);
  const [videoOpen, setVideoOpen] = useStateS(false);
  // ¿la serie completada fue la última del ejercicio? -> rest timer se vuelve hub de transición
  const [restIsTransition, setRestIsTransition] = useStateS(false);

  // tick timer
  useEffectS(() => {
    if (!restOpen) return;
    const t = setInterval(() => {
      setRestSec(s => {
        if (s <= 1) {
          // vibration + ping
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          setRestOpen(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [restOpen]);

  const setKey = (eid, sid) => `${eid}:${sid}`;
  const isSetDone = (eid, sid) => !!state.completed[setKey(eid, sid)];
  const getLog = (eid, sid) => state.completed[setKey(eid, sid)] || null;

  const totalSets = r.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = Object.keys(state.completed).length;

  const goPrev = () => setState(s => ({ ...s, exIndex: Math.max(0, s.exIndex - 1) }));
  const goNext = () => {
    if (state.exIndex < r.exercises.length - 1) {
      setState(s => ({ ...s, exIndex: s.exIndex + 1 }));
      // scroll del frame al inicio para no aterrizar a media pantalla
      const scroller = document.querySelector('[data-execute-scroll]');
      if (scroller) scroller.scrollTop = 0;
    } else onFinish();
  };

  const isLastExercise = state.exIndex === r.exercises.length - 1;
  const nextEx = !isLastExercise ? r.exercises[state.exIndex + 1] : null;

  const completeSet = (s, weight, reps, note) => {
    // detect PR
    const last = s.lastSession;
    const isPR = last && (weight > last.weight || (weight === last.weight && reps > last.reps));
    const key = setKey(ex.id, s.id);
    setState(st => ({ ...st, completed: { ...st.completed, [key]: { weight, reps, isPR, note: note || '' } } }));
    if (isPR) {
      pushToast({ variant: 'pr', title: '¡Nuevo record!', message: `${ex.name} · ${weight}kg × ${reps}`, duration: 4000 });
      if (navigator.vibrate) navigator.vibrate([100, 60, 100, 60, 200]);
    }
    // ¿era la última serie pendiente del ejercicio?
    const remainingAfter = ex.sets.filter(ss => ss.id !== s.id && !isSetDone(ex.id, ss.id)).length;
    setRestIsTransition(remainingAfter === 0);
    // start rest timer
    setRestTotal(s.restSec);
    setRestSec(s.restSec);
    setRestOpen(true);
  };

  const updateSetNote = (sid, note) => {
    const key = setKey(ex.id, sid);
    setState(st => {
      const existing = st.completed[key];
      if (!existing) {
        // store pending note even if set not completed
        return { ...st, completed: { ...st.completed, [`pending:${key}`]: { note } } };
      }
      return { ...st, completed: { ...st.completed, [key]: { ...existing, note } } };
    });
  };

  const updateExerciseFeedback = (eid, patch) => {
    setState(st => ({
      ...st,
      exerciseFeedback: { ...st.exerciseFeedback, [eid]: { ...(st.exerciseFeedback[eid] || {}), ...patch } },
    }));
  };

  const allSetsDone = ex.sets.every(s => isSetDone(ex.id, s.id));
  const exFeedback = state.exerciseFeedback?.[ex.id] || {};

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div data-execute-scroll style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
        padding: '12px 16px 96px',
        scrollbarWidth: 'none',
      }} className="scroll-thin">
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => nav('home')} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="x" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase',
            color: isRecovery ? '#FBBF24' : '#F14D5E',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            {isRecovery && <Icon name="rotateCw" size={11} />}
            {isRecovery ? `Recuperando viernes · ${doneSets}/${totalSets}` : `Entreno en curso · ${doneSets}/${totalSets}`}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMoreOpen(v => !v)} aria-label="Más opciones" style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon name="moreHorizontal" size={16} />
          </button>
          {moreOpen && (
            <>
              <div onClick={() => setMoreOpen(false)} style={{
                position: 'fixed', inset: 0, zIndex: 30,
              }} />
              <div style={{
                position: 'absolute', top: 42, right: 0, zIndex: 31,
                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                borderRadius: 12, padding: 6, minWidth: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                animation: 'k-fade-in 0.15s ease-out',
              }}>
                <button onClick={() => { setMoreOpen(false); setConfirmFinish(true); }} style={{
                  width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                  color: '#22C55E', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Icon name="checkCircle" size={14} /> Terminar entreno
                </button>
                <button onClick={() => { setMoreOpen(false); nav('home'); }} style={{
                  width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                  color: 'var(--color-text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Icon name="pause" size={14} /> Pausar y salir
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* progress dots per exercise */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
        {r.exercises.map((e, i) => {
          const done = e.sets.every(s => isSetDone(e.id, s.id));
          const current = i === state.exIndex;
          const currentColor = isRecovery ? '#F59E0B' : '#E62639';
          return (
            <div key={e.id} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: done ? '#22C55E' : current ? currentColor : 'rgba(255,255,255,0.08)',
              boxShadow: current ? `0 0 6px ${currentColor}80` : 'none',
            }} />
          );
        })}
      </div>

      {/* exercise header */}
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: 14, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            Ejercicio {state.exIndex + 1}/{r.exercises.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {state.exIndex > 0 && <button onClick={goPrev} style={navArrow}><Icon name="chevronLeft" size={14} /></button>}
            <button onClick={goNext} style={navArrow}><Icon name="chevronRight" size={14} /></button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <KExerciseThumb name={ex.name} muscleGroup={ex.muscleGroup} photoUrl={ex.photoUrl} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-text)', letterSpacing: -0.01, lineHeight: 1.15 }}>{ex.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <KBadge text={ex.muscleGroup} variant="info" size="sm" />
              <KBadge text={ex.equipment} variant="neutral" size="sm" />
              {ex.videoUrl && (
                <button
                  onClick={() => setVideoOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px 3px 6px', borderRadius: 999,
                    background: 'rgba(230,38,57,0.12)',
                    border: '1px solid rgba(230,38,57,0.35)',
                    color: '#F87171',
                    fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Icon name="playCircle" size={13} />
                  Ver demo
                </button>
              )}
            </div>
          </div>
        </div>
        {ex.note && (
          <div style={{
            marginTop: 10, padding: '8px 10px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10, fontSize: 12, color: '#FBBF24', lineHeight: 1.4,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <Icon name="infoCircle" size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{ex.note}</span>
          </div>
        )}
      </div>

      {/* sets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {ex.sets.map((s, i) => (
          <SetRow key={s.id} set={s} index={i + 1}
            done={isSetDone(ex.id, s.id)}
            log={getLog(ex.id, s.id)}
            onComplete={(w, r, note) => completeSet(s, w, r, note)}
            onSaveNote={(note) => updateSetNote(s.id, note)}
          />
        ))}
      </div>

      {/* Exercise feedback — appears when all sets done */}
      {allSetsDone && (
        <ExerciseFeedbackCard
          feedback={exFeedback}
          onChange={(patch) => updateExerciseFeedback(ex.id, patch)}
        />
      )}

      </div>
      {/* /scroller — los overlays viven fuera para anclarse al viewport del frame */}

      {/* Rest timer sheet */}
      {restOpen && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, zIndex: 40,
          background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'k-fade-in 0.25s ease-out',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.1, textTransform: 'uppercase', color: '#F14D5E', marginBottom: 24 }}>
            {restIsTransition ? 'Descanso · Ejercicio completo' : 'Descanso'}
          </div>
          <KRing
            percentage={((restTotal - restSec) / restTotal) * 100}
            size={restIsTransition ? 180 : 220} stroke={14} pulse
            color="#E62639"
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: restIsTransition ? 44 : 56, color: 'var(--color-text)',
                letterSpacing: -0.03, lineHeight: 1 }}>
                {String(Math.floor(restSec / 60)).padStart(2, '0')}:{String(restSec % 60).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                {restIsTransition
                  ? (nextEx ? 'Próximo ejercicio listo' : 'Último ejercicio')
                  : `Siguiente: serie ${(ex.sets.findIndex(ss => !isSetDone(ex.id, ss.id)) + 1) || '—'}`}
              </div>
            </div>
          </KRing>

          {/* Transición: tarjeta del próximo ejercicio o terminar */}
          {restIsTransition && (
            <div style={{ marginTop: 20, width: '100%', maxWidth: 320 }}>
              {nextEx ? (
                <button onClick={() => { setRestOpen(false); goNext(); }} style={{
                  width: '100%', padding: 12, borderRadius: 14,
                  background: 'linear-gradient(135deg, #E62639 0%, #B81E2E 100%)',
                  border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  textAlign: 'left', boxShadow: '0 8px 24px rgba(230,38,57,0.35)',
                }}>
                  <KExerciseThumb name={nextEx.name} muscleGroup={nextEx.muscleGroup} photoUrl={nextEx.photoUrl} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
                      Siguiente · {state.exIndex + 2}/{r.exercises.length}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextEx.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
                      {nextEx.sets.length} series · {nextEx.muscleGroup}
                    </div>
                  </div>
                  <Icon name="chevronRight" size={20} />
                </button>
              ) : (
                <button onClick={() => { setRestOpen(false); setConfirmFinish(true); }} style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
                }}>
                  <Icon name="checkCircle" size={18} /> Terminar entreno
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: restIsTransition ? 16 : 28 }}>
            <button onClick={() => setRestSec(s => Math.max(0, s - 15))} style={timerBtn}>
              −15s
            </button>
            <button onClick={() => setRestOpen(false)} style={{
              ...timerBtn,
              background: restIsTransition ? 'var(--color-bg-raised)' : '#E62639',
              color: restIsTransition ? 'var(--color-text-muted)' : '#fff',
              borderColor: restIsTransition ? 'var(--color-border)' : '#E62639',
              padding: '10px 20px',
            }}>
              {restIsTransition ? 'Cerrar' : <><Icon name="chevronsRight" size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Saltar</>}
            </button>
            <button onClick={() => setRestSec(s => s + 15)} style={timerBtn}>
              +15s
            </button>
          </div>
          {!restIsTransition && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="vibrate" size={12} /> Vibrará al terminar
            </div>
          )}
        </div>
      )}

      {/* Sticky bottom CTA — cambia según estado del ejercicio actual */}
      {!restOpen && !confirmFinish && (
        <StickyExerciseCTA
          ex={ex}
          allSetsDone={allSetsDone}
          doneSetsInEx={ex.sets.filter(s => isSetDone(ex.id, s.id)).length}
          totalSetsInEx={ex.sets.length}
          nextEx={nextEx}
          isLastExercise={isLastExercise}
          isRecovery={isRecovery}
          onNext={goNext}
          onFinish={() => setConfirmFinish(true)}
        />
      )}

      {/* Video demo overlay */}
      {videoOpen && ex.videoUrl && (
        <VideoDemoOverlay
          url={ex.videoUrl}
          exerciseName={ex.name}
          onClose={() => setVideoOpen(false)}
        />
      )}

      {/* Confirmación terminar antes */}
      {confirmFinish && (
        <FinishConfirmDialog
          doneSets={doneSets}
          totalSets={totalSets}
          onCancel={() => setConfirmFinish(false)}
          onConfirm={() => { setConfirmFinish(false); onFinish(); }}
        />
      )}
    </div>
  );
};
const navArrow = {
  width: 26, height: 26, borderRadius: 7,
  background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

// ============================================================
// VIDEO DEMO OVERLAY — reproduce demo de YouTube embebida
// ============================================================
const VideoDemoOverlay = ({ url, exerciseName, onClose }) => {
  // Convierte URLs comunes a embed
  const embedUrl = (() => {
    if (!url) return '';
    if (url.includes('/embed/')) return url + (url.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    return url;
  })();
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 90,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'k-fade-in 0.18s ease-out',
        padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380,
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* header */}
        <div style={{
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--color-border-light)',
        }}>
          <Icon name="playCircle" size={16} style={{ color: 'var(--color-primary)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              Demo del coach
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {exerciseName}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1, fontFamily: 'inherit',
            }}
          >×</button>
        </div>
        {/* video */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
          <iframe
            src={embedUrl}
            title={exerciseName}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      </div>
    </div>
  );
};

const timerBtn = {
  padding: '10px 16px', borderRadius: 12,
  background: 'var(--color-card)', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

// === Sticky bottom CTA — siempre visible, cambia según estado ===
const StickyExerciseCTA = ({ ex, allSetsDone, doneSetsInEx, totalSetsInEx, nextEx, isLastExercise, isRecovery, onNext, onFinish }) => {
  // Estado A: aún hay series pendientes en este ejercicio -> barra informativa discreta
  if (!allSetsDone) {
    return (
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
        padding: '10px 14px',
        background: 'linear-gradient(180deg, rgba(9,9,11,0) 0%, rgba(9,9,11,0.92) 35%)',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(230,38,57,0.14)', color: '#F14D5E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
          }}>
            {doneSetsInEx}/{totalSetsInEx}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              Series del ejercicio
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
              {totalSetsInEx - doneSetsInEx === 1 ? 'Falta 1 serie' : `Faltan ${totalSetsInEx - doneSetsInEx} series`}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado B: todas las series completas, hay siguiente -> CTA prominente "Siguiente"
  if (!isLastExercise && nextEx) {
    return (
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
        padding: '12px 14px 14px',
        background: 'linear-gradient(180deg, rgba(9,9,11,0) 0%, rgba(9,9,11,0.95) 30%)',
      }}>
        <button onClick={onNext} style={{
          width: '100%', padding: 10, borderRadius: 14,
          background: 'linear-gradient(135deg, #E62639 0%, #B81E2E 100%)',
          border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          textAlign: 'left',
          boxShadow: '0 10px 28px rgba(230,38,57,0.4)',
          animation: 'k-fade-in 0.3s ease-out',
        }}>
          <KExerciseThumb name={nextEx.name} muscleGroup={nextEx.muscleGroup} photoUrl={nextEx.photoUrl} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>
              Siguiente ejercicio
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextEx.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
              {nextEx.sets.length} series · {nextEx.muscleGroup}
            </div>
          </div>
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
    );
  }

  // Estado C: último ejercicio completo -> Terminar
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
      padding: '12px 14px 14px',
      background: 'linear-gradient(180deg, rgba(9,9,11,0) 0%, rgba(9,9,11,0.95) 30%)',
    }}>
      <button onClick={onFinish} style={{
        width: '100%', padding: '14px 16px', borderRadius: 14,
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        border: '1px solid rgba(255,255,255,0.18)', color: '#fff',
        fontSize: 15, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 10px 28px rgba(34,197,94,0.4)',
        animation: 'k-fade-in 0.3s ease-out',
      }}>
        <Icon name="checkCircle" size={18} /> Terminar entreno · {isRecovery ? 'recuperación' : 'sesión'} completa
      </button>
    </div>
  );
};

// === Confirmación terminar antes de tiempo ===
const FinishConfirmDialog = ({ doneSets, totalSets, onCancel, onConfirm }) => {
  const incomplete = doneSets < totalSets;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'k-fade-in 0.2s ease-out',
    }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'relative',
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '20px 18px 24px', width: '100%',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)',
          margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: incomplete ? 'rgba(245,158,11,0.14)' : 'rgba(34,197,94,0.14)',
            color: incomplete ? '#F59E0B' : '#22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={incomplete ? 'infoCircle' : 'checkCircle'} size={18} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-text)' }}>
            {incomplete ? '¿Terminar antes?' : '¿Terminar entreno?'}
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 18 }}>
          {incomplete
            ? `Has completado ${doneSets} de ${totalSets} series. Las series sin registrar no se guardarán.`
            : `Has completado las ${totalSets} series. Vamos a guardar tu sesión.`}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px', borderRadius: 12,
            background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Seguir
          </button>
          <button onClick={onConfirm} style={{
            flex: 1.4, padding: '12px', borderRadius: 12,
            background: incomplete ? '#F59E0B' : '#22C55E',
            border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            {incomplete ? 'Terminar igual' : 'Terminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Feedback de ejercicio — RPE + nota (aparece tras completar todas las series)
const ExerciseFeedbackCard = ({ feedback, onChange }) => {
  const rpe = feedback.rpe || null;
  const note = feedback.note || '';
  const RPE_LABELS = {
    1: 'Muy fácil', 2: 'Fácil', 3: 'Cómodo', 4: 'Algo de esfuerzo', 5: 'Moderado',
    6: 'Difícil', 7: 'Muy difícil', 8: 'Casi al límite', 9: '1 rep en reserva', 10: 'Al fallo',
  };
  const rpeColor = (n) => n >= 9 ? '#EF4444' : n >= 7 ? '#F59E0B' : n >= 5 ? '#FBBF24' : '#22C55E';
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)',
      border: '1px solid rgba(34,197,94,0.30)', borderRadius: 14,
      padding: 14, marginBottom: 20,
      animation: 'k-fade-in 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 7,
          background: 'rgba(34,197,94,0.18)', color: '#22C55E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="check" size={13} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          Ejercicio completo · ¿cómo se sintió?
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        Tu coach lo verá para ajustar la próxima sesión
      </div>

      {/* RPE scale 1-10 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          Esfuerzo (RPE)
        </span>
        {rpe && (
          <span style={{ fontSize: 11, fontWeight: 700, color: rpeColor(rpe) }}>
            {rpe} · {RPE_LABELS[rpe]}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const active = rpe === n;
          const filled = rpe && n <= rpe;
          return (
            <button key={n}
              onClick={() => onChange({ rpe: rpe === n ? null : n })}
              style={{
                flex: 1, height: 32, borderRadius: 6,
                background: filled ? rpeColor(rpe) : 'rgba(255,255,255,0.05)',
                border: active ? `2px solid ${rpeColor(rpe)}` : '1px solid var(--color-border)',
                color: filled ? '#0A0A0B' : 'var(--color-text-secondary)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>{n}</button>
          );
        })}
      </div>

      {/* note */}
      <textarea
        value={note}
        onChange={(e) => onChange({ note: e.target.value })}
        placeholder="Comentarios sobre el ejercicio (opcional)…"
        rows={2}
        style={{
          width: '100%', resize: 'none',
          background: 'var(--color-bg-raised)',
          border: '1px solid var(--color-border)', borderRadius: 8,
          padding: '8px 10px', color: 'var(--color-text)',
          fontSize: 12, fontFamily: 'var(--font-body)',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
};

// set row editor
const SetRow = ({ set, index, done, log, onComplete, onSaveNote }) => {
  const meta = SET_TYPE_META[set.type];
  const [w, setW] = useStateS(log?.weight ?? set.targetWeight);
  const [r, setR] = useStateS(log?.reps ?? (typeof set.targetReps === 'string' && isNaN(Number(set.targetReps)) ? 8 : Number(set.targetReps)));
  const [noteOpen, setNoteOpen] = useStateS(false);
  const [noteDraft, setNoteDraft] = useStateS(log?.note ?? '');
  const disabled = done;
  const hasNote = !!(log?.note && log.note.trim());

  const QUICK_TAGS = [
    { key: 'easy',   label: 'Fácil — subir peso',  color: '#22C55E' },
    { key: 'good',   label: 'Bien',                 color: '#3B82F6' },
    { key: 'hard',   label: 'Pesado',               color: '#F59E0B' },
    { key: 'pain',   label: 'Dolor / molestia',     color: '#EF4444' },
    { key: 'form',   label: 'Forma incorrecta',     color: '#A855F7' },
  ];

  const saveNote = (text) => {
    setNoteDraft(text);
    onSaveNote(text);
  };

  return (
    <div style={{
      background: done ? 'rgba(34,197,94,0.06)' : 'var(--color-card)',
      border: `1px solid ${done ? 'rgba(34,197,94,0.30)' : 'var(--color-border)'}`,
      borderRadius: 14, padding: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      {done && <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: '#22C55E',
      }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
            color: done ? '#22C55E' : 'var(--color-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>{done ? <Icon name="check" size={14} /> : index}</div>
          <KSetTypePill type={set.type} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          Objetivo: {set.targetWeight > 0 ? `${set.targetWeight}kg × ` : ''}{set.targetReps}
        </div>
      </div>

      {set.lastSession && !done && (
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="clock" size={10} /> Última: {set.lastSession.weight}kg × {set.lastSession.reps}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <NumberStepper label="Peso (kg)" value={w} step={2.5} onChange={setW} disabled={disabled} />
        <NumberStepper label="Reps" value={r} step={1} onChange={setR} disabled={disabled} />
        {/* Note btn — siempre visible */}
        <button
          onClick={() => setNoteOpen(v => !v)}
          title={hasNote ? 'Editar nota' : 'Añadir nota para tu coach'}
          style={{
            padding: '12px 10px', borderRadius: 12,
            background: hasNote ? 'rgba(245,158,11,0.15)' : 'var(--color-bg-raised)',
            border: `1px solid ${hasNote ? 'rgba(245,158,11,0.4)' : 'var(--color-border)'}`,
            color: hasNote ? '#FBBF24' : 'var(--color-text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative',
          }}>
          <Icon name="messageCircle" size={14} />
          {hasNote && <span style={{
            position: 'absolute', top: 4, right: 4, width: 6, height: 6,
            borderRadius: 999, background: '#FBBF24',
          }} />}
        </button>
        {!done ? (
          <button onClick={() => onComplete(w, r, noteDraft)} style={{
            padding: '12px 14px', borderRadius: 12,
            background: '#E62639', color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(230,38,57,0.4)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="check" size={14} />
          </button>
        ) : (
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(34,197,94,0.12)', color: '#22C55E',
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {log.weight}kg × {log.reps}
            {log.isPR && <span style={{ fontSize: 10, color: '#F14D5E', marginLeft: 4 }}>🏆</span>}
          </div>
        )}
      </div>

      {/* note editor inline */}
      {noteOpen && (
        <div style={{
          marginTop: 10, padding: 10,
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10,
          animation: 'k-fade-in 0.2s ease-out',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.06, textTransform: 'uppercase', color: '#FBBF24', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="messageCircle" size={11} /> Nota para tu coach
          </div>
          {/* quick tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {QUICK_TAGS.map(t => {
              const active = noteDraft.includes(t.label);
              return (
                <button key={t.key}
                  onClick={() => saveNote(active ? noteDraft.replace(t.label, '').replace(/^[·,\s]+|[·,\s]+$/g, '').trim() : (noteDraft ? `${noteDraft} · ${t.label}` : t.label))}
                  style={{
                    padding: '5px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: active ? `${t.color}22` : 'transparent',
                    border: `1px solid ${active ? t.color : 'var(--color-border)'}`,
                    color: active ? t.color : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}>{t.label}</button>
              );
            })}
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => saveNote(e.target.value)}
            placeholder="Escribe una nota libre…"
            rows={2}
            style={{
              width: '100%', resize: 'none',
              background: 'var(--color-bg-raised)',
              border: '1px solid var(--color-border)', borderRadius: 8,
              padding: '8px 10px', color: 'var(--color-text)',
              fontSize: 12, fontFamily: 'var(--font-body)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            {hasNote && (
              <button onClick={() => { saveNote(''); setNoteOpen(false); }} style={{
                padding: '6px 10px', borderRadius: 8,
                background: 'transparent', border: 'none',
                color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Borrar</button>
            )}
            <button onClick={() => setNoteOpen(false)} style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.4)',
              color: '#FBBF24', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Listo</button>
          </div>
        </div>
      )}
    </div>
  );
};
const NumberStepper = ({ label, value, step, onChange, disabled }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'stretch', background: 'var(--color-bg-raised)',
      border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden',
      opacity: disabled ? 0.5 : 1 }}>
      <button disabled={disabled} onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))} style={stepBtn}>−</button>
      <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontFamily: 'var(--font-display)',
        fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{value}</div>
      <button disabled={disabled} onClick={() => onChange(+(value + step).toFixed(2))} style={stepBtn}>+</button>
    </div>
  </div>
);
const stepBtn = {
  width: 32, background: 'transparent', border: 'none', color: 'var(--color-text)',
  fontSize: 18, fontWeight: 700, cursor: 'pointer',
};

// ============================================================
// COMPLETE — resumen de entreno
// ============================================================
const CompleteScreen = ({ routine, recoveringFrom, state, setState, nav }) => {
  const r = routine || DS.TODAY_ROUTINE;
  const isRecovery = !!recoveringFrom;
  const logs = Object.values(state.completed).filter(l => l && typeof l.weight === 'number');
  const prs = logs.filter(l => l.isPR).length;
  const totalVol = logs.reduce((a, l) => a + (l.weight || 0) * (l.reps || 0), 0);
  const totalSets = r.exercises.reduce((a, e) => a + e.sets.length, 0);
  const duration = 58; // ficticio

  // count notes coach will see
  const setNotesCount = logs.filter(l => l.note && l.note.trim()).length;
  const exFeedbackCount = Object.values(state.exerciseFeedback || {}).filter(f => f.rpe || (f.note && f.note.trim())).length;

  const sessionFB = state.sessionFeedback || { mood: null, note: '' };
  const setMood = (mood) => setState(st => ({ ...st, sessionFeedback: { ...st.sessionFeedback, mood } }));
  const setSessionNote = (note) => setState(st => ({ ...st, sessionFeedback: { ...st.sessionFeedback, note } }));

  const MOODS = [
    { key: 'exhausted', emoji: '😫', label: 'Agotado',     color: '#EF4444' },
    { key: 'tough',     emoji: '😐', label: 'Justo',        color: '#F59E0B' },
    { key: 'good',      emoji: '💪', label: 'Bien',         color: '#22C55E' },
    { key: 'fire',      emoji: '🔥', label: 'A tope',        color: '#E62639' },
  ];

  return (
    <div style={{ padding: '20px 16px 0', textAlign: 'center' }}>
      <div style={{ margin: '12px auto 16px', width: 140, height: 140, position: 'relative' }}>
        <KRing percentage={100} size={140} stroke={8} color={isRecovery ? '#F59E0B' : '#22C55E'}>
          <div style={{ width: 70, height: 70, borderRadius: 999,
            background: isRecovery ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isRecovery ? '#F59E0B' : '#22C55E' }}>
            <Icon name={isRecovery ? 'rotateCw' : 'check'} size={42} strokeWidth={2.5} />
          </div>
        </KRing>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: -0.02,
        color: 'var(--color-text)', marginBottom: 4 }}>
        {isRecovery ? '¡Entreno recuperado!' : '¡Entreno completado!'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
        {r.name} · {isRecovery ? 'Recuperado del viernes 14' : `Semana ${DS.PROGRAM.currentWeek}`}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <KStatCard label="Duración" value={`${duration}m`} />
        <KStatCard label="Series" value={`${logs.length}/${totalSets}`} />
        <KStatCard label="Volumen" value={`${Math.round(totalVol)}kg`} />
      </div>

      {prs > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #2A0F14 0%, #16161A 100%)',
          border: '1px solid rgba(230,38,57,0.45)',
          borderRadius: 16, padding: 14, marginBottom: 14, textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12,
            background: 'rgba(230,38,57,0.2)', color: '#F14D5E',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trophy" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{prs} records superados</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Guardados en tu historial
            </div>
          </div>
        </div>
      )}

      {/* MOOD + nota para coach */}
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: 14, marginBottom: 14, textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Icon name="messageCircle" size={14} style={{ color: '#F14D5E' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
            ¿Cómo te sentiste hoy?
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Tu coach lo verá en su feed
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {MOODS.map(m => {
            const active = sessionFB.mood === m.key;
            return (
              <button key={m.key}
                onClick={() => setMood(active ? null : m.key)}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 12,
                  background: active ? `${m.color}22` : 'var(--color-bg-raised)',
                  border: active ? `1.5px solid ${m.color}` : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{m.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 600,
                  color: active ? m.color : 'var(--color-text-secondary)' }}>{m.label}</span>
              </button>
            );
          })}
        </div>
        <textarea
          value={sessionFB.note}
          onChange={(e) => setSessionNote(e.target.value)}
          placeholder="Cuéntale a tu coach algo del entreno (opcional)…"
          rows={3}
          style={{
            width: '100%', resize: 'none',
            background: 'var(--color-bg-raised)',
            border: '1px solid var(--color-border)', borderRadius: 10,
            padding: '10px 12px', color: 'var(--color-text)',
            fontSize: 13, fontFamily: 'var(--font-body)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {(setNotesCount > 0 || exFeedbackCount > 0) && (
          <div style={{
            marginTop: 10, padding: '8px 10px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8, fontSize: 11, color: '#FBBF24',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon name="infoCircle" size={12} />
            <span>
              También enviaremos
              {setNotesCount > 0 && ` ${setNotesCount} ${setNotesCount === 1 ? 'nota' : 'notas'} de series`}
              {setNotesCount > 0 && exFeedbackCount > 0 && ' +'}
              {exFeedbackCount > 0 && ` ${exFeedbackCount} ${exFeedbackCount === 1 ? 'feedback' : 'feedbacks'} de ejercicios`}
            </span>
          </div>
        )}
      </div>

      <button onClick={() => nav('home')} style={{
        width: '100%', padding: '14px 16px', borderRadius: 12,
        background: '#E62639', color: '#fff', border: 'none', cursor: 'pointer',
        fontSize: 15, fontWeight: 700,
        boxShadow: '0 4px 14px rgba(230,38,57,0.4)',
      }}>
        Enviar y volver al inicio
      </button>
      <button onClick={() => nav('progress')} style={{
        width: '100%', padding: '12px 16px', borderRadius: 12, marginTop: 10, marginBottom: 20,
        background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', cursor: 'pointer',
        fontSize: 13, fontWeight: 600,
      }}>
        Ver progreso
      </button>
    </div>
  );
};

// ============================================================
// PROGRESS — PRs, medidas, fotos
// ============================================================
const ProgressScreen = ({ nav }) => {
  const [tab, setTab] = useStateS('Records');
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <KHeaderTop title="Progreso" subtitle="Tu evolución" />
      <div style={{ marginBottom: 16 }}>
        <KSegmented options={['Records', 'Medidas', 'Fotos']} selected={tab} onChange={setTab} />
      </div>
      {tab === 'Records' && <RecordsTab />}
      {tab === 'Medidas' && <MeasuresTab />}
      {tab === 'Fotos' && <PhotosTab />}
    </div>
  );
};

const RecordsTab = () => {
  const recs = DS.RECORDS;
  const thisMonth = recs.filter(r => r.achievedAt.startsWith('2025-11')).length;
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <KStatCard label="PRs totales" value={recs.length} valueColor="#E62639" />
        <KStatCard label="Este mes" value={thisMonth} valueColor="#22C55E" />
        <KStatCard label="Tendencia" value="+2" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recs.map(pr => (
          <div key={pr.id} style={{
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <KExerciseThumb name={pr.exerciseName} muscleGroup={pr.muscleGroup} photoUrl={pr.photoUrl} size={44} />
              <div style={{
                position: 'absolute', bottom: -3, right: -3,
                width: 18, height: 18, borderRadius: 6,
                background: '#E62639', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--color-card)',
              }}>
                <Icon name="trophy" size={10} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.exerciseName}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {pr.weight}kg × {pr.reps} reps · {formatDateShortS(pr.achievedAt)}
              </div>
            </div>
            <KBadge text={`${pr.weight} kg`} variant="success" />
          </div>
        ))}
      </div>
    </div>
  );
};

const MeasuresTab = () => {
  const metrics = DS.METRICS;
  const latest = metrics[0];
  const prev = metrics[metrics.length - 1];
  const weightDelta = (latest.weight - prev.weight).toFixed(1);
  const bfDelta = (latest.bodyFat - prev.bodyFat).toFixed(1);

  return (
    <div>
      {/* hero deltas */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <DeltaCard label="Peso actual" value={`${latest.weight} kg`} delta={weightDelta} unit="kg" positive={false} />
        <DeltaCard label="Grasa corporal" value={`${latest.bodyFat}%`} delta={bfDelta} unit="pt" positive={false} />
      </div>

      {/* trend chart placeholder */}
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: 14, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Peso · 30 días</span>
          <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>↓ 1.2 kg</span>
        </div>
        <SparkChart data={[59.4, 59.2, 59.0, 58.8, 58.9, 58.7, 58.5, 58.4, 58.2, 58.2]} />
      </div>

      {/* add button */}
      <button style={{
        width: '100%', padding: '12px 14px', borderRadius: 12,
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        color: 'var(--color-primary)', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Icon name="plus" size={14} /> Registrar nueva medida
      </button>

      <SectionHeaderS title="Historial" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {metrics.map(m => (
          <div key={m.id} style={{
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
            borderRadius: 14, padding: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDateShortS(m.recordedAt)}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{m.weight} kg</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{m.bodyFat}% grasa</span>
              </div>
            </div>
            {m.notes && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{m.notes}</div>}
            {m.measurements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {m.measurements.map(x => (
                  <span key={x.type} style={{
                    fontSize: 10, padding: '3px 7px', borderRadius: 6,
                    background: 'var(--color-bg-raised)', color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}>
                    {x.type} · {x.value} cm
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
const DeltaCard = ({ label, value, delta, unit, positive }) => {
  const n = parseFloat(delta);
  const good = n < 0 ? !positive : positive;
  return (
    <div style={{
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
      borderRadius: 14, padding: '12px 14px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-text)', marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: good ? '#22C55E' : '#EF4444', fontWeight: 600, marginTop: 6,
        display: 'flex', alignItems: 'center', gap: 3 }}>
        <Icon name={n < 0 ? 'arrowDownRight' : 'arrowUpRight'} size={10} />
        {Math.abs(n)} {unit} · 30d
      </div>
    </div>
  );
};
const SparkChart = ({ data }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 300, h = 60;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h * 0.9 - 3}`).join(' ');
  const last = data[data.length - 1];
  const lx = w, ly = h - ((last - min) / range) * h * 0.9 - 3;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 60 }}>
      <defs>
        <linearGradient id="spark-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#E62639" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E62639" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="url(#spark-g)" />
      <polyline points={pts} fill="none" stroke="#E62639" strokeWidth="2" />
      <circle cx={lx} cy={ly} r="3" fill="#E62639" />
    </svg>
  );
};

const PhotosTab = () => {
  const byDate = useMemoS(() => {
    const map = {};
    DS.PHOTOS.forEach(p => {
      map[p.takenAt] = map[p.takenAt] || [];
      map[p.takenAt].push(p);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, []);
  return (
    <div>
      <button style={{
        width: '100%', padding: '14px', borderRadius: 12,
        background: 'var(--color-card)', border: '1px dashed var(--color-border)',
        color: 'var(--color-primary)', cursor: 'pointer', marginBottom: 14,
        fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Icon name="camera" size={14} /> Nueva foto de progreso
      </button>
      {byDate.map(([date, photos]) => (
        <div key={date} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{formatDateShortS(date)}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{photos[0].notes}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {photos.map(p => (
              <div key={p.id} style={{
                aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden',
                background: 'linear-gradient(135deg, #1E1E24 0%, #16161A 100%)',
                border: '1px solid var(--color-border)', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="user" size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                <span style={{
                  position: 'absolute', bottom: 6, left: 6,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  padding: '2px 6px', borderRadius: 5,
                  fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: 0.04, textTransform: 'uppercase',
                }}>
                  {({ Front: 'Frente', Side: 'Lateral', Back: 'Espalda' })[p.angle]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// PROFILE
// ============================================================
const ProfileScreen = ({ nav }) => {
  const s = DS.STUDENT;
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <KHeaderTop title="Perfil" />
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: 18, marginBottom: 14, textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <KAvatar initials={s.initials} size={72} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-text)' }}>{s.name}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{s.email}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <KBadge text={s.goal} variant="info" />
          <KBadge text="Desde sept 24" variant="neutral" />
        </div>
      </div>

      {/* quick stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <KStatCard label="Peso" value={`${s.weight} kg`} />
        <KStatCard label="Grasa" value={`${s.bodyFat}%`} />
        <KStatCard label="Altura" value={`${s.height} cm`} />
      </div>

      <SectionHeaderS title="Mi coach" />
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: 12, marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <KAvatar initials={DS.COACH.initials} size={42} color="#71717A" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{DS.COACH.name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{DS.COACH.handle}</div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(230,38,57,0.12)', border: '1px solid rgba(230,38,57,0.35)',
          color: '#F14D5E', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="messageCircle" size={16} />
        </button>
      </div>

      <SectionHeaderS title="Ajustes" />
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
      }}>
        {[
          { icon: 'bell', label: 'Notificaciones', value: 'Activadas' },
          { icon: 'ruler', label: 'Unidades', value: 'Métrico (kg/cm)' },
          { icon: 'vibrate', label: 'Vibración en timer', value: 'Activada' },
          { icon: 'moon', label: 'Tema', value: 'Oscuro' },
          { icon: 'infoCircle', label: 'Sobre Kondix', value: null },
        ].map((r, i, arr) => (
          <div key={r.label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--color-border-light)',
            cursor: 'pointer',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8,
              background: 'var(--color-bg-raised)', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--color-text)' }}>{r.label}</div>
            {r.value && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.value}</div>}
            <Icon name="chevronRight" size={14} style={{ color: 'var(--color-text-muted)' }} />
          </div>
        ))}
      </div>

      <button style={{
        width: '100%', padding: '12px 14px', borderRadius: 12,
        background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
        color: '#EF4444', cursor: 'pointer',
        fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Icon name="logOut" size={14} /> Cerrar sesión
      </button>
    </div>
  );
};

Object.assign(window, {
  CalendarScreen, DayDetailScreen, OverviewScreen, ExecuteScreen,
  CompleteScreen, ProgressScreen, ProfileScreen,
});

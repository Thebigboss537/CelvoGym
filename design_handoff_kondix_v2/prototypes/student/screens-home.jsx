// Pantallas de la vista alumno — Kondix.
// Export: Screens.{Home, Calendar, DayDetail, Overview, Execute, Complete, Progress, Profile}

const D = window.KONDIX_DATA;

// ------- helpers -------
const formatDateES = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};
const formatDateShort = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// ============================================================
// HOME — 3 variantes: 'hero', 'minimal', 'ritual'
// ============================================================
const HomeScreen = ({ variant = 'hero', nav, hasActiveSession, onStartToday }) => {
  const student = D.STUDENT;
  const program = D.PROGRAM;
  const routine = D.TODAY_ROUTINE;
  const progressPct = Math.round((program.currentWeek / program.totalWeeks) * 100);
  const completedThisWeek = 2; // L y Mi
  const plannedThisWeek = 3;
  const recentPRs = D.RECORDS.slice(0, 2);

  if (variant === 'minimal') return <HomeMinimal {...{ student, program, routine, progressPct, completedThisWeek, plannedThisWeek, recentPRs, nav, onStartToday, hasActiveSession }} />;
  if (variant === 'ritual')  return <HomeRitual  {...{ student, program, routine, progressPct, completedThisWeek, plannedThisWeek, recentPRs, nav, onStartToday, hasActiveSession }} />;
  return                     <HomeHero    {...{ student, program, routine, progressPct, completedThisWeek, plannedThisWeek, recentPRs, nav, onStartToday, hasActiveSession }} />;
};

// --- Variante A: HERO — foco en rutina de hoy con CTA grande
const HomeHero = ({ student, program, routine, progressPct, completedThisWeek, plannedThisWeek, recentPRs, nav, onStartToday, hasActiveSession }) => {
  // Parse local (no UTC) para evitar shift de zona horaria
  const [ty, tm, td] = D.TODAY_DATE.split('-').map(Number);
  const todayDow = new Date(ty, tm - 1, td).getDay(); // 0=dom, 6=sab
  const isTrainingDay = D.PROGRAM.suggestedDays.includes(todayDow);
  const pending = D.SESSIONS.find(s => s.status === 'missed' && s.isPendingRecovery);
  return (
  <div style={{ padding: '14px 16px 0' }}>
    {/* greeting */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>Sábado, 15 nov</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: -0.02, color: 'var(--color-text)' }}>
          Hola, {student.firstName}
        </div>
      </div>
      <button onClick={() => nav('profile')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <KAvatar initials={student.initials} size={40} />
      </button>
    </div>

    {/* Racha */}
    <div style={{
      background: 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.03) 100%)',
      border: '1px solid rgba(245,158,11,0.30)', borderRadius: 12,
      padding: '10px 12px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>🔥</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>4 semanas de racha</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Recupera el viernes hoy y mantén la racha intacta</div>
      </div>
      <Icon name="chevronRight" size={16} style={{ color: 'rgba(251,191,36,0.5)' }} />
    </div>

    {/* Banner: recuperar entreno pendiente del viernes */}
    {pending && (
      <PendingRecoveryBanner
        sess={pending}
        todayDate={D.TODAY_DATE}
        onRecover={() => onStartToday({ recoveringFrom: pending.date })}
        nav={nav}
      />
    )}

    {/* HERO CARD — varía si es día de entreno o descanso */}
    {isTrainingDay ? (
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #2A0F14 0%, #16161A 60%, #0E0E10 100%)',
        border: '1px solid rgba(230,38,57,0.35)', borderRadius: 20,
        padding: 18, marginBottom: 18,
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          background: 'radial-gradient(circle, rgba(230,38,57,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#E62639',
            boxShadow: '0 0 8px #E62639', animation: 'k-live 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.1, textTransform: 'uppercase', color: '#F14D5E' }}>
            Hoy · Entreno programado
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: -0.02,
          color: 'var(--color-text)', lineHeight: 1.1, marginBottom: 4 }}>
          {routine.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          {routine.focus}
        </div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
          <InlineMeta icon="dumbbell" label="Ejercicios" value={routine.exercises.length} />
          <InlineMeta icon="clock" label="Estimado" value={`${routine.estimatedMinutes}'`} />
          <InlineMeta icon="target" label="Series" value={routine.exercises.reduce((a, e) => a + e.sets.length, 0)} />
        </div>
        <button onClick={() => onStartToday()} style={{
          width: '100%', padding: '14px 16px', borderRadius: 12,
          background: '#E62639', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 700, letterSpacing: 0.01,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 8px 24px rgba(230,38,57,0.45)',
        }}>
          <Icon name={hasActiveSession ? 'playCircle' : 'play'} size={18} />
          {hasActiveSession ? 'Continuar entreno' : 'Empezar entreno'}
        </button>
      </div>
    ) : (
      <RestDayCard hasPending={!!pending} />
    )}

    {/* Programa progress */}
    <div style={{
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
      borderRadius: 14, padding: 14, marginBottom: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.09, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Tu programa</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>{program.name}</div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Semana {program.currentWeek}/{program.totalWeeks}</span>
      </div>
      <KProgressBar percentage={progressPct} size="sm" />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11,
        color: 'var(--color-text-muted)', marginTop: 10 }}>
        <span>{completedThisWeek}/{plannedThisWeek} esta semana</span>
        <span>Modo rotación · A-B-C</span>
      </div>
    </div>

    {/* Quick stats */}
    <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
      <KStatCard label="Racha" value="4 sem" valueColor="#F59E0B" sub="Sin fallar" />
      <KStatCard label="Este mes" value="9" sub="Entrenos" />
      <KStatCard label="PRs" value={recentPRs.length} valueColor="#E62639" sub="Nuevos" />
    </div>

    {/* PRs recientes */}
    <SectionHeader title="Records recientes" right={
      <button onClick={() => nav('progress')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        color: 'var(--color-primary)', fontSize: 12, fontWeight: 600 }}>Ver todos →</button>
    } />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {recentPRs.map(pr => <PRMiniCard key={pr.id} pr={pr} />)}
    </div>
  </div>
  );
};

// --- Variante B: MINIMAL — tipografía grande, blanco/negro, zen
const HomeMinimal = ({ student, program, routine, progressPct, completedThisWeek, plannedThisWeek, recentPRs, nav, onStartToday }) => (
  <div style={{ padding: '14px 16px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: 0.06, textTransform: 'uppercase' }}>
        Lun · 17 nov
      </div>
      <button onClick={() => nav('profile')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <KAvatar initials={student.initials} size={36} />
      </button>
    </div>

    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>Hoy toca</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, letterSpacing: -0.03,
        color: 'var(--color-text)', lineHeight: 0.95, marginBottom: 10 }}>
        {routine.letter}. Push.
      </div>
      <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
        {routine.focus}
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 20, marginBottom: 28 }}>
        <LabelValueStack label="Ejercicios" value={routine.exercises.length} />
        <LabelValueStack label="Series" value={routine.exercises.reduce((a, e) => a + e.sets.length, 0)} />
        <LabelValueStack label="Min" value={routine.estimatedMinutes} />
      </div>
      <button onClick={onStartToday} style={{
        width: '100%', padding: '18px 16px', borderRadius: 14,
        background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: -0.01,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <Icon name="play" size={16} /> Empezar ahora
      </button>
    </div>

    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          Semana {program.currentWeek} de {program.totalWeeks}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{completedThisWeek}/{plannedThisWeek}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: program.totalWeeks }).map((_, i) => {
          const done = i < program.currentWeek - 1;
          const current = i === program.currentWeek - 1;
          return (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: done ? '#E62639' : current ? 'rgba(230,38,57,0.45)' : 'rgba(255,255,255,0.08)',
            }} />
          );
        })}
      </div>
    </div>

    <SectionHeader title="Últimos records" compact />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
      {recentPRs.map((pr, i) => (
        <div key={pr.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0', borderBottom: i === recentPRs.length - 1 ? 'none' : '1px solid var(--color-border-light)',
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{pr.exerciseName}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{formatDateShort(pr.achievedAt)}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>
            {pr.weight}<span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}> kg × {pr.reps}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Variante C: RITUAL — narrativa, semanal + motivacional
const HomeRitual = ({ student, program, routine, progressPct, completedThisWeek, plannedThisWeek, recentPRs, nav, onStartToday }) => {
  const weekDays = [
    { dow: 'L', done: true,  routine: 'A' },
    { dow: 'M', done: false, routine: null },
    { dow: 'X', done: true,  routine: 'B' },
    { dow: 'J', done: false, routine: null },
    { dow: 'V', done: false, routine: 'C', today: true },
    { dow: 'S', done: false, routine: null },
    { dow: 'D', done: false, routine: null },
  ];
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KAvatar initials={student.initials} size={40} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>Buenos días</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-text)' }}>{student.firstName}</div>
          </div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          color: 'var(--color-text)', position: 'relative', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="bell" size={18} />
          <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 999,
            background: '#E62639', boxShadow: '0 0 6px #E62639' }} />
        </button>
      </div>

      {/* Racha banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.03) 100%)',
        border: '1px solid rgba(245,158,11,0.30)', borderRadius: 12,
        padding: '10px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>🔥</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>4 semanas de racha</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No pierdas el ritmo esta semana</div>
        </div>
      </div>

      {/* Semana dots */}
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: 14, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.06, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Tu semana</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{completedThisWeek}/{plannedThisWeek} entrenos</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6 }}>{d.dow}</div>
              <div style={{
                width: '100%', aspectRatio: 1, borderRadius: 10,
                background: d.done ? '#E62639' : d.today ? 'rgba(230,38,57,0.15)' : 'var(--color-bg-raised)',
                border: d.today ? '1.5px solid #E62639' : '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: d.done ? '#fff' : d.today ? '#F14D5E' : 'var(--color-text-muted)',
                fontSize: 11, fontWeight: 700,
                boxShadow: d.today ? '0 0 12px rgba(230,38,57,0.35)' : 'none',
              }}>{d.done ? '✓' : d.routine || '·'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero card today (compact) */}
      <div onClick={onStartToday} style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        background: 'linear-gradient(135deg, #2A0F14 0%, #16161A 100%)',
        border: '1px solid rgba(230,38,57,0.35)', borderRadius: 16,
        padding: 16, marginBottom: 18,
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140,
          background: 'radial-gradient(circle, rgba(230,38,57,0.20) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(230,38,57,0.2)', color: '#F14D5E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
          }}>{routine.letter}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', color: '#F14D5E' }}>Hoy</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{routine.name}</div>
          </div>
          <Icon name="chevronRight" size={20} style={{ color: '#F14D5E' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          {routine.exercises.length} ejercicios · {routine.estimatedMinutes} min · {routine.focus}
        </div>
        <button onClick={onStartToday} style={{
          width: '100%', padding: '12px 14px', borderRadius: 10,
          background: '#E62639', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 6px 18px rgba(230,38,57,0.4)',
        }}>
          <Icon name="play" size={14} /> Empezar
        </button>
      </div>

      {/* Nota del coach */}
      {D.COACH_NOTES[routine.id] && (
        <div style={{
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: 14, marginBottom: 18,
          display: 'flex', gap: 10,
        }}>
          <KAvatar initials={D.COACH.initials} size={32} color="#71717A" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{D.COACH.name}</span>
              <KBadge text="Coach" variant="info" size="sm" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
              {D.COACH_NOTES[routine.id]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ------- home helpers -------
const InlineMeta = ({ icon, label, value }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, color: 'var(--color-text-muted)' }}>
      <Icon name={icon} size={12} />
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.06, textTransform: 'uppercase' }}>{label}</span>
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--color-text)' }}>{value}</div>
  </div>
);
const LabelValueStack = ({ label, value }) => (
  <div>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, letterSpacing: 0.04 }}>{label}</div>
  </div>
);
const SectionHeader = ({ title, right, compact }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: compact ? 8 : 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{title}</div>
    {right}
  </div>
);
const PRMiniCard = ({ pr }) => (
  <div style={{
    background: 'var(--color-card)', border: '1px solid var(--color-border)',
    borderRadius: 12, padding: '10px 12px',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <KExerciseThumb name={pr.exerciseName} muscleGroup={pr.muscleGroup} photoUrl={pr.photoUrl} size={36} />
      <div style={{
        position: 'absolute', bottom: -3, right: -3,
        width: 16, height: 16, borderRadius: 5,
        background: '#E62639', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid var(--color-card)',
      }}>
        <Icon name="trophy" size={9} />
      </div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.exerciseName}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{formatDateShort(pr.achievedAt)}</div>
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>
      {pr.weight}<span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, marginLeft: 2 }}>kg</span>
    </div>
    {pr.isNew && <KBadge text="Nuevo" variant="info" size="sm" />}
  </div>
);

// === Banner: Recuperar entreno pendiente ===
const PendingRecoveryBanner = ({ sess, todayDate, onRecover, nav }) => {
  const dateLabel = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };
  const dayName = dateLabel(sess.date);
  const deadline = sess.recoveryDeadline;
  const dlDate = deadline ? new Date(deadline) : null;
  const today = new Date(todayDate);
  const daysLeft = dlDate ? Math.max(0, Math.round((dlDate - today) / 86400000)) : 0;
  const dlLabel = daysLeft === 0 ? 'hoy' : daysLeft === 1 ? 'mañana' : `en ${daysLeft} días`;

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #1f1409 0%, #16161A 60%, #0E0E10 100%)',
      border: '1.5px solid rgba(245,158,11,0.45)', borderRadius: 16,
      padding: 14, marginBottom: 16,
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140,
        background: 'radial-gradient(circle, rgba(245,158,11,0.20) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Icon name="alarmClock" size={13} style={{ color: '#F59E0B' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.1, textTransform: 'uppercase', color: '#FBBF24' }}>
          Entreno pendiente · plazo {dlLabel}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: -0.01,
        color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 4 }}>
        Te quedó pendiente el {dayName}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
        <strong style={{ color: '#FBBF24', fontWeight: 600 }}>{sess.routineName}</strong> · Recupéralo antes del domingo y mantén tu racha intacta
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onRecover} style={{
          flex: 1, padding: '11px 14px', borderRadius: 10,
          background: '#F59E0B', color: '#0A0A0B', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
        }}>
          <Icon name="rotateCw" size={14} />
          Recuperar ahora
        </button>
        <button onClick={() => nav('dayDetail', { date: sess.date })} style={{
          padding: '11px 14px', borderRadius: 10,
          background: 'transparent', color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)', cursor: 'pointer',
          fontSize: 12, fontWeight: 600,
        }}>
          Ver detalle
        </button>
      </div>
    </div>
  );
};

// === Card: Día de descanso ===
const RestDayCard = ({ hasPending }) => (
  <div style={{
    background: 'var(--color-card)', border: '1px solid var(--color-border)',
    borderRadius: 16, padding: 18, marginBottom: 18,
    display: 'flex', alignItems: 'center', gap: 14,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 14,
      background: 'rgba(59,130,246,0.12)', color: '#60A5FA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24,
    }}>
      🛋️
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.09, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        Hoy · día de descanso
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-text)', lineHeight: 1.2 }}>
        Recupera energía
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
        {hasPending
          ? 'Si quieres, hoy es buen día para recuperar el entreno del viernes'
          : 'El próximo entreno toca el lunes'}
      </div>
    </div>
  </div>
);

window.HomeScreen = HomeScreen;

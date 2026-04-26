// Programs: list + editor (weekly grid with L-D slots). Supports assign-to-students flow.

// ─── Model helpers ─────────────────────────────────────────────────────────
function newProgram() {
  return {
    id: uid('pg'),
    name: 'Nuevo programa',
    description: '',
    coverColor: '#E62639',
    objective: 'Hipertrofia',
    level: 'Intermedio',
    mode: 'fixed',       // 'fixed' | 'loop'
    durationWeeks: 8,
    scheduleType: 'week', // 'week' (L-D) | 'numbered' (Día 1..N)
    daysPerWeek: 7,
    notes: '',
    weeks: [makeWeek(0)],
    createdAt: new Date().toISOString(),
    status: 'draft',
    assignedCount: 0,
  };
}

function makeWeek(idx) {
  return {
    id: uid('wk'),
    label: `Semana ${idx + 1}`,
    slots: Array.from({ length: 7 }, () => ({ kind: 'empty' })), // empty | rest | routine
  };
}

function seedProgramsFull() {
  const mk = (overrides) => {
    const base = newProgram();
    const p = { ...base, ...overrides };
    // Fill weeks based on length
    p.weeks = Array.from({ length: p.durationWeeks || 8 }, (_, i) => {
      const w = makeWeek(i);
      if (overrides.pattern) {
        w.slots = overrides.pattern.map((s, di) => {
          if (s === null) return { kind: 'rest' };
          if (s === '.') return { kind: 'empty' };
          const rt = (window.__sampleRoutines || [])[s % (window.__sampleRoutines || []).length];
          if (!rt) return { kind: 'empty' };
            const firstDay = (rt.days || [])[0];
            return { kind: 'routineDay', routineId: rt.id, routineName: rt.name, dayId: firstDay?.id, dayName: firstDay?.name || rt.name, category: rt.category, blockId: 'seed_' + rt.id, overrides: {} };
        });
      }
      return w;
    });
    return p;
  };

  return [
    mk({
      id: 'pg_1',
      name: 'Hipertrofia — Upper/Lower',
      description: 'Programa de 8 semanas con división upper/lower. Progresión lineal con un deload en la semana 5.',
      objective: 'Hipertrofia', level: 'Intermedio',
      mode: 'fixed', durationWeeks: 8, daysPerWeek: 4,
      coverColor: '#E62639',
      pattern: [0, null, 1, null, 2, 3, null],
      status: 'active',
      assignedCount: 4,
    }),
    mk({
      id: 'pg_2',
      name: 'Fuerza 5×5',
      description: 'Progresión lineal clásica sobre sentadilla, banca y peso muerto. Simple y efectivo.',
      objective: 'Fuerza', level: 'Todos',
      mode: 'fixed', durationWeeks: 12, daysPerWeek: 3,
      coverColor: '#f59e0b',
      pattern: [0, null, 1, null, 0, null, null],
      status: 'active',
      assignedCount: 2,
    }),
    mk({
      id: 'pg_3',
      name: 'Full Body Principiante',
      description: 'Cuerpo completo para iniciarse. 3 días por semana con foco en técnica.',
      objective: 'Funcional', level: 'Principiante',
      mode: 'fixed', durationWeeks: 6, daysPerWeek: 3,
      coverColor: '#22c55e',
      pattern: [2, null, 2, null, 2, null, null],
      status: 'active',
      assignedCount: 1,
    }),
    mk({
      id: 'pg_4',
      name: 'Push Pull Legs',
      description: 'PPL alto volumen para ganar masa. 6 días a la semana, en bucle.',
      objective: 'Hipertrofia', level: 'Avanzado',
      mode: 'loop', durationWeeks: 4, daysPerWeek: 6,
      coverColor: '#60a5fa',
      pattern: [0, 1, 2, 0, 1, 2, null],
      status: 'draft',
      assignedCount: 0,
    }),
  ];
}

const OBJECTIVE_COLORS = {
  'Hipertrofia': '#E62639',
  'Fuerza': '#f59e0b',
  'Resistencia': '#22c55e',
  'Funcional': '#60a5fa',
  'Rendimiento': '#a78bfa',
  'Otro': '#78787f',
};

// ─── Programs list view ────────────────────────────────────────────────────
function ProgramsView() {
  const [programs, setPrograms] = React.useState(() => {
    try {
      const saved = localStorage.getItem('kondix-programs-list');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Prime sample routines index so programs can reference them
    window.__sampleRoutines = (() => {
      try {
        const r = localStorage.getItem('kondix-routines-list');
        if (r) return JSON.parse(r);
      } catch {}
      return [];
    })();
    return seedProgramsFull();
  });
  const [editingId, setEditingId] = React.useState(null);
  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(null);
  const [confirm, confirmDialog] = useConfirm();

  React.useEffect(() => {
    try { localStorage.setItem('kondix-programs-list', JSON.stringify(programs)); } catch {}
  }, [programs]);

  const routineLibrary = React.useMemo(() => {
    try {
      const r = localStorage.getItem('kondix-routines-list');
      if (r) return JSON.parse(r);
    } catch {}
    return [];
  }, []);

  if (editingId) {
    const program = programs.find(p => p.id === editingId);
    if (!program) { setEditingId(null); return null; }
    return (
      <ProgramEditor
        program={program}
        routineLibrary={routineLibrary}
        onBack={() => setEditingId(null)}
        onChange={(np) => setPrograms(ps => ps.map(p => p.id === np.id ? np : p))}
        onAssign={() => setAssignOpen(program)}
      />
    );
  }

  const duplicateProgram = (p) => {
    const np = JSON.parse(JSON.stringify(p));
    np.id = uid('pg');
    np.name = p.name + ' (copia)';
    np.assignedCount = 0;
    np.createdAt = new Date().toISOString();
    setPrograms([np, ...programs]);
  };

  const deleteProgram = (p) => {
    confirm({
      title: 'Eliminar programa',
      message: `¿Eliminar "${p.name}"? Se perderán todas las semanas configuradas. Los estudiantes asignados quedarán sin programa activo.`,
      onConfirm: () => setPrograms(ps => ps.filter(x => x.id !== p.id)),
    });
  };

  return (
    <div style={{ padding: '28px 36px 120px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        overline="Planificación"
        title="Programas"
        subtitle={`${programs.length} programas. Agrupa rutinas en un plan temporal y asígnalo a tus estudiantes.`}
        actions={<Button variant="primary" icon="plus" onClick={() => setCreatingOpen(true)}>Crear programa</Button>}
      />

      {programs.length === 0 ? (
        <EmptyState
          title="Aún no tienes programas"
          description="Crea tu primer programa para organizar rutinas por semanas y asignarlo a estudiantes."
          icon="folder"
          actionLabel="Crear programa"
          onAction={() => setCreatingOpen(true)}
        />
      ) : (
        <div style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14,
        }}>
          {programs.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              onOpen={() => setEditingId(p.id)}
              onDuplicate={() => duplicateProgram(p)}
              onDelete={() => deleteProgram(p)}
              onAssign={() => setAssignOpen(p)}
            />
          ))}
        </div>
      )}

      {creatingOpen && (
        <CreateProgramModal
          onClose={() => setCreatingOpen(false)}
          onCreate={(np) => {
            setPrograms([np, ...programs]);
            setCreatingOpen(false);
            setEditingId(np.id);
          }}
        />
      )}

      {assignOpen && (
        <AssignProgramModal
          program={assignOpen}
          onClose={() => setAssignOpen(null)}
          onAssign={(studentIds, startDate) => {
            setPrograms(ps => ps.map(p => p.id === assignOpen.id
              ? { ...p, assignedCount: (p.assignedCount || 0) + studentIds.length, status: 'active' }
              : p));
            setAssignOpen(null);
          }}
        />
      )}

      {confirmDialog}
    </div>
  );
}

// ─── Program card ──────────────────────────────────────────────────────────
function ProgramCard({ program, onOpen, onDuplicate, onDelete, onAssign }) {
  const [hover, setHover] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const color = OBJECTIVE_COLORS[program.objective] || program.coverColor || '#78787f';
  const totalSessions = (program.weeks || []).reduce(
    (a, w) => a + w.slots.filter(s => s.kind === 'routineDay').length, 0);

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
      {/* Timeline preview */}
      <div style={{
        height: 90,
        background: `linear-gradient(135deg, ${color}20 0%, #0a0a0b 85%)`,
        position: 'relative',
        borderBottom: '1px solid var(--color-border-light)',
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge tone="primary" style={{ background: color + '30', color, borderColor: color + '55' }}>{program.objective}</Badge>
          {program.status === 'draft' && <Badge tone="outline">Borrador</Badge>}
          {program.mode === 'loop' && <Badge tone="outline">En bucle</Badge>}
        </div>

        {/* Mini timeline */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          {(program.weeks || []).slice(0, 16).map((w, wi) => {
            const active = w.slots.filter(s => s.kind === 'routineDay').length;
            const rest = w.slots.filter(s => s.kind === 'rest' || s.kind === 'empty').length;
            return (
              <div key={wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <div style={{ height: Math.max(4, active * 2.5), background: color, borderRadius: 1, opacity: 0.85 }} />
                <div style={{ height: Math.max(2, rest), background: 'var(--color-border)', borderRadius: 1 }} />
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', top: 8, right: 8 }}>
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
                borderRadius: 8, padding: 4, minWidth: 180,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 11,
              }} onClick={(e) => e.stopPropagation()}>
                <CardMenuItem icon="users" onClick={() => { onAssign(); setMenuOpen(false); }}>Asignar a estudiantes</CardMenuItem>
                <CardMenuItem icon="copy" onClick={() => { onDuplicate(); setMenuOpen(false); }}>Duplicar</CardMenuItem>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                <CardMenuItem icon="trash" danger onClick={() => { onDelete(); setMenuOpen(false); }}>Eliminar</CardMenuItem>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {program.name}
        </div>
        {program.description && (
          <p style={{
            fontSize: 12, color: 'var(--color-text-muted)',
            margin: '6px 0 0', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{program.description}</p>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, marginTop: 12,
          fontFamily: 'var(--font-mono)',
        }}>
          <Stat label="Semanas" value={program.mode === 'loop' ? '∞' : program.durationWeeks} />
          <Stat label="Sesiones" value={totalSessions} />
          <Stat label="Nivel" value={program.level || '—'} mono={false} />
        </div>

        <div style={{
          marginTop: 12, paddingTop: 10,
          borderTop: '1px solid var(--color-border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="users" size={11} />
            {program.assignedCount || 0} asignad{program.assignedCount === 1 ? 'o' : 'os'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: hover ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, transition: 'color .12s' }}>
            Editar<Icon name="arrowRight" size={11} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono = true }) {
  return (
    <div style={{
      background: 'var(--color-bg-raised)',
      border: '1px solid var(--color-border-light)',
      borderRadius: 6,
      padding: '6px 8px',
    }}>
      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        marginTop: 2,
      }}>{value}</div>
    </div>
  );
}

function CardMenuItem({ icon, children, onClick, danger }) {
  const [h, setH] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 6, cursor: 'pointer', fontSize: 12,
        color: danger ? 'var(--color-danger)' : 'var(--color-text)',
        background: h ? (danger ? 'rgba(239,68,68,0.12)' : 'var(--color-card-hover)') : 'transparent',
      }}
    >
      <Icon name={icon} size={13} />{children}
    </div>
  );
}

// ─── Create program modal ─────────────────────────────────────────────────
function CreateProgramModal({ onClose, onCreate }) {
  const [name, setName] = React.useState('');
  const [objective, setObjective] = React.useState('Hipertrofia');
  const [level, setLevel] = React.useState('Intermedio');
  const [mode, setMode] = React.useState('fixed');
  const [duration, setDuration] = React.useState(8);
  const [scheduleType, setScheduleType] = React.useState('week');

  const handleCreate = () => {
    const np = newProgram();
    np.name = name.trim() || 'Nuevo programa';
    np.objective = objective;
    np.level = level;
    np.mode = mode;
    np.durationWeeks = mode === 'loop' ? 4 : duration;
    np.scheduleType = scheduleType;
    np.weeks = Array.from({ length: np.durationWeeks }, (_, i) => makeWeek(i));
    onCreate(np);
  };

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div className="k-modal-center" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(560px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 40px)',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 14, zIndex: 201,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="k-overline">Nuevo</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '2px 0 0', letterSpacing: '-0.02em' }}>Crear programa</h2>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>

        <div style={{ padding: 22, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }} className="scroll-thin">
          <Field label="Nombre del programa">
            <TextField value={name} onChange={setName} placeholder="Ej: Hipertrofia 8 semanas" autoFocus />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Objetivo">
              <SelectField value={objective} onChange={setObjective}
                options={['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Rendimiento']} />
            </Field>
            <Field label="Nivel">
              <SelectField value={level} onChange={setLevel}
                options={['Principiante', 'Intermedio', 'Avanzado', 'Todos']} />
            </Field>
          </div>

          <Field label="Duración">
            <div style={{ display: 'flex', gap: 8 }}>
              <SegmentBtn active={mode === 'fixed'} onClick={() => setMode('fixed')} label="Fija" hint="N semanas" />
              <SegmentBtn active={mode === 'loop'} onClick={() => setMode('loop')} label="En bucle" hint="Se repite" />
            </div>
          </Field>

          {mode === 'fixed' && (
            <Field label="Duración del programa">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <input type="number" min="1" max="52" value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(52, Number(e.target.value) || 1)))}
                  style={{
                    width: 70, padding: '8px 10px', fontSize: 14, fontWeight: 600,
                    background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
                    borderRadius: 8, color: 'var(--color-text)', textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                  }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  semana{duration === 1 ? '' : 's'}
                </span>
              </div>
              <input type="range" min="1" max="24" value={Math.min(duration, 24)}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                <span>1</span><span>8</span><span>16</span><span>24+</span>
              </div>
            </Field>
          )}

          <Field label="Días de la semana">
            <div style={{ display: 'flex', gap: 8 }}>
              <SegmentBtn active={scheduleType === 'week'} onClick={() => setScheduleType('week')} label="L–D" hint="Días reales" />
              <SegmentBtn active={scheduleType === 'numbered'} onClick={() => setScheduleType('numbered')} label="Día 1–N" hint="Sin calendario" />
            </div>
          </Field>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleCreate}>Crear y editar</Button>
        </div>
      </div>
    </>,
    document.body
  );
}

function SegmentBtn({ active, onClick, label, hint }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 12px',
      background: active ? 'var(--color-primary-subtle)' : 'var(--color-bg-raised)',
      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
      borderRadius: 8, cursor: 'pointer', textAlign: 'left',
      color: active ? 'var(--color-primary)' : 'var(--color-text)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{hint}</div>
    </button>
  );
}

// ─── Program editor ────────────────────────────────────────────────────────
function ProgramEditor({ program, routineLibrary, onBack, onChange, onAssign }) {
  const [local, setLocal] = React.useState(program);
  const [selectedCell, setSelectedCell] = React.useState(null); // { weekIdx, dayIdx }
  const [assignFor, setAssignFor] = React.useState(null); // wizard { weekIdx }
  const [confirm, confirmDialog] = useConfirm();

  React.useEffect(() => { onChange(local); }, [local]);

  const patch = (p) => setLocal(l => ({ ...l, ...p }));

  const setSlot = (weekIdx, dayIdx, slot) => {
    const weeks = local.weeks.map((w, wi) => {
      if (wi !== weekIdx) return w;
      const slots = w.slots.map((s, di) => di === dayIdx ? slot : s);
      return { ...w, slots };
    });
    patch({ weeks });
  };

  // Apply a routine assignment to multiple weeks.
  // cfg: { weeks: [wi...], mapping: { dayId: weekdayIdx } }
  // For each selected week, for each mapped routine-day, place a routineDay slot.
  // Replaces existing non-empty slots only on asked weekdays (leaves others alone).
  const applyAssignment = (routine, cfg) => {
    const blockId = uid('blk');
    const invMap = {}; // weekdayIdx → day object
    (routine.days || []).forEach(d => {
      const w = cfg.mapping[d.id];
      if (w != null) invMap[w] = d;
    });
    const weeks = local.weeks.map((w, wi) => {
      if (!cfg.weeks.includes(wi)) return w;
      const slots = w.slots.map((s, di) => {
        if (invMap[di] != null) {
          const d = invMap[di];
          return {
            kind: 'routineDay',
            routineId: routine.id, routineName: routine.name,
            dayId: d.id, dayName: d.name,
            category: routine.category,
            blockId,
            overrides: {},
          };
        }
        return s;
      });
      return { ...w, slots };
    });
    patch({ weeks });
  };

  // Fill all empty slots with rest (leave routineDay and existing rest alone)
  const fillEmptyWithRest = () => {
    const weeks = local.weeks.map(w => ({
      ...w,
      slots: w.slots.map(s => (s.kind === 'empty' ? { kind: 'rest' } : s)),
    }));
    patch({ weeks });
  };

  // Count empty cells — used to decide whether to show the "fill rest" action
  const emptyCount = local.weeks.reduce((a, w) => a + w.slots.filter(s => s.kind === 'empty').length, 0);
  const hasAnyRoutine = local.weeks.some(w => w.slots.some(s => s.kind === 'routineDay'));
  const removeBlock = (blockId) => {
    const weeks = local.weeks.map(w => ({
      ...w,
      slots: w.slots.map(s => (s.kind === 'routineDay' && s.blockId === blockId ? { kind: 'empty' } : s)),
    }));
    patch({ weeks });
  };

  const addWeek = () => {
    const idx = local.weeks.length;
    patch({ weeks: [...local.weeks, makeWeek(idx)], durationWeeks: idx + 1 });
  };

  const duplicateWeek = (wi) => {
    const src = local.weeks[wi];
    const copy = { ...src, id: uid('wk'), label: `Semana ${local.weeks.length + 1}`, slots: src.slots.map(s => ({ ...s })) };
    const weeks = [...local.weeks.slice(0, wi + 1), copy, ...local.weeks.slice(wi + 1)];
    patch({ weeks: weeks.map((w, i) => ({ ...w, label: w.label.replace(/Semana \d+/, `Semana ${i + 1}`) })), durationWeeks: weeks.length });
  };

  const deleteWeek = (wi) => {
    if (local.weeks.length <= 1) return;
    confirm({
      title: 'Eliminar semana',
      message: `¿Eliminar "${local.weeks[wi].label}"? Todas las rutinas asignadas a esta semana se perderán.`,
      onConfirm: () => {
        const weeks = local.weeks.filter((_, i) => i !== wi).map((w, i) => ({ ...w, label: `Semana ${i + 1}` }));
        patch({ weeks, durationWeeks: weeks.length });
      },
    });
  };

  const activeSlot = selectedCell
    ? local.weeks[selectedCell.weekIdx]?.slots[selectedCell.dayIdx]
    : null;

  const dayLabels = local.scheduleType === 'numbered'
    ? ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
    : ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-deep)' }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0, padding: '10px 18px',
        borderBottom: '1px solid var(--color-border-light)',
        background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <Button variant="ghost" size="sm" icon="arrowLeft" onClick={onBack}>Volver</Button>
          <span style={{ color: 'var(--color-border)' }} className="k-prog-sep">·</span>
          <span className="k-overline k-prog-overline">Editando</span>
          <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{local.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" icon="users" onClick={onAssign}>Asignar</Button>
          <Button variant="primary" icon="check">Guardar</Button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 340px', minHeight: 0 }} className="k-prog-grid">
        {/* Left: metadata */}
        <aside style={{ borderRight: '1px solid var(--color-border-light)', background: 'var(--color-bg)', padding: 20, overflow: 'auto' }} className="scroll-thin">
          <div className="k-overline" style={{ marginBottom: 8 }}>Programa</div>
          <input value={local.name} onChange={(e) => patch({ name: e.target.value })}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
              letterSpacing: '-0.02em', color: 'var(--color-text)',
              padding: 0, marginBottom: 6,
            }} />
          <textarea value={local.description} onChange={(e) => patch({ description: e.target.value })}
            placeholder="Describe el objetivo del programa, quién debería hacerlo…"
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.5,
              fontFamily: 'var(--font-sans)', minHeight: 48,
            }} />

          <div style={{ height: 1, background: 'var(--color-border-light)', margin: '16px 0' }} />

          <Field label="Objetivo" style={{ marginBottom: 12 }}>
            <SelectField value={local.objective} onChange={(v) => patch({ objective: v })}
              options={['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Rendimiento']} />
          </Field>
          <Field label="Nivel" style={{ marginBottom: 12 }}>
            <SelectField value={local.level} onChange={(v) => patch({ level: v })}
              options={['Principiante', 'Intermedio', 'Avanzado', 'Todos']} />
          </Field>

          <Field label="Duración" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <SegmentBtn active={local.mode === 'fixed'} onClick={() => {
                if (local.mode === 'fixed') return;
                // Restore to single-week if user had been in loop: just switch mode
                patch({ mode: 'fixed' });
              }} label="Fija" hint={`${local.durationWeeks} sem`} />
              <SegmentBtn active={local.mode === 'loop'} onClick={() => {
                if (local.mode === 'loop') return;
                // Going to loop: collapse to 1 week
                if (local.weeks.length > 1) {
                  confirm({
                    title: 'Cambiar a modo bucle',
                    message: 'El programa en bucle es de una sola semana que se repite. Se mantendrá solo la primera semana y se descartarán las demás. ¿Continuar?',
                    confirmLabel: 'Sí, cambiar',
                    onConfirm: () => patch({
                      mode: 'loop',
                      durationWeeks: 1,
                      weeks: [{ ...local.weeks[0], label: 'Semana base' }],
                    }),
                  });
                } else {
                  patch({ mode: 'loop', durationWeeks: 1, weeks: [{ ...local.weeks[0], label: 'Semana base' }] });
                }
              }} label="En bucle" hint="∞" />
            </div>
          </Field>

          <Field label="Días de la semana" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <SegmentBtn active={local.scheduleType === 'week'} onClick={() => patch({ scheduleType: 'week' })} label="L–D" hint="Reales" />
              <SegmentBtn active={local.scheduleType === 'numbered'} onClick={() => patch({ scheduleType: 'numbered' })} label="D1–N" hint="Numerado" />
            </div>
          </Field>

          <div style={{ height: 1, background: 'var(--color-border-light)', margin: '16px 0' }} />

          <div className="k-overline" style={{ marginBottom: 8 }}>Notas internas</div>
          <textarea value={local.notes || ''} onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Notas privadas para ti, no visibles al estudiante."
            style={{
              width: '100%', background: 'var(--color-bg-raised)',
              border: '1px solid var(--color-border)', borderRadius: 8,
              outline: 'none', padding: 10, color: 'var(--color-text)',
              fontSize: 12, fontFamily: 'var(--font-sans)', resize: 'vertical',
              minHeight: 72, lineHeight: 1.5,
            }} />

          <div style={{ height: 1, background: 'var(--color-border-light)', margin: '16px 0' }} />
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
            <div>{local.weeks.length} semanas · {local.weeks.reduce((a, w) => a + w.slots.filter(s => s.kind === 'routineDay').length, 0)} sesiones</div>
            <div>{local.assignedCount || 0} estudiantes asignados</div>
          </div>
        </aside>

        {/* Center: weekly grid */}
        <main style={{ overflow: 'auto', padding: '20px 24px 80px' }} className="scroll-thin">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="k-overline">Calendario</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '2px 0 0', letterSpacing: '-0.02em' }}>
                {local.mode === 'loop' ? 'Semana base (se repite)' : 'Estructura semanal'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="primary" size="sm" icon="plus" onClick={() => setAssignFor({ weekIdx: 0 })}>
                Asignar rutina
              </Button>
              {hasAnyRoutine && emptyCount > 0 && (
                <Button
                  variant="outline" size="sm" icon="moon"
                  onClick={() => confirm({
                    title: 'Marcar vacíos como descanso',
                    message: `Se marcarán ${emptyCount} día${emptyCount === 1 ? '' : 's'} vacío${emptyCount === 1 ? '' : 's'} como descanso. Los días con rutina no se tocan.`,
                    confirmLabel: 'Marcar descanso',
                    onConfirm: fillEmptyWithRest,
                  })}
                >
                  Rellenar descansos
                </Button>
              )}
              {local.mode !== 'loop' && (
                <Button variant="outline" size="sm" icon="plus" onClick={addWeek}>Añadir semana</Button>
              )}
            </div>
          </div>

          {/* Scroll wrapper: keeps cells readable at narrow widths */}
          <div className="k-prog-scroller" style={{ overflowX: 'auto', paddingBottom: 6 }}>
            <div style={{ minWidth: 720 }}>
              {/* Day headers */}
              <div className="k-prog-week-row" style={{
                display: 'grid',
                gridTemplateColumns: '90px repeat(7, minmax(82px, 1fr)) 40px',
                gap: 6, marginBottom: 6,
              }}>
                <div />
                {dayLabels.map((d, i) => (
                  <div key={i} style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                    color: 'var(--color-text-muted)', textAlign: 'center',
                    padding: '6px 0',
                  }}>{d}</div>
                ))}
                <div />
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {local.weeks.map((w, wi) => (
                  <WeekRow
                    key={w.id}
                    week={w}
                    weekIdx={wi}
                    selected={selectedCell?.weekIdx === wi ? selectedCell.dayIdx : null}
                    onSelectCell={(di) => setSelectedCell({ weekIdx: wi, dayIdx: di })}
                    onAddRoutine={(di) => { setAssignFor({ weekIdx: wi, dayIdx: di }); setSelectedCell({ weekIdx: wi, dayIdx: di }); }}
                    onSetSlot={(di, slot) => setSlot(wi, di, slot)}
                    onDuplicate={() => duplicateWeek(wi)}
                    onDelete={() => deleteWeek(wi)}
                    canDelete={local.weeks.length > 1}
                    hideWeekMenu={local.mode === 'loop'}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Right: inspector (drawer on narrow) */}
        <aside
          style={{ borderLeft: '1px solid var(--color-border-light)', background: 'var(--color-bg)', overflow: 'auto' }}
          className={`scroll-thin k-prog-inspector ${selectedCell ? 'is-open' : ''}`}
        >
          {/* Drawer close btn, only visible in drawer mode via CSS */}
          <button
            onClick={() => setSelectedCell(null)}
            className="k-prog-inspector-close"
            aria-label="Cerrar panel"
            style={{
              position: 'sticky', top: 0, alignSelf: 'flex-end',
              background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
              borderRadius: 6, padding: 6, cursor: 'pointer', color: 'var(--color-text)',
              display: 'none', zIndex: 2, marginLeft: 'auto',
            }}
          >
            <Icon name="x" size={14} />
          </button>
          <CellInspector
            cell={selectedCell}
            slot={activeSlot}
            week={selectedCell ? local.weeks[selectedCell.weekIdx] : null}
            dayLabel={selectedCell ? dayLabels[selectedCell.dayIdx] : null}
            onChangeSlot={(slot) => selectedCell && setSlot(selectedCell.weekIdx, selectedCell.dayIdx, slot)}
            onAssign={() => selectedCell && setAssignFor(selectedCell)}
            onRemoveBlock={(blockId) => removeBlock(blockId)}
          />
        </aside>
        {/* Backdrop only on narrow */}
        {selectedCell && (
          <div
            className="k-prog-inspector-backdrop"
            onClick={() => setSelectedCell(null)}
            style={{ display: 'none' }}
          />
        )}
      </div>

      {assignFor && (
        <AssignRoutineModal
          library={routineLibrary}
          program={local}
          initialWeek={assignFor.weekIdx}
          onClose={() => setAssignFor(null)}
          onAssign={(routine, cfg) => {
            applyAssignment(routine, cfg);
            setAssignFor(null);
            // Focus on the first mapped cell in the first affected week
            const firstWeekday = Math.min(...Object.values(cfg.mapping).filter(v => v != null));
            if (cfg.weeks.length) setSelectedCell({ weekIdx: cfg.weeks[0], dayIdx: firstWeekday });
          }}
        />
      )}

      {/* legacy picker removed — all assignments go through wizard */}

      {confirmDialog}

      <style>{`
        @media (max-width: 1180px) {
          .k-prog-grid { grid-template-columns: 240px 1fr !important; }
          .k-prog-overline, .k-prog-sep { display: none !important; }
          .k-prog-inspector {
            position: fixed !important;
            top: 0; right: 0; bottom: 0;
            width: min(380px, 92vw);
            z-index: 50;
            box-shadow: -12px 0 32px rgba(0,0,0,0.5);
            transform: translateX(100%);
            transition: transform .2s ease;
            display: flex !important;
            flex-direction: column;
          }
          .k-prog-inspector.is-open { transform: translateX(0); }
          .k-prog-inspector-close { display: flex !important; margin: 10px 10px 0 auto !important; }
          .k-prog-inspector-backdrop {
            display: block !important;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 49;
          }
        }
        @media (max-width: 820px) {
          .k-prog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Week row ──────────────────────────────────────────────────────────────
function WeekRow({ week, weekIdx, selected, onSelectCell, onAddRoutine, onSetSlot, onDuplicate, onDelete, canDelete, hideWeekMenu }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const filled = week.slots.filter(s => s.kind === 'routineDay').length;

  return (
    <div className="k-prog-week-row" style={{
      display: 'grid',
      gridTemplateColumns: '90px repeat(7, minmax(82px, 1fr)) 40px',
      gap: 6, alignItems: 'stretch',
    }}>
      {/* Week label */}
      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 8,
        padding: '8px 10px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Sem {weekIdx + 1}
        </div>
        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {filled}/7 SESIONES
        </div>
      </div>

      {/* Day cells */}
      {week.slots.map((s, di) => (
        <DayCell
          key={di}
          slot={s}
          selected={selected === di}
          onClick={() => onSelectCell(di)}
          onAddRoutine={() => onAddRoutine(di)}
          onMarkRest={() => onSetSlot(di, { kind: 'rest' })}
          onClear={() => onSetSlot(di, { kind: 'empty' })}
        />
      ))}

      {/* Week actions */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!hideWeekMenu && (
          <>
            <IconButton icon="more" size="sm" onClick={() => setMenuOpen(v => !v)} />
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{
                  position: 'absolute', right: 0, top: 32, zIndex: 11,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  borderRadius: 8, padding: 4, minWidth: 160, boxShadow: 'var(--shadow-lg)',
                }}>
                  <CardMenuItem icon="copy" onClick={() => { onDuplicate(); setMenuOpen(false); }}>Duplicar semana</CardMenuItem>
                  {canDelete && <CardMenuItem icon="trash" danger onClick={() => { onDelete(); setMenuOpen(false); }}>Eliminar semana</CardMenuItem>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DayCell({ slot, selected, onClick, onAddRoutine, onMarkRest, onClear }) {
  const [hover, setHover] = React.useState(false);

  if (slot.kind === 'routineDay') {
    const color = OBJECTIVE_COLORS[slot.category] || 'var(--color-primary)';
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          background: `${color}14`,
          border: `1px solid ${selected ? color : color + '55'}`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 8, padding: '8px 10px',
          cursor: 'pointer', position: 'relative',
          minHeight: 68, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'border-color .12s',
        }}
      >
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
          lineHeight: 1.2, wordBreak: 'break-word', overflowWrap: 'anywhere',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          letterSpacing: '-0.01em',
        }}>
          {slot.dayName || slot.routineName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, minWidth: 0 }}>
          <div
            title={slot.routineName}
            style={{
              fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1,
              textTransform: 'uppercase',
            }}
          >
            {slot.routineName}
          </div>
          {slot.overrides && Object.keys(slot.overrides).length > 0 && (
            <span title="Tiene overrides" style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--color-warning)', flexShrink: 0,
            }} />
          )}
        </div>
      </div>
    );
  }

  if (slot.kind === 'rest') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--color-bg-raised)',
          border: `1px dashed ${selected ? 'var(--color-text-muted)' : 'var(--color-border)'}`,
          borderRadius: 8, padding: '8px 10px',
          cursor: 'pointer', minHeight: 68,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Icon name="moon" size={14} style={{ color: 'var(--color-text-muted)' }} />
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          DESCANSO
        </div>
        {hover && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              position: 'absolute', top: 4, right: 4, width: 18, height: 18,
              background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 4,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text)',
            }}
          >
            <Icon name="x" size={11} />
          </button>
        )}
      </div>
    );
  }

  // Empty
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'var(--color-card)' : 'transparent',
        border: `1px dashed ${selected ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
        borderRadius: 8, minHeight: 68,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, position: 'relative',
      }}
    >
      {hover ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAddRoutine(); }}
            style={{
              background: 'var(--color-primary)', border: 'none', borderRadius: 6,
              padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 4,
              cursor: 'pointer', color: '#fff', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-sans)',
            }}
            title="Añadir rutina"
          >
            <Icon name="plus" size={11} />Rutina
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRest(); }}
            style={{
              background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 6,
              padding: '6px 8px', display: 'flex', alignItems: 'center',
              cursor: 'pointer', color: 'var(--color-text-muted)',
            }}
            title="Marcar como descanso"
          >
            <Icon name="moon" size={11} />
          </button>
        </div>
      ) : (
        <Icon name="plus" size={12} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
      )}
    </div>
  );
}

// ─── Cell inspector (right panel) ─────────────────────────────────────────
function CellInspector({ cell, slot, week, dayLabel, onChangeSlot, onAssign, onRemoveBlock }) {
  if (!cell || !slot) {
    return (
      <div style={{ padding: 20 }}>
        <div className="k-overline" style={{ marginBottom: 8 }}>Detalle</div>
        <div style={{
          padding: 20, border: '1px dashed var(--color-border)', borderRadius: 10,
          textAlign: 'center',
        }}>
          <Icon name="pointer" size={18} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Selecciona un día del calendario para ver y editar sus detalles.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div className="k-overline" style={{ marginBottom: 4 }}>{week?.label} · {dayLabel}</div>

      {slot.kind === 'routineDay' && (
        <RoutineSlotInspector slot={slot} onChangeSlot={onChangeSlot} onRemoveBlock={onRemoveBlock} />
      )}
      {slot.kind === 'rest' && (
        <RestSlotInspector onChangeSlot={onChangeSlot} />
      )}
      {slot.kind === 'empty' && (
        <EmptySlotInspector onChangeSlot={onChangeSlot} onAssign={onAssign} />
      )}
    </div>
  );
}

function EmptySlotInspector({ onChangeSlot, onAssign }) {
  return (
    <>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '2px 0 8px', letterSpacing: '-0.02em' }}>Día vacío</h3>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 14px' }}>
        Elige qué hacer en este día: asignar una rutina, marcar descanso explícito, o dejarlo vacío (descanso implícito).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button variant="primary" icon="plus" onClick={onAssign} style={{ width: '100%' }}>Asignar rutina</Button>
        <Button variant="outline" icon="moon" onClick={() => onChangeSlot({ kind: 'rest' })} style={{ width: '100%' }}>Marcar como descanso</Button>
      </div>
    </>
  );
}

function RestSlotInspector({ onChangeSlot }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="moon" size={14} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, letterSpacing: '-0.02em' }}>Descanso</h3>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>DÍA DE RECUPERACIÓN</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '14px 0' }}>
        El estudiante verá este día marcado como descanso. Útil para diferenciar de días vacíos donde aún no has decidido.
      </p>
      <Button variant="outline" onClick={() => onChangeSlot({ kind: 'empty' })} style={{ width: '100%' }}>
        Quitar descanso
      </Button>
    </>
  );
}

function RoutineSlotInspector({ slot, onChangeSlot, onRemoveBlock }) {
  const [showOverrides, setShowOverrides] = React.useState(Object.keys(slot.overrides || {}).length > 0);
  const color = OBJECTIVE_COLORS[slot.category] || 'var(--color-primary)';
  const ov = slot.overrides || {};

  const setOv = (p) => onChangeSlot({ ...slot, overrides: { ...ov, ...p } });

  return (
    <>
      <div style={{
        border: `1px solid ${color}55`, borderLeft: `3px solid ${color}`,
        borderRadius: 10, padding: '12px 14px', background: `${color}10`,
        marginTop: 4,
      }}>
        <div style={{ fontSize: 10, color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {slot.routineName}
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {slot.dayName || slot.routineName}
        </h3>
        {slot.category && (
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
            {slot.category}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {slot.blockId && onRemoveBlock ? (
          <Button variant="ghost" size="sm" icon="trash" onClick={() => onRemoveBlock(slot.blockId)}>
            Quitar rutina
          </Button>
        ) : (
          <Button variant="ghost" size="sm" icon="trash" onClick={() => onChangeSlot({ kind: 'empty' })}>
            Quitar
          </Button>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--color-border-light)', margin: '18px 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div className="k-overline">Progresión</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Ajustes solo para esta semana
          </div>
        </div>
        <ToggleSwitch value={showOverrides} onChange={(v) => {
          setShowOverrides(v);
          if (!v) onChangeSlot({ ...slot, overrides: {} });
        }} />
      </div>

      {showOverrides && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-bg-raised)', border: '1px solid var(--color-border-light)', borderRadius: 10, padding: 12 }}>
          <OverrideRow label="Peso" suffix="%"
            value={ov.weightPct}
            onChange={(v) => setOv({ weightPct: v })}
            hint="±% sobre el peso base de la rutina" />
          <OverrideRow label="Reps" suffix=""
            value={ov.repsDelta}
            onChange={(v) => setOv({ repsDelta: v })}
            hint="± reps por serie" />
          <OverrideRow label="Series" suffix=""
            value={ov.setsDelta}
            onChange={(v) => setOv({ setsDelta: v })}
            hint="± series por ejercicio" />
          <OverrideRow label="RPE objetivo" suffix=""
            value={ov.rpeTarget}
            onChange={(v) => setOv({ rpeTarget: v })}
            hint="RPE fijo (0-10). Deja vacío para no forzar" />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip active={ov.deload} onClick={() => setOv({ deload: !ov.deload, weightPct: !ov.deload ? -40 : ov.weightPct, setsDelta: !ov.deload ? -1 : ov.setsDelta })}>
              <Icon name="minus" size={10} />Deload (-40%)
            </Chip>
            <Chip active={ov.testWeek} onClick={() => setOv({ testWeek: !ov.testWeek })}>
              <Icon name="sparkles" size={10} />Semana de test
            </Chip>
          </div>
        </div>
      )}
    </>
  );
}

function OverrideRow({ label, suffix, value, onChange, hint }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{label}</label>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{hint}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? undefined : Number(v));
          }}
          placeholder="—"
          style={{
            flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: 6, padding: '6px 8px', color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
          }}
        />
        {suffix && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '5px 8px', borderRadius: 12,
      background: active ? 'var(--color-primary-subtle)' : 'var(--color-bg)',
      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
      color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
      letterSpacing: '0.03em', cursor: 'pointer',
    }}>{children}</button>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 10,
      background: value ? 'var(--color-primary)' : 'var(--color-border)',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background .15s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left .15s',
      }} />
    </button>
  );
}

// ─── Assign routine wizard ────────────────────────────────────────────────
// Step 1: pick routine from library
// Step 2: select week range + map routine-days to weekdays (obligatorio todos)
function AssignRoutineModal({ library, program, initialWeek, onClose, onAssign }) {
  const [step, setStep] = React.useState(1);
  const [routine, setRoutine] = React.useState(null);

  const handlePick = (r) => {
    setRoutine(r);
    setStep(2);
  };
  const handleBack = () => { setStep(1); setRoutine(null); };

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div className="k-modal-center" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(780px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 40px)',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 14, zIndex: 201, boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
      }}>
        {step === 1 && (
          <PickRoutineStep library={library} onClose={onClose} onPick={handlePick} />
        )}
        {step === 2 && routine && (
          <MapDaysStep
            routine={routine}
            program={program}
            initialWeek={initialWeek}
            onBack={handleBack}
            onClose={onClose}
            onAssign={(cfg) => { onAssign(routine, cfg); }}
          />
        )}
      </div>
    </>,
    document.body
  );
}

function PickRoutineStep({ library, onClose, onPick }) {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('Todas');
  const categories = ['Todas', ...new Set((library || []).map(r => r.category).filter(Boolean))];
  const filtered = (library || []).filter(r => {
    if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter !== 'Todas' && r.category !== filter) return false;
    return true;
  });

  return (
    <>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="k-overline">Paso 1 de 2 · Rutina</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '2px 0 0', letterSpacing: '-0.02em' }}>Selecciona una rutina</h2>
        </div>
        <IconButton icon="x" onClick={onClose} />
      </div>

      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', minWidth: 200, position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <TextField value={query} onChange={setQuery} placeholder="Buscar rutina…" style={{ paddingLeft: 32 }} autoFocus />
        </div>
        <SelectField value={filter} onChange={setFilter} options={categories} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }} className="scroll-thin">
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            {library?.length === 0
              ? 'Aún no tienes rutinas. Crea una primero desde la sección Rutinas.'
              : 'No se encontraron rutinas con ese criterio.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(r => (
              <RoutinePickerItem key={r.id} routine={r} onPick={() => onPick(r)} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 22px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} rutina{filtered.length === 1 ? '' : 's'}
        </span>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      </div>
    </>
  );
}

// Step 2: map routine days to weekdays + choose weeks
function MapDaysStep({ routine, program, initialWeek, onBack, onClose, onAssign }) {
  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const totalWeeks = program.weeks.length;
  const routineDays = routine.days || [];

  // Scope: 'all' | 'one' | 'range'
  const [scope, setScope] = React.useState('all');
  const [rangeStart, setRangeStart] = React.useState((initialWeek ?? 0) + 1);
  const [rangeEnd, setRangeEnd] = React.useState(totalWeeks);
  const [singleWeek, setSingleWeek] = React.useState((initialWeek ?? 0) + 1);

  // Mapping: dayId → weekdayIdx (0-6) or null
  const [mapping, setMapping] = React.useState(() => {
    // Auto-suggest: L-V spread starting Monday
    const pick = [0, 2, 4, 1, 3, 5, 6];
    const m = {};
    routineDays.forEach((d, i) => { m[d.id] = i < pick.length ? pick[i] : null; });
    return m;
  });

  const weeksSelected = React.useMemo(() => {
    if (scope === 'all') return Array.from({ length: totalWeeks }, (_, i) => i);
    if (scope === 'one') return [singleWeek - 1];
    const s = Math.min(rangeStart, rangeEnd) - 1;
    const e = Math.max(rangeStart, rangeEnd) - 1;
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }, [scope, singleWeek, rangeStart, rangeEnd, totalWeeks]);

  const setDayMapping = (dayId, weekdayIdx) => {
    setMapping(m => ({ ...m, [dayId]: weekdayIdx }));
  };

  // Validation: every routine day must be mapped
  const allMapped = routineDays.every(d => mapping[d.id] != null && mapping[d.id] >= 0);
  // No two routine days on same weekday
  const weekdayCounts = {};
  routineDays.forEach(d => {
    const w = mapping[d.id];
    if (w != null) weekdayCounts[w] = (weekdayCounts[w] || 0) + 1;
  });
  const hasCollision = Object.values(weekdayCounts).some(c => c > 1);

  // Which weekdays are taken by what?
  const weekdayToDay = {};
  routineDays.forEach(d => {
    const w = mapping[d.id];
    if (w != null) weekdayToDay[w] = (weekdayToDay[w] || []).concat(d);
  });

  const cat = routine.category;
  const color = OBJECTIVE_COLORS[cat] || 'var(--color-primary)';

  const handleAssign = () => {
    if (!allMapped || hasCollision) return;
    onAssign({
      weeks: weeksSelected,
      mapping, // {dayId: weekdayIdx}
    });
  };

  return (
    <>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="k-overline">Paso 2 de 2 · Mapeo</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '2px 0 0', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {routine.name}
          </h2>
        </div>
        <IconButton icon="x" onClick={onClose} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px' }} className="scroll-thin">
        {/* Scope */}
        <div className="k-overline" style={{ marginBottom: 8 }}>En qué semanas</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <ScopeBtn active={scope === 'all'} onClick={() => setScope('all')} label={`Todas (${totalWeeks})`} />
          <ScopeBtn active={scope === 'range'} onClick={() => setScope('range')} label="Un rango" />
          <ScopeBtn active={scope === 'one'} onClick={() => setScope('one')} label="Una sola semana" />
        </div>

        {scope === 'range' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>DE</span>
            <WeekStepper value={rangeStart} min={1} max={totalWeeks} onChange={setRangeStart} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>A</span>
            <WeekStepper value={rangeEnd} min={1} max={totalWeeks} onChange={setRangeEnd} />
          </div>
        )}
        {scope === 'one' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>SEMANA</span>
            <WeekStepper value={singleWeek} min={1} max={totalWeeks} onChange={setSingleWeek} />
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
          APLICA A {weeksSelected.length} SEMANA{weeksSelected.length === 1 ? '' : 'S'}
        </div>

        {/* Mapping */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="k-overline">Mapear días a la semana</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {routineDays.length} DÍA{routineDays.length === 1 ? '' : 'S'} DE RUTINA
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14, lineHeight: 1.4 }}>
          Asigna cada día de la rutina a un día de la semana. Debes mapear todos.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {routineDays.map(d => {
            const exCount = (d.groups || []).reduce((s, g) => s + (g.exercises?.length || 0), 0);
            const current = mapping[d.id];
            return (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'var(--color-card)',
                border: `1px solid ${current == null ? 'var(--color-warning)' : 'var(--color-border-light)'}`,
                borderRadius: 10,
                flexWrap: 'wrap',
              }}>
                <div style={{ width: 3, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: '1 1 140px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                    {exCount} EJERCICIO{exCount === 1 ? '' : 'S'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {dayLabels.map((lbl, i) => {
                    const active = current === i;
                    const conflict = weekdayCounts[i] > 1 && active;
                    return (
                      <button
                        key={i}
                        onClick={() => setDayMapping(d.id, active ? null : i)}
                        style={{
                          width: 38, height: 34, padding: 0,
                          background: active ? color : 'var(--color-bg-raised)',
                          color: active ? '#fff' : 'var(--color-text)',
                          border: `1px solid ${conflict ? 'var(--color-warning)' : active ? color : 'var(--color-border)'}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                          fontWeight: 600,
                          transition: 'background .1s, border-color .1s',
                        }}
                      >{lbl}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {hasCollision && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'color-mix(in oklab, var(--color-warning) 12%, transparent)', border: '1px solid var(--color-warning)', borderRadius: 8, fontSize: 12, color: 'var(--color-text)' }}>
            <strong>Colisión:</strong> dos días de rutina tienen el mismo día de la semana. Cambia uno de los dos.
          </div>
        )}
        {!allMapped && !hasCollision && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--color-bg-raised)', border: '1px dashed var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Faltan días por mapear. Si la rutina no cabe en una semana, elige otra rutina con menos días.
          </div>
        )}

        {/* Preview */}
        {allMapped && !hasCollision && (
          <div style={{ marginTop: 20 }}>
            <div className="k-overline" style={{ marginBottom: 8 }}>Vista previa de una semana</div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
            }}>
              {dayLabels.map((lbl, i) => {
                const days = weekdayToDay[i] || [];
                return (
                  <div key={i} style={{
                    minHeight: 54,
                    background: days.length ? 'var(--color-card)' : 'var(--color-bg-raised)',
                    border: days.length ? `1px solid ${color}` : '1px dashed var(--color-border-light)',
                    borderRadius: 6, padding: 6,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                      {lbl.toUpperCase()}
                    </div>
                    {days.length > 0 ? (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
                        {days.map(d => d.name).join(' + ')}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 22px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Button variant="ghost" icon="arrowLeft" onClick={onBack}>Cambiar rutina</Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon="check" disabled={!allMapped || hasCollision} onClick={handleAssign}>
            Asignar a {weeksSelected.length} sem
          </Button>
        </div>
      </div>
    </>
  );
}

function ScopeBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px',
      background: active ? 'var(--color-primary)' : 'var(--color-bg-raised)',
      color: active ? '#fff' : 'var(--color-text)',
      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
      borderRadius: 8, cursor: 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)',
    }}>{label}</button>
  );
}

function WeekStepper({ value, min, max, onChange }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        style={{ width: 28, height: 30, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontSize: 14 }}>−</button>
      <div style={{ width: 40, textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{value}</div>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        style={{ width: 28, height: 30, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontSize: 14 }}>+</button>
    </div>
  );
}

// ─── Routine picker modal ─ legacy single-day picker kept for single-cell swaps ─
function RoutinePickerModal({ library, onClose, onPick }) {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('Todas');

  const categories = ['Todas', ...new Set((library || []).map(r => r.category).filter(Boolean))];

  const filtered = (library || []).filter(r => {
    if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter !== 'Todas' && r.category !== filter) return false;
    return true;
  });

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div className="k-modal-center" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(640px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 40px)',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 14, zIndex: 201, boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="k-overline">Selecciona una rutina</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '2px 0 0', letterSpacing: '-0.02em' }}>Añadir al calendario</h2>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>

        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', minWidth: 200, position: 'relative' }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <TextField value={query} onChange={setQuery} placeholder="Buscar rutina…" style={{ paddingLeft: 32 }} autoFocus />
          </div>
          <SelectField value={filter} onChange={setFilter} options={categories} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }} className="scroll-thin">
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              {library?.length === 0
                ? 'Aún no tienes rutinas. Crea una primero desde la sección Rutinas.'
                : 'No se encontraron rutinas con ese criterio.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map(r => (
                <RoutinePickerItem key={r.id} routine={r} onPick={() => onPick(r)} />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {filtered.length} rutina{filtered.length === 1 ? '' : 's'}
          </span>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </>,
    document.body
  );
}

function RoutinePickerItem({ routine, onPick }) {
  const [hover, setHover] = React.useState(false);
  const color = OBJECTIVE_COLORS[routine.category] || 'var(--color-border)';
  const days = routine.days?.length || 0;
  const totalExercises = (routine.days || []).reduce((a, d) => a + (d.groups || []).reduce((b, g) => b + (g.exercises?.length || 0), 0), 0);
  return (
    <div
      onClick={onPick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', gap: 12, alignItems: 'center',
        padding: '10px 12px', borderRadius: 8,
        border: `1px solid ${hover ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
        background: hover ? 'var(--color-card-hover)' : 'var(--color-card)',
        cursor: 'pointer', transition: 'border-color .12s, background .12s',
      }}
    >
      <div style={{ width: 3, height: 32, borderRadius: 2, background: color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{routine.name}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2, display: 'flex', gap: 10 }}>
          {routine.category && <span>{routine.category.toUpperCase()}</span>}
          <span>{days} día{days === 1 ? '' : 's'}</span>
          <span>{totalExercises} ejercicios</span>
        </div>
      </div>
      <Icon name="plus" size={14} style={{ color: hover ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
    </div>
  );
}

// ─── Assign to students modal ─────────────────────────────────────────────
function AssignProgramModal({ program, onClose, onAssign }) {
  const students = React.useMemo(() => seedStudents(), []);
  const [selected, setSelected] = React.useState(new Set());
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [query, setQuery] = React.useState('');

  const filtered = students.filter(s => s.status === 'active' && s.name.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id) => setSelected(s => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleAssign = () => {
    onAssign([...selected], startDate);
  };

  const endDate = React.useMemo(() => {
    if (program.mode === 'loop') return '—';
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() + program.durationWeeks * 7);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [startDate, program]);

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div className="k-modal-center" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(680px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 40px)',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 14, zIndex: 201, boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="k-overline">Asignar programa</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '2px 0 0', letterSpacing: '-0.02em' }}>{program.name}</h2>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>

        <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, overflow: 'auto' }} className="scroll-thin">
          {/* Left: students */}
          <div style={{ minWidth: 0 }}>
            <div className="k-overline" style={{ marginBottom: 8 }}>Estudiantes</div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
              <TextField value={query} onChange={setQuery} placeholder="Buscar estudiante…" style={{ paddingLeft: 32 }} />
            </div>
            <div style={{ maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--color-border-light)', borderRadius: 8, padding: 4 }} className="scroll-thin">
              {filtered.map(s => {
                const checked = selected.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                      background: checked ? 'var(--color-primary-subtle)' : 'transparent',
                      border: `1px solid ${checked ? 'var(--color-primary)' : 'transparent'}`,
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: checked ? 'var(--color-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {checked && <Icon name="check" size={10} style={{ color: '#fff' }} />}
                    </div>
                    <img src={s.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{s.objective} · {s.level}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
              {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
            </div>
          </div>

          {/* Right: dates + summary */}
          <div style={{ minWidth: 0 }}>
            <div className="k-overline" style={{ marginBottom: 8 }}>Inicio</div>
            <Field label="Fecha de inicio">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%', background: 'var(--color-bg-raised)',
                  border: '1px solid var(--color-border)', borderRadius: 8,
                  padding: '10px 12px', color: 'var(--color-text)',
                  fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
                  colorScheme: 'dark',
                }} />
            </Field>

            <div style={{ marginTop: 16, padding: 14, background: 'var(--color-bg-raised)', border: '1px solid var(--color-border-light)', borderRadius: 10 }}>
              <div className="k-overline" style={{ marginBottom: 10 }}>Resumen</div>
              <SumRow label="Programa" value={program.name} />
              <SumRow label="Duración" value={program.mode === 'loop' ? 'En bucle' : `${program.durationWeeks} semanas`} />
              <SumRow label="Finaliza" value={endDate} />
              <SumRow label="Sesiones/sem" value={`${Math.round((program.weeks?.[0]?.slots || []).filter(s => s.kind === 'routineDay').length)}`} />
              <SumRow label="Asignar a" value={`${selected.size} estudiante${selected.size === 1 ? '' : 's'}`} />
            </div>

            <div style={{
              marginTop: 14, padding: 12,
              background: 'rgba(230,38,57,0.08)',
              border: '1px solid rgba(230,38,57,0.25)',
              borderRadius: 10, fontSize: 11, lineHeight: 1.5, color: 'var(--color-text-secondary)',
            }}>
              <strong style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Nota:</strong> Si algún estudiante ya tiene un programa activo, se pausará automáticamente al comenzar este.
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon="check" onClick={handleAssign} disabled={selected.size === 0}>
            Asignar a {selected.size || '…'}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}

function SumRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', fontSize: 12 }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{value}</span>
    </div>
  );
}

Object.assign(window, {
  ProgramsView,
  newProgram, makeWeek,
  OBJECTIVE_COLORS,
});

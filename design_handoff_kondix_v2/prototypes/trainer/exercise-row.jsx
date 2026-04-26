// ExerciseRow — one exercise inside a day. Renders series, reps range, weight, rest, RPE, notes.
// Supports simple (all sets same) and advanced (per-set) modes.

function RepsRangeInput({ value, onChange, compact = false }) {
  // value: { min, max } | null — either side can be null for 'open'
  const v = value || { min: null, max: null };
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      height: 30,
      overflow: 'hidden',
    }}>
      <input
        type="number"
        min={0}
        value={v.min ?? ''}
        onChange={(e) => onChange({ ...v, min: e.target.value === '' ? null : Number(e.target.value) })}
        placeholder={compact ? '—' : 'libre'}
        style={{
          width: compact ? 38 : 48,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-0)',
          fontSize: 13,
          textAlign: 'center',
          outline: 'none',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          padding: '0 2px',
        }}
      />
      <span style={{ color: 'var(--text-4)', fontSize: 11, fontFamily: 'var(--font-mono)' }}></span>
      <input
        type="number"
        min={0}
        value={v.max ?? ''}
        onChange={(e) => onChange({ ...v, max: e.target.value === '' ? null : Number(e.target.value) })}
        placeholder={compact ? '—' : 'libre'}
        style={{
          width: compact ? 38 : 48,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-0)',
          fontSize: 13,
          textAlign: 'center',
          outline: 'none',
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          padding: '0 2px',
        }}
      />
    </div>
  );
}

function formatRest(sec) {
  if (!sec) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}:${String(s).padStart(2,'0')}` : `${m}m`;
}

function formatReps(reps) {
  if (!reps) return 'libre';
  const { min, max } = reps;
  if (min == null && max == null) return 'libre';
  if (min == null) return `≤ ${max}`;
  if (max == null) return `${min}+`;
  if (min === max) return `${min}`;
  return `${min}–${max}`;
}

function ExerciseRow({ exercise, onChange, onDelete, onDuplicate, onStartDrag, isDragging, groupBadge }) {
  const [expanded, setExpanded] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const patch = (p) => onChange({ ...exercise, ...p });

  const updateSetCount = (n) => {
    const count = Math.max(1, Math.min(20, n));
    const newAdvanced = Array.from({ length: count }, (_, i) => (
      exercise.advancedSets[i] || {
        id: makeSetId(),
        reps: exercise.reps,
        weight: exercise.weight,
        rpe: exercise.rpe,
      }
    ));
    patch({ sets: count, advancedSets: newAdvanced });
  };

  return (
    <div
      style={{
        background: 'var(--bg-2)',
        border: `1px solid ${isDragging ? 'var(--red-500)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        transition: 'border-color .12s',
        position: 'relative',
      }}
    >
      {/* Group indicator */}
      {groupBadge && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: groupBadge.color,
        }} />
      )}

      {/* Main row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 12,
        alignItems: 'center',
        padding: '10px 12px',
      }}>
        {/* Drag handle + index */}
        <div
          onMouseDown={onStartDrag}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'grab',
            color: 'var(--text-4)',
          }}
        >
          <Icon name="grip" size={14} />
        </div>

        {/* Name + meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {groupBadge && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                color: groupBadge.color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {groupBadge.label}
              </span>
            )}
            <EditableText
              value={exercise.name}
              onChange={(name) => patch({ name })}
              placeholder="Nombre del ejercicio"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-0)', letterSpacing: '-0.01em' }}
            />
            {!exercise.libId && exercise.name && (
              <Badge tone="red" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 9 }}>nuevo</Badge>
            )}
          </div>
          {exercise.muscle && (
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{exercise.muscle}</span>
          )}
        </div>

        {/* Inline quick-stats + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="k-quick-stats">
            <QuickStat label="Series" value={exercise.sets} mono />
            <QuickStat label="Reps" value={formatReps(exercise.reps)} mono />
            <QuickStat label="Peso" value={exercise.weight == null ? 'libre' : `${exercise.weight} kg`} mono />
            <QuickStat label="Desc." value={formatRest(exercise.rest)} mono />
          </div>
          <IconButton
            icon={expanded ? 'chevronUp' : 'chevronDown'}
            size="sm"
            onClick={() => setExpanded(e => !e)}
            tooltip={expanded ? 'Colapsar' : 'Editar detalles'}
          />
          <div style={{ position: 'relative' }}>
            <IconButton
              icon="more"
              size="sm"
              onClick={() => setMenuOpen(o => !o)}
            />
            {menuOpen && (
              <>
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 20 }}
                />
                <div style={{
                  position: 'absolute',
                  right: 0, top: '100%',
                  marginTop: 4,
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 21,
                  minWidth: 180,
                  overflow: 'hidden',
                }}>
                  <MenuItem icon="copy" onClick={() => { onDuplicate(); setMenuOpen(false); }}>Duplicar</MenuItem>
                  <MenuItem
                    icon={exercise.mode === 'advanced' ? 'unlink' : 'link'}
                    onClick={() => { patch({ mode: exercise.mode === 'advanced' ? 'simple' : 'advanced' }); setMenuOpen(false); setExpanded(true); }}
                  >
                    {exercise.mode === 'advanced' ? 'Modo simple' : 'Serie por serie'}
                  </MenuItem>
                  <MenuItem icon="trash" danger onClick={() => { onDelete(); setMenuOpen(false); }}>Eliminar</MenuItem>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-1)',
          padding: '14px 14px 14px 34px',
        }}>
          {exercise.mode === 'simple' ? (
            <SimpleSetEditor exercise={exercise} patch={patch} updateSetCount={updateSetCount} />
          ) : (
            <AdvancedSetEditor exercise={exercise} patch={patch} updateSetCount={updateSetCount} />
          )}

          {/* Notes */}
          <div style={{ marginTop: 14 }}>
            <Field label="Notas del entrenador">
              <textarea
                value={exercise.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Técnica, tempo, variaciones… (se muestra al estudiante)"
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--text-1)',
                  padding: '8px 10px',
                  fontSize: 12,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-sans)',
                }}
                className="k-focus-ring"
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, children, onClick, danger }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', textAlign: 'left',
        padding: '8px 12px',
        background: hover ? 'var(--bg-4)' : 'transparent',
        border: 'none', cursor: 'pointer',
        color: danger ? 'var(--red-400)' : 'var(--text-1)',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Icon name={icon} size={13} />
      {children}
    </button>
  );
}

function QuickStat({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{
        fontSize: 9,
        color: 'var(--text-4)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        color: 'var(--text-0)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
    </div>
  );
}

function SimpleSetEditor({ exercise, patch, updateSetCount }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr',
        gap: 12,
        alignItems: 'end',
      }}>
        <Field label="Series">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            height: 30,
          }}>
            <button
              onClick={() => updateSetCount(exercise.sets - 1)}
              style={{ width: 28, height: 28, background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="minus" size={12} />
            </button>
            <span style={{
              minWidth: 28, textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-0)',
              fontVariantNumeric: 'tabular-nums',
            }}>{exercise.sets}</span>
            <button
              onClick={() => updateSetCount(exercise.sets + 1)}
              style={{ width: 28, height: 28, background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="plus" size={12} />
            </button>
          </div>
        </Field>
        <Field label="Reps (min–max, vacío = libre)">
          <RepsRangeInput value={exercise.reps} onChange={(reps) => patch({ reps })} />
        </Field>
        <Field label="Peso (kg, vacío = libre)">
          <NumInput
            value={exercise.weight}
            onChange={(weight) => patch({ weight })}
            placeholder="libre"
            suffix="kg"
          />
        </Field>
        <Field label="Descanso">
          <NumInput
            value={exercise.rest}
            onChange={(rest) => patch({ rest })}
            placeholder="—"
            suffix="seg"
          />
        </Field>
        <Field label="RPE / RIR (opc.)">
          <NumInput
            value={exercise.rpe}
            onChange={(rpe) => patch({ rpe })}
            placeholder="—"
            min={1}
            max={10}
          />
        </Field>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="sparkles" size={12} style={{ color: 'var(--red-500)' }} />
        Todas las series usan los mismos valores. Cambia a <button
          onClick={() => patch({ mode: 'advanced' })}
          style={{ background: 'transparent', border: 'none', color: 'var(--red-400)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
        >serie por serie</button> para variar cada una (piramidal, dropsets, etc).
      </div>
    </div>
  );
}

function AdvancedSetEditor({ exercise, patch, updateSetCount }) {
  const updateSet = (idx, p) => {
    const next = exercise.advancedSets.map((s, i) => i === idx ? { ...s, ...p } : s);
    patch({ advancedSets: next });
  };
  const addSet = () => {
    const last = exercise.advancedSets[exercise.advancedSets.length - 1] || { reps: exercise.reps, weight: exercise.weight, rpe: exercise.rpe };
    patch({
      sets: exercise.sets + 1,
      advancedSets: [...exercise.advancedSets, { id: makeSetId(), reps: last.reps, weight: last.weight, rpe: last.rpe }],
    });
  };
  const removeSet = (idx) => {
    if (exercise.advancedSets.length <= 1) return;
    patch({
      sets: exercise.sets - 1,
      advancedSets: exercise.advancedSets.filter((_, i) => i !== idx),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 1fr 72px 28px',
        gap: 10,
        padding: '0 4px',
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-4)',
        fontWeight: 500,
      }}>
        <span>#</span>
        <span>Reps</span>
        <span>Peso</span>
        <span>RPE</span>
        <span></span>
      </div>
      {exercise.advancedSets.map((s, i) => (
        <div key={s.id} style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 1fr 72px 28px',
          gap: 10,
          alignItems: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--red-500)',
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <RepsRangeInput value={s.reps} onChange={(reps) => updateSet(i, { reps })} compact />
          <NumInput
            value={s.weight}
            onChange={(weight) => updateSet(i, { weight })}
            placeholder="libre"
            suffix="kg"
          />
          <NumInput
            value={s.rpe}
            onChange={(rpe) => updateSet(i, { rpe })}
            placeholder="—"
            min={1}
            max={10}
          />
          <IconButton
            icon="x"
            size="sm"
            onClick={() => removeSet(i)}
            tooltip="Eliminar serie"
            style={{ opacity: exercise.advancedSets.length > 1 ? 1 : 0.3 }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        <Button variant="outline" size="xs" icon="plus" onClick={addSet}>Añadir serie</Button>
        <span style={{ color: 'var(--text-4)' }}>·</span>
        <Field label="Descanso entre series" style={{ flex: 1, maxWidth: 180 }}>
          <NumInput
            value={exercise.rest}
            onChange={(rest) => patch({ rest })}
            placeholder="—"
            suffix="seg"
          />
        </Field>
      </div>
    </div>
  );
}

window.ExerciseRow = ExerciseRow;
window.formatReps = formatReps;
window.formatRest = formatRest;

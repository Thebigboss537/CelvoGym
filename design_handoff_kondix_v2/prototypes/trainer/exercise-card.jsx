// Exercise card — collapsible, draggable, portal menu. Aligned to Kondix model.

function SetRow({ set, idx, onChange, onDelete, canDelete }) {
  const patch = (p) => onChange({ ...set, ...p });
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 110px 1fr 1fr 58px 72px 24px',
      gap: 8,
      alignItems: 'center',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
        fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600,
        textAlign: 'center',
      }}>{String(idx + 1).padStart(2, '0')}</span>

      <SelectField
        value={set.setType}
        onChange={(setType) => patch({ setType })}
        options={SET_TYPES.map(v => ({ value: v, label: SET_TYPE_LABELS[v] }))}
      />

      <SmallInput value={set.targetReps} onChange={(v) => patch({ targetReps: v })} placeholder="libre" mono />
      <SmallInput value={set.targetWeight} onChange={(v) => patch({ targetWeight: v })} placeholder="libre" mono suffix="kg" />
      <SmallInput type="number" value={set.targetRpe ?? ''} onChange={(v) => patch({ targetRpe: v === '' ? null : Number(v) })} placeholder="—" mono />
      <SmallInput type="number" value={set.restSeconds ?? ''} onChange={(v) => patch({ restSeconds: v === '' ? null : Number(v) })} placeholder="—" mono suffix="s" />
      <IconButton
        icon="x" size="xs" onClick={onDelete} tooltip="Eliminar serie"
        style={{ opacity: canDelete ? 1 : 0.3, pointerEvents: canDelete ? 'auto' : 'none' }}
      />
    </div>
  );
}

function SmallInput({ value, onChange, placeholder, mono, suffix, type = 'text', style, ...props }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      background: 'var(--color-bg-raised)',
      border: `1px solid ${focus ? 'var(--color-primary)' : 'var(--color-border)'}`,
      borderRadius: 7, height: 32,
      transition: 'border-color .12s',
      ...style,
    }}>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'transparent', border: 'none',
          color: 'var(--color-text)', fontSize: 13,
          padding: '0 8px', outline: 'none',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          fontVariantNumeric: 'tabular-nums', textAlign: 'center',
          minWidth: 0, width: '100%',
        }}
        {...props}
      />
      {suffix && (
        <span style={{
          color: 'var(--color-text-muted)', fontSize: 10,
          paddingRight: 8, fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
        }}>{suffix}</span>
      )}
    </div>
  );
}

// Portal-rendered dropdown. Positions against an anchor element.
function PortalMenu({ anchorRef, open, onClose, children, align = 'right' }) {
  const [pos, setPos] = React.useState(null);

  React.useEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const top = r.bottom + 4;
    const left = align === 'right' ? r.right : r.left;
    setPos({ top, left });
  }, [open, anchorRef, align]);

  if (!open || !pos) return null;

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
      <div
        style={{
          position: 'fixed',
          top: pos.top,
          left: align === 'right' ? undefined : pos.left,
          right: align === 'right' ? window.innerWidth - pos.left : undefined,
          background: 'var(--color-card-hover)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1001,
          minWidth: 200,
          overflow: 'hidden',
          padding: 4,
        }}
        className="k-fade-up"
      >
        {children}
      </div>
    </>,
    document.body
  );
}

function ExerciseCard({
  exercise, onChange, onDelete, onDuplicate,
  badge, canGroupWithNext, onGroupWithNext, onUngroup, isInCluster,
  onDragStart, onDragEnd, isDragging, dragHandlers,
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuBtnRef = React.useRef(null);
  const [confirm, confirmDialog] = useConfirm();

  const requestDelete = () => confirm({
    title: 'Eliminar ejercicio',
    message: `¿Eliminar "${exercise.name || 'este ejercicio'}"? Esta acción no se puede deshacer.`,
    onConfirm: onDelete,
  });

  const patch = (p) => onChange({ ...exercise, ...p });
  const setsCount = exercise.sets.length;
  const firstEffective = exercise.sets.find(s => s.setType === 'Effective') || exercise.sets[0];
  const totalRest = exercise.sets.reduce((s, x) => s + (x.restSeconds || 0), 0);

  const summary = React.useMemo(() => {
    if (!exercise.sets.length) return '—';
    const counts = {};
    exercise.sets.forEach(s => counts[s.setType] = (counts[s.setType] || 0) + 1);
    const labels = { Warmup: 'calent.', Effective: 'efect.', DropSet: 'drop', RestPause: 'r-p', AMRAP: 'AMRAP' };
    return Object.entries(counts).map(([t, c]) => `${c} ${labels[t] || t}`).join(' · ');
  }, [exercise.sets]);

  return (
    <>
    <div
      {...(dragHandlers || {})}
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 10,
        overflow: 'visible',
        transition: 'border-color .15s, box-shadow .15s, opacity .15s',
        position: 'relative',
        opacity: isDragging ? 0.4 : 1,
      }}>
      {badge && (
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: badge.color,
          borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
        }} />
      )}

      {/* Collapsed header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          cursor: 'pointer',
          background: expanded ? 'var(--color-bg-raised)' : 'transparent',
          borderBottom: expanded ? '1px solid var(--color-border-light)' : 'none',
          borderTopLeftRadius: 10, borderTopRightRadius: 10,
          borderBottomLeftRadius: expanded ? 0 : 10, borderBottomRightRadius: expanded ? 0 : 10,
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div
          draggable
          onDragStart={(e) => { e.stopPropagation(); onDragStart?.(e); }}
          onDragEnd={(e) => { e.stopPropagation(); onDragEnd?.(e); }}
          onClick={(e) => e.stopPropagation()}
          title="Arrastra para mover"
          style={{
            color: 'var(--color-text-muted)',
            cursor: 'grab', padding: 4,
            borderRadius: 4,
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-card-hover)'; e.currentTarget.style.color = 'var(--color-text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <Icon name="grip" size={14} />
        </div>

        {badge && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            color: badge.color, minWidth: 18,
            letterSpacing: '0.05em',
          }}>{badge.label}</span>
        )}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {exercise.name || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin nombre</span>}
            </span>
            {exercise.muscleGroup && <Badge tone="outline">{exercise.muscleGroup}</Badge>}
            {exercise.videoUrl && <Icon name="playCircle" size={14} style={{ color: 'var(--color-primary)' }} />}
            {!exercise.catalogId && exercise.name && <Badge tone="primary" style={{ fontSize: 9, padding: '2px 6px' }}>Nuevo</Badge>}
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {setsCount} {setsCount === 1 ? 'serie' : 'series'} · {summary}
          </span>
        </div>

        {!expanded && firstEffective && (
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 12, color: 'var(--color-text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span><span style={{ color: 'var(--color-text-muted)', fontSize: 9, letterSpacing: '0.05em' }}>REPS </span>{firstEffective.targetReps || 'libre'}</span>
            <span><span style={{ color: 'var(--color-text-muted)', fontSize: 9, letterSpacing: '0.05em' }}>PESO </span>{firstEffective.targetWeight ? firstEffective.targetWeight + 'kg' : 'libre'}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={(e) => e.stopPropagation()}>
          <div ref={menuBtnRef}>
            <IconButton icon="more" size="sm" onClick={() => setMenuOpen(o => !o)} active={menuOpen} />
          </div>
          <IconButton icon={expanded ? 'chevronUp' : 'chevronDown'} size="sm" onClick={() => setExpanded(e => !e)} />

          <PortalMenu anchorRef={menuBtnRef} open={menuOpen} onClose={() => setMenuOpen(false)}>
            {!isInCluster && canGroupWithNext && (
              <>
                <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Agrupar con el siguiente
                </div>
                <MenuItem icon="link" onClick={() => { onGroupWithNext('Superset'); setMenuOpen(false); }}>
                  Superset <span style={{ color: 'var(--color-text-muted)', fontSize: 11, marginLeft: 'auto' }}>2 ejerc.</span>
                </MenuItem>
                <MenuItem icon="link" onClick={() => { onGroupWithNext('Triset'); setMenuOpen(false); }}>
                  Triset <span style={{ color: 'var(--color-text-muted)', fontSize: 11, marginLeft: 'auto' }}>3 ejerc.</span>
                </MenuItem>
                <MenuItem icon="link" onClick={() => { onGroupWithNext('Circuit'); setMenuOpen(false); }}>
                  Circuito <span style={{ color: 'var(--color-text-muted)', fontSize: 11, marginLeft: 'auto' }}>2+ ejerc.</span>
                </MenuItem>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
              </>
            )}
            {isInCluster && onUngroup && (
              <>
                <MenuItem icon="unlink" onClick={() => { onUngroup(); setMenuOpen(false); }}>
                  Sacar del grupo
                </MenuItem>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
              </>
            )}
            <MenuItem icon="copy" onClick={() => { onDuplicate(); setMenuOpen(false); }}>Duplicar ejercicio</MenuItem>
            <MenuItem icon="trash" danger onClick={() => { requestDelete(); setMenuOpen(false); }}>Eliminar</MenuItem>
          </PortalMenu>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px 16px' }} className="k-fade-up">
          {/* Name picker */}
          <Field label="Ejercicio" style={{ marginBottom: 12 }}>
            <ExercisePicker
              value={exercise.name}
              onChange={(p) => patch({
                name: p.name,
                catalogId: p.catalogId !== undefined ? p.catalogId : exercise.catalogId,
                muscleGroup: p.muscleGroup !== undefined ? p.muscleGroup : exercise.muscleGroup,
              })}
            />
          </Field>

          {/* Tempo + video */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, marginBottom: 14 }}>
            <Field label="Tempo (opc.)">
              <SmallInput
                value={exercise.tempo}
                onChange={(v) => patch({ tempo: v })}
                placeholder="3-0-1-0"
                mono
              />
            </Field>
            <Field label="Video demostrativo">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 32 }}>
                <SelectField
                  value={exercise.videoSource}
                  onChange={(videoSource) => patch({ videoSource, videoUrl: videoSource === 'None' ? '' : exercise.videoUrl })}
                  options={[
                    { value: 'None', label: 'Sin video' },
                    { value: 'YouTube', label: 'YouTube' },
                    { value: 'Upload', label: 'Subir archivo' },
                  ]}
                  style={{ flexShrink: 0, width: 130 }}
                />
                {exercise.videoSource === 'YouTube' && (
                  <SmallInput
                    value={exercise.videoUrl}
                    onChange={(v) => patch({ videoUrl: v })}
                    placeholder="https://youtu.be/…"
                    style={{ flex: 1 }}
                  />
                )}
                {exercise.videoSource === 'Upload' && (
                  <Button variant="outline" size="sm" icon="video">
                    {exercise.videoUrl ? 'Reemplazar' : 'Subir video'}
                  </Button>
                )}
              </div>
            </Field>
          </div>

          {/* Sets table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '28px 110px 1fr 1fr 58px 72px 24px',
              gap: 8, padding: '0 2px',
            }} className="k-overline">
              <span style={{ textAlign: 'center' }}>#</span>
              <span>Tipo</span>
              <span style={{ textAlign: 'center' }}>Reps</span>
              <span style={{ textAlign: 'center' }}>Peso</span>
              <span style={{ textAlign: 'center' }}>RPE</span>
              <span style={{ textAlign: 'center' }}>Desc.</span>
              <span></span>
            </div>
            {exercise.sets.map((s, i) => (
              <SetRow
                key={s.id}
                set={s}
                idx={i}
                canDelete={exercise.sets.length > 1}
                onChange={(ns) => patch({ sets: exercise.sets.map((x, j) => j === i ? ns : x) })}
                onDelete={() => patch({ sets: exercise.sets.filter((_, j) => j !== i) })}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <Button
              variant="ghost" size="sm" icon="plus"
              onClick={() => {
                const last = exercise.sets[exercise.sets.length - 1] || newSet();
                patch({ sets: [...exercise.sets, newSet({ setType: last.setType, targetReps: last.targetReps, targetWeight: last.targetWeight, targetRpe: last.targetRpe, restSeconds: last.restSeconds })] });
              }}
              style={{ color: 'var(--color-primary)' }}
            >Añadir serie</Button>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              <Icon name="timer" size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Desc. total ≈ {Math.round(totalRest / 60)} min
            </span>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 14 }}>
            <Field label="Notas del ejercicio">
              <textarea
                value={exercise.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Técnica, variaciones… (se muestra al alumno)"
                rows={2}
                className="k-focus-ring"
                style={{
                  width: '100%',
                  background: 'var(--color-bg-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: 'var(--color-text-secondary)',
                  fontSize: 12, outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.5,
                }}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
    {confirmDialog}
    </>
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
        padding: '8px 10px',
        background: hover ? (danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)') : 'transparent',
        border: 'none', cursor: 'pointer',
        color: danger ? 'var(--color-danger)' : 'var(--color-text)',
        fontSize: 12, fontFamily: 'var(--font-sans)',
        borderRadius: 6,
      }}
    >
      <Icon name={icon} size={13} />
      <span style={{ display: 'contents' }}>{children}</span>
    </button>
  );
}

window.ExerciseCard = ExerciseCard;
window.MenuItem = MenuItem;
window.PortalMenu = PortalMenu;

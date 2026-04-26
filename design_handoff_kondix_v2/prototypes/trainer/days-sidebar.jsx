// Sidebar with days list (drag-reorderable)

function DaysSidebar({ routine, activeDayId, onSelectDay, onReorder, onAddDay, onDeleteDay, onDuplicateDay, onMobileClose, isMobile }) {
  const [draggedIdx, setDraggedIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);

  const handleDrop = (toIdx) => {
    if (draggedIdx === null || draggedIdx === toIdx) return;
    onReorder(draggedIdx, toIdx);
    setDraggedIdx(null);
    setOverIdx(null);
  };

  return (
    <aside style={{
      width: isMobile ? '100%' : 280,
      minWidth: isMobile ? undefined : 280,
      background: 'var(--color-bg)',
      borderRight: isMobile ? 'none' : '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Routine meta */}
      <div style={{
        padding: '18px 20px 16px',
        borderBottom: '1px solid var(--color-border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="k-overline" style={{ color: 'var(--color-primary)' }}>
            <Icon name="clipboard" size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
            Rutina
          </div>
          {isMobile && (
            <IconButton icon="x" size="sm" onClick={onMobileClose} />
          )}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em',
          color: 'var(--color-text)',
          margin: 0, lineHeight: 1.2,
        }}>
          <EditableText
            value={routine.name}
            onChange={(name) => routine._patch({ name })}
            placeholder="Nombre de la rutina…"
          />
        </h1>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
          <EditableText
            value={routine.description}
            onChange={(description) => routine._patch({ description })}
            placeholder="Añade una descripción…"
            multiline
          />
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <CategoryPicker
            value={routine.category}
            onChange={(category) => routine._patch({ category })}
          />
          {routine.tags.map(t => <Badge key={t} tone="outline">{t}</Badge>)}
        </div>
      </div>

      {/* Days list */}
      <div className="k-overline" style={{ padding: '14px 20px 6px', color: 'var(--color-text-muted)' }}>
        Días · {routine.days.length}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 16px' }} className="scroll-thin">
        {routine.days.map((d, i) => {
          const exCount = d.groups.reduce((s, g) => s + g.exercises.length, 0);
          const active = d.id === activeDayId;
          const isOver = overIdx === i && draggedIdx !== null && draggedIdx !== i;
          return (
            <div
              key={d.id}
              draggable
              onDragStart={(e) => { setDraggedIdx(i); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => { setDraggedIdx(null); setOverIdx(null); }}
              onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
              onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
              onClick={() => onSelectDay(d.id)}
              style={{
                padding: '11px 12px',
                margin: '2px 0',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                background: active ? 'var(--color-primary-subtle)' : 'transparent',
                border: `1px solid ${active ? 'rgba(230,38,57,0.35)' : 'transparent'}`,
                transition: 'background .12s, border-color .12s',
                position: 'relative',
                opacity: draggedIdx === i ? 0.4 : 1,
                boxShadow: isOver ? 'inset 0 2px 0 var(--color-primary)' : 'none',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-card)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11, fontWeight: 700,
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                minWidth: 20,
              }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: active ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}>{d.name || <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Sin nombre</span>}</div>
                <div style={{
                  fontSize: 11, color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>{exCount} ejercicio{exCount === 1 ? '' : 's'}</div>
              </div>
              <Icon name="grip" size={12} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
            </div>
          );
        })}

        <button
          onClick={onAddDay}
          className="k-focus-ring"
          style={{
            width: '100%',
            marginTop: 8,
            padding: '11px 12px',
            background: 'transparent',
            border: '1px dashed var(--color-border)',
            borderRadius: 10,
            color: 'var(--color-text-muted)',
            fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'border-color .12s, color .12s',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <Icon name="plus" size={14} /> Añadir día
        </button>
      </div>
    </aside>
  );
}

window.DaysSidebar = DaysSidebar;

function CategoryPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const categories = ['Hipertrofia', 'Fuerza', 'Pérdida grasa', 'Funcional', 'Otro'];
  const colors = window.OBJECTIVE_COLORS || {};
  const color = colors[value] || '#78787f';

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="k-focus-ring"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 8px 3px 8px',
          background: color + '25',
          border: `1px solid ${color}55`,
          borderRadius: 20,
          color,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          transition: 'background .12s',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
        {value || 'Sin categoría'}
        <Icon name="chevronDown" size={10} style={{ opacity: 0.7, marginLeft: 2 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          padding: 4, minWidth: 170, zIndex: 50,
        }}>
          {categories.map(c => {
            const cc = colors[c] || '#78787f';
            const active = c === value;
            return (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className="k-focus-ring"
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 8px',
                  background: active ? 'var(--color-card-hover)' : 'transparent',
                  border: 'none', borderRadius: 6,
                  color: 'var(--color-text)',
                  fontSize: 12, fontWeight: 500, textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-card-hover)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 4, background: cc, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{c}</span>
                {active && <Icon name="check" size={12} style={{ color: 'var(--color-primary)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.CategoryPicker = CategoryPicker;

// Autocomplete exercise picker — searches catalog, creates new on-the-fly.
function ExercisePicker({ value, onChange, onCommit, autoFocus, inline }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value || '');
  const [activeIdx, setActiveIdx] = React.useState(0);
  const ref = React.useRef(null);
  const boxRef = React.useRef(null);

  React.useEffect(() => { setQuery(value || ''); }, [value]);
  React.useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const q = query.trim().toLowerCase();
  const matches = q.length >= 1
    ? EXERCISE_CATALOG.filter(e =>
        e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
      ).slice(0, 6)
    : [];

  const showCreate = q.length >= 2 && !matches.some(m => m.name.toLowerCase() === q);
  const totalOptions = matches.length + (showCreate ? 1 : 0);

  React.useEffect(() => { setActiveIdx(0); }, [query]);

  const pick = (idx) => {
    if (idx < matches.length) {
      const m = matches[idx];
      onChange({ name: m.name, catalogId: m.id, muscleGroup: m.muscleGroup });
    } else if (showCreate) {
      onChange({ name: query.trim(), catalogId: null, muscleGroup: null });
    }
    setOpen(false);
    onCommit?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActiveIdx(i => Math.min(totalOptions - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (totalOptions > 0) pick(activeIdx);
      else if (query.trim()) { onChange({ name: query.trim(), catalogId: null, muscleGroup: null }); onCommit?.(); setOpen(false); }
    }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={ref}
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange({ name: e.target.value }); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onKeyDown={onKeyDown}
        placeholder="Busca o escribe el nombre del ejercicio…"
        className="k-focus-ring"
        style={{
          background: inline ? 'transparent' : 'var(--color-bg-raised)',
          border: inline ? 'none' : '1px solid var(--color-border)',
          borderBottom: inline ? '1px solid var(--color-border-light)' : undefined,
          borderRadius: inline ? 0 : 8,
          padding: inline ? '4px 0' : '10px 12px',
          color: 'var(--color-text)',
          fontSize: inline ? 14 : 13,
          fontWeight: inline ? 600 : 400,
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          width: '100%',
        }}
      />
      {open && (matches.length > 0 || showCreate) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50, overflow: 'hidden',
          maxHeight: 280, overflowY: 'auto',
        }} className="scroll-thin">
          {matches.map((m, i) => (
            <div
              key={m.id}
              onMouseDown={(e) => { e.preventDefault(); pick(i); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px',
                cursor: 'pointer',
                background: activeIdx === i ? 'var(--color-card-hover)' : 'transparent',
                borderLeft: activeIdx === i ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{m.name}</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.muscleGroup}</span>
            </div>
          ))}
          {showCreate && (
            <div
              onMouseDown={(e) => { e.preventDefault(); pick(matches.length); }}
              onMouseEnter={() => setActiveIdx(matches.length)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                cursor: 'pointer',
                background: activeIdx === matches.length ? 'var(--color-card-hover)' : 'transparent',
                borderLeft: activeIdx === matches.length ? '2px solid var(--color-primary)' : '2px solid transparent',
                borderTop: matches.length > 0 ? '1px solid var(--color-border-light)' : 'none',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="plus" size={13} /></div>
              <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
                Crear <strong style={{ color: 'var(--color-primary)' }}>"{query.trim()}"</strong>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 6, fontWeight: 400 }}>Nuevo ejercicio</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.ExercisePicker = ExercisePicker;

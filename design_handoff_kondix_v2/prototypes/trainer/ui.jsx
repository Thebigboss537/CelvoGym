// UI primitives for Kondix — Syne + Outfit, Crimson primary.

function Button({ variant = 'secondary', size = 'md', icon, iconRight, children, style, fullWidth, ...props }) {
  const sizes = {
    xs: { padding: '0 8px', fontSize: 11, height: 24, borderRadius: 6 },
    sm: { padding: '0 12px', fontSize: 12, height: 30, borderRadius: 8 },
    md: { padding: '0 16px', fontSize: 13, height: 38, borderRadius: 10 },
    lg: { padding: '0 20px', fontSize: 14, height: 44, borderRadius: 12 },
  };
  const variants = {
    primary: { background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' },
    secondary: { background: 'var(--color-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
    ghost: { background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid transparent' },
    outline: { background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
    subtle: { background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', border: '1px solid rgba(230,38,57,0.25)' },
  };
  const hoverBg = {
    primary: 'var(--color-primary-hover)',
    secondary: 'var(--color-card-hover)',
    ghost: 'var(--color-card)',
    outline: 'var(--color-card)',
    subtle: 'rgba(230,38,57,0.18)',
  };
  const [hover, setHover] = React.useState(false);
  const v = variants[variant];
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="k-focus-ring"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontWeight: 600, letterSpacing: '-0.005em',
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background .15s, border-color .15s, transform .1s',
        userSelect: 'none',
        width: fullWidth ? '100%' : undefined,
        ...sizes[size], ...v,
        background: hover ? hoverBg[variant] : v.background,
        ...style,
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={(e) => e.currentTarget.style.transform = ''}
      {...props}
    >
      {icon && <Icon name={icon} size={size === 'xs' ? 12 : 15} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'xs' ? 12 : 15} />}
    </button>
  );
}

function IconButton({ icon, size = 'md', tooltip, active, style, ...props }) {
  const sizes = { xs: 22, sm: 26, md: 30, lg: 36 };
  const iconSizes = { xs: 12, sm: 14, md: 15, lg: 16 };
  const [hover, setHover] = React.useState(false);
  return (
    <button
      title={tooltip}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="k-focus-ring"
      style={{
        width: sizes[size], height: sizes[size],
        background: active ? 'var(--color-primary-subtle)' : (hover ? 'var(--color-card-hover)' : 'transparent'),
        border: 'none',
        borderRadius: 8,
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .12s, color .12s',
        padding: 0, flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <Icon name={icon} size={iconSizes[size]} />
    </button>
  );
}

function EditableText({ value, onChange, placeholder, style, multiline = false }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const ref = React.useRef(null);

  React.useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  React.useEffect(() => {
    if (editing && ref.current) { ref.current.focus(); ref.current.select?.(); }
  }, [editing]);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    const Tag = multiline ? 'textarea' : 'input';
    return (
      <Tag
        ref={ref}
        value={draft || ''}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { cancel(); }
        }}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        style={{
          background: 'var(--color-bg-raised)',
          border: '1px solid var(--color-primary)',
          color: 'var(--color-text)',
          borderRadius: 6,
          padding: '3px 7px',
          margin: '-4px -8px',
          outline: 'none',
          font: 'inherit',
          resize: multiline ? 'vertical' : 'none',
          width: multiline ? '100%' : 'auto',
          minWidth: 80,
          ...style,
        }}
      />
    );
  }

  const isEmpty = !value || String(value).trim() === '';
  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        cursor: 'text', padding: '3px 6px', margin: '-3px -6px',
        borderRadius: 6, transition: 'background .12s',
        display: 'inline-block',
        color: isEmpty ? 'var(--color-text-muted)' : undefined,
        fontStyle: isEmpty ? 'italic' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-card)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {isEmpty ? placeholder : value}
    </span>
  );
}

function Badge({ children, tone = 'neutral', style }) {
  const tones = {
    neutral: { bg: 'var(--color-card-hover)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },
    primary: { bg: 'var(--color-primary-subtle)', color: 'var(--color-primary)', border: 'rgba(230,38,57,0.3)' },
    warmup: { bg: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', border: 'rgba(245,158,11,0.3)' },
    effective: { bg: 'var(--color-primary-subtle)', color: 'var(--color-primary)', border: 'rgba(230,38,57,0.3)' },
    drop: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
    amrap: { bg: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', border: 'rgba(34,197,94,0.3)' },
    restpause: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
    outline: { bg: 'transparent', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px',
      background: t.bg, color: t.color,
      border: `1px solid ${t.border}`,
      borderRadius: 6,
      fontSize: 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      fontFamily: 'var(--font-sans)',
      ...style,
    }}>{children}</span>
  );
}

function Field({ label, children, style, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label className="k-overline" style={{ color: 'var(--color-text-muted)' }}>{label}</label>}
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{hint}</span>}
    </div>
  );
}

function TextField({ value, onChange, placeholder, style, type = 'text', ...props }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="k-focus-ring"
      style={{
        background: 'var(--color-bg-raised)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '10px 12px',
        color: 'var(--color-text)',
        fontSize: 13,
        outline: 'none',
        fontFamily: 'var(--font-sans)',
        width: '100%',
        transition: 'border-color .12s',
        ...style,
      }}
      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
      {...props}
    />
  );
}

function SelectField({ value, onChange, options, style, ...props }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="k-focus-ring"
      style={{
        background: 'var(--color-bg-raised)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '8px 10px',
        color: 'var(--color-text)',
        fontSize: 12,
        outline: 'none',
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a1a1aa\' stroke-width=\'2\'><polyline points=\'6 9 12 15 18 9\'/></svg>")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: 26,
        ...style,
      }}
      {...props}
    >
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}

function KondixLogo({ size = 22 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 22 L16 10 L26 22" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="6" y1="26" x2="26" y2="26" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.8,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--color-primary)',
      }}>KONDIX</span>
    </div>
  );
}

Object.assign(window, { Button, IconButton, EditableText, Badge, Field, TextField, SelectField, KondixLogo });

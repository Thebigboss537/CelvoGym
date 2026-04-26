// Primitivos UI para la vista alumno — móvil first, Kondix design system.
// Exporta: KBadge, KStatCard, KSpinner, KEmptyState, KProgressBar, KSegmented,
// KBottomNav, KHeaderTop, KSheet, KToast, KRing, KAvatar, SET_TYPE_META.

const SET_TYPE_META = {
  warmup:    { label: 'Calentamiento', color: '#A1A1AA', bg: 'rgba(161,161,170,0.10)', ring: 'rgba(161,161,170,0.30)', dot: '#A1A1AA' },
  effective: { label: 'Efectiva',      color: '#F4F4F5', bg: 'rgba(230,38,57,0.10)',   ring: 'rgba(230,38,57,0.35)',   dot: '#E62639' },
  dropset:   { label: 'Dropset',       color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  ring: 'rgba(245,158,11,0.30)',  dot: '#F59E0B' },
  failure:   { label: 'Al fallo',      color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   ring: 'rgba(239,68,68,0.40)',   dot: '#EF4444' },
  amrap:     { label: 'AMRAP',         color: '#22C55E', bg: 'rgba(34,197,94,0.10)',   ring: 'rgba(34,197,94,0.35)',   dot: '#22C55E' },
};
window.SET_TYPE_META = SET_TYPE_META;

// === Badge ===
const KBadge = ({ text, variant = 'neutral', dot = false, size = 'md' }) => {
  const variants = {
    neutral: { bg: 'rgba(255,255,255,0.06)', color: '#A1A1AA', border: 'rgba(255,255,255,0.08)' },
    info:    { bg: 'rgba(230,38,57,0.10)',   color: '#F14D5E', border: 'rgba(230,38,57,0.25)' },
    success: { bg: 'rgba(34,197,94,0.10)',   color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
    warning: { bg: 'rgba(245,158,11,0.10)',  color: '#FBBF24', border: 'rgba(245,158,11,0.30)' },
    danger:  { bg: 'rgba(239,68,68,0.10)',   color: '#F87171', border: 'rgba(239,68,68,0.25)' },
  };
  const v = variants[variant] || variants.neutral;
  const padY = size === 'sm' ? '2px' : '3px';
  const fz = size === 'sm' ? 10 : 11;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: `${padY} 8px`, borderRadius: 999,
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`,
      fontSize: fz, fontWeight: 600, letterSpacing: 0.02, lineHeight: 1,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: v.color,
        boxShadow: variant === 'info' ? `0 0 6px ${v.color}` : 'none' }} />}
      {text}
    </span>
  );
};

// === Avatar ===
const KAvatar = ({ initials, size = 36, color = '#E62639' }) => (
  <div style={{
    width: size, height: size, borderRadius: 999,
    background: `linear-gradient(135deg, ${color} 0%, #8B0F1F 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: size * 0.36, letterSpacing: 0.5,
    fontFamily: 'var(--font-display)', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(230,38,57,0.35)',
  }}>{initials}</div>
);

// === Stat card ===
const KStatCard = ({ label, value, sub, valueColor, icon }) => (
  <div style={{
    background: 'var(--color-card)', border: '1px solid var(--color-border)',
    borderRadius: 14, padding: '12px 14px', flex: 1, minWidth: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      {icon && <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>}
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: -0.02,
      color: valueColor || 'var(--color-text)', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
  </div>
);

// === Spinner ===
const KSpinner = ({ size = 24 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
    <div style={{
      width: size, height: size, borderRadius: 999,
      border: '2px solid rgba(230,38,57,0.15)', borderTopColor: '#E62639',
      animation: 'k-spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes k-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// === EmptyState ===
const KEmptyState = ({ title, subtitle, icon }) => (
  <div style={{
    textAlign: 'center', padding: '40px 24px',
    background: 'var(--color-card)', border: '1px dashed var(--color-border)',
    borderRadius: 16,
  }}>
    {icon && <div style={{ fontSize: 28, marginBottom: 8, color: 'var(--color-text-muted)' }}>{icon}</div>}
    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{subtitle}</div>}
  </div>
);

// === ProgressBar ===
const KProgressBar = ({ percentage = 0, label, showLabel, size = 'md', color }) => {
  const h = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;
  return (
    <div>
      {showLabel && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11,
        color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>
        <span>{label}</span><span>{Math.round(percentage)}%</span>
      </div>}
      <div style={{ height: h, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, Math.max(0, percentage))}%`,
          background: color || 'linear-gradient(90deg, #E62639 0%, #F14D5E 100%)',
          borderRadius: 999, transition: 'width 0.5s cubic-bezier(.4,0,.2,1)',
          boxShadow: percentage > 0 ? '0 0 8px rgba(230,38,57,0.5)' : 'none',
        }} />
      </div>
    </div>
  );
};

// === Segmented control ===
const KSegmented = ({ options, selected, onChange, full = true }) => (
  <div style={{
    display: 'flex', gap: 4, padding: 4,
    background: 'var(--color-card)', border: '1px solid var(--color-border)',
    borderRadius: 12, width: full ? '100%' : 'auto',
  }}>
    {options.map(opt => {
      const active = opt === selected;
      return (
        <button key={opt} onClick={() => onChange(opt)} style={{
          flex: 1, padding: '8px 10px', borderRadius: 9,
          background: active ? 'var(--color-primary)' : 'transparent',
          color: active ? '#fff' : 'var(--color-text-muted)',
          border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, letterSpacing: 0.01,
          transition: 'all 0.15s',
          boxShadow: active ? '0 2px 8px rgba(230,38,57,0.35)' : 'none',
        }}>{opt}</button>
      );
    })}
  </div>
);

// === Ring progress (for rest timer, completion) ===
const KRing = ({ percentage = 0, size = 120, stroke = 8, color = '#E62639', bgColor = 'rgba(230,38,57,0.12)', children, pulse = false }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percentage / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size,
      animation: pulse ? 'k-ring-pulse 1.5s ease-in-out infinite' : 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(.4,0,.2,1)',
            filter: `drop-shadow(0 0 6px ${color}66)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
      <style>{`
        @keyframes k-ring-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
      `}</style>
    </div>
  );
};

// === Header (top bar inside screens) ===
const KHeaderTop = ({ title, subtitle, right, onBack, compact = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: compact ? '12px 0 4px' : '14px 0 10px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <Icon name="chevronLeft" size={18} />
        </button>
      )}
      <div style={{ minWidth: 0 }}>
        {subtitle && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{subtitle}</div>}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compact ? 18 : 22, letterSpacing: -0.02, color: 'var(--color-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      </div>
    </div>
    {right}
  </div>
);

// === Bottom nav ===
const KBottomNav = ({ tabs, active, onTab }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0, bottom: 0,
    background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(39,39,42,0.6)',
    padding: '8px 8px 24px', zIndex: 20,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'stretch' }}>
      {tabs.map(tab => {
        const a = tab.key === active;
        return (
          <button key={tab.key} onClick={() => onTab(tab.key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
            color: a ? 'var(--color-primary)' : 'var(--color-text-muted)',
            transition: 'color 0.15s', position: 'relative',
          }}>
            {a && <span style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 20, height: 2, borderRadius: 2, background: 'var(--color-primary)',
              boxShadow: '0 0 6px var(--color-primary)',
            }} />}
            <Icon name={tab.icon} size={20} strokeWidth={a ? 2.2 : 1.75} />
            <span style={{ fontSize: 10, fontWeight: a ? 700 : 500, letterSpacing: 0.02 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// === Sheet (bottom sheet modal) ===
const KSheet = ({ open, onClose, title, children, height = 'auto' }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'k-fade-in 0.2s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight: '85%', height,
        background: 'var(--color-bg-raised)',
        borderRadius: '20px 20px 0 0', borderTop: '1px solid var(--color-border)',
        padding: '12px 16px 24px', overflow: 'auto',
        animation: 'k-sheet-up 0.28s cubic-bezier(.2,.9,.3,1.2)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: 'var(--color-border)', margin: '0 auto 14px' }} />
        {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          color: 'var(--color-text)', marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
      <style>{`
        @keyframes k-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes k-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// === Toast (emerges from top, PR style) ===
const KToast = ({ toast, onDismiss }) => {
  const { useEffect } = React;
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onDismiss(), toast.duration || 3500);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const palette = {
    pr:      { bg: 'linear-gradient(135deg, #1f0a0f 0%, #2A0F14 100%)', border: 'rgba(230,38,57,0.45)', color: '#F14D5E', icon: 'trophy' },
    success: { bg: 'rgba(22,22,26,0.95)', border: 'rgba(34,197,94,0.40)', color: '#4ADE80', icon: 'check' },
    info:    { bg: 'rgba(22,22,26,0.95)', border: 'rgba(230,38,57,0.25)', color: '#F14D5E', icon: 'infoCircle' },
  }[toast.variant || 'info'];
  return (
    <div style={{
      position: 'absolute', top: 56, left: 12, right: 12, zIndex: 60,
      background: palette.bg, border: `1px solid ${palette.border}`,
      borderRadius: 14, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 24px rgba(230,38,57,0.25)',
      animation: 'k-toast-in 0.4s cubic-bezier(.2,.9,.3,1.2)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${palette.color}22`, color: palette.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={palette.icon} size={18} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        {toast.title && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', letterSpacing: 0.01 }}>{toast.title}</div>}
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: toast.title ? 2 : 0 }}>{toast.message}</div>
      </div>
      <style>{`
        @keyframes k-toast-in { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// === Active session floating banner ===
const KActiveSessionBanner = ({ routineName, completedSets, totalSets, onResume, isRecovery = false }) => (
  <div onClick={onResume} style={{
    position: 'absolute', bottom: 84, left: 12, right: 12, zIndex: 30,
    background: isRecovery
      ? 'linear-gradient(135deg, #1f1409 0%, #16161A 100%)'
      : 'linear-gradient(135deg, #1f0a0f 0%, #16161A 100%)',
    border: `1px solid ${isRecovery ? 'rgba(245,158,11,0.45)' : 'rgba(230,38,57,0.45)'}`,
    borderRadius: 14,
    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: isRecovery
      ? '0 10px 28px rgba(0,0,0,0.6), 0 0 18px rgba(245,158,11,0.2)'
      : '0 10px 28px rgba(0,0,0,0.6), 0 0 18px rgba(230,38,57,0.2)',
    cursor: 'pointer', animation: 'k-pulse-border 2s ease-in-out infinite',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: isRecovery ? 'rgba(245,158,11,0.15)' : 'rgba(230,38,57,0.15)',
      color: isRecovery ? '#FBBF24' : '#F14D5E',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <Icon name={isRecovery ? 'rotateCw' : 'playCircle'} size={20} />
      <span style={{
        position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 999,
        background: isRecovery ? '#F59E0B' : '#E62639',
        boxShadow: `0 0 6px ${isRecovery ? '#F59E0B' : '#E62639'}`,
        animation: 'k-live 1.4s ease-in-out infinite',
      }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.09, textTransform: 'uppercase',
        color: isRecovery ? '#FBBF24' : '#F14D5E' }}>
        {isRecovery ? 'Recuperando · viernes' : 'Entreno en curso'}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {routineName} · {completedSets}/{totalSets} series
      </div>
    </div>
    <div style={{ color: 'var(--color-text-muted)' }}>
      <Icon name="chevronRight" size={18} />
    </div>
    <style>{`
      @keyframes k-pulse-border {
        0%, 100% { box-shadow: 0 10px 28px rgba(0,0,0,0.6), 0 0 14px rgba(230,38,57,0.2); }
        50%      { box-shadow: 0 10px 28px rgba(0,0,0,0.6), 0 0 22px rgba(230,38,57,0.45); }
      }
      @keyframes k-live {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: 0.5; transform: scale(0.85); }
      }
    `}</style>
  </div>
);

// === Set type pill ===
const KSetTypePill = ({ type }) => {
  const meta = SET_TYPE_META[type] || SET_TYPE_META.effective;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 999,
      background: meta.bg, color: meta.color,
      border: `1px solid ${meta.ring}`,
      fontSize: 10, fontWeight: 600, letterSpacing: 0.04, textTransform: 'uppercase',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: meta.dot }} />
      {meta.label}
    </span>
  );
};

// === ExerciseThumb (placeholder por grupo muscular) ===
const MUSCLE_HUES = {
  'Pecho':       { bg: 'linear-gradient(135deg, rgba(230,38,57,0.22) 0%, rgba(230,38,57,0.08) 100%)', border: 'rgba(230,38,57,0.32)', fg: '#F87280' },
  'Espalda':     { bg: 'linear-gradient(135deg, rgba(56,189,248,0.20) 0%, rgba(56,189,248,0.06) 100%)', border: 'rgba(56,189,248,0.30)', fg: '#7DD3FC' },
  'Hombro':      { bg: 'linear-gradient(135deg, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.06) 100%)', border: 'rgba(245,158,11,0.30)', fg: '#FBBF24' },
  'Bíceps':      { bg: 'linear-gradient(135deg, rgba(168,85,247,0.20) 0%, rgba(168,85,247,0.06) 100%)', border: 'rgba(168,85,247,0.30)', fg: '#C084FC' },
  'Tríceps':     { bg: 'linear-gradient(135deg, rgba(244,114,182,0.20) 0%, rgba(244,114,182,0.06) 100%)', border: 'rgba(244,114,182,0.30)', fg: '#F9A8D4' },
  'Cuádriceps':  { bg: 'linear-gradient(135deg, rgba(34,197,94,0.20) 0%, rgba(34,197,94,0.06) 100%)', border: 'rgba(34,197,94,0.30)', fg: '#86EFAC' },
  'Femoral':     { bg: 'linear-gradient(135deg, rgba(20,184,166,0.20) 0%, rgba(20,184,166,0.06) 100%)', border: 'rgba(20,184,166,0.30)', fg: '#5EEAD4' },
  'Glúteo':      { bg: 'linear-gradient(135deg, rgba(236,72,153,0.20) 0%, rgba(236,72,153,0.06) 100%)', border: 'rgba(236,72,153,0.30)', fg: '#F9A8D4' },
  'Gemelo':      { bg: 'linear-gradient(135deg, rgba(132,204,22,0.20) 0%, rgba(132,204,22,0.06) 100%)', border: 'rgba(132,204,22,0.30)', fg: '#BEF264' },
  'Core':        { bg: 'linear-gradient(135deg, rgba(251,146,60,0.20) 0%, rgba(251,146,60,0.06) 100%)', border: 'rgba(251,146,60,0.30)', fg: '#FDBA74' },
  'Abdomen':     { bg: 'linear-gradient(135deg, rgba(251,146,60,0.20) 0%, rgba(251,146,60,0.06) 100%)', border: 'rgba(251,146,60,0.30)', fg: '#FDBA74' },
};
const DEFAULT_HUE = { bg: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)', border: 'rgba(255,255,255,0.14)', fg: 'rgba(255,255,255,0.65)' };

const KExerciseThumb = ({ name, muscleGroup, photoUrl, size = 44, style }) => {
  const hue = MUSCLE_HUES[muscleGroup] || DEFAULT_HUE;
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const radius = Math.round(size * 0.27);

  if (photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid rgba(255,255,255,0.08)', ...style,
      }} />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: hue.bg, border: `1px solid ${hue.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: Math.round(size * 0.36),
      letterSpacing: -0.02, color: hue.fg,
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,0.08) 0%, transparent 45%)',
        pointerEvents: 'none',
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{initials}</span>
    </div>
  );
};

Object.assign(window, {
  KBadge, KAvatar, KStatCard, KSpinner, KEmptyState, KProgressBar, KSegmented,
  KRing, KHeaderTop, KBottomNav, KSheet, KToast, KActiveSessionBanner, KSetTypePill,
  KExerciseThumb,
});

// App shell with left nav. Hosts: Dashboard, Rutinas, Programas, Ejercicios, Estudiantes.

function AppShell({ route, setRoute, children }) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 900);
  React.useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: 'trendingUp' },
    { id: 'routines', label: 'Rutinas', icon: 'clipboard' },
    { id: 'programs', label: 'Programas', icon: 'folder' },
    { id: 'library', label: 'Ejercicios', icon: 'dumbbell' },
    { id: 'students', label: 'Estudiantes', icon: 'users' },
  ];

  const Sidebar = ({ onClose }) => (
    <aside style={{
      width: 232, flexShrink: 0,
      background: 'var(--color-bg)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <KondixLogo size={22} />
        {onClose && <IconButton icon="x" size="sm" onClick={onClose} />}
      </div>

      <div className="k-overline" style={{ padding: '14px 20px 8px', color: 'var(--color-text-muted)' }}>Espacio</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
        {nav.map(n => {
          const active = route === n.id;
          return (
            <button key={n.id}
              onClick={() => { setRoute(n.id); onClose?.(); }}
              className="k-focus-ring"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 9,
                background: active ? 'var(--color-primary-subtle)' : 'transparent',
                border: active ? '1px solid rgba(230,38,57,0.3)' : '1px solid transparent',
                color: active ? 'var(--color-text)' : 'var(--color-text-secondary)',
                fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background .12s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-card)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={n.icon} size={15} style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '14px 14px 16px', borderTop: '1px solid var(--color-border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6 }}>
          <img src="https://i.pravatar.cc/80?img=14" alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>Mario Vega</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Entrenador · PRO</div>
          </div>
          <IconButton icon="settings" size="sm" />
        </div>
      </div>
    </aside>
  );

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100vw',
      background: 'var(--color-bg-deep)',
      color: 'var(--color-text)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
    }}>
      {!isMobile && <Sidebar />}
      {isMobile && mobileNavOpen && (
        <>
          <div onClick={() => setMobileNavOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 101 }} className="k-slide-in-left">
            <Sidebar onClose={() => setMobileNavOpen(false)} />
          </div>
        </>
      )}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {isMobile && (
          <div style={{ height: 52, flexShrink: 0, borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10 }}>
            <IconButton icon="menu" onClick={() => setMobileNavOpen(true)} />
            <KondixLogo size={18} />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--color-bg-deep)' }} className="scroll-thin">
          {children}
        </div>
      </main>
    </div>
  );
}

window.AppShell = AppShell;

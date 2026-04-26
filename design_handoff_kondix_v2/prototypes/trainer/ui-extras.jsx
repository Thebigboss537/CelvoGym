// Shared ConfirmDialog + PhotoUpload components

function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', tone = 'danger', onConfirm, onCancel }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  const toneColor = tone === 'danger' ? 'var(--color-danger)' : 'var(--color-primary)';
  const toneIconBg = tone === 'danger' ? 'rgba(239,68,68,0.12)' : 'var(--color-primary-subtle)';

  return ReactDOM.createPortal(
    <>
      <div onClick={onCancel} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        zIndex: 200,
        animation: 'fade-up .15s ease-out',
      }} />
      <div className="k-modal-center" style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(420px, calc(100vw - 32px))',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        zIndex: 201,
        boxShadow: 'var(--shadow-lg)',
        padding: 24,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: toneIconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="trash" size={18} style={{ color: toneColor }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17, fontWeight: 700,
              margin: 0, letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}>{title}</h3>
            <p style={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
          <Button
            variant="primary"
            icon="trash"
            onClick={onConfirm}
            style={tone === 'danger' ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}

// Hook for inline confirmation: const confirm = useConfirm(); confirm({ title, message, onConfirm })
function useConfirm() {
  const [state, setState] = React.useState(null);
  const confirm = React.useCallback((opts) => setState(opts), []);
  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title || '¿Estás seguro?'}
      message={state?.message || 'Esta acción no se puede deshacer.'}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      tone={state?.tone}
      onConfirm={() => { state?.onConfirm?.(); setState(null); }}
      onCancel={() => setState(null)}
    />
  );
  return [confirm, dialog];
}

// PhotoUpload — thumbnail with drag-drop, file picker, or URL paste
function PhotoUpload({ value, onChange, aspect = '1/1', label, hint }) {
  const [dragging, setDragging] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const readFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const onFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = '';
  };

  const submitUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  if (value) {
    return (
      <div>
        {label && <div className="k-overline" style={{ marginBottom: 6 }}>{label}</div>}
        <div style={{
          position: 'relative',
          aspectRatio: aspect,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--color-bg-raised)',
          border: '1px solid var(--color-border)',
        }}>
          <img
            src={value}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div style={{
            position: 'absolute', top: 8, right: 8,
            display: 'flex', gap: 6,
          }}>
            <IconButton
              icon="edit" size="sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <IconButton
              icon="x" size="sm"
              onClick={() => onChange(null)}
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFilePick} />
      </div>
    );
  }

  return (
    <div>
      {label && <div className="k-overline" style={{ marginBottom: 6 }}>{label}</div>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !showUrlInput && fileInputRef.current?.click()}
        style={{
          aspectRatio: aspect,
          borderRadius: 12,
          border: `1.5px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
          background: dragging ? 'var(--color-primary-subtle)' : 'var(--color-bg-raised)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: showUrlInput ? 'default' : 'pointer',
          transition: 'border-color .12s, background .12s',
          padding: 14,
          textAlign: 'center',
        }}
      >
        {showUrlInput ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <TextField
              value={urlInput}
              onChange={setUrlInput}
              placeholder="https://…"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') submitUrl(); if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput(''); } }}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <Button variant="outline" size="sm" onClick={() => { setShowUrlInput(false); setUrlInput(''); }}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={submitUrl} disabled={!urlInput.trim()}>Usar URL</Button>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-primary-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Icon name="video" size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
              {dragging ? 'Suelta la imagen aquí' : 'Añadir foto miniatura'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
              {hint || 'Arrastra, selecciona o pega una URL'}
            </div>
            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="xs" icon="video" onClick={() => fileInputRef.current?.click()}>Archivo</Button>
              <Button variant="ghost" size="xs" icon="link" onClick={() => setShowUrlInput(true)}>URL</Button>
            </div>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFilePick} />
    </div>
  );
}

Object.assign(window, { ConfirmDialog, useConfirm, PhotoUpload });

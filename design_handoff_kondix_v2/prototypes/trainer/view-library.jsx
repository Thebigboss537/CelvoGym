// Biblioteca de ejercicios — grid de cards con imagen

function LibraryView({ library, onChange }) {
  const [query, setQuery] = React.useState('');
  const [filterMuscle, setFilterMuscle] = React.useState('all');
  const [filterEquip, setFilterEquip] = React.useState('all');
  const [filterCat, setFilterCat] = React.useState('all');
  const [editing, setEditing] = React.useState(null);
  const [selected, setSelected] = React.useState(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter(e => {
      if (q && !e.name.toLowerCase().includes(q) && !e.muscleGroup.toLowerCase().includes(q)) return false;
      if (filterMuscle !== 'all' && e.muscleGroup !== filterMuscle) return false;
      if (filterEquip !== 'all' && e.equipment !== filterEquip) return false;
      if (filterCat !== 'all' && e.category !== filterCat) return false;
      return true;
    });
  }, [library, query, filterMuscle, filterEquip, filterCat]);

  const countByMuscle = React.useMemo(() => {
    const c = {};
    library.forEach(e => c[e.muscleGroup] = (c[e.muscleGroup] || 0) + 1);
    return c;
  }, [library]);

  return (
    <div style={{ padding: '28px 36px 120px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        overline="Biblioteca"
        title="Ejercicios"
        subtitle={`${library.length} ejercicios en tu biblioteca. Se usan al crear rutinas.`}
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing({ _new: true, id: uid('lib'), name: '', muscleGroup: 'Pecho', secondaryMuscles: [], equipment: 'Barra', category: 'Hipertrofia', level: 'Principiante', instructions: '', videoSource: 'None', videoUrl: '', photoUrl: null, timesUsed: 0 })}>
            Crear ejercicio
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px', minWidth: 220, position: 'relative' }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <TextField value={query} onChange={setQuery} placeholder="Buscar ejercicio…" style={{ paddingLeft: 34 }} />
        </div>
        <SelectField value={filterMuscle} onChange={setFilterMuscle} options={[{ value: 'all', label: 'Todos los músculos' }, ...MUSCLE_GROUPS.map(m => ({ value: m, label: `${m} (${countByMuscle[m] || 0})` }))]} style={{ height: 38 }} />
        <SelectField value={filterEquip} onChange={setFilterEquip} options={[{ value: 'all', label: 'Equipamiento' }, ...EQUIPMENT.map(m => ({ value: m, label: m }))]} style={{ height: 38 }} />
        <SelectField value={filterCat} onChange={setFilterCat} options={[{ value: 'all', label: 'Categoría' }, ...CATEGORIES.map(m => ({ value: m, label: m }))]} style={{ height: 38 }} />
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14, marginTop: 20,
      }}>
        {filtered.map(ex => (
          <ExerciseLibraryCard key={ex.id} ex={ex} onClick={() => setSelected(ex)} onEdit={() => setEditing(ex)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Icon name="search" size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>Sin resultados para esos filtros.</div>
        </div>
      )}

      {selected && <ExerciseDetailDrawer ex={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} />}
      {editing && <ExerciseEditModal ex={editing} onClose={() => setEditing(null)} onSave={(ne) => {
        const exists = library.some(l => l.id === ne.id);
        onChange(exists ? library.map(l => l.id === ne.id ? ne : l) : [ne, ...library]);
        setEditing(null);
      }} onDelete={!editing._new ? () => { onChange(library.filter(l => l.id !== editing.id)); setEditing(null); } : null} />}
    </div>
  );
}

function ExerciseLibraryCard({ ex, onClick, onEdit }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${hover ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color .15s, transform .15s',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        height: 130,
        background: `linear-gradient(135deg, color-mix(in oklch, ${muscleColor(ex.muscleGroup)} 18%, #0a0a0b) 0%, #0a0a0b 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        borderBottom: '1px solid var(--color-border-light)',
        overflow: 'hidden',
      }}>
        {ex.photoUrl ? (
          <img src={ex.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Icon name="dumbbell" size={42} style={{ color: muscleColor(ex.muscleGroup), opacity: 0.5 }} />
        )}
        {ex.photoUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55))' }} />}
        {ex.videoSource !== 'None' && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="playCircle" size={11} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>VIDEO</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <Badge tone="outline" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>{ex.muscleGroup}</Badge>
        </div>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          {ex.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>{ex.equipment}</span>
          <span>·</span>
          <span>{ex.level}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <Badge tone="primary">{ex.category}</Badge>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Usado {ex.timesUsed}×
          </span>
        </div>
      </div>
    </div>
  );
}

function muscleColor(m) {
  return {
    'Pecho': 'var(--muscle-pecho)',
    'Espalda': 'var(--muscle-espalda)',
    'Hombro': 'var(--muscle-hombro)',
    'Bíceps': 'var(--muscle-biceps)',
    'Tríceps': 'var(--muscle-triceps)',
    'Cuádriceps': 'var(--muscle-cuadriceps)',
    'Femoral': 'var(--muscle-femoral)',
    'Glúteo': 'var(--muscle-gluteo)',
    'Gemelo': 'var(--muscle-gemelo)',
    'Core': 'var(--muscle-core)',
    'Antebrazo': 'var(--muscle-antebrazo)',
    // Legacy aliases (read-only, in case stale data references them)
    'Hombros': 'var(--muscle-hombro)',
    'Glúteos': 'var(--muscle-gluteo)',
    'Piernas': 'var(--muscle-cuadriceps)',
    'Pantorrilla': 'var(--muscle-gemelo)',
  }[m] || 'var(--color-text-muted)';
}

function ExerciseDetailDrawer({ ex, onClose, onEdit }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div className="k-slide-in-right scroll-thin" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(520px, 100vw)',
        background: 'var(--color-bg)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 101, overflowY: 'auto',
      }}>
        <div style={{
          height: 200,
          background: `linear-gradient(180deg, color-mix(in oklch, ${muscleColor(ex.muscleGroup)} 25%, #0a0a0b), #0a0a0b)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {ex.photoUrl ? (
            <img src={ex.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Icon name="dumbbell" size={68} style={{ color: muscleColor(ex.muscleGroup), opacity: 0.45 }} />
          )}
          {ex.photoUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6))' }} />}
          <IconButton icon="x" size="md" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', zIndex: 2 }} />
        </div>
        <div style={{ padding: '22px 28px 40px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <Badge tone="primary">{ex.muscleGroup}</Badge>
            <Badge tone="outline">{ex.category}</Badge>
            <Badge tone="outline">{ex.equipment}</Badge>
            <Badge tone="outline">{ex.level}</Badge>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{ex.name}</h2>

          {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="k-overline">Músculos secundarios</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {ex.secondaryMuscles.map(m => <Badge key={m} tone="neutral">{m}</Badge>)}
              </div>
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <div className="k-overline">Instrucciones técnicas</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
              {ex.instructions || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin instrucciones.</span>}
            </p>
          </div>

          {ex.videoSource === 'YouTube' && ex.videoUrl && (
            <div style={{ marginTop: 22 }}>
              <div className="k-overline">Video demostrativo</div>
              <div style={{ marginTop: 8, aspectRatio: '16/9', background: 'var(--color-bg-raised)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                <Icon name="playCircle" size={48} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>{ex.videoUrl}</div>
            </div>
          )}

          <div style={{ marginTop: 22, padding: 14, background: 'var(--color-card)', borderRadius: 10, border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Usado en rutinas</span>
              <strong style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{ex.timesUsed}×</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <Button variant="primary" icon="edit" onClick={onEdit} fullWidth>Editar ejercicio</Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ExerciseEditModal({ ex, onClose, onSave, onDelete }) {
  const [draft, setDraft] = React.useState(ex);
  const [confirm, confirmDialog] = useConfirm();
  const patch = (p) => setDraft(d => ({ ...d, ...p }));
  const toggleSec = (m) => {
    const cur = draft.secondaryMuscles || [];
    patch({ secondaryMuscles: cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m] });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }} />
      <div className="k-modal-center" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(640px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 32px)',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, letterSpacing: '-0.02em' }}>
            {ex._new ? 'Crear ejercicio' : 'Editar ejercicio'}
          </h3>
          <span style={{ flex: 1 }} />
          <IconButton icon="x" size="sm" onClick={onClose} />
        </div>

        <div style={{ padding: 22, overflowY: 'auto' }} className="scroll-thin">
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 14 }} className="k-edit-grid">
            <PhotoUpload
              value={draft.photoUrl}
              onChange={(photoUrl) => patch({ photoUrl })}
              aspect="1/1"
              label="Miniatura"
              hint="Se verá en biblioteca y en vista de estudiante"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nombre del ejercicio">
                <TextField value={draft.name} onChange={(name) => patch({ name })} placeholder="Ej: Press inclinado con mancuernas" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Grupo muscular">
                  <SelectField value={draft.muscleGroup} onChange={(muscleGroup) => patch({ muscleGroup })} options={MUSCLE_GROUPS} style={{ height: 38 }} />
                </Field>
                <Field label="Equipamiento">
                  <SelectField value={draft.equipment} onChange={(equipment) => patch({ equipment })} options={EQUIPMENT} style={{ height: 38 }} />
                </Field>
                <Field label="Categoría">
                  <SelectField value={draft.category} onChange={(category) => patch({ category })} options={CATEGORIES} style={{ height: 38 }} />
                </Field>
                <Field label="Nivel">
                  <SelectField value={draft.level} onChange={(level) => patch({ level })} options={LEVELS} style={{ height: 38 }} />
                </Field>
              </div>
            </div>
          </div>
          <style>{`@media (max-width: 560px) { .k-edit-grid { grid-template-columns: 1fr !important; } }`}</style>

          <Field label="Músculos secundarios" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MUSCLE_GROUPS.filter(m => m !== draft.muscleGroup).map(m => {
                const on = (draft.secondaryMuscles || []).includes(m);
                return (
                  <button key={m} onClick={() => toggleSec(m)}
                    style={{
                      padding: '5px 10px',
                      background: on ? 'var(--color-primary-subtle)' : 'var(--color-bg-raised)',
                      border: `1px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      color: on ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Instrucciones técnicas" style={{ marginBottom: 14 }}>
            <textarea
              value={draft.instructions}
              onChange={(e) => patch({ instructions: e.target.value })}
              placeholder="Explica la técnica correcta, puntos clave, errores comunes…"
              rows={4}
              className="k-focus-ring"
              style={{
                width: '100%', background: 'var(--color-bg-raised)',
                border: '1px solid var(--color-border)', borderRadius: 8,
                padding: '10px 12px', color: 'var(--color-text)',
                fontSize: 13, outline: 'none', resize: 'vertical',
                fontFamily: 'var(--font-sans)', lineHeight: 1.5,
              }}
            />
          </Field>

          <Field label="Video demostrativo">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SelectField value={draft.videoSource} onChange={(videoSource) => patch({ videoSource, videoUrl: videoSource === 'None' ? '' : draft.videoUrl })} options={[{ value: 'None', label: 'Sin video' }, { value: 'YouTube', label: 'YouTube' }, { value: 'Upload', label: 'Subir archivo' }]} style={{ width: 140, height: 38 }} />
              {draft.videoSource === 'YouTube' && <TextField value={draft.videoUrl} onChange={(v) => patch({ videoUrl: v })} placeholder="https://youtu.be/…" />}
              {draft.videoSource === 'Upload' && <Button variant="outline" icon="video">Subir MP4</Button>}
            </div>
          </Field>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--color-border-light)', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {onDelete ? (
            <Button
              variant="ghost" icon="trash"
              onClick={() => confirm({
                title: 'Eliminar ejercicio',
                message: `¿Eliminar "${draft.name}" de tu biblioteca? Esta acción no se puede deshacer.`,
                onConfirm: onDelete,
              })}
              style={{ color: 'var(--color-danger)' }}
            >
              Eliminar
            </Button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" icon="save" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>{ex._new ? 'Crear' : 'Guardar'}</Button>
          </div>
        </div>
        {confirmDialog}
      </div>
    </>
  );
}

function PageHeader({ overline, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="k-overline" style={{ color: 'var(--color-primary)', marginBottom: 6 }}>{overline}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '10px 0 0', maxWidth: 640 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

window.LibraryView = LibraryView;
window.PageHeader = PageHeader;
window.muscleColor = muscleColor;

// Day panel — groups (Single / Superset / Triset / Circuit) + cross-group DnD

// Flat representation of all exercises within a day for DnD indexing
function flattenDay(day) {
  const flat = [];
  day.groups.forEach((g, gi) => {
    g.exercises.forEach((e, ei) => {
      flat.push({ groupIdx: gi, exIdx: ei, groupId: g.id, exerciseId: e.id });
    });
  });
  return flat;
}

// Move an exercise (by groupIdx+exIdx) to target (by groupIdx+exIdx)
// Same group: reorder. Cross group:
//   - dragged exercise leaves source group (if source becomes empty, remove group)
//   - target group: exercise inserted at exIdx
function moveExercise(day, from, to) {
  if (from.groupIdx === to.groupIdx && from.exIdx === to.exIdx) return day;

  const groups = day.groups.map(g => ({ ...g, exercises: [...g.exercises] }));
  const [moved] = groups[from.groupIdx].exercises.splice(from.exIdx, 1);

  // Adjust target exIdx if same group and moving forward past removed item
  let targetExIdx = to.exIdx;
  if (from.groupIdx === to.groupIdx && to.exIdx > from.exIdx) targetExIdx -= 1;

  groups[to.groupIdx].exercises.splice(targetExIdx, 0, moved);

  // If source group is empty, remove it. Adjust ungrouping.
  const cleaned = groups
    .filter(g => g.exercises.length > 0)
    .map(g => g.exercises.length === 1 && g.groupType !== 'Single'
      ? { ...g, groupType: 'Single' }
      : g);

  return { ...day, groups: cleaned };
}

function GroupBlock({
  group, groupIdx, onChange, onDelete,
  dragState, setDragState, dropTarget, setDropTarget,
  onDropAt,
}) {
  const isCluster = group.groupType !== 'Single';
  const patch = (p) => onChange({ ...group, ...p });

  const clusterColor = {
    Single: null,
    Superset: 'var(--color-primary)',
    Triset: '#c084fc',
    Circuit: '#60a5fa',
  }[group.groupType];

  const letters = ['A', 'B', 'C', 'D', 'E'];

  // For DnD: drop zone between exercises
  const DropSlot = ({ exIdx }) => {
    const active = dropTarget && dropTarget.groupIdx === groupIdx && dropTarget.exIdx === exIdx;
    return (
      <div
        onDragOver={(e) => {
          if (!dragState) return;
          e.preventDefault();
          setDropTarget({ groupIdx, exIdx });
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDropAt({ groupIdx, exIdx });
        }}
        style={{
          height: active ? 32 : 6,
          marginTop: -3, marginBottom: -3,
          transition: 'height .12s',
          display: 'flex', alignItems: 'center',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {active && (
          <div style={{
            width: '100%', height: 3,
            background: 'var(--color-primary)',
            borderRadius: 2,
            boxShadow: '0 0 12px rgba(230,38,57,0.6)',
          }} />
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      padding: isCluster ? '10px 10px 10px 16px' : 0,
      borderLeft: isCluster ? `2px solid ${clusterColor}` : 'none',
      background: isCluster ? `color-mix(in oklch, ${clusterColor} 5%, transparent)` : 'transparent',
      borderRadius: isCluster ? 6 : 0,
      marginLeft: isCluster ? 4 : 0,
    }}>
      {isCluster && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 10, paddingLeft: 2,
        }}>
          <Badge style={{
            background: `color-mix(in oklch, ${clusterColor} 18%, transparent)`,
            color: clusterColor,
            borderColor: `color-mix(in oklch, ${clusterColor} 35%, transparent)`,
          }}>
            <Icon name="link" size={10} />
            {group.groupType}
          </Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Icon name="timer" size={11} />
            <span>
              <EditableText
                value={group.restSeconds}
                onChange={(v) => patch({ restSeconds: Number(v) || 0 })}
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}
              />s desc. entre rondas
            </span>
          </div>
          <span style={{ flex: 1 }} />
          <IconButton
            icon="unlink" size="xs" tooltip="Deshacer grupo"
            onClick={() => patch({ groupType: 'Single' })}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <DropSlot exIdx={0} />
        {group.exercises.map((ex, i) => {
          const isDragging = dragState && dragState.groupIdx === groupIdx && dragState.exIdx === i;
          const canGroupWithNext = !isCluster && i === 0;

          return (
            <React.Fragment key={ex.id}>
              <ExerciseCard
                exercise={ex}
                badge={isCluster ? { label: letters[i], color: clusterColor } : null}
                isInCluster={isCluster}
                isDragging={isDragging}
                canGroupWithNext={canGroupWithNext}
                onGroupWithNext={(type) => {
                  // Merge this single-group with next single-group(s) into a cluster
                  // groupIdx here must be followed by at least one sibling
                }}
                onUngroup={isCluster ? () => {
                  // Extract this exercise into its own Single group
                } : null}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', ex.id);
                  setDragState({ groupIdx, exIdx: i, exerciseId: ex.id });
                }}
                onDragEnd={() => {
                  setDragState(null);
                  setDropTarget(null);
                }}
                onChange={(nex) => patch({ exercises: group.exercises.map((x, j) => j === i ? nex : x) })}
                onDelete={() => {
                  const next = group.exercises.filter((_, j) => j !== i);
                  if (next.length === 0) onDelete();
                  else patch({ exercises: next, groupType: next.length === 1 ? 'Single' : group.groupType });
                }}
                onDuplicate={() => {
                  const dup = { ...ex, id: uid('e'), sets: ex.sets.map(s => ({ ...s, id: uid('s') })) };
                  patch({ exercises: [...group.exercises.slice(0, i + 1), dup, ...group.exercises.slice(i + 1)] });
                }}
              />
              <DropSlot exIdx={i + 1} />
            </React.Fragment>
          );
        })}
      </div>

      {isCluster && (
        <Button
          variant="ghost" size="sm" icon="plus"
          onClick={() => patch({ exercises: [...group.exercises, newExercise()] })}
          style={{ marginTop: 4, color: clusterColor }}
        >
          Añadir al {group.groupType.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

function DayPanel({ day, onChange, onDelete }) {
  const patch = (p) => onChange({ ...day, ...p });
  const [dragState, setDragState] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null);

  const addExercise = () => {
    patch({ groups: [...day.groups, newGroup({ groupType: 'Single', exercises: [newExercise()] })] });
  };

  const addSuperset = () => {
    patch({ groups: [...day.groups, newGroup({ groupType: 'Superset', exercises: [newExercise(), newExercise()] })] });
  };

  // Group first exercise of group[groupIdx] with the first of group[groupIdx+1]
  // (or wrap the group itself into a cluster if it already has multiple exercises)
  const groupWithNext = (groupIdx, type) => {
    const groups = [...day.groups];
    const cur = groups[groupIdx];
    const nxt = groups[groupIdx + 1];
    if (!nxt) return;
    const merged = {
      ...cur,
      groupType: type,
      exercises: [...cur.exercises, ...nxt.exercises],
    };
    groups.splice(groupIdx, 2, merged);
    patch({ groups });
  };

  const ungroupExercise = (groupIdx, exIdx) => {
    const groups = [...day.groups].map(g => ({ ...g, exercises: [...g.exercises] }));
    const [removed] = groups[groupIdx].exercises.splice(exIdx, 1);
    const newSingle = newGroup({ groupType: 'Single', exercises: [removed] });
    groups.splice(groupIdx + 1, 0, newSingle);
    const cleaned = groups.map(g =>
      g.exercises.length <= 1 && g.groupType !== 'Single' ? { ...g, groupType: 'Single' } : g
    );
    patch({ groups: cleaned });
  };

  const onDropAt = (target) => {
    if (!dragState) return;
    const moved = moveExercise(day, dragState, target);
    onChange(moved);
    setDragState(null);
    setDropTarget(null);
  };

  const totalExercises = day.groups.reduce((s, g) => s + g.exercises.length, 0);
  const totalSets = day.groups.reduce((s, g) => s + g.exercises.reduce((ss, e) => ss + e.sets.length, 0), 0);
  const totalClusters = day.groups.filter(g => g.groupType !== 'Single').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Day header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 16,
        paddingBottom: 14, borderBottom: '1px solid var(--color-border-light)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="k-overline" style={{ color: 'var(--color-primary)', marginBottom: 4 }}>Día de entreno</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em',
            color: 'var(--color-text)',
            margin: 0, lineHeight: 1.05,
          }}>
            <EditableText
              value={day.name}
              onChange={(name) => patch({ name })}
              placeholder="Nombre del día…"
            />
          </h2>
          <div style={{
            marginTop: 10, display: 'flex', gap: 16,
            fontSize: 11, color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            <span><strong style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{totalExercises}</strong> ejercicios</span>
            <span><strong style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{totalSets}</strong> series</span>
            <span><strong style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{totalClusters}</strong> grupos</span>
          </div>
        </div>
        <IconButton icon="trash" tooltip="Eliminar día" onClick={onDelete} />
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {day.groups.map((g, i) => (
          <GroupBlockWithActions
            key={g.id}
            group={g}
            groupIdx={i}
            canGroupWithNext={
              g.groupType === 'Single' &&
              i < day.groups.length - 1 &&
              day.groups[i + 1].groupType === 'Single'
            }
            onGroupWithNext={(type) => groupWithNext(i, type)}
            onUngroupExercise={(exIdx) => ungroupExercise(i, exIdx)}
            onChange={(ng) => patch({ groups: day.groups.map((x, j) => j === i ? ng : x) })}
            onDelete={() => patch({ groups: day.groups.filter((_, j) => j !== i) })}
            dragState={dragState}
            setDragState={setDragState}
            dropTarget={dropTarget}
            setDropTarget={setDropTarget}
            onDropAt={onDropAt}
          />
        ))}
      </div>

      {/* Add group CTA */}
      <div style={{
        display: 'flex', gap: 8, padding: 14,
        border: '1px dashed var(--color-border)',
        borderRadius: 12, justifyContent: 'center', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <Button variant="primary" size="md" icon="plus" onClick={addExercise}>
          Añadir ejercicio
        </Button>
        <Button variant="outline" size="md" icon="link" onClick={addSuperset}>
          Añadir superset
        </Button>
      </div>
    </div>
  );
}

// GroupBlock variant that knows how to group/ungroup via parent callbacks.
function GroupBlockWithActions(props) {
  const { group, groupIdx, canGroupWithNext, onGroupWithNext, onUngroupExercise, ...rest } = props;
  const isCluster = group.groupType !== 'Single';
  const patch = (p) => rest.onChange({ ...group, ...p });

  const clusterColor = {
    Single: null,
    Superset: 'var(--color-primary)',
    Triset: '#c084fc',
    Circuit: '#60a5fa',
  }[group.groupType];

  const letters = ['A', 'B', 'C', 'D', 'E'];

  const DropSlot = ({ exIdx }) => {
    const active = rest.dropTarget && rest.dropTarget.groupIdx === groupIdx && rest.dropTarget.exIdx === exIdx;
    return (
      <div
        onDragOver={(e) => {
          if (!rest.dragState) return;
          e.preventDefault();
          rest.setDropTarget({ groupIdx, exIdx });
        }}
        onDrop={(e) => {
          e.preventDefault();
          rest.onDropAt({ groupIdx, exIdx });
        }}
        style={{
          height: active ? 28 : 8,
          marginTop: -2, marginBottom: -2,
          transition: 'height .12s',
          display: 'flex', alignItems: 'center',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {active && (
          <div style={{
            width: '100%', height: 3,
            background: 'var(--color-primary)',
            borderRadius: 2,
            boxShadow: '0 0 12px rgba(230,38,57,0.6)',
          }} />
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      padding: isCluster ? '12px 12px 8px 16px' : 0,
      borderLeft: isCluster ? `2px solid ${clusterColor}` : 'none',
      background: isCluster ? `color-mix(in oklch, ${clusterColor} 5%, transparent)` : 'transparent',
      borderRadius: isCluster ? 6 : 0,
    }}>
      {isCluster && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 10,
        }}>
          <Badge style={{
            background: `color-mix(in oklch, ${clusterColor} 18%, transparent)`,
            color: clusterColor,
            borderColor: `color-mix(in oklch, ${clusterColor} 35%, transparent)`,
          }}>
            <Icon name="link" size={10} />
            {group.groupType}
          </Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Icon name="timer" size={11} />
            <span>
              <EditableText
                value={group.restSeconds}
                onChange={(v) => patch({ restSeconds: Number(v) || 0 })}
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}
              />s desc. entre rondas
            </span>
          </div>
          <span style={{ flex: 1 }} />
          <Button
            variant="ghost" size="xs" icon="unlink"
            onClick={() => patch({ groupType: 'Single' })}
          >Desagrupar</Button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <DropSlot exIdx={0} />
        {group.exercises.map((ex, i) => {
          const isDragging = rest.dragState && rest.dragState.groupIdx === groupIdx && rest.dragState.exIdx === i;
          // canGroupWithNext: only on first exercise of a Single group when there's a next Single group
          const showGroupAction = canGroupWithNext && i === 0;

          return (
            <React.Fragment key={ex.id}>
              <ExerciseCard
                exercise={ex}
                badge={isCluster ? { label: letters[i], color: clusterColor } : null}
                isInCluster={isCluster}
                isDragging={isDragging}
                canGroupWithNext={showGroupAction}
                onGroupWithNext={(type) => onGroupWithNext(type)}
                onUngroup={isCluster ? () => onUngroupExercise(i) : null}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  try { e.dataTransfer.setData('text/plain', ex.id); } catch {}
                  rest.setDragState({ groupIdx, exIdx: i, exerciseId: ex.id });
                }}
                onDragEnd={() => {
                  rest.setDragState(null);
                  rest.setDropTarget(null);
                }}
                onChange={(nex) => patch({ exercises: group.exercises.map((x, j) => j === i ? nex : x) })}
                onDelete={() => {
                  const next = group.exercises.filter((_, j) => j !== i);
                  if (next.length === 0) rest.onDelete();
                  else patch({ exercises: next, groupType: next.length === 1 ? 'Single' : group.groupType });
                }}
                onDuplicate={() => {
                  const dup = { ...ex, id: uid('e'), sets: ex.sets.map(s => ({ ...s, id: uid('s') })) };
                  patch({ exercises: [...group.exercises.slice(0, i + 1), dup, ...group.exercises.slice(i + 1)] });
                }}
              />
              <DropSlot exIdx={i + 1} />
            </React.Fragment>
          );
        })}
      </div>

      {isCluster && (
        <Button
          variant="ghost" size="sm" icon="plus"
          onClick={() => patch({ exercises: [...group.exercises, newExercise()] })}
          style={{ marginTop: 4, color: clusterColor }}
        >
          Añadir al {group.groupType.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

window.DayPanel = DayPanel;

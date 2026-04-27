# Routine Editor — Single-view redesign (port of handoff prototype)

> Replace the existing 4-step routine wizard (`routine-wizard.ts`, 1094 LOC) with a single-view editor that mirrors the v2 React handoff at `design_handoff_kondix_v2/prototypes/trainer/`. Backend model unchanged.

**Status:** brainstormed and approved 2026-04-27. Implementation plan to follow via `superpowers:writing-plans`.

## 1. Problem

The current Angular routine editor is a wizard with 4 sequential steps (Info → Días → Ejercicios → Revisar). The v2 design handoff intends a single-view editor: **left sidebar** (routine meta + draggable day list) + **main panel** (active day with collapsible exercise cards, drag-and-drop, group/superset clusters). The wizard pattern doesn't match the editor mental model the trainer expects when iterating on a routine.

## 2. Scope

**In:**
- New single-view editor for both create (`/trainer/routines/new`) and edit (`/trainer/routines/:id/edit`).
- Sidebar: routine name, description, category pill, draggable day list, "Add day" CTA.
- Day panel: header with stats, collapsible exercise cards, cluster styling (Superset / Triset / Circuit), drag-and-drop reorder across cluster boundaries, "Add exercise" / "Add superset" CTAs.
- Exercise card: collapsed header (name + muscle group + video badge + first-set summary + menu) and expanded body (autocomplete picker + sets table + total rest estimate + notes).
- Exercise picker: inline autocomplete against `/catalog` + "create new" fallback.
- Group menu: contextual options based on the exercise's neighbors (4 scenarios: middle / first / inside cluster / single).
- Mobile (≤ 768 px): sidebar collapses to a left-slide drawer toggled from the day panel header.
- Locked routine guard: routines with sessions registered open in read-only mode with a banner.
- Explicit save with dirty-state indicator; confirm-dialog when navigating away with unsaved changes.

**Out (explicitly deferred):**
- "Vista alumno" button — never to be implemented (was prototype-only).
- "Asignar" button — deferred to a separate decision about whether assignment should live in the editor header or remain on the existing `/trainer/programs` flow.
- Tempo field on the exercise card — removed from editor UI. `Exercise.Tempo` stays in the domain model and DB (already exists); the editor just stops rendering / writing to it. Existing values round-trip untouched.
- RPE column on the sets table — hidden from editor UI but `ExerciseSet.TargetRpe` stays in the domain model and DB (no migration; future feature can re-expose it).
- Video source toggle (YouTube/Upload) on the exercise card — video metadata lives on the catalog entry; the editor only shows a read-only ▶ badge when `catalogVideoUrl` is present.
- New backend endpoints, new permissions, new tables. The `Routine → Day → ExerciseBlock → Exercise → ExerciseSet` schema and existing CRUD handlers are untouched.
- Catalog editor changes (covered in a separate Phase 6 follow-up if/when the field-richness gap matters).

## 3. Architecture decisions

### 3.1 Decomposition: smart shell + 4 presentational components

| File | Role | Approx LOC |
|---|---|---|
| `features/trainer/routines/feature/routine-editor.ts` | Smart shell — state, fetch, save, dirty handling, locked guard, drawer toggle | ~280 |
| `features/trainer/routines/ui/routine-sidebar.ts` | Presentational — routine meta + draggable day list | ~180 |
| `features/trainer/routines/ui/day-panel.ts` | Presentational — day header + clusters + add CTAs | ~250 |
| `features/trainer/routines/ui/exercise-card.ts` | Presentational — collapsed/expanded states + sets table + group menu | ~320 |
| `features/trainer/routines/ui/exercise-picker.ts` | Presentational — autocomplete against `/catalog` + create-new fallback | ~180 |

Rationale: each presentational has a single visual responsibility, can be tested in isolation, and `<kx-exercise-card>` may eventually be reusable in a read-only program preview or student-side view. The split mirrors the four React handoff files (`days-sidebar.jsx`, `day-panel.jsx`, `exercise-card.jsx`, `exercise-picker.jsx`).

### 3.2 Drag and drop: `@angular/cdk/drag-drop` + handoff visual treatment

- Reuse the same library introduced in v2 Phase 5 (`program-form.ts`); `@angular/cdk@^21.2.8` is already in the bundle.
- Days in the sidebar: a single `cdkDropList` with `cdkDrag` per day.
- Exercises across clusters: `cdkDropListGroup` envelope; each block (cluster) is its own `cdkDropList` with `cdkDrag` per exercise. Cross-cluster moves are allowed.
- Drop indicator: a 3 px crimson line with a glow shadow rendered over the `cdkDropListPlaceholder` slot — matches the handoff's drop-slot visual.
- `program-form.ts` accessibility carryovers (no keyboard alternative, missing `role`/`aria-label` on drop zones) are accepted here too — same pattern, will be addressed when the broader a11y sweep happens.

### 3.3 Exercise picker: autocomplete inline (no modal)

- The picker is rendered inline inside the expanded card. No modal, no drawer.
- Debounced 200 ms fetch to `GET /api/v1/catalog?q=<query>` (endpoint already exists; same one used by the catalog list).
- Up/Down arrows navigate the dropdown, Enter commits, Escape closes.
- If the trimmed query is ≥ 2 characters and matches no catalog entry, a "Crear "{query}" — Nuevo ejercicio" option appears with a crimson `+` icon. Selecting it sets `catalogExerciseId = null` and uses the typed text as the exercise name.
- Selecting a catalog match populates `catalogExerciseId`, `name`, `muscleGroup`, `catalogImageUrl`, `catalogVideoUrl` on the exercise.

### 3.4 Group menu: contextual bidirectional grouping

The "..." menu on each exercise card displays options based on the exercise's position in the day. Rules:

- A neighbor is **eligible for grouping** only if it's a `Single` block (not already inside a cluster) **and** part of an unbroken chain of `Single` blocks reaching from the current exercise's block in that direction. The chain stops at the first non-`Single` block (or at the day's start/end).
- **Above and below** are evaluated independently. Each direction can offer Superset (1 chained neighbor), Triset (2 chained neighbors), or Circuit (3+ chained neighbors), depending on how long the unbroken `Single` chain extends in that direction.
- When the menu emits a group action, the new cluster is created with `restSeconds = 60` as default (matches the React handoff). Trainer can edit it inline on the cluster header.
- **Inside a cluster:** only "Sacar del grupo", "Duplicar", "Eliminar". No grouping options (would have to ungroup first).
- **No eligible neighbors in either direction:** only "Duplicar" and "Eliminar".
- Duplicate and Delete are always present.

Menu structure:

```
Agrupar con anterior          (section label, only if upward options exist)
  ⛓ Superset      + #N
  ⛓ Triset        + #N-1, #N-2
  ⛓ Circuito      + #N-1, #N-2, #N-3
Agrupar con siguientes        (section label, only if downward options exist)
  ⛓ Superset      + #N+1
  ⛓ Triset        + #N+1, #N+2
  ⛓ Circuito      + #N+1, #N+2, #N+3
─────
📋 Duplicar ejercicio
🗑 Eliminar
```

(Or, if inside a cluster:)

```
⛓̸ Sacar del grupo
─────
📋 Duplicar ejercicio
🗑 Eliminar
```

Selecting a group action emits a `groupAction` event with shape `{ kind: 'group'; type: 'Superset'|'Triset'|'Circuit'; direction: 'up'|'down'; count: number } | { kind: 'ungroup' }`. The day-panel translates this into a mutation of `WizardDay.blocks`.

### 3.5 Save flow: explicit save + dirty state

- "Guardar" button always visible in the top header (top-right). Disabled when `!dirty()` or `saving()`.
- A pill `● cambios sin guardar` (amber tint) appears next to the "EDITANDO" overline when `dirty() === true`.
- `dirty` flips to `true` on any change emitted by the presentational components. Resets to `false` after a successful save.
- Navigating away while `dirty` (clicking "Volver a rutinas" or any router navigation): open `<kx-confirm-dialog>` titled "¿Descartar cambios sin guardar?". Confirm exits; cancel stays.
- After successful save: toast "Rutina guardada", `dirty` → false. If creating, navigate to `/trainer/routines/:id/edit` (replaces the URL); if editing, stay in place.

### 3.6 Mobile drawer (≤ 768 px)

- `routine-editor.ts` carries `mobileSidebarOpen: signal<boolean>(false)`.
- Desktop (`md:` breakpoint, ≥ 768 px): sidebar always visible at 280 px width.
- Mobile: sidebar hidden by default. A `☰ Días` button in the day-panel header (mobile-only via `md:hidden`) opens an overlay drawer (slide-in left, full-height, fixed-position).
- Selecting a day on mobile auto-closes the drawer.
- Tap on the overlay backdrop or `✕` in the drawer header closes it without changing day selection.
- The sidebar component is the same; CSS controls layout mode. No separate `<kx-routine-drawer>` component.

### 3.7 Locked routine guard (preserve from wizard)

The wizard already fetches `RoutineUsageDto` on load and renders banners. Same logic moves to the editor:

- `usage().hasSessions === true` → editor opens read-only. All inputs/buttons disabled. Save button hidden. Banner amber: "Rutina con sesiones registradas. Para modificar, duplica la rutina desde la lista."
- `usage().hasSessions === false && usage().activeAssignmentCount > 0` → editor editable. Banner amber informational: "X alumno(s) activo(s) verán los cambios en su próxima sesión."
- `usage()` is fetched alongside the routine on init.

## 4. Data model (unchanged)

The editor reads from and writes to the same DTOs the wizard uses today:

```typescript
// Already in shared/models
RoutineDetailDto { id, name, description, category, tags, days: DayDto[] }
DayDto { id, name, sortOrder, blocks: BlockDto[] }
BlockDto { id, blockType: BlockType | null, restSeconds, exercises: ExerciseDto[] }
ExerciseDto { id, name, notes, tempo, catalogExerciseId, sets: SetDto[] }
SetDto { id, setType, targetReps, targetWeight, targetRpe, restSeconds, sortOrder }

// In-component editing model (port from wizard)
interface WizardSet      { setType, targetReps, targetWeight, targetRpe, restSeconds }
interface WizardExercise { name, notes, tempo, catalogExerciseId, sets, catalogImageUrl, catalogVideoUrl }
interface WizardBlock    { blockType: BlockType | null, restSeconds, exercises }
interface WizardDay      { name, blocks }
```

`tempo` and `targetRpe` are kept in the wizard model (so the round-trip with the API doesn't drop them). The editor templates just don't render fields for them.

The save endpoint stays `POST /api/v1/routines` and `PUT /api/v1/routines/:id` with the existing payload shape — full replace semantics (per the project's documented "routine updates: full replace" convention).

## 5. Component contracts

### 5.1 `<kx-routine-sidebar>`

| Type | Field | Description |
|---|---|---|
| Input | `routine: WizardRoutine` | Full editing model |
| Input | `activeDayIndex: number` | Index of the currently-viewed day |
| Input | `isLocked: boolean` | Read-only mode (from `usage().hasSessions`) |
| Output | `routineChange: WizardRoutine` | Emitted on any meta change (name/description/category) |
| Output | `selectDay: number` | Click on a day item |
| Output | `addDay: void` | Click on "Añadir día" CTA |
| Output | `removeDay: number` | Inline delete on a day item (dayIndex) |
| Output | `reorderDays: { from: number; to: number }` | After CDK drop |

Renders: pill `📋 RUTINA`, name input (Syne 18-20 px), description multiline, category pill (with dropdown of `CATEGORIES = ['Hipertrofia','Fuerza','Resistencia','Funcional','Otro']`), section overline `Días · N`, draggable list of day items (each shows mono number `01`/`02`/`03`, day name, `N ejercicio(s)` count, grip icon), dashed "Añadir día" button.

### 5.2 `<kx-day-panel>`

| Type | Field | Description |
|---|---|---|
| Input | `day: WizardDay` | The active day |
| Input | `dayIndex: number` | For delete confirmation copy |
| Input | `isLocked: boolean` | Read-only mode |
| Output | `dayChange: WizardDay` | Emitted on any block/exercise change inside |
| Output | `removeDay: void` | Trash icon click |
| Output | `addExercise: void` | "+ Añadir ejercicio" CTA |
| Output | `addSuperset: void` | "+ Añadir superset" CTA (creates a 2-exercise Superset block with empty exercises) |

Renders: day header (overline `DÍA DE ENTRENO`, name H1 Syne 30 px editable, stats `N ejercicios · M series · K grupos`, IconButton trash), `cdkDropListGroup` envelope wrapping each block (cluster styled if `block.blockType !== null`), `<kx-exercise-card>` per exercise inside, dashed bordered zone with the two add CTAs.

### 5.3 `<kx-exercise-card>`

| Type | Field | Description |
|---|---|---|
| Input | `exercise: WizardExercise` | The exercise data |
| Input | `badge: { label: string; color: string } | null` | Cluster letter (A/B/C…) and color |
| Input | `isInCluster: boolean` | Whether the parent block is a cluster |
| Input | `groupOptions: GroupOption[]` | Computed by parent based on neighbors |
| Input | `isLocked: boolean` | Read-only mode |
| Output | `exerciseChange: WizardExercise` | Any sub-field change |
| Output | `delete: void` | Confirmed delete |
| Output | `duplicate: void` | Duplicate menu action |
| Output | `groupAction: GroupActionEvent` | Group/ungroup menu action |

`GroupOption` shape:
```typescript
type GroupOption =
  | { kind: 'group'; type: 'Superset'|'Triset'|'Circuit'; direction: 'up'|'down'; count: number }
  | { kind: 'ungroup' };
type GroupActionEvent = GroupOption;
```

Local state (signals): `expanded: boolean = false`, `menuOpen: boolean = false`.

Collapsed header: drag handle, badge (if `isInCluster`), name (or italic "Sin nombre" placeholder), muscle-group `<kx-badge tone="outline">`, ▶ play icon (if `exercise.catalogVideoUrl != null`), "Nuevo" badge (if `!exercise.catalogExerciseId && exercise.name`), summary text (`N series · breakdown`), first effective set's REPS/PESO in mono (only when collapsed), `⋯` menu button, chevron expand button.

Expanded body: `<kx-exercise-picker>` for the name field, sets table (5 columns: `#` mono index, `Tipo` select, `Reps` input, `Peso` input with `kg` suffix, `Desc.` input with `s` suffix, `✕` delete), "+ Añadir serie" link, total-rest estimate `⏱ Desc. total ≈ N min`, notes textarea.

### 5.4 `<kx-exercise-picker>`

| Type | Field | Description |
|---|---|---|
| Input | `value: string` | Current name text |
| Input | `catalogId: string | null` | Currently-selected catalog id (informational; doesn't affect rendering) |
| Input | `autoFocus: boolean = false` | Whether to focus on mount |
| Output | `selected` | `{ name, catalogExerciseId, muscleGroup, videoUrl, imageUrl }` |

Behavior: input + dropdown, debounced 200 ms fetch to `/api/v1/catalog?q=<trimmed lowercased query>`, show up to 6 matches, each row showing `name` + `muscleGroup` (mono uppercase). If `query.length >= 2` and no exact name match, append a "Crear "{query}" — Nuevo ejercicio" option. Keyboard: ↑/↓ navigate, Enter commits, Esc closes. Selecting commits and closes.

### 5.5 `routine-editor.ts` smart shell

State (signals):
```typescript
routine: WritableSignal<WizardRoutine>;
loading: WritableSignal<boolean>;
saving: WritableSignal<boolean>;
dirty: WritableSignal<boolean>;
usage: WritableSignal<RoutineUsageDto | null>;
activeDayIndex: WritableSignal<number>;
mobileSidebarOpen: WritableSignal<boolean>;

// Computed
isLocked = computed(() => this.usage()?.hasSessions ?? false);
isEdit = computed(() => !!this.routineId);
activeDay = computed(() => this.routine().days[this.activeDayIndex()]);
```

Methods: `loadRoutine()`, `save()`, `cancel()`, `confirmDiscardIfDirty(action: () => void)`, `markDirty()`, `selectDay(idx)`, `addDay()`, `removeDay(idx)`, `addExercise()` / `addSuperset()` for the active day, `onGroupAction(blockIdx, exIdx, action)`, `onReorderExercise(event: CdkDragDrop)`.

Subscriptions: `takeUntilDestroyed(this.destroyRef)` on every HTTP call.

Routes: same as today (`/trainer/routines/new`, `/trainer/routines/:id/edit`); `routine-editor.ts` replaces `RoutineWizard` in `routines.routes.ts`.

## 6. Behavioral rules to preserve

These came over from the existing `routine-wizard.ts` and stay:

- **Routine updates are full-replace** — the save payload re-sends the entire `days/blocks/exercises/sets` tree. No partial PATCHes.
- **Locked routine guard** — `RoutineUsageDto.hasSessions` blocks editing entirely; `activeAssignmentCount > 0` shows an informational banner but allows edits.
- **Catalog `videoSource` enum** — when exercise is picked from catalog, `catalogVideoUrl` carries the URL. The editor never writes to `videoUrl`/`videoSource`/`tempo` (left at their existing values for non-catalog exercises; new exercises get `videoSource: 'None'`, `tempo: ''`).
- **`name.trim()` required to save**; same validation as the wizard's step 1.

## 7. Migration plan

(To be expanded by the implementation plan; high-level outline:)

1. Create the 4 presentational components with placeholder templates and matching interfaces. Build green.
2. Implement `<kx-exercise-picker>` (no internal dependencies).
3. Implement `<kx-exercise-card>` (consumes picker; supports collapsed + expanded + menu + sets table).
4. Implement `<kx-day-panel>` (consumes exercise-card; CDK drop list group + add CTAs).
5. Implement `<kx-routine-sidebar>` (CDK drag list of days + meta editor).
6. Implement `routine-editor.ts` smart shell (state, fetch, save, dirty, drawer, locked guard, drag handlers).
7. Update `routines.routes.ts` to point `/new` and `/:id/edit` at `RoutineEditor`. Delete `routine-wizard.ts`.
8. Verify `<kx-wizard-stepper>` is still used elsewhere (grep). If unused, delete it.
9. Build verde (.NET unchanged at 77 specs; Karma at 10). Manual smoke: create new routine, add days, add exercises, group into superset, drag reorder, save, edit existing, confirm dirty-state guard.

No backend work, no migrations, no env vars.

## 8. Tests

- **Karma:** match the v2 phases' posture (no new specs added; verification via `ng build` clean is sufficient). If a unit feels load-bearing during implementation (e.g., the contextual group-options computation), spec it.
- **Manual smoke checklist** (run before merging):
  - Create routine, add 3 days, drag-reorder, save, reload, days persisted in correct order.
  - Add exercise via picker (catalog match), expand card, edit sets, save, verify catalog metadata round-trips.
  - Add exercise via picker (create new), confirm `catalogExerciseId` is null on the saved record.
  - Create a Superset via the menu with neighbor below; verify A/B labels render and rest-between-rounds is editable.
  - Move an exercise from one cluster to another via drag; verify cluster auto-demotes to Single when only 1 exercise remains.
  - Open a routine with `usage().hasSessions === true`; verify read-only banner + disabled controls + hidden Guardar button.
  - On mobile (≤ 768 px viewport), verify drawer toggles, day selection auto-closes drawer.
  - Edit any field, click "Volver a rutinas" — confirm-dialog appears.

## 9. Risks

- **File length:** `<kx-exercise-card>` will likely cross 300 lines (collapsed + expanded + menu + sets table + portal dropdown all in one single-file standalone). Acceptable per Kondix conventions; if it crosses ~450 lines during implementation, evaluate extracting the sets table or the menu into siblings (`<kx-exercise-sets>`, `<kx-exercise-menu>`).
- **CDK accessibility carryover:** drag/drop has no keyboard alternative (same as `program-form`). Acceptable; tracked as a separate v2.1 item.
- **Catalog endpoint `q=` perf:** debounced 200 ms client-side, but the backend `/catalog?q=` does an `ILIKE` scan. If the catalog grows past a few thousand entries, add a server-side limit (already in place at 50 hardcoded).
- **Wizard-stepper deletion:** if `<kx-wizard-stepper>` is used by another flow, do not delete; just stop importing it from the routine wizard's place.

## 10. Out of scope (re-stated for clarity)

- Backend changes (no new endpoints, no migrations).
- Vista alumno button.
- Asignar button (still under separate decision; will not appear in the editor for now).
- Tempo field in editor UI.
- RPE column in editor UI.
- Video source toggle in editor.
- Catalog editor field-richness (equipment, category, level, secondaryMuscles, timesUsed) — separate Phase 6 carryover.
- Any v2.1 polish items already documented in the v2 implementation log carryover queue.

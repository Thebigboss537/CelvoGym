# Routine Editor Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-step routine wizard (`routine-wizard.ts`, 1094 LOC) with a single-view editor that mirrors the v2 React handoff: sidebar (routine meta + draggable day list) + main panel (active day with collapsible exercise cards, CDK drag-and-drop, group/superset clusters, autocomplete picker).

**Architecture:** Smart shell + 4 presentational components. Existing backend untouched (no migrations, no new endpoints). `@angular/cdk/drag-drop` (already in bundle from Phase 5) for reorder + cross-cluster moves. Sidebar collapses to a left-slide drawer below 768 px. Save is explicit with a dirty-state pill in the header.

**Tech Stack:** Angular 21 standalone components, signals + computed, `@angular/cdk@^21.2.8`, Tailwind 4 with `@theme` tokens, Lucide icons (already integrated). No new dependencies.

**Spec reference:** `docs/superpowers/specs/2026-04-27-routine-editor-redesign.md`.

**Handoff reference (read-only — for visual/behavioral cribbing):**
- `design_handoff_kondix_v2/prototypes/trainer/days-sidebar.jsx`
- `design_handoff_kondix_v2/prototypes/trainer/day-panel.jsx`
- `design_handoff_kondix_v2/prototypes/trainer/exercise-card.jsx`
- `design_handoff_kondix_v2/prototypes/trainer/exercise-picker.jsx`

---

## File structure (locked in)

| Action | Path | Role |
|---|---|---|
| Create | `kondix-web/src/app/features/trainer/routines/ui/exercise-picker.ts` | Autocomplete inline + "Crear nuevo" |
| Create | `kondix-web/src/app/features/trainer/routines/ui/group-options.ts` | Pure helper — compute contextual menu options |
| Create | `kondix-web/src/app/features/trainer/routines/ui/group-options.spec.ts` | Karma spec for the helper above |
| Create | `kondix-web/src/app/features/trainer/routines/ui/exercise-card.ts` | Collapsed/expanded card + sets table + "..." menu |
| Create | `kondix-web/src/app/features/trainer/routines/ui/day-panel.ts` | Day header + cluster blocks + add CTAs + CDK drop list group |
| Create | `kondix-web/src/app/features/trainer/routines/ui/routine-sidebar.ts` | Routine meta + draggable day list |
| Create | `kondix-web/src/app/features/trainer/routines/feature/routine-editor.ts` | Smart shell — state, fetch, save, dirty, drawer, locked guard |
| Modify | `kondix-web/src/app/features/trainer/trainer.routes.ts:11,13` | Point `routines/new` + `routines/:id/edit` at the new editor |
| Delete | `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts` | The 1094-LOC wizard |
| Delete | `kondix-web/src/app/shared/ui/wizard-stepper.ts` | Only used by the wizard |
| Modify | `kondix-web/src/app/shared/ui/index.ts` | Drop the `KxWizardStepper` re-export |

---

## Shared types (used across multiple components)

These live inline in the consuming component or as a `types.ts` next to them — your call as the implementer; the plan declares them once here so later tasks can reference them without redefining:

```typescript
// Editing model — round-trips with the API. Note: 'tempo' and 'targetRpe'
// stay on the model so existing values aren't dropped, even though the
// editor templates don't render fields for them.
export type SetType = 'Warmup' | 'Effective' | 'DropSet' | 'RestPause' | 'AMRAP';
export type BlockType = 'Superset' | 'Triset' | 'Circuit';

export interface WizardSet {
  setType: SetType;
  targetReps: string;
  targetWeight: string;
  targetRpe: number | null;   // hidden in editor UI; preserved on save
  restSeconds: number | null;
}

export interface WizardExercise {
  name: string;
  notes: string;
  tempo: string;              // hidden in editor UI; preserved on save
  catalogExerciseId: string | null;
  catalogImageUrl: string | null;
  catalogVideoUrl: string | null;
  sets: WizardSet[];
}

export interface WizardBlock {
  blockType: BlockType | null;  // null = implicit Single (1 exercise)
  restSeconds: number;
  exercises: WizardExercise[];
}

export interface WizardDay {
  name: string;
  blocks: WizardBlock[];
}

export interface WizardRoutine {
  name: string;
  description: string;
  category: string;
  tags: string[];               // pass-through; no UI to edit in this editor
  days: WizardDay[];
}

// Picker → exercise-card
export interface PickerSelection {
  name: string;
  catalogExerciseId: string | null;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

// Group menu options (output by group-options helper, consumed by exercise-card)
export type GroupOption =
  | { kind: 'group'; type: BlockType; direction: 'up' | 'down'; count: number }
  | { kind: 'ungroup' };

export type GroupActionEvent = GroupOption;
```

**Notes for the implementer:**
- `WizardSet`, `WizardExercise`, `WizardBlock`, `WizardDay` already exist inline in `routine-wizard.ts:14-46`. Lift them as-is — the field shapes are identical to the API contract.
- `tags` is NEW on the editing model (the wizard kept it as a separate signal). Folding it into `WizardRoutine` is cleaner; load preserves and save passes it through.
- Backend payload shape (POST `/api/v1/routines`, PUT `/api/v1/routines/:id`) is **already** what `WizardRoutine` serializes to with the field rename `catalogImageUrl/catalogVideoUrl → imageUrl/videoUrl` on load only (the SAVE payload doesn't include those — see `routine-wizard.ts:1024-1049` for the exact body shape and reuse it verbatim in `routine-editor.ts`'s `save()` method).

---

## Task 1: Scaffold the 4 presentational components

**Files:**
- Create: `kondix-web/src/app/features/trainer/routines/ui/exercise-picker.ts`
- Create: `kondix-web/src/app/features/trainer/routines/ui/exercise-card.ts`
- Create: `kondix-web/src/app/features/trainer/routines/ui/day-panel.ts`
- Create: `kondix-web/src/app/features/trainer/routines/ui/routine-sidebar.ts`

Each scaffolds with the inputs/outputs from spec §5 + a placeholder template so subsequent tasks can wire imports without TypeScript errors.

- [ ] **Step 1: Create the `ui/` folder + 4 stub files**

`exercise-picker.ts`:
```typescript
import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';

export interface PickerSelection {
  name: string;
  catalogExerciseId: string | null;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

@Component({
  selector: 'kx-exercise-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs">[exercise-picker placeholder]</div>`,
})
export class KxExercisePicker {
  value = input<string>('');
  catalogId = input<string | null>(null);
  autoFocus = input<boolean>(false);
  selected = output<PickerSelection>();
}
```

`exercise-card.ts`:
```typescript
import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import type { WizardExercise, GroupActionEvent, GroupOption } from './types';

@Component({
  selector: 'kx-exercise-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs p-2">[exercise-card placeholder]</div>`,
})
export class KxExerciseCard {
  exercise = input.required<WizardExercise>();
  badge = input<{ label: string; color: string } | null>(null);
  isInCluster = input<boolean>(false);
  groupOptions = input<GroupOption[]>([]);
  isLocked = input<boolean>(false);

  exerciseChange = output<WizardExercise>();
  delete = output<void>();
  duplicate = output<void>();
  groupAction = output<GroupActionEvent>();
}
```

`day-panel.ts`:
```typescript
import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import type { WizardDay } from './types';

@Component({
  selector: 'kx-day-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs p-4">[day-panel placeholder]</div>`,
})
export class KxDayPanel {
  day = input.required<WizardDay>();
  dayIndex = input.required<number>();
  isLocked = input<boolean>(false);

  dayChange = output<WizardDay>();
  removeDay = output<void>();
  addExercise = output<void>();
  addSuperset = output<void>();
}
```

`routine-sidebar.ts`:
```typescript
import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import type { WizardRoutine } from './types';

@Component({
  selector: 'kx-routine-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs p-4">[routine-sidebar placeholder]</div>`,
})
export class KxRoutineSidebar {
  routine = input.required<WizardRoutine>();
  activeDayIndex = input.required<number>();
  isLocked = input<boolean>(false);

  routineChange = output<WizardRoutine>();
  selectDay = output<number>();
  addDay = output<void>();
  removeDay = output<number>();
  reorderDays = output<{ from: number; to: number }>();
}
```

- [ ] **Step 2: Create `kondix-web/src/app/features/trainer/routines/ui/types.ts`**

```typescript
export type SetType = 'Warmup' | 'Effective' | 'DropSet' | 'RestPause' | 'AMRAP';
export type BlockType = 'Superset' | 'Triset' | 'Circuit';

export interface WizardSet {
  setType: SetType;
  targetReps: string;
  targetWeight: string;
  targetRpe: number | null;
  restSeconds: number | null;
}

export interface WizardExercise {
  name: string;
  notes: string;
  tempo: string;
  catalogExerciseId: string | null;
  catalogImageUrl: string | null;
  catalogVideoUrl: string | null;
  sets: WizardSet[];
}

export interface WizardBlock {
  blockType: BlockType | null;
  restSeconds: number;
  exercises: WizardExercise[];
}

export interface WizardDay {
  name: string;
  blocks: WizardBlock[];
}

export interface WizardRoutine {
  name: string;
  description: string;
  category: string;
  tags: string[];
  days: WizardDay[];
}

export type GroupOption =
  | { kind: 'group'; type: BlockType; direction: 'up' | 'down'; count: number }
  | { kind: 'ungroup' };

export type GroupActionEvent = GroupOption;
```

- [ ] **Step 3: Build to verify all files compile**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. Lazy chunk for routine-editor doesn't yet exist (the smart wrapper lands in Task 7).

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/ui/
git commit -m "$(cat <<'EOF'
chore(routine-editor): scaffold 4 presentational components + types

Empty templates with the input/output contracts from the design spec
(2026-04-27-routine-editor-redesign). No behavior yet — Task 1 only
locks in the file boundaries so subsequent tasks can wire imports.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Implement `<kx-exercise-picker>` (autocomplete)

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/ui/exercise-picker.ts`

Cribs from `routine-wizard.ts:898-940` (existing catalog autocomplete logic) and the visual treatment from `design_handoff_kondix_v2/prototypes/trainer/exercise-picker.jsx`.

- [ ] **Step 1: Replace stub with real implementation**

```typescript
import {
  ChangeDetectionStrategy, Component, DestroyRef,
  ElementRef, ViewChild, computed, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

export interface PickerSelection {
  name: string;
  catalogExerciseId: string | null;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

interface CatalogSuggestion {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

@Component({
  selector: 'kx-exercise-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative w-full">
      <input
        #inp
        type="text"
        [(ngModel)]="query"
        (input)="onInput()"
        (focus)="open.set(true)"
        (blur)="onBlur()"
        (keydown)="onKeyDown($event)"
        autocomplete="off"
        placeholder="Busca o escribe el nombre del ejercicio…"
        class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition"
      />
      @if (open() && (matches().length > 0 || canCreate())) {
        <div class="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
          @for (m of matches(); track m.id; let i = $index) {
            <button type="button"
              (mousedown)="pickMatch(i, $event)"
              (mouseenter)="activeIdx.set(i)"
              class="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition border-l-2"
              [class.bg-card-hover]="activeIdx() === i"
              [class.border-primary]="activeIdx() === i"
              [class.border-transparent]="activeIdx() !== i">
              <span class="text-sm text-text font-medium truncate">{{ m.name }}</span>
              @if (m.muscleGroup) {
                <span class="text-overline text-text-muted">{{ m.muscleGroup }}</span>
              }
            </button>
          }
          @if (canCreate()) {
            <button type="button"
              (mousedown)="pickCreate($event)"
              (mouseenter)="activeIdx.set(matches().length)"
              class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition border-l-2"
              [class.bg-card-hover]="activeIdx() === matches().length"
              [class.border-primary]="activeIdx() === matches().length"
              [class.border-transparent]="activeIdx() !== matches().length"
              [class.border-t]="matches().length > 0">
              <span class="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">+</span>
              <span class="text-xs text-text">
                Crear <strong class="text-primary">"{{ query.trim() }}"</strong>
                <span class="text-text-muted ml-2">Nuevo ejercicio</span>
              </span>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class KxExercisePicker {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  value = input<string>('');
  catalogId = input<string | null>(null);
  autoFocus = input<boolean>(false);
  selected = output<PickerSelection>();

  @ViewChild('inp') inputRef?: ElementRef<HTMLInputElement>;

  query = '';
  open = signal(false);
  activeIdx = signal(0);
  matches = signal<CatalogSuggestion[]>([]);

  canCreate = computed(() => {
    const q = this.query.trim().toLowerCase();
    if (q.length < 2) return false;
    return !this.matches().some(m => m.name.toLowerCase() === q);
  });

  totalOptions = computed(() => this.matches().length + (this.canCreate() ? 1 : 0));

  private debounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.query = this.value() ?? '';
    if (this.autoFocus()) {
      queueMicrotask(() => this.inputRef?.nativeElement.focus());
    }
  }

  onInput() {
    this.activeIdx.set(0);
    this.open.set(true);
    if (this.debounce) clearTimeout(this.debounce);
    const q = this.query.trim();
    if (q.length < 2) {
      this.matches.set([]);
      return;
    }
    this.debounce = setTimeout(() => this.fetchCatalog(q), 200);
  }

  onBlur() {
    // Slight delay so mousedown on a suggestion can fire before close.
    setTimeout(() => this.open.set(false), 180);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.open.set(true);
      this.activeIdx.update(i => Math.min(this.totalOptions() - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIdx.update(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.commitActive();
    } else if (e.key === 'Escape') {
      this.open.set(false);
    }
  }

  pickMatch(i: number, e: MouseEvent) {
    e.preventDefault(); // keep focus
    const m = this.matches()[i];
    if (m) this.commitMatch(m);
  }

  pickCreate(e: MouseEvent) {
    e.preventDefault();
    this.commitCreate();
  }

  private commitActive() {
    const idx = this.activeIdx();
    if (idx < this.matches().length) {
      this.commitMatch(this.matches()[idx]);
    } else if (this.canCreate()) {
      this.commitCreate();
    } else if (this.query.trim()) {
      // No matches and < 2 chars: still emit free-text so the trainer's
      // partial input isn't lost when blurring.
      this.selected.emit({
        name: this.query.trim(),
        catalogExerciseId: null,
        muscleGroup: null,
        videoUrl: null,
        imageUrl: null,
        notes: null,
      });
    }
    this.open.set(false);
  }

  private commitMatch(m: CatalogSuggestion) {
    this.selected.emit({
      name: m.name,
      catalogExerciseId: m.id,
      muscleGroup: m.muscleGroup,
      videoUrl: m.videoUrl,
      imageUrl: m.imageUrl,
      notes: m.notes,
    });
    this.query = m.name;
    this.open.set(false);
  }

  private commitCreate() {
    this.selected.emit({
      name: this.query.trim(),
      catalogExerciseId: null,
      muscleGroup: null,
      videoUrl: null,
      imageUrl: null,
      notes: null,
    });
    this.open.set(false);
  }

  private fetchCatalog(q: string) {
    this.api
      .get<CatalogSuggestion[]>(`/catalog?q=${encodeURIComponent(q)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.matches.set(data.slice(0, 6));
          this.activeIdx.set(0);
        },
        error: () => this.matches.set([]),
      });
  }
}
```

- [ ] **Step 2: Build to verify**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. The picker isn't yet consumed anywhere; it just compiles standalone.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/ui/exercise-picker.ts
git commit -m "$(cat <<'EOF'
feat(routine-editor): kx-exercise-picker autocomplete

Inline autocomplete with debounced /catalog?q= fetch (200ms), keyboard
nav (↑/↓/Enter/Esc), and a "Crear nuevo {query}" fallback when query ≥ 2
chars and no exact match exists. Cribs the catalog-fetch logic from
routine-wizard.ts:898-940 and the visual from
design_handoff_kondix_v2/prototypes/trainer/exercise-picker.jsx.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Implement `group-options` helper + Karma spec (TDD)

**Files:**
- Create: `kondix-web/src/app/features/trainer/routines/ui/group-options.ts`
- Create: `kondix-web/src/app/features/trainer/routines/ui/group-options.spec.ts`

This is the one piece of pure logic in the editor that's worth a test. Per spec §8: "If a unit feels load-bearing during implementation (e.g., the contextual group-options computation), spec it."

- [ ] **Step 1: Write the failing spec first**

`group-options.spec.ts`:
```typescript
import { computeGroupOptions } from './group-options';
import type { WizardBlock, WizardExercise, WizardSet } from './types';

const newSet = (): WizardSet => ({ setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null });
const newEx = (name = ''): WizardExercise => ({ name, notes: '', tempo: '', catalogExerciseId: null, catalogImageUrl: null, catalogVideoUrl: null, sets: [newSet()] });
const single = (name: string): WizardBlock => ({ blockType: null, restSeconds: 90, exercises: [newEx(name)] });
const cluster = (type: 'Superset' | 'Triset' | 'Circuit', count: number): WizardBlock => ({
  blockType: type, restSeconds: 60,
  exercises: Array.from({ length: count }, (_, i) => newEx(`ex${i}`)),
});

describe('computeGroupOptions', () => {

  it('returns only Duplicate/Eliminate-equivalent (empty) when alone in day', () => {
    const blocks = [single('A')];
    expect(computeGroupOptions(blocks, 0)).toEqual([]);
  });

  it('first block with single neighbor below: only Superset down', () => {
    const blocks = [single('A'), single('B')];
    expect(computeGroupOptions(blocks, 0)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
    ]);
  });

  it('middle block with single neighbors above and below: Superset both ways', () => {
    const blocks = [single('A'), single('B'), single('C')];
    expect(computeGroupOptions(blocks, 1)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'up', count: 1 },
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
    ]);
  });

  it('block with 3 single neighbors below: offers Superset/Triset/Circuit down', () => {
    const blocks = [single('A'), single('B'), single('C'), single('D')];
    expect(computeGroupOptions(blocks, 0)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
      { kind: 'group', type: 'Triset', direction: 'down', count: 2 },
      { kind: 'group', type: 'Circuit', direction: 'down', count: 3 },
    ]);
  });

  it('chain broken by a cluster: stops at the cluster, does not skip past', () => {
    const blocks = [single('A'), single('B'), cluster('Superset', 2), single('D')];
    // From block 0 (A): only B is reachable (B then a Superset stops the chain)
    expect(computeGroupOptions(blocks, 0)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'down', count: 1 },
    ]);
  });

  it('block inside a cluster: only Ungroup', () => {
    const blocks = [cluster('Superset', 2), single('C')];
    // Inside-cluster representation: the consumer (day-panel) calls
    // computeGroupOptions for a NON-cluster block. Inside-cluster rendering
    // emits 'ungroup' directly without consulting this helper.
    // So this test ensures: even if called for a cluster block, we return
    // [{ kind: 'ungroup' }] as a sentinel.
    expect(computeGroupOptions(blocks, 0)).toEqual([{ kind: 'ungroup' }]);
  });

  it('last block with single neighbor above: only Superset up', () => {
    const blocks = [single('A'), single('B')];
    expect(computeGroupOptions(blocks, 1)).toEqual([
      { kind: 'group', type: 'Superset', direction: 'up', count: 1 },
    ]);
  });

});
```

- [ ] **Step 2: Run the spec to confirm RED**

Run: `cd kondix-web && npx ng test --watch=false --browsers=ChromeHeadless --include="**/group-options.spec.ts"`
Expected: 7 failures with `Cannot find module './group-options'` (or equivalent — the implementation doesn't exist yet).

- [ ] **Step 3: Implement the helper**

`group-options.ts`:
```typescript
import type { WizardBlock, GroupOption, BlockType } from './types';

/**
 * Compute the contextual menu options for a block at index `blockIdx`.
 *
 * Rules:
 * - If the block is itself a cluster (blockType !== null), the only option is
 *   { kind: 'ungroup' } as a sentinel; the consumer handles the menu rendering.
 * - Otherwise we walk neighbors in each direction, counting unbroken Single
 *   blocks (blockType === null). The chain stops at the first non-Single
 *   block or the array boundary.
 * - For each direction with N >= 1 chained singles, we offer:
 *     N == 1     → Superset
 *     N == 2     → Triset
 *     N >= 3     → Circuit (count is exactly the chain length, capped where needed)
 *   And include all smaller options too (so Superset is always offered when
 *   there's at least 1 neighbor; Triset when at least 2; etc.).
 */
export function computeGroupOptions(blocks: WizardBlock[], blockIdx: number): GroupOption[] {
  const block = blocks[blockIdx];
  if (!block) return [];

  // Inside-cluster: single sentinel.
  if (block.blockType !== null) {
    return [{ kind: 'ungroup' }];
  }

  // Walk up: count unbroken Single blocks above.
  let upCount = 0;
  for (let i = blockIdx - 1; i >= 0; i--) {
    if (blocks[i].blockType === null) upCount++;
    else break;
  }

  // Walk down: count unbroken Single blocks below.
  let downCount = 0;
  for (let i = blockIdx + 1; i < blocks.length; i++) {
    if (blocks[i].blockType === null) downCount++;
    else break;
  }

  const options: GroupOption[] = [];
  appendDirection(options, 'up', upCount);
  appendDirection(options, 'down', downCount);
  return options;
}

function appendDirection(out: GroupOption[], direction: 'up' | 'down', chainLen: number) {
  if (chainLen >= 1) out.push({ kind: 'group', type: 'Superset', direction, count: 1 });
  if (chainLen >= 2) out.push({ kind: 'group', type: 'Triset',   direction, count: 2 });
  if (chainLen >= 3) out.push({ kind: 'group', type: 'Circuit',  direction, count: chainLen });
  // chainLen >= 4 is folded into the same Circuit option (count = chainLen).
}
```

- [ ] **Step 4: Run the spec to confirm GREEN**

Run: `cd kondix-web && npx ng test --watch=false --browsers=ChromeHeadless --include="**/group-options.spec.ts"`
Expected: 7/7 PASS.

- [ ] **Step 5: Run the FULL Karma suite to confirm no regressions**

Run: `cd kondix-web && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: 17/17 PASS (10 prior + 7 new).

- [ ] **Step 6: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/ui/group-options.ts \
        kondix-web/src/app/features/trainer/routines/ui/group-options.spec.ts \
        kondix-web/src/app/features/trainer/routines/ui/types.ts
git commit -m "$(cat <<'EOF'
feat(routine-editor): contextual group-options helper + spec

Pure helper that walks neighbors to find the unbroken Single chain
length above/below a block, then enumerates the {Superset, Triset,
Circuit} options available in each direction (the menu's bidirectional
agrupar items). Returns { kind: 'ungroup' } sentinel when the block
itself is a cluster. 7 Karma cases cover: alone, first w/ neighbor
below, middle, 3+ chain, chain broken by cluster, inside cluster, last.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Implement `<kx-exercise-card>` (collapsed + expanded + menu)

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/ui/exercise-card.ts`

This is the largest single component (~320 LOC). It mirrors `design_handoff_kondix_v2/prototypes/trainer/exercise-card.jsx:116-399` (without the tempo/video/RPE fields, per spec §2 and §3).

- [ ] **Step 1: Replace stub with full implementation**

```typescript
import {
  ChangeDetectionStrategy, Component, computed, inject, input, output, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  ChevronDown, ChevronUp, GripVertical, MoreHorizontal,
  Play, Trash2, Copy, Link2, Unlink2, X, Plus, Timer,
} from 'lucide-angular';
import { KxExercisePicker, PickerSelection } from './exercise-picker';
import type {
  WizardExercise, WizardSet, GroupActionEvent, GroupOption, BlockType, SetType,
} from './types';

const ICONS = { ChevronDown, ChevronUp, GripVertical, MoreHorizontal, Play, Trash2, Copy, Link2, Unlink2, X, Plus, Timer };

const SET_TYPE_LABELS: Record<SetType, string> = {
  Warmup: 'Calent.',
  Effective: 'Efectiva',
  DropSet: 'Drop set',
  RestPause: 'Rest-pause',
  AMRAP: 'AMRAP',
};

const SET_TYPES: SetType[] = ['Warmup', 'Effective', 'DropSet', 'RestPause', 'AMRAP'];

const newSet = (): WizardSet => ({
  setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null,
});

@Component({
  selector: 'kx-exercise-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, KxExercisePicker],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(ICONS) }],
  template: `
    <div class="bg-card border border-border rounded-xl overflow-visible relative transition"
         [class.opacity-60]="isLocked()">
      @if (badge(); as b) {
        <span class="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
              [style.background]="b.color"></span>
      }

      <!-- Collapsed/expanded HEADER -->
      <div class="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-t-xl"
           [class.bg-bg-raised]="expanded()"
           [class.border-b]="expanded()"
           [class.border-border-light]="expanded()"
           (click)="toggle()">

        <!-- Drag handle (passes through to CDK on the parent) -->
        <span class="text-text-muted hover:text-text cursor-grab" (click)="$event.stopPropagation()">
          <lucide-angular name="grip-vertical" [size]="14"></lucide-angular>
        </span>

        @if (badge(); as b) {
          <span class="font-mono text-[11px] font-bold tracking-wider min-w-[18px]"
                [style.color]="b.color">{{ b.label }}</span>
        }

        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-semibold text-text truncate">
              @if (exercise().name) { {{ exercise().name }} }
              @else { <span class="italic text-text-muted">Sin nombre</span> }
            </span>
            @if (exercise().catalogVideoUrl) {
              <lucide-angular name="play" [size]="14" class="text-primary"></lucide-angular>
            }
            @if (!exercise().catalogExerciseId && exercise().name.trim().length > 0) {
              <span class="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wide">Nuevo</span>
            }
          </div>
          <span class="text-[11px] text-text-muted font-mono">{{ summary() }}</span>
        </div>

        @if (!expanded() && firstEffective(); as fe) {
          <div class="flex gap-3 items-center font-mono text-xs text-text-secondary tabular-nums">
            <span><span class="text-text-muted text-[9px] tracking-wider">REPS </span>{{ fe.targetReps || 'libre' }}</span>
            <span><span class="text-text-muted text-[9px] tracking-wider">PESO </span>{{ fe.targetWeight ? fe.targetWeight + 'kg' : 'libre' }}</span>
          </div>
        }

        <!-- Menu trigger + chevron -->
        <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
          <button type="button" (click)="menuOpen.set(!menuOpen())"
                  [disabled]="isLocked()"
                  class="text-text-muted hover:text-text px-1.5 py-1 rounded transition"
                  aria-label="Opciones del ejercicio">
            <lucide-angular name="more-horizontal" [size]="16"></lucide-angular>
          </button>
          <button type="button" (click)="toggle()"
                  class="text-text-muted hover:text-text px-1.5 py-1 rounded transition"
                  aria-label="Expandir / colapsar">
            <lucide-angular [name]="expanded() ? 'chevron-up' : 'chevron-down'" [size]="16"></lucide-angular>
          </button>
        </div>
      </div>

      <!-- "..." MENU dropdown (positioned absolute below trigger) -->
      @if (menuOpen()) {
        <div class="fixed inset-0 z-40" (click)="menuOpen.set(false)"></div>
        <div class="absolute right-3 top-12 z-50 bg-card-hover border border-border rounded-xl shadow-lg min-w-[240px] overflow-hidden p-1.5 animate-fade-up">
          @for (group of groupedOptions().above; track $index) {
            @if (groupedOptions().above.length > 0 && $index === 0) {
              <div class="text-overline text-text-muted px-2 pt-1.5 pb-1">Agrupar con anterior</div>
            }
            <button type="button" (click)="emitGroup(group); menuOpen.set(false)"
                    class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-text hover:bg-card-hover/60 rounded">
              <lucide-angular name="link-2" [size]="13"></lucide-angular>
              <span>{{ labelFor(group) }}</span>
              <span class="ml-auto text-text-muted text-xs font-mono">{{ countLabel(group) }}</span>
            </button>
          }
          @for (group of groupedOptions().below; track $index) {
            @if (groupedOptions().below.length > 0 && $index === 0) {
              <div class="text-overline text-text-muted px-2 pt-1.5 pb-1">Agrupar con siguientes</div>
            }
            <button type="button" (click)="emitGroup(group); menuOpen.set(false)"
                    class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-text hover:bg-card-hover/60 rounded">
              <lucide-angular name="link-2" [size]="13"></lucide-angular>
              <span>{{ labelFor(group) }}</span>
              <span class="ml-auto text-text-muted text-xs font-mono">{{ countLabel(group) }}</span>
            </button>
          }
          @if (groupedOptions().ungroup) {
            <button type="button" (click)="emitGroup({ kind: 'ungroup' }); menuOpen.set(false)"
                    class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-text hover:bg-card-hover/60 rounded">
              <lucide-angular name="unlink-2" [size]="13"></lucide-angular>
              <span>Sacar del grupo</span>
            </button>
          }
          @if (groupedOptions().above.length || groupedOptions().below.length || groupedOptions().ungroup) {
            <div class="h-px bg-border my-1"></div>
          }
          <button type="button" (click)="duplicate.emit(); menuOpen.set(false)"
                  class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-text hover:bg-card-hover/60 rounded">
            <lucide-angular name="copy" [size]="13"></lucide-angular>
            <span>Duplicar ejercicio</span>
          </button>
          <button type="button" (click)="delete.emit(); menuOpen.set(false)"
                  class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-danger hover:bg-danger/10 rounded">
            <lucide-angular name="trash-2" [size]="13"></lucide-angular>
            <span>Eliminar</span>
          </button>
        </div>
      }

      <!-- EXPANDED BODY -->
      @if (expanded()) {
        <div class="p-4 animate-fade-up">
          <div class="text-overline text-text-muted mb-1">Ejercicio</div>
          <kx-exercise-picker
            [value]="exercise().name"
            [catalogId]="exercise().catalogExerciseId"
            (selected)="onPickerSelected($event)"
          />

          <!-- Sets table -->
          <div class="mt-4 grid gap-2"
               style="grid-template-columns: 28px 110px 1fr 1fr 72px 24px;">
            <div class="text-overline text-text-muted text-center">#</div>
            <div class="text-overline text-text-muted">Tipo</div>
            <div class="text-overline text-text-muted text-center">Reps</div>
            <div class="text-overline text-text-muted text-center">Peso</div>
            <div class="text-overline text-text-muted text-center">Desc.</div>
            <div></div>

            @for (set of exercise().sets; track $index; let si = $index) {
              <span class="font-mono text-xs text-text-muted text-center self-center tabular-nums">
                {{ (si + 1).toString().padStart(2, '0') }}
              </span>
              <select [ngModel]="set.setType" (ngModelChange)="updateSet(si, { setType: $event })"
                      [name]="'st-' + si" [disabled]="isLocked()"
                      class="select-styled bg-bg-raised border border-border rounded-lg px-2 py-1.5 text-xs text-text">
                @for (t of setTypes; track t) {
                  <option [value]="t">{{ setTypeLabels[t] }}</option>
                }
              </select>
              <input type="text" [ngModel]="set.targetReps"
                     (ngModelChange)="updateSet(si, { targetReps: $event })"
                     [name]="'reps-' + si" [disabled]="isLocked()" placeholder="libre"
                     class="bg-bg-raised border border-border rounded-lg px-2 py-1.5 text-xs text-text text-center font-mono tabular-nums" />
              <div class="flex items-center bg-bg-raised border border-border rounded-lg overflow-hidden">
                <input type="text" [ngModel]="set.targetWeight"
                       (ngModelChange)="updateSet(si, { targetWeight: $event })"
                       [name]="'wt-' + si" [disabled]="isLocked()" placeholder="libre"
                       class="bg-transparent flex-1 px-2 py-1.5 text-xs text-text text-center font-mono tabular-nums focus:outline-none" />
                <span class="text-[9px] text-text-muted pr-2 font-mono">KG</span>
              </div>
              <div class="flex items-center bg-bg-raised border border-border rounded-lg overflow-hidden">
                <input type="number" [ngModel]="set.restSeconds ?? ''"
                       (ngModelChange)="updateSet(si, { restSeconds: $event === '' ? null : Number($event) })"
                       [name]="'rest-' + si" [disabled]="isLocked()" placeholder="—"
                       class="bg-transparent flex-1 px-2 py-1.5 text-xs text-text text-center font-mono tabular-nums focus:outline-none" />
                <span class="text-[9px] text-text-muted pr-2 font-mono">S</span>
              </div>
              <button type="button" (click)="removeSet(si)"
                      [disabled]="isLocked() || exercise().sets.length === 1"
                      class="text-text-muted hover:text-danger text-xs disabled:opacity-30 disabled:cursor-not-allowed self-center"
                      aria-label="Eliminar serie">
                <lucide-angular name="x" [size]="14"></lucide-angular>
              </button>
            }
          </div>

          <div class="flex items-center mt-3">
            <button type="button" (click)="addSet()" [disabled]="isLocked()"
                    class="text-primary text-xs hover:underline disabled:opacity-50">
              + Añadir serie
            </button>
            <span class="flex-1"></span>
            <span class="text-[10px] text-text-muted font-mono flex items-center gap-1">
              <lucide-angular name="timer" [size]="11"></lucide-angular>
              Desc. total ≈ {{ totalRestMin() }} min
            </span>
          </div>

          <div class="mt-4">
            <div class="text-overline text-text-muted mb-1">Notas del ejercicio</div>
            <textarea
              [ngModel]="exercise().notes"
              (ngModelChange)="updateNotes($event)"
              [disabled]="isLocked()"
              rows="2"
              placeholder="Técnica, variaciones… (se muestra al alumno)"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-primary resize-y"></textarea>
          </div>
        </div>
      }
    </div>
  `,
})
export class KxExerciseCard {
  exercise = input.required<WizardExercise>();
  badge = input<{ label: string; color: string } | null>(null);
  isInCluster = input<boolean>(false);
  groupOptions = input<GroupOption[]>([]);
  isLocked = input<boolean>(false);

  exerciseChange = output<WizardExercise>();
  delete = output<void>();
  duplicate = output<void>();
  groupAction = output<GroupActionEvent>();

  expanded = signal(false);
  menuOpen = signal(false);

  setTypes = SET_TYPES;
  setTypeLabels = SET_TYPE_LABELS;

  firstEffective = computed(() => {
    const ex = this.exercise();
    return ex.sets.find(s => s.setType === 'Effective') ?? ex.sets[0] ?? null;
  });

  summary = computed(() => {
    const ex = this.exercise();
    if (ex.sets.length === 0) return '—';
    const counts: Record<string, number> = {};
    for (const s of ex.sets) counts[s.setType] = (counts[s.setType] || 0) + 1;
    const labels: Record<string, string> = {
      Warmup: 'calent.', Effective: 'efect.', DropSet: 'drop',
      RestPause: 'r-p', AMRAP: 'AMRAP',
    };
    const breakdown = Object.entries(counts).map(([t, c]) => `${c} ${labels[t] || t}`).join(' · ');
    return `${ex.sets.length} ${ex.sets.length === 1 ? 'serie' : 'series'} · ${breakdown}`;
  });

  totalRestMin = computed(() => {
    const total = this.exercise().sets.reduce((s, x) => s + (x.restSeconds || 0), 0);
    return Math.round(total / 60);
  });

  groupedOptions = computed(() => {
    const opts = this.groupOptions();
    return {
      above: opts.filter((o): o is Extract<GroupOption, { kind: 'group'; direction: 'up' }> =>
        o.kind === 'group' && o.direction === 'up'),
      below: opts.filter((o): o is Extract<GroupOption, { kind: 'group'; direction: 'down' }> =>
        o.kind === 'group' && o.direction === 'down'),
      ungroup: opts.some(o => o.kind === 'ungroup'),
    };
  });

  toggle() { this.expanded.update(e => !e); }

  emitGroup(opt: GroupActionEvent) { this.groupAction.emit(opt); }

  labelFor(opt: GroupOption): string {
    if (opt.kind !== 'group') return '';
    return opt.type === 'Circuit' ? 'Circuito' : opt.type;
  }

  countLabel(opt: GroupOption): string {
    if (opt.kind !== 'group') return '';
    const sign = opt.direction === 'up' ? '−' : '+';
    return `${sign}${opt.count}`;
  }

  onPickerSelected(s: PickerSelection) {
    const ex = this.exercise();
    this.exerciseChange.emit({
      ...ex,
      name: s.name,
      catalogExerciseId: s.catalogExerciseId,
      catalogImageUrl: s.imageUrl,
      catalogVideoUrl: s.videoUrl,
      notes: s.notes ?? ex.notes,
    });
  }

  updateSet(si: number, patch: Partial<WizardSet>) {
    const ex = this.exercise();
    const sets = ex.sets.map((s, j) => j === si ? { ...s, ...patch } : s);
    this.exerciseChange.emit({ ...ex, sets });
  }

  removeSet(si: number) {
    const ex = this.exercise();
    if (ex.sets.length === 1) return;
    this.exerciseChange.emit({ ...ex, sets: ex.sets.filter((_, j) => j !== si) });
  }

  addSet() {
    const ex = this.exercise();
    const last = ex.sets[ex.sets.length - 1];
    const seed: WizardSet = last ? { ...last } : newSet();
    this.exerciseChange.emit({ ...ex, sets: [...ex.sets, seed] });
  }

  updateNotes(notes: string) {
    this.exerciseChange.emit({ ...this.exercise(), notes });
  }
}
```

- [ ] **Step 2: Build to verify**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. Lucide icons may warn about unused names — that's fine; the build will tree-shake.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/ui/exercise-card.ts
git commit -m "$(cat <<'EOF'
feat(routine-editor): kx-exercise-card with collapsed + expanded states

Mirrors design_handoff_kondix_v2/prototypes/trainer/exercise-card.jsx
without tempo / video toggle / RPE column (per spec). Collapsed header
shows drag handle + cluster badge + name + ▶ icon if catalogVideoUrl
+ "Nuevo" badge + summary + first-effective REPS/PESO. Expanded body
embeds kx-exercise-picker + sets table (5 cols) + + Añadir serie +
total rest estimate + notes. The "..." menu reads grouped options from
groupOptions input and emits groupAction events upward.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Implement `<kx-day-panel>` (clusters + CDK drop list group)

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/ui/day-panel.ts`

Cribs from `design_handoff_kondix_v2/prototypes/trainer/day-panel.jsx`. Wraps the block list in a `cdkDropListGroup` so drags can cross between clusters.

- [ ] **Step 1: Replace stub with full implementation**

```typescript
import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup,
  moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { Trash2, Plus, Link2, Unlink2, Timer } from 'lucide-angular';
import { KxExerciseCard } from './exercise-card';
import { computeGroupOptions } from './group-options';
import type {
  WizardDay, WizardBlock, WizardExercise, WizardSet, BlockType, GroupActionEvent,
} from './types';

const ICONS = { Trash2, Plus, Link2, Unlink2, Timer };

const CLUSTER_COLORS: Record<BlockType, string> = {
  Superset: 'var(--color-primary)',
  Triset: '#c084fc',
  Circuit: '#60a5fa',
};

const CLUSTER_LETTERS = ['A', 'B', 'C', 'D', 'E'];

const newSet = (): WizardSet => ({ setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null });
const newExercise = (): WizardExercise => ({ name: '', notes: '', tempo: '', catalogExerciseId: null, catalogImageUrl: null, catalogVideoUrl: null, sets: [newSet()] });
const newBlock = (): WizardBlock => ({ blockType: null, restSeconds: 90, exercises: [newExercise()] });
const newSuperset = (): WizardBlock => ({ blockType: 'Superset', restSeconds: 60, exercises: [newExercise(), newExercise()] });

@Component({
  selector: 'kx-day-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, LucideAngularModule, KxExerciseCard],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(ICONS) }],
  template: `
    <div class="flex flex-col gap-4">

      <!-- Day header -->
      <div class="flex items-end gap-4 pb-3.5 border-b border-border-light">
        <div class="flex-1 min-w-0">
          <div class="text-overline text-primary mb-1">Día de entreno</div>
          <input type="text"
            [ngModel]="day().name"
            (ngModelChange)="updateDayName($event)"
            [disabled]="isLocked()"
            placeholder="Nombre del día…"
            class="font-display text-3xl font-extrabold text-text bg-transparent w-full focus:outline-none border-b border-transparent focus:border-primary leading-none" />
          <div class="mt-2.5 flex gap-4 text-[11px] text-text-muted font-mono uppercase tracking-wider">
            <span><strong class="text-text-secondary font-display text-sm normal-case tracking-tight">{{ stats().exercises }}</strong> ejercicios</span>
            <span><strong class="text-text-secondary font-display text-sm normal-case tracking-tight">{{ stats().sets }}</strong> series</span>
            <span><strong class="text-text-secondary font-display text-sm normal-case tracking-tight">{{ stats().clusters }}</strong> grupos</span>
          </div>
        </div>
        <button type="button" (click)="removeDay.emit()" [disabled]="isLocked()"
                class="text-text-muted hover:text-danger p-2 rounded transition disabled:opacity-50"
                aria-label="Eliminar día">
          <lucide-angular name="trash-2" [size]="16"></lucide-angular>
        </button>
      </div>

      <!-- Block list with cdkDropListGroup so drags cross between clusters -->
      <div cdkDropListGroup class="flex flex-col gap-3.5">
        @for (block of day().blocks; track $index; let bi = $index) {
          <div
            cdkDropList
            [cdkDropListData]="block.exercises"
            [id]="'block-' + bi"
            (cdkDropListDropped)="onDrop($event, bi)"
            class="relative"
            [class.pl-4]="block.blockType !== null"
            [class.py-2.5]="block.blockType !== null"
            [class.rounded-md]="block.blockType !== null"
            [style.borderLeft]="block.blockType ? '2px solid ' + clusterColor(block.blockType) : null"
            [style.background]="block.blockType ? clusterTint(block.blockType) : null">

            @if (block.blockType !== null) {
              <div class="flex items-center gap-2.5 mb-2.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
                      [style.background]="clusterTint(block.blockType, 0.18)"
                      [style.color]="clusterColor(block.blockType)">
                  <lucide-angular name="link-2" [size]="10" class="inline align-text-bottom mr-1"></lucide-angular>
                  {{ block.blockType }}
                </span>
                <div class="flex items-center gap-1.5 text-[11px] text-text-muted font-mono">
                  <lucide-angular name="timer" [size]="11"></lucide-angular>
                  <input type="number" [ngModel]="block.restSeconds"
                         (ngModelChange)="updateBlockRest(bi, $event)"
                         [disabled]="isLocked()"
                         class="bg-transparent text-text-secondary w-12 text-right font-mono focus:outline-none focus:bg-bg-raised rounded px-1" />s desc. entre rondas
                </div>
                <span class="flex-1"></span>
                <button type="button" (click)="ungroupBlock(bi)" [disabled]="isLocked()"
                        class="text-text-muted hover:text-text text-xs flex items-center gap-1 disabled:opacity-50">
                  <lucide-angular name="unlink-2" [size]="12"></lucide-angular>
                  desagrupar
                </button>
              </div>
            }

            <div class="flex flex-col gap-2">
              @for (ex of block.exercises; track $index; let ei = $index) {
                <div cdkDrag [cdkDragData]="{ blockIdx: bi, exIdx: ei }">
                  <kx-exercise-card
                    [exercise]="ex"
                    [badge]="block.blockType !== null ? { label: clusterLetters[ei], color: clusterColor(block.blockType!) } : null"
                    [isInCluster]="block.blockType !== null"
                    [groupOptions]="computeOptionsFor(bi)"
                    [isLocked]="isLocked()"
                    (exerciseChange)="updateExercise(bi, ei, $event)"
                    (delete)="removeExercise(bi, ei)"
                    (duplicate)="duplicateExercise(bi, ei)"
                    (groupAction)="onGroupAction(bi, ei, $event)"
                  />
                </div>
              }
            </div>

            @if (block.blockType !== null) {
              <button type="button" (click)="addToCluster(bi)" [disabled]="isLocked()"
                      class="mt-2 text-xs flex items-center gap-1 disabled:opacity-50"
                      [style.color]="clusterColor(block.blockType)">
                <lucide-angular name="plus" [size]="12"></lucide-angular>
                Añadir al {{ block.blockType.toLowerCase() }}
              </button>
            }
          </div>
        }
      </div>

      <!-- Add zone -->
      <div class="border border-dashed border-border-light/60 rounded-xl p-3.5 flex justify-center gap-2 flex-wrap bg-white/[0.015]">
        <button type="button" (click)="addExercise.emit()" [disabled]="isLocked()"
                class="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition press disabled:opacity-50 flex items-center gap-1.5">
          <lucide-angular name="plus" [size]="14"></lucide-angular>
          Añadir ejercicio
        </button>
        <button type="button" (click)="addSuperset.emit()" [disabled]="isLocked()"
                class="bg-card border border-border hover:border-primary text-text text-sm px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5">
          <lucide-angular name="link-2" [size]="14"></lucide-angular>
          Añadir superset
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Crimson glowing drop indicator over CDK placeholder */
    :host ::ng-deep .cdk-drop-list-dragging .cdk-drag-placeholder {
      background: var(--color-primary);
      box-shadow: 0 0 12px rgba(230,38,57,0.6);
      height: 3px;
      min-height: 3px;
      border-radius: 2px;
      opacity: 1;
      transition: none;
    }
    :host ::ng-deep .cdk-drag-preview {
      box-sizing: border-box;
      background: var(--color-card);
      border: 1px solid var(--color-primary);
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    }
    :host ::ng-deep .cdk-drag-animating {
      transition: transform 200ms cubic-bezier(0,0,0.2,1);
    }
  `],
})
export class KxDayPanel {
  day = input.required<WizardDay>();
  dayIndex = input.required<number>();
  isLocked = input<boolean>(false);

  dayChange = output<WizardDay>();
  removeDay = output<void>();
  addExercise = output<void>();
  addSuperset = output<void>();

  clusterLetters = CLUSTER_LETTERS;

  stats = computed(() => {
    const day = this.day();
    let exercises = 0, sets = 0, clusters = 0;
    for (const b of day.blocks) {
      exercises += b.exercises.length;
      for (const e of b.exercises) sets += e.sets.length;
      if (b.blockType !== null) clusters++;
    }
    return { exercises, sets, clusters };
  });

  clusterColor(t: BlockType): string { return CLUSTER_COLORS[t]; }
  clusterTint(t: BlockType, alpha = 0.05): string {
    const color = CLUSTER_COLORS[t];
    return `color-mix(in oklch, ${color} ${alpha * 100}%, transparent)`;
  }

  computeOptionsFor(blockIdx: number) {
    return computeGroupOptions(this.day().blocks, blockIdx);
  }

  updateDayName(name: string) {
    this.dayChange.emit({ ...this.day(), name });
  }

  updateBlockRest(bi: number, restSeconds: number) {
    this.dayChange.emit(this.patchBlock(bi, { restSeconds }));
  }

  updateExercise(bi: number, ei: number, ex: WizardExercise) {
    const day = this.day();
    const blocks = day.blocks.map((b, i) =>
      i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? ex : e) } : b
    );
    this.dayChange.emit({ ...day, blocks });
  }

  removeExercise(bi: number, ei: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const remaining = block.exercises.filter((_, j) => j !== ei);
    let blocks: WizardBlock[];
    if (remaining.length === 0) {
      // Remove the whole block.
      blocks = day.blocks.filter((_, i) => i !== bi);
    } else {
      const updated: WizardBlock = {
        ...block,
        exercises: remaining,
        // Demote to Single if cluster shrinks to 1.
        blockType: remaining.length === 1 ? null : block.blockType,
      };
      blocks = day.blocks.map((b, i) => i === bi ? updated : b);
    }
    this.dayChange.emit({ ...day, blocks });
  }

  duplicateExercise(bi: number, ei: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const dup = JSON.parse(JSON.stringify(block.exercises[ei])) as WizardExercise;
    const exercises = [...block.exercises.slice(0, ei + 1), dup, ...block.exercises.slice(ei + 1)];
    // If we just made a single-exercise block become 2, promote to Superset.
    const promoted = block.blockType === null && exercises.length === 2
      ? { ...block, blockType: 'Superset' as const, restSeconds: 60, exercises }
      : { ...block, exercises };
    this.dayChange.emit({ ...day, blocks: day.blocks.map((b, i) => i === bi ? promoted : b) });
  }

  addToCluster(bi: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const exercises = [...block.exercises, newExercise()];
    this.dayChange.emit({ ...day, blocks: day.blocks.map((b, i) => i === bi ? { ...b, exercises } : b) });
  }

  ungroupBlock(bi: number) {
    // Demote a cluster back to N single blocks (one per exercise).
    const day = this.day();
    const block = day.blocks[bi];
    const newBlocks: WizardBlock[] = block.exercises.map(e => ({
      blockType: null, restSeconds: 90, exercises: [e],
    }));
    this.dayChange.emit({
      ...day,
      blocks: [...day.blocks.slice(0, bi), ...newBlocks, ...day.blocks.slice(bi + 1)],
    });
  }

  onGroupAction(bi: number, ei: number, action: GroupActionEvent) {
    if (action.kind === 'ungroup') {
      this.ungroupExerciseFromCluster(bi, ei);
      return;
    }
    // kind === 'group': merge `count` neighbors in `direction` with this block.
    const day = this.day();
    const blocks = [...day.blocks];
    const sourceBlock = blocks[bi];
    if (sourceBlock.blockType !== null) return; // safety: already in a cluster

    const range = action.direction === 'up'
      ? { start: bi - action.count, end: bi + 1 }
      : { start: bi, end: bi + action.count + 1 };

    const merged: WizardBlock = {
      blockType: action.type,
      restSeconds: 60,
      exercises: blocks.slice(range.start, range.end).flatMap(b => b.exercises),
    };

    const next = [...blocks.slice(0, range.start), merged, ...blocks.slice(range.end)];
    this.dayChange.emit({ ...day, blocks: next });
  }

  private ungroupExerciseFromCluster(bi: number, ei: number) {
    const day = this.day();
    const block = day.blocks[bi];
    const remaining = block.exercises.filter((_, j) => j !== ei);
    const removed = block.exercises[ei];

    let blocks: WizardBlock[];
    const newSingle: WizardBlock = { blockType: null, restSeconds: 90, exercises: [removed] };

    if (remaining.length === 0) {
      blocks = [...day.blocks.slice(0, bi), newSingle, ...day.blocks.slice(bi + 1)];
    } else if (remaining.length === 1) {
      const demoted: WizardBlock = { ...block, exercises: remaining, blockType: null };
      blocks = [...day.blocks.slice(0, bi), demoted, newSingle, ...day.blocks.slice(bi + 1)];
    } else {
      const trimmed: WizardBlock = { ...block, exercises: remaining };
      blocks = [...day.blocks.slice(0, bi), trimmed, newSingle, ...day.blocks.slice(bi + 1)];
    }
    this.dayChange.emit({ ...day, blocks });
  }

  onDrop(event: CdkDragDrop<WizardExercise[]>, targetBi: number) {
    const day = this.day();
    if (event.previousContainer === event.container) {
      // Reorder within same block.
      const block = day.blocks[targetBi];
      const exercises = [...block.exercises];
      moveItemInArray(exercises, event.previousIndex, event.currentIndex);
      this.dayChange.emit({ ...day, blocks: day.blocks.map((b, i) => i === targetBi ? { ...b, exercises } : b) });
      return;
    }

    // Cross-block move.
    const fromBi = Number((event.previousContainer.id ?? '').replace('block-', ''));
    if (Number.isNaN(fromBi)) return;
    const blocks = day.blocks.map(b => ({ ...b, exercises: [...b.exercises] }));
    const moved = blocks[fromBi].exercises.splice(event.previousIndex, 1)[0];
    blocks[targetBi].exercises.splice(event.currentIndex, 0, moved);

    // Cleanup: empty source → remove; cluster of 1 → demote to Single.
    const cleaned = blocks
      .filter(b => b.exercises.length > 0)
      .map(b => b.exercises.length === 1 && b.blockType !== null ? { ...b, blockType: null } : b);

    this.dayChange.emit({ ...day, blocks: cleaned });
  }

  private patchBlock(bi: number, patch: Partial<WizardBlock>): WizardDay {
    const day = this.day();
    return { ...day, blocks: day.blocks.map((b, i) => i === bi ? { ...b, ...patch } : b) };
  }
}
```

- [ ] **Step 2: Build to verify**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/ui/day-panel.ts
git commit -m "$(cat <<'EOF'
feat(routine-editor): kx-day-panel with CDK drop-list-group + clusters

Day header (overline + Syne H1 + stats + trash) + cdkDropListGroup
wrapping each block. Cluster blocks render with left border tint, type
pill, editable inter-round rest, "desagrupar" affordance, and letter
badges (A/B/C…) per exercise. Cross-cluster drags cleanup empties and
auto-demote 1-exercise clusters to Single. Group menu actions
(Superset/Triset/Circuit up/down + Ungroup) translate to block
mutations. Drop indicator is a 3px crimson line with glow shadow over
the CDK placeholder.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Implement `<kx-routine-sidebar>` (meta + draggable day list)

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/ui/routine-sidebar.ts`

Cribs from `design_handoff_kondix_v2/prototypes/trainer/days-sidebar.jsx`.

- [ ] **Step 1: Replace stub with full implementation**

```typescript
import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray,
} from '@angular/cdk/drag-drop';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  ChevronDown, ClipboardList, GripVertical, Plus, X,
} from 'lucide-angular';
import type { WizardRoutine } from './types';

const ICONS = { ChevronDown, ClipboardList, GripVertical, Plus, X };

const CATEGORIES = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Otro'];

const CATEGORY_COLORS: Record<string, string> = {
  Hipertrofia: '#E62639',
  Fuerza: '#F59E0B',
  Resistencia: '#22C55E',
  Funcional: '#60a5fa',
  Otro: '#71717A',
};

@Component({
  selector: 'kx-routine-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CdkDropList, CdkDrag, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(ICONS) }],
  template: `
    <aside class="w-full h-full bg-bg flex flex-col overflow-hidden md:w-[280px] md:border-r md:border-border">

      <!-- Meta header -->
      <div class="px-5 py-4 border-b border-border-light">
        <div class="text-overline text-primary mb-2 flex items-center gap-1">
          <lucide-angular name="clipboard-list" [size]="10"></lucide-angular>
          Rutina
        </div>
        <input type="text"
          [ngModel]="routine().name"
          (ngModelChange)="patchRoutine({ name: $event })"
          [disabled]="isLocked()"
          placeholder="Nombre de la rutina…"
          class="w-full font-display text-xl font-bold text-text bg-transparent focus:outline-none border-b border-transparent focus:border-primary leading-tight" />
        <textarea
          [ngModel]="routine().description"
          (ngModelChange)="patchRoutine({ description: $event })"
          [disabled]="isLocked()"
          placeholder="Añade una descripción…"
          rows="2"
          class="w-full mt-2 text-xs text-text-muted bg-transparent focus:outline-none resize-none"></textarea>

        <!-- Category picker -->
        <div class="mt-2.5 relative">
          <button type="button" (click)="toggleCatMenu()" [disabled]="isLocked()"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50"
                  [style.background]="catTint(routine().category)"
                  [style.borderColor]="catBorder(routine().category)"
                  [style.color]="catColor(routine().category)"
                  style="border: 1px solid">
            <span class="w-1.5 h-1.5 rounded-full" [style.background]="catColor(routine().category)"></span>
            {{ routine().category || 'Sin categoría' }}
            <lucide-angular name="chevron-down" [size]="10" class="opacity-70"></lucide-angular>
          </button>
          @if (catMenuOpen()) {
            <div class="fixed inset-0 z-40" (click)="catMenuOpen.set(false)"></div>
            <div class="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg p-1 min-w-[180px]">
              @for (c of categories; track c) {
                <button type="button" (click)="patchRoutine({ category: c }); catMenuOpen.set(false)"
                        class="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text hover:bg-card-hover rounded text-left">
                  <span class="w-2 h-2 rounded-full" [style.background]="catColor(c)"></span>
                  <span class="flex-1">{{ c }}</span>
                  @if (c === routine().category) {
                    <span class="text-primary">✓</span>
                  }
                </button>
              }
            </div>
          }
        </div>
      </div>

      <!-- Days list -->
      <div class="text-overline text-text-muted px-5 pt-3.5 pb-1.5">
        Días · {{ routine().days.length }}
      </div>
      <div cdkDropList (cdkDropListDropped)="onDrop($event)"
           class="flex-1 overflow-y-auto px-2.5 pb-4">
        @for (d of routine().days; track $index; let i = $index) {
          <div cdkDrag [cdkDragDisabled]="isLocked()"
               (click)="selectDay.emit(i)"
               class="flex items-center gap-2.5 px-3 py-2.5 my-0.5 rounded-lg cursor-pointer transition border"
               [class.bg-primary/10]="activeDayIndex() === i"
               [class.border-primary/35]="activeDayIndex() === i"
               [class.border-transparent]="activeDayIndex() !== i"
               [class.hover:bg-card]="activeDayIndex() !== i">
            <span class="font-mono text-[11px] font-bold min-w-[18px]"
                  [class.text-primary]="activeDayIndex() === i"
                  [class.text-text-muted]="activeDayIndex() !== i">{{ pad(i + 1) }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold truncate"
                   [class.text-text]="activeDayIndex() === i"
                   [class.text-text-secondary]="activeDayIndex() !== i">
                @if (d.name) { {{ d.name }} }
                @else { <span class="italic text-text-muted">Sin nombre</span> }
              </div>
              <div class="text-[11px] text-text-muted font-mono">{{ exCount(d) }} ejercicio{{ exCount(d) === 1 ? '' : 's' }}</div>
            </div>
            @if (routine().days.length > 1) {
              <button type="button" (click)="$event.stopPropagation(); removeDay.emit(i)"
                      [disabled]="isLocked()"
                      class="text-text-muted hover:text-danger text-xs p-1 disabled:opacity-50"
                      aria-label="Eliminar día">
                <lucide-angular name="x" [size]="12"></lucide-angular>
              </button>
            }
            <lucide-angular name="grip-vertical" [size]="12" class="text-text-muted opacity-50"></lucide-angular>
          </div>
        }
        <button type="button" (click)="addDay.emit()" [disabled]="isLocked()"
                class="w-full mt-2 px-3 py-2.5 bg-transparent border border-dashed border-border rounded-lg text-text-muted text-xs font-medium hover:border-primary hover:text-primary transition disabled:opacity-50 flex items-center justify-center gap-1.5">
          <lucide-angular name="plus" [size]="14"></lucide-angular>
          Añadir día
        </button>
      </div>
    </aside>
  `,
})
export class KxRoutineSidebar {
  routine = input.required<WizardRoutine>();
  activeDayIndex = input.required<number>();
  isLocked = input<boolean>(false);

  routineChange = output<WizardRoutine>();
  selectDay = output<number>();
  addDay = output<void>();
  removeDay = output<number>();
  reorderDays = output<{ from: number; to: number }>();

  categories = CATEGORIES;
  catMenuOpen = signal(false);

  toggleCatMenu() { if (!this.isLocked()) this.catMenuOpen.update(o => !o); }

  catColor(cat: string): string { return CATEGORY_COLORS[cat] ?? '#71717A'; }
  catTint(cat: string): string { return `color-mix(in oklch, ${this.catColor(cat)} 15%, transparent)`; }
  catBorder(cat: string): string { return `color-mix(in oklch, ${this.catColor(cat)} 35%, transparent)`; }

  pad(n: number): string { return n.toString().padStart(2, '0'); }
  exCount(day: { blocks: { exercises: unknown[] }[] }): number {
    return day.blocks.reduce((s, b) => s + b.exercises.length, 0);
  }

  patchRoutine(patch: Partial<WizardRoutine>) {
    this.routineChange.emit({ ...this.routine(), ...patch });
  }

  onDrop(event: CdkDragDrop<unknown>) {
    if (event.previousIndex === event.currentIndex) return;
    this.reorderDays.emit({ from: event.previousIndex, to: event.currentIndex });
  }
}
```

- [ ] **Step 2: Build to verify**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/ui/routine-sidebar.ts
git commit -m "$(cat <<'EOF'
feat(routine-editor): kx-routine-sidebar with draggable day list

Pill RUTINA + name input (Syne) + description + category pill (5
categories with color-coded dots and dropdown), section "Días · N",
CDK drag-drop reorderable day items showing mono index / name / count
/ grip / inline X to delete (when more than 1 day exists), and a
dashed "Añadir día" button at the bottom. Tags pass through the
routine model untouched (no UI surfaced per the design).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Implement `routine-editor.ts` smart shell

**Files:**
- Create: `kondix-web/src/app/features/trainer/routines/feature/routine-editor.ts`

Smart shell. Loads / saves the routine, owns the dirty signal, owns `mobileSidebarOpen`, wires children, applies the locked-routine guard.

- [ ] **Step 1: Create the file**

```typescript
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { ArrowLeft, Save, Menu, X } from 'lucide-angular';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/ui/toast';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxRoutineSidebar } from '../ui/routine-sidebar';
import { KxDayPanel } from '../ui/day-panel';
import { RoutineDetailDto, RoutineUsageDto } from '../../../../shared/models';
import type {
  WizardRoutine, WizardDay, WizardBlock, WizardExercise, WizardSet,
} from '../ui/types';

const ICONS = { ArrowLeft, Save, Menu, X };

const newSet = (): WizardSet => ({
  setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null,
});
const newExercise = (): WizardExercise => ({
  name: '', notes: '', tempo: '',
  catalogExerciseId: null, catalogImageUrl: null, catalogVideoUrl: null,
  sets: [newSet()],
});
const newBlock = (): WizardBlock => ({
  blockType: null, restSeconds: 90, exercises: [newExercise()],
});
const newDay = (): WizardDay => ({ name: '', blocks: [newBlock()] });
const newSuperset = (): WizardBlock => ({
  blockType: 'Superset', restSeconds: 60, exercises: [newExercise(), newExercise()],
});

@Component({
  selector: 'app-routine-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, KxSpinner, KxConfirmDialog, KxRoutineSidebar, KxDayPanel],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(ICONS) }],
  template: `
    @if (loading()) {
      <div class="min-h-screen flex items-center justify-center">
        <kx-spinner />
      </div>
    } @else {
      <div class="min-h-screen flex flex-col bg-bg">

        <!-- Top header -->
        <header class="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-bg-raised">
          <div class="flex items-center gap-3 min-w-0">
            <button type="button" (click)="cancel()"
                    class="text-text-muted hover:text-text flex items-center gap-1.5 text-sm transition">
              <lucide-angular name="arrow-left" [size]="14"></lucide-angular>
              <span class="hidden sm:inline">Volver a rutinas</span>
            </button>
            <span class="text-text-muted text-[10px] uppercase tracking-wider pl-3 border-l border-border hidden md:inline">
              Editando
            </span>
            @if (dirty()) {
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-warning/15 text-warning border border-warning/30">
                ● cambios sin guardar
              </span>
            }
          </div>
          <button type="button" (click)="save()"
                  [disabled]="!dirty() || saving() || isLocked()"
                  class="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition press disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
            <lucide-angular name="save" [size]="14"></lucide-angular>
            {{ saving() ? 'Guardando…' : 'Guardar' }}
          </button>
        </header>

        <!-- Locked banner -->
        @if (isLocked()) {
          <div class="bg-warning/10 border-b border-warning/30 px-4 py-2.5">
            <p class="text-warning text-sm font-semibold">Rutina con sesiones registradas</p>
            <p class="text-warning/70 text-xs mt-0.5">No se puede editar. Duplica la rutina desde la lista para crear una versión nueva.</p>
          </div>
        } @else if (usage()?.activeAssignmentCount; as ac) {
          <div class="bg-warning/10 border-b border-warning/30 px-4 py-2.5">
            <p class="text-warning/70 text-xs">{{ ac }} alumno(s) verán los cambios en su próxima sesión.</p>
          </div>
        }

        <!-- Main content: sidebar + day panel -->
        <div class="flex-1 flex relative overflow-hidden">

          <!-- Sidebar (desktop always visible; mobile = drawer) -->
          <div class="hidden md:block">
            <kx-routine-sidebar
              [routine]="routine()"
              [activeDayIndex]="activeDayIndex()"
              [isLocked]="isLocked()"
              (routineChange)="onRoutineChange($event)"
              (selectDay)="selectDay($event)"
              (addDay)="addDay()"
              (removeDay)="removeDay($event)"
              (reorderDays)="onReorderDays($event)"
            />
          </div>

          <!-- Mobile drawer overlay -->
          @if (mobileSidebarOpen()) {
            <div class="md:hidden fixed inset-0 bg-black/60 z-40 animate-fade-up"
                 (click)="mobileSidebarOpen.set(false)"></div>
            <div class="md:hidden fixed top-0 left-0 bottom-0 w-[280px] z-50 bg-bg border-r border-border animate-slide-in-left">
              <div class="absolute top-3 right-3 z-10">
                <button type="button" (click)="mobileSidebarOpen.set(false)"
                        class="text-text-muted hover:text-text p-1.5 rounded">
                  <lucide-angular name="x" [size]="16"></lucide-angular>
                </button>
              </div>
              <kx-routine-sidebar
                [routine]="routine()"
                [activeDayIndex]="activeDayIndex()"
                [isLocked]="isLocked()"
                (routineChange)="onRoutineChange($event)"
                (selectDay)="onMobileSelectDay($event)"
                (addDay)="addDay()"
                (removeDay)="removeDay($event)"
                (reorderDays)="onReorderDays($event)"
              />
            </div>
          }

          <!-- Day panel -->
          <main class="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
            <!-- Mobile-only: hamburger toggle -->
            <button type="button" (click)="mobileSidebarOpen.set(true)"
                    class="md:hidden flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4">
              <lucide-angular name="menu" [size]="14"></lucide-angular>
              Días
            </button>

            @if (activeDay(); as day) {
              <kx-day-panel
                [day]="day"
                [dayIndex]="activeDayIndex()"
                [isLocked]="isLocked()"
                (dayChange)="onDayChange($event)"
                (removeDay)="removeDay(activeDayIndex())"
                (addExercise)="addExerciseToActiveDay()"
                (addSuperset)="addSupersetToActiveDay()"
              />
            }
          </main>
        </div>
      </div>

      <!-- Discard confirmation -->
      <kx-confirm-dialog
        [open]="discardDialogOpen()"
        title="Descartar cambios sin guardar"
        message="Tenés cambios sin guardar. ¿Salir y descartarlos?"
        confirmLabel="Descartar"
        variant="danger"
        (confirmed)="confirmDiscard()"
        (cancelled)="discardDialogOpen.set(false)" />
    }
  `,
  styles: [`
    @keyframes slide-in-left {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    .animate-slide-in-left { animation: slide-in-left 0.18s ease-out; }
    @media (prefers-reduced-motion: reduce) {
      .animate-slide-in-left { animation: none; }
    }
  `],
})
export class RoutineEditor implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  routineId = '';

  loading = signal(true);
  saving = signal(false);
  dirty = signal(false);
  routine = signal<WizardRoutine>({ name: '', description: '', category: '', tags: [], days: [newDay()] });
  usage = signal<RoutineUsageDto | null>(null);
  activeDayIndex = signal(0);
  mobileSidebarOpen = signal(false);
  discardDialogOpen = signal(false);
  private pendingDiscardAction: (() => void) | null = null;

  isEdit = computed(() => !!this.routineId);
  isLocked = computed(() => this.usage()?.hasSessions ?? false);
  activeDay = computed<WizardDay | null>(() => {
    const d = this.routine().days;
    const idx = this.activeDayIndex();
    return idx >= 0 && idx < d.length ? d[idx] : null;
  });

  ngOnInit() {
    this.routineId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.routineId) {
      this.loadRoutine();
      this.loadUsage();
    } else {
      this.loading.set(false);
    }
  }

  // ── Children event handlers ──

  onRoutineChange(r: WizardRoutine) {
    this.routine.set(r);
    this.dirty.set(true);
  }

  onDayChange(d: WizardDay) {
    const idx = this.activeDayIndex();
    this.routine.update(r => ({ ...r, days: r.days.map((x, i) => i === idx ? d : x) }));
    this.dirty.set(true);
  }

  selectDay(idx: number) { this.activeDayIndex.set(idx); }

  onMobileSelectDay(idx: number) {
    this.activeDayIndex.set(idx);
    this.mobileSidebarOpen.set(false);
  }

  addDay() {
    this.routine.update(r => ({ ...r, days: [...r.days, newDay()] }));
    this.activeDayIndex.set(this.routine().days.length - 1);
    this.dirty.set(true);
  }

  removeDay(idx: number) {
    this.routine.update(r => ({ ...r, days: r.days.filter((_, i) => i !== idx) }));
    if (this.activeDayIndex() >= this.routine().days.length) {
      this.activeDayIndex.set(Math.max(0, this.routine().days.length - 1));
    }
    this.dirty.set(true);
  }

  onReorderDays(e: { from: number; to: number }) {
    this.routine.update(r => {
      const days = [...r.days];
      const [moved] = days.splice(e.from, 1);
      days.splice(e.to, 0, moved);
      return { ...r, days };
    });
    // Adjust activeDayIndex so the user's selection follows the move.
    const cur = this.activeDayIndex();
    if (cur === e.from) this.activeDayIndex.set(e.to);
    else if (cur > e.from && cur <= e.to) this.activeDayIndex.set(cur - 1);
    else if (cur < e.from && cur >= e.to) this.activeDayIndex.set(cur + 1);
    this.dirty.set(true);
  }

  addExerciseToActiveDay() {
    const idx = this.activeDayIndex();
    this.routine.update(r => ({
      ...r,
      days: r.days.map((d, i) => i === idx ? { ...d, blocks: [...d.blocks, newBlock()] } : d),
    }));
    this.dirty.set(true);
  }

  addSupersetToActiveDay() {
    const idx = this.activeDayIndex();
    this.routine.update(r => ({
      ...r,
      days: r.days.map((d, i) => i === idx ? { ...d, blocks: [...d.blocks, newSuperset()] } : d),
    }));
    this.dirty.set(true);
  }

  // ── Top-level actions ──

  cancel() {
    if (this.dirty()) {
      this.pendingDiscardAction = () => this.router.navigate(['/trainer/routines']);
      this.discardDialogOpen.set(true);
    } else {
      this.router.navigate(['/trainer/routines']);
    }
  }

  confirmDiscard() {
    this.discardDialogOpen.set(false);
    this.pendingDiscardAction?.();
    this.pendingDiscardAction = null;
  }

  save() {
    if (!this.routine().name.trim()) {
      this.toast.show('El nombre de la rutina es requerido', 'error');
      return;
    }
    if (this.isLocked()) return;
    this.saving.set(true);

    const r = this.routine();
    // Build the API payload — same shape as the wizard's save (routine-wizard.ts:1024-1049).
    const body = {
      name: r.name,
      description: r.description || null,
      tags: r.tags,
      category: r.category || null,
      days: r.days.map((d) => ({
        name: d.name,
        blocks: d.blocks.map((b) => ({
          blockType: b.blockType,
          restSeconds: b.restSeconds,
          exercises: b.exercises.map((e) => ({
            name: e.name,
            notes: e.notes || null,
            tempo: e.tempo || null,
            catalogExerciseId: e.catalogExerciseId,
            sets: e.sets.map((s) => ({
              setType: s.setType,
              targetReps: s.targetReps || null,
              targetWeight: s.targetWeight || null,
              targetRpe: s.targetRpe,
              restSeconds: s.restSeconds,
            })),
          })),
        })),
      })),
    };

    const req = this.isEdit()
      ? this.api.put<RoutineDetailDto>(`/routines/${this.routineId}`, body)
      : this.api.post<RoutineDetailDto>('/routines', body);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.toast.show(this.isEdit() ? 'Rutina actualizada' : 'Rutina creada');
        this.dirty.set(false);
        this.saving.set(false);
        if (!this.isEdit()) {
          // Switch URL to edit mode without re-fetching.
          this.routineId = saved.id;
          this.router.navigate(['/trainer/routines', saved.id, 'edit'], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.toast.show(err.error?.error ?? 'No pudimos guardar la rutina. Intentá de nuevo.', 'error');
        this.saving.set(false);
      },
    });
  }

  // ── Loaders ──

  private loadRoutine() {
    this.api.get<RoutineDetailDto>(`/routines/${this.routineId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.routine.set(this.toEditingModel(r));
          this.loading.set(false);
        },
        error: () => {
          this.toast.show('Error al cargar la rutina', 'error');
          this.router.navigate(['/trainer/routines']);
        },
      });
  }

  private loadUsage() {
    this.api.get<RoutineUsageDto>(`/routines/${this.routineId}/usage`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => this.usage.set(u),
      });
  }

  private toEditingModel(r: RoutineDetailDto): WizardRoutine {
    return {
      name: r.name,
      description: r.description ?? '',
      category: r.category ?? '',
      tags: r.tags ?? [],
      days: r.days.map((d) => ({
        name: d.name,
        blocks: d.blocks.map((b) => ({
          blockType: b.blockType,
          restSeconds: b.restSeconds,
          exercises: b.exercises.map((e) => ({
            name: e.name,
            notes: e.notes ?? '',
            tempo: e.tempo ?? '',
            catalogExerciseId: e.catalogExerciseId ?? null,
            catalogImageUrl: e.imageUrl ?? null,
            catalogVideoUrl: e.videoUrl ?? null,
            sets: e.sets.map((s) => ({
              setType: s.setType,
              targetReps: s.targetReps ?? '',
              targetWeight: s.targetWeight ?? '',
              targetRpe: s.targetRpe,
              restSeconds: s.restSeconds,
            })),
          })),
        })),
      })),
    };
  }
}
```

- [ ] **Step 2: Build to verify**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. The editor isn't yet wired to the router — that lands in Task 8.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/feature/routine-editor.ts
git commit -m "$(cat <<'EOF'
feat(routine-editor): RoutineEditor smart shell

Owns state (routine signal, dirty, usage, activeDayIndex,
mobileSidebarOpen, discardDialogOpen), loads via /routines/:id +
/routines/:id/usage, saves via POST/PUT /routines reusing the wizard's
exact body shape. Locked routine guard renders a read-only banner +
disables the Save button. Discard confirm-dialog fires on Volver-a-
rutinas when dirty. Mobile drawer overlays the sidebar with slide-in
animation that respects prefers-reduced-motion. Routes are not yet
wired — Task 8 swaps RoutineWizard → RoutineEditor in trainer.routes.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Update routes to point at the new editor

**Files:**
- Modify: `kondix-web/src/app/features/trainer/trainer.routes.ts:11,13`

- [ ] **Step 1: Edit the two route entries**

Change lines 11 and 13 from:
```typescript
{ path: 'routines/new', loadComponent: () => import('./routines/feature/routine-wizard').then(m => m.RoutineWizard) },
{ path: 'routines/:id/edit', loadComponent: () => import('./routines/feature/routine-wizard').then(m => m.RoutineWizard) },
```
to:
```typescript
{ path: 'routines/new', loadComponent: () => import('./routines/feature/routine-editor').then(m => m.RoutineEditor) },
{ path: 'routines/:id/edit', loadComponent: () => import('./routines/feature/routine-editor').then(m => m.RoutineEditor) },
```

- [ ] **Step 2: Build to verify**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. Note the `routines/feature/routine-editor` lazy chunk now appears in the bundle output. The `routine-wizard` chunk also still appears because it's still on disk — Task 9 deletes it.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/trainer.routes.ts
git commit -m "$(cat <<'EOF'
feat(routine-editor): wire trainer.routes to RoutineEditor

Both /trainer/routines/new and /trainer/routines/:id/edit now lazy-load
RoutineEditor instead of RoutineWizard. The wizard file remains on disk
for one more commit; Task 9 deletes it after we verify nothing else
imports it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Delete the wizard + clean up `<kx-wizard-stepper>`

**Files:**
- Delete: `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts`
- Delete: `kondix-web/src/app/shared/ui/wizard-stepper.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts` (remove `KxWizardStepper` re-export)

The wizard is the only consumer of `<kx-wizard-stepper>` (verified by grep earlier in the planning).

- [ ] **Step 1: Verify nothing else imports the wizard or stepper**

Run from repo root:
```bash
grep -rEl "RoutineWizard|KxWizardStepper|wizard-stepper" kondix-web/src/app | sort -u
```
Expected output (only these 3 paths — if anything else appears, STOP and re-check):
```
kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts
kondix-web/src/app/shared/ui/index.ts
kondix-web/src/app/shared/ui/wizard-stepper.ts
```

- [ ] **Step 2: Delete the wizard file**

```bash
git rm kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts
```

- [ ] **Step 3: Remove the `KxWizardStepper` re-export**

Open `kondix-web/src/app/shared/ui/index.ts` and remove the line that exports `wizard-stepper` (likely something like `export * from './wizard-stepper';` or `export { KxWizardStepper } from './wizard-stepper';`). The other re-exports stay untouched.

- [ ] **Step 4: Delete the stepper file**

```bash
git rm kondix-web/src/app/shared/ui/wizard-stepper.ts
```

- [ ] **Step 5: Build + Karma to verify no regressions**

Run:
```bash
cd kondix-web && npx ng build && npx ng test --watch=false --browsers=ChromeHeadless
```
Expected:
- Build: 0 errors. The lazy chunk for `routine-wizard` is gone; `routine-editor` chunk size logged.
- Karma: 17/17 PASS (10 prior + 7 from group-options spec).

- [ ] **Step 6: Commit**

```bash
git add kondix-web/src/app/shared/ui/index.ts
git commit -m "$(cat <<'EOF'
chore(routine-editor): delete the 4-step wizard + unused stepper

Removes routine-wizard.ts (1094 LOC) and shared/ui/wizard-stepper.ts.
Verified via grep that no other code imports either symbol — the only
remaining references after Task 8 were the wizard file itself, the
stepper file, and the index.ts re-export. RoutineEditor (Tasks 1-7) is
now the only routine-editing UI.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Manual smoke test + polish

This task has no code unless the smoke test surfaces issues. Run the spec §8 manual checklist before declaring done.

- [ ] **Step 1: Run the dev server**

Run:
```bash
cd kondix-web && npx ng serve --port 4200
```
Open `http://localhost:4200`. Log in as a trainer with `kondix:manage`.

- [ ] **Step 2: Smoke checklist (per spec §8)**

Walk through each item; if any fails, file a fix as a sub-step before commit:

- Create routine, add 3 days, drag-reorder, save, reload, days persisted in correct order.
- Add exercise via picker (catalog match), expand card, edit sets, save, verify catalog metadata round-trips (▶ icon present after reload).
- Add exercise via picker (create new), confirm `catalogExerciseId` is null on the saved record.
- Create a Superset via the menu with neighbor below; verify A/B labels render and rest-between-rounds is editable.
- Move an exercise from one cluster to another via drag; verify cluster auto-demotes to Single when only 1 exercise remains.
- Open a routine with `usage().hasSessions === true`; verify read-only banner + disabled controls + hidden Save button.
- On mobile (≤ 768 px viewport via DevTools), verify drawer toggles, day selection auto-closes drawer.
- Edit any field, click "Volver a rutinas" — confirm-dialog appears.

- [ ] **Step 3: Fix any issues surfaced (only if any)**

If smoke surfaced issues, fix them inline in this task. One commit per discrete fix:

```bash
git add <touched files>
git commit -m "fix(routine-editor): <specific issue>"
```

If nothing failed, skip step 3.

- [ ] **Step 4: Final build + final Karma**

```bash
cd kondix-web && npx ng build && npx ng test --watch=false --browsers=ChromeHeadless
```
Expected: 0 errors, 17/17 specs.

---

## Self-Review (the planner's checklist, applied)

**1. Spec coverage:** every spec section maps to a task.

| Spec section | Tasks |
|---|---|
| §3.1 Decomposition (smart + 4 presentational) | Tasks 1, 2, 4, 5, 6, 7 |
| §3.2 CDK D&D + handoff visual | Task 5 (drop indicator CSS), Task 6 (sidebar reorder) |
| §3.3 Inline autocomplete picker | Task 2 |
| §3.4 Group menu (bidirectional, contextual) | Task 3 (helper), Task 4 (menu render), Task 5 (mutation) |
| §3.5 Save explicit + dirty pill + discard dialog | Task 7 |
| §3.6 Mobile drawer ≤ 768 px | Task 7 |
| §3.7 Locked routine guard | Task 7 |
| §4 Data model unchanged | Implicit; Task 7's `toEditingModel` mirrors the wizard exactly |
| §5.1–5.5 Component contracts | Tasks 2, 4, 5, 6, 7 (each contract realized in its own task) |
| §6 Behavioral rules to preserve | Task 7 (full-replace save; locked guard; required name validation) |
| §7 Migration plan | Tasks 1, 8, 9 (scaffold → routes → delete) |
| §8 Tests | Task 3 (Karma spec for group-options); Task 10 (manual smoke) |

**2. Placeholder scan:** none of the steps say "TBD", "TODO", or "implement later". Every code step contains the actual code. Every command step shows the exact command and expected output.

**3. Type consistency:** `WizardRoutine`, `WizardDay`, `WizardBlock`, `WizardExercise`, `WizardSet`, `PickerSelection`, `GroupOption`, `GroupActionEvent`, `BlockType`, `SetType` are defined once in `types.ts` (Task 1) and consumed by every later task with identical signatures. Method names referenced across tasks (`computeGroupOptions`, `toEditingModel`, `onDrop`, `onGroupAction`, `addToCluster`, `ungroupBlock`, `ungroupExerciseFromCluster`) are defined in the task that introduces them and used unchanged in any later reference.

---

## Execution choice

Plan complete and saved to `docs/superpowers/plans/2026-04-27-routine-editor-redesign-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, two-stage review between tasks (spec compliance → code quality), fast iteration. Same pattern v2 Phases 1–6 used successfully.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

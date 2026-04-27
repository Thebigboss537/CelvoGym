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
  Number = Number;

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

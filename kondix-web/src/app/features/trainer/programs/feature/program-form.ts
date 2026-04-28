import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, ArrowLeft, Users, Check, Plus, Moon, X } from 'lucide-angular';

import { ProgramEditorStore } from '../data-access/program-editor.store';
import { ProgramMetaPanel } from '../ui/program-meta-panel';
import { ProgramWeekRow } from '../ui/program-week-row';
import { CellInspector } from '../ui/cell-inspector';
import { AssignRoutineModal } from '../ui/assign-routine-modal';
import { ProgramSlot } from '../../../../shared/models';

@Component({
  selector: 'kx-program-editor-page',
  standalone: true,
  imports: [
    CommonModule, LucideAngularModule,
    ProgramMetaPanel, ProgramWeekRow, CellInspector, AssignRoutineModal,
  ],
  providers: [
    ProgramEditorStore,
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ArrowLeft, Users, Check, Plus, Moon, X }) },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.loading() && !store.program()) {
      <div class="flex items-center justify-center h-full min-h-[60vh]">
        <p class="text-text-secondary text-sm">Cargando…</p>
      </div>
    } @else if (store.error() && !store.program()) {
      <div class="flex items-center justify-center h-full min-h-[60vh]">
        <p class="text-danger text-sm">{{ store.error() }}</p>
      </div>
    } @else if (store.program(); as p) {

      <!-- TOP BAR -->
      <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-light bg-bg">
        <!-- Left: back + title -->
        <div class="flex items-center gap-3 min-w-0">
          <button type="button"
                  class="px-3 py-1.5 text-text-secondary hover:text-text text-xs transition flex items-center gap-1.5"
                  (click)="back()">
            <lucide-icon name="arrow-left" [size]="14"></lucide-icon>
            Volver
          </button>
          <div class="hidden sm:flex flex-col min-w-0">
            <div class="text-overline text-text-muted">Editando</div>
            <div class="font-display font-bold text-base text-text truncate">{{ p.name }}</div>
          </div>
          @if (!p.isPublished) {
            <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider text-amber-400 border border-amber-400/40 bg-amber-400/10">
              BORRADOR
            </span>
          }
        </div>

        <!-- Right: actions -->
        <div class="flex items-center gap-2 shrink-0">
          @if (!p.isPublished) {
            <button type="button"
                    class="px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition press flex items-center gap-1.5"
                    (click)="publish()">
              <lucide-icon name="check" [size]="13"></lucide-icon>
              Publicar
            </button>
          }
          <button type="button"
                  class="px-3 py-1.5 bg-card hover:bg-card-hover border border-border text-text-secondary text-xs font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  [disabled]="!p.isPublished"
                  (click)="goAssign()">
            <lucide-icon name="users" [size]="13"></lucide-icon>
            Asignar
          </button>
        </div>
      </div>

      <!-- 3-COLUMN GRID -->
      <div class="k-prog-grid grid h-[calc(100vh-112px)] overflow-hidden"
           style="grid-template-columns: 320px 1fr 340px;">

        <!-- LEFT: meta panel -->
        <kx-program-meta-panel
          [program]="p"
          (patch)="onMetaPatch($event)"
          (modeChange)="onModeChange($event)"
          class="overflow-auto" />

        <!-- CENTER: calendar -->
        <main class="flex flex-col overflow-hidden border-x border-border-light">
          <!-- Center header -->
          <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-light shrink-0">
            <div>
              <div class="text-overline text-text-muted">Calendario</div>
              <h2 class="font-display font-bold text-base text-text">{{ p.weeks.length }} semana{{ p.weeks.length === 1 ? '' : 's' }}</h2>
            </div>
            <div class="flex items-center gap-1.5">
              <!-- Assign routine (opens modal picking week = first week) -->
              <button type="button"
                      class="px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition press flex items-center gap-1.5"
                      (click)="openAssignFor(0)">
                <lucide-icon name="plus" [size]="13"></lucide-icon>
                Asignar rutina
              </button>

              @if (showFillRest()) {
                <button type="button"
                        class="px-3 py-1.5 bg-card hover:bg-card-hover border border-border text-text-secondary text-xs font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        (click)="fillRest()">
                  <lucide-icon name="moon" [size]="13"></lucide-icon>
                  Rellenar descansos
                </button>
              }

              @if (p.mode === 'Fixed') {
                <button type="button"
                        class="px-3 py-1.5 bg-card hover:bg-card-hover border border-border text-text-secondary text-xs font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        (click)="addWeek()">
                  <lucide-icon name="plus" [size]="13"></lucide-icon>
                  Añadir semana
                </button>
              }
            </div>
          </div>

          <!-- Scrollable grid body -->
          <div class="flex-1 overflow-auto p-4">
            <div [style.min-width.px]="720">
              <!-- Day header row -->
              <div class="grid gap-1.5 mb-1.5" [style.grid-template-columns]="gridTemplate()">
                <div></div><!-- week label column placeholder -->
                @for (label of dayLabels(); track $index) {
                  <div class="text-overline text-text-muted text-center py-1">{{ label }}</div>
                }
                <div></div><!-- menu column placeholder -->
              </div>

              <!-- Week rows -->
              @for (week of p.weeks; track week.id) {
                <div class="mb-1.5">
                  <kx-program-week-row
                    [week]="week"
                    [selectedDayIndex]="store.selected()?.weekIndex === week.weekIndex ? (store.selected()?.dayIndex ?? null) : null"
                    [hideMenu]="p.mode === 'Loop'"
                    [canDelete]="p.weeks.length > 1"
                    [programObjective]="p.objective"
                    (selectCell)="selectCell(week.weekIndex, $event)"
                    (duplicate)="duplicateWeek(week.weekIndex)"
                    (delete)="deleteWeek(week.weekIndex)" />
                </div>
              }
            </div>
          </div>
        </main>

        <!-- RIGHT: cell inspector -->
        <aside class="k-prog-inspector flex flex-col border-l border-border-light bg-bg overflow-auto"
               [class.is-open]="store.selected() !== null">
          <!-- Close button — hidden on wide screens, shown on narrow via CSS -->
          <button type="button"
                  class="k-prog-inspector-close hidden items-center gap-1 text-text-muted hover:text-text text-xs transition px-3 py-2"
                  (click)="store.clearSelection()">
            <lucide-icon name="x" [size]="14"></lucide-icon>
            Cerrar
          </button>

          <kx-cell-inspector
            [slot]="activeSlot()"
            [weekIndex]="store.selected()?.weekIndex ?? null"
            [dayLabel]="activeDayLabel()"
            [canMarkRest]="p.scheduleType === 'Week'"
            (setKind)="onSetKind($event)"
            (assign)="openAssignFor(store.selected()?.weekIndex ?? 0)"
            (removeBlock)="removeBlock($event)" />
        </aside>
      </div>

      <!-- Backdrop overlay for narrow screens when inspector is open -->
      <div class="k-prog-inspector-backdrop hidden fixed inset-0 z-40 bg-black/50"
           [class.is-open]="store.selected() !== null"
           (click)="store.clearSelection()"></div>

      <!-- Assign routine modal -->
      @if (assignFor() !== null) {
        <kx-assign-routine-modal
          [program]="p"
          [initialWeek]="assignFor()!"
          (close)="assignFor.set(null)"
          (assigned)="onRoutineAssigned($event)" />
      }

    }
  `,
  styles: [`
    @media (max-width: 1180px) {
      :host ::ng-deep .k-prog-grid { grid-template-columns: 240px 1fr !important; }
      :host ::ng-deep .k-prog-inspector {
        position: fixed !important;
        top: 0; right: 0; bottom: 0;
        width: min(380px, 92vw);
        z-index: 50;
        box-shadow: -12px 0 32px rgba(0,0,0,0.5);
        transform: translateX(100%);
        transition: transform .2s ease;
        display: flex !important;
        flex-direction: column;
      }
      :host ::ng-deep .k-prog-inspector.is-open { transform: translateX(0); }
      :host ::ng-deep .k-prog-inspector-close { display: flex !important; margin: 10px 10px 0 auto !important; }
      :host ::ng-deep .k-prog-inspector-backdrop { display: block !important; }
    }
    @media (max-width: 820px) {
      :host ::ng-deep .k-prog-grid { grid-template-columns: 1fr !important; }
    }
  `],
})
export class ProgramEditorPage implements OnInit {
  protected readonly store = inject(ProgramEditorStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly assignFor = signal<number | null>(null);

  protected readonly dayLabels = computed(() => {
    const p = this.store.program();
    if (!p) return [];
    if (p.scheduleType === 'Numbered') {
      return Array.from({ length: p.daysPerWeek ?? 0 }, (_, i) => `D${i + 1}`);
    }
    return ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  });

  protected readonly gridTemplate = computed(() => {
    const cells = this.dayLabels().length;
    return `90px repeat(${cells}, minmax(82px, 1fr)) 40px`;
  });

  protected readonly activeSlot = computed<ProgramSlot | null>(() => {
    const p = this.store.program();
    const sel = this.store.selected();
    if (!p || !sel) return null;
    const week = p.weeks.find(w => w.weekIndex === sel.weekIndex);
    return week?.slots.find(s => s.dayIndex === sel.dayIndex) ?? null;
  });

  protected readonly activeDayLabel = computed(() => {
    const sel = this.store.selected();
    if (sel == null) return null;
    return this.dayLabels()[sel.dayIndex] ?? null;
  });

  protected readonly showFillRest = computed(() => {
    const p = this.store.program();
    if (!p || p.scheduleType === 'Numbered') return false;
    const empty = p.weeks.flatMap(w => w.slots).filter(s => s.kind === 'Empty').length;
    const hasRoutine = p.weeks.some(w => w.slots.some(s => s.kind === 'RoutineDay'));
    return empty > 0 && hasRoutine;
  });

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id') ?? '';
      if (id) this.store.reload(id);
    });
  }

  back() { this.router.navigate(['/trainer/programs']); }
  selectCell(weekIndex: number, dayIndex: number) { this.store.selectCell(weekIndex, dayIndex); }
  openAssignFor(weekIndex: number) { this.assignFor.set(weekIndex); }

  onMetaPatch(patch: any) {
    const p = this.store.program();
    if (!p) return;
    this.store.updateMeta(p.id, {
      name: patch.name ?? p.name,
      description: patch.description !== undefined ? patch.description : p.description,
      notes: patch.notes !== undefined ? patch.notes : p.notes,
      objective: patch.objective ?? p.objective,
      level: patch.level ?? p.level,
      mode: patch.mode ?? p.mode,
    });
  }

  async onModeChange(newMode: 'Fixed' | 'Loop') {
    const p = this.store.program();
    if (!p) return;
    if (newMode === 'Loop' && p.weeks.length > 1) {
      const ok = window.confirm('El programa en bucle es de una sola semana. Se mantendrá solo la primera semana y se descartarán las demás. ¿Continuar?');
      if (!ok) return;
      for (let i = p.weeks.length - 1; i >= 1; i--) {
        await this.store.deleteWeek(p.id, i);
      }
    }
    this.onMetaPatch({ mode: newMode });
  }

  async addWeek() {
    const p = this.store.program(); if (!p) return;
    await this.store.addWeek(p.id);
  }

  async duplicateWeek(weekIndex: number) {
    const p = this.store.program(); if (!p) return;
    await this.store.duplicateWeek(p.id, weekIndex);
  }

  async deleteWeek(weekIndex: number) {
    const p = this.store.program(); if (!p) return;
    if (!window.confirm(`¿Eliminar Semana ${weekIndex + 1}? Las rutinas de esta semana se perderán.`)) return;
    await this.store.deleteWeek(p.id, weekIndex);
  }

  async fillRest() {
    const p = this.store.program(); if (!p) return;
    await this.store.fillRest(p.id);
  }

  async onSetKind(kind: 'Empty' | 'Rest') {
    const p = this.store.program(); const sel = this.store.selected();
    if (!p || !sel) return;
    await this.store.setSlot(p.id, sel.weekIndex, sel.dayIndex, kind);
  }

  async removeBlock(blockId: string) {
    const p = this.store.program(); if (!p) return;
    await this.store.removeBlock(p.id, blockId);
  }

  async onRoutineAssigned(payload: { routineId: string; weeks: number[]; mapping?: Record<string, number>; dayIds?: string[]; }) {
    const p = this.store.program(); if (!p) return;
    await this.store.assignRoutine(p.id, payload);
  }

  async publish() {
    const p = this.store.program(); if (!p) return;
    if (!window.confirm('¿Publicar este programa? Después podrás asignarlo a estudiantes. Esta acción no se puede deshacer.')) return;
    await this.store.publish(p.id);
  }

  goAssign() {
    const p = this.store.program(); if (!p) return;
    // Phase 6 will wire this. For now, navigate to the assign sub-route placeholder.
    this.router.navigate(['/trainer/programs', p.id, 'assign']);
  }
}

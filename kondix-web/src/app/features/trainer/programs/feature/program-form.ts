import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CdkDragDrop,
  DragDropModule,
  copyArrayItem,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ApiService } from '../../../../core/services/api.service';
import {
  ProgramAssignmentDto,
  ProgramDetailDto,
  ProgramWeekOverrideDto,
  RoutineListDto,
} from '../../../../shared/models';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';

interface RoutineSlot {
  routineId: string;
  label: string;
}

interface WeekRow {
  weekIndex: number; // 1-based week number
  days: (RoutineListDto | null)[]; // length = 7 (L..D)
}

@Component({
  selector: 'app-program-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, DragDropModule, KxSpinner, KxConfirmDialog],
  template: `
    <div class="animate-fade-up px-4 sm:px-6 md:px-8 pt-6 pb-nav-safe md:pb-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-1.5 text-sm text-text-secondary mb-4">
        <a routerLink="/trainer/programs" class="hover:text-text transition">Programas</a>
        <span class="text-text-muted">/</span>
        <span class="text-text">{{ isEdit() ? 'Editar programa' : 'Nuevo programa' }}</span>
      </nav>

      <h1 class="font-display text-2xl font-extrabold mb-6">
        {{ isEdit() ? 'Editar programa' : 'Nuevo programa' }}
      </h1>

      @if (activeAssignmentCount() > 0) {
        <div class="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4">
          <p class="text-warning text-sm font-semibold">Programa con alumnos asignados</p>
          <p class="text-warning/70 text-xs mt-1">
            {{ activeAssignmentCount() }} alumno(s) tienen este programa activo.
            Puedes cambiar nombre y duración, pero para modificar las rutinas
            debes cancelar las asignaciones primero.
          </p>
        </div>
      }

      @if (loadingData()) {
        <kx-spinner />
      } @else {
        <form (ngSubmit)="save()" class="space-y-5 max-w-xl">

          <!-- Name -->
          <div>
            <label class="block text-xs text-text-secondary mb-1">Nombre</label>
            <input type="text" [(ngModel)]="name" name="name" required maxlength="200"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition"
              placeholder="Ej: Torso-Pierna 12 semanas" />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs text-text-secondary mb-1">Descripción <span class="text-text-muted">(opcional)</span></label>
            <textarea [(ngModel)]="description" name="description" maxlength="2000" rows="2"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition resize-none"
              placeholder="Describe el objetivo o estructura del programa..."></textarea>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-xs text-text-secondary mb-1">Duración</label>
            <div class="flex items-center gap-2">
              <input type="number" [(ngModel)]="durationWeeks" (ngModelChange)="onDurationChange($event)"
                name="durationWeeks" required min="1" max="52"
                class="w-24 bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition text-center" />
              <span class="text-sm text-text-secondary">semanas</span>
            </div>
          </div>

          <!-- Routine slots (source of truth for ProgramRoutine[] persistence) -->
          <div>
            <label class="block text-xs text-text-secondary mb-2">Rutinas en rotación</label>
            <div class="space-y-2">
              @for (slot of slots(); track $index; let i = $index) {
                <div class="flex items-center gap-2 bg-bg-raised border border-border rounded-xl px-3 py-2">
                  <!-- Label letter (A, B, C…) -->
                  <span class="text-xs font-bold text-text-muted w-5 shrink-0">{{ slotLetter(i) }}</span>

                  <!-- Routine selector -->
                  <select [(ngModel)]="slot.routineId" [name]="'routine-' + i"
                    class="select-styled flex-1 bg-bg-raised text-sm text-text border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary transition cursor-pointer">
                    <option value="" disabled>Seleccionar rutina</option>
                    @for (r of routines(); track r.id) {
                      <option [value]="r.id">{{ r.name }}</option>
                    }
                  </select>

                  <!-- Custom label -->
                  <input type="text" [(ngModel)]="slot.label" [name]="'label-' + i" maxlength="100"
                    class="w-28 bg-card border border-border-light rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary transition"
                    placeholder="Etiqueta" />

                  <!-- Reorder buttons -->
                  <div class="flex flex-col gap-0.5 shrink-0">
                    <button type="button" (click)="moveUp(i)"
                      [disabled]="i === 0"
                      class="text-text-muted hover:text-text disabled:opacity-30 text-xs leading-none px-1"
                      aria-label="Subir">▲</button>
                    <button type="button" (click)="moveDown(i)"
                      [disabled]="i === slots().length - 1"
                      class="text-text-muted hover:text-text disabled:opacity-30 text-xs leading-none px-1"
                      aria-label="Bajar">▼</button>
                  </div>

                  <!-- Remove -->
                  @if (slots().length > 1) {
                    <button type="button" (click)="removeSlot(i)"
                      class="text-danger hover:text-danger/70 text-sm shrink-0 transition"
                      aria-label="Eliminar rutina">✕</button>
                  }
                </div>
              }
            </div>

            @if (routines().length > 0) {
              <button type="button" (click)="addSlot()"
                class="text-primary text-xs hover:underline mt-2 transition">
                + Agregar rutina
              </button>
            } @else {
              <p class="text-text-muted text-xs mt-2">No tenés rutinas creadas. <a routerLink="/trainer/routines/new" class="text-primary hover:underline">Crear una</a>.</p>
            }
          </div>

          @if (error()) {
            <p class="text-danger text-xs">{{ error() }}</p>
          }

          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button type="submit" [disabled]="saving()"
              class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition press disabled:opacity-60">
              {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Crear programa') }}
            </button>
            <a routerLink="/trainer/programs"
              class="bg-card hover:bg-card-hover border border-border text-text-secondary text-sm px-4 py-2.5 rounded-lg transition">
              Cancelar
            </a>
            @if (isEdit()) {
              <button type="button" (click)="showDeleteDialog.set(true)"
                class="ml-auto bg-danger/10 text-danger border border-danger/20 text-sm px-4 py-2.5 rounded-lg transition hover:bg-danger/20">
                Eliminar
              </button>
            }
          </div>
        </form>

        <!-- Weekly D&D grid + per-week notes (UI projection — not persisted as cells).
             Notes ARE persisted via PUT /programs/{id}/week-overrides on blur. -->
        @if (routines().length > 0) {
          <section class="mt-10 max-w-5xl">
            <header class="mb-3">
              <h2 class="font-display text-lg font-bold text-text">Planificación semanal</h2>
              <p class="text-text-muted text-xs mt-1">
                Arrastrá rutinas desde el panel para organizar mentalmente las semanas.
                {{ isEdit()
                  ? 'Las notas se guardan automáticamente al salir del campo.'
                  : 'Guardá el programa primero para registrar notas por semana.' }}
              </p>
            </header>

            <div class="flex gap-4">
              <!-- Sidebar of available routines -->
              <aside class="w-56 shrink-0"
                cdkDropList
                #sidebar="cdkDropList"
                [cdkDropListData]="sidebarRoutines()"
                [cdkDropListConnectedTo]="cellLists()"
                [cdkDropListSortingDisabled]="true">
                <p class="text-overline text-text-muted mb-2">Rutinas</p>
                @for (r of sidebarRoutines(); track r.id) {
                  <div cdkDrag [cdkDragData]="r"
                    class="px-3 py-2 mb-2 rounded-lg bg-card border border-border cursor-grab text-sm text-text">
                    {{ r.name }}
                  </div>
                } @empty {
                  <p class="text-text-muted text-xs">Sin rutinas.</p>
                }
              </aside>

              <!-- Weekly grid -->
              <div class="flex-1 overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr>
                      <th class="w-12 text-left text-overline text-text-muted pb-2">Sem</th>
                      @for (d of weekdays; track d) {
                        <th class="text-overline text-text-muted pb-2 px-1">{{ d }}</th>
                      }
                      <th class="text-overline text-text-muted pb-2 pl-2 text-left w-56">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (week of weeklyGrid(); track week.weekIndex) {
                      <tr>
                        <td class="text-text font-bold align-top pt-2">{{ week.weekIndex }}</td>
                        @for (cell of week.days; track $index) {
                          <td class="align-top px-1 py-1">
                            <div cdkDropList
                              [id]="cellId(week.weekIndex, $index)"
                              [cdkDropListData]="week.days"
                              [cdkDropListConnectedTo]="allListsExcept(week.weekIndex, $index)"
                              (cdkDropListDropped)="onDrop(week.weekIndex, $index, $event)"
                              class="min-h-12 p-1 border border-dashed border-border rounded-md bg-bg-raised/40">
                              @if (cell) {
                                <div cdkDrag [cdkDragData]="cell"
                                  class="px-2 py-1 rounded bg-primary/15 text-primary text-xs font-semibold cursor-grab flex items-center justify-between gap-1">
                                  <span class="truncate">{{ cell.name }}</span>
                                  <button type="button" (click)="clearCell(week.weekIndex, $index)"
                                    class="text-primary/70 hover:text-primary leading-none shrink-0"
                                    aria-label="Quitar rutina">✕</button>
                                </div>
                              }
                            </div>
                          </td>
                        }
                        <td class="pl-2 align-top py-1">
                          <input type="text" maxlength="2000"
                            class="w-full bg-bg-raised border border-border rounded-md px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary transition disabled:opacity-50"
                            placeholder="+5kg en compuestos"
                            [disabled]="!isEdit() || savingNotes().has(week.weekIndex)"
                            [value]="overrides().get(week.weekIndex) ?? ''"
                            (blur)="onOverrideBlur(week.weekIndex, $event)" />
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        }
      }
    </div>

    <kx-confirm-dialog
      [open]="showDeleteDialog()"
      title="Eliminar programa"
      message="Esta acción no se puede deshacer. ¿Estás seguro?"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="confirmDelete()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class ProgramForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  isEdit = signal(false);
  loadingData = signal(true);
  saving = signal(false);
  error = signal('');
  showDeleteDialog = signal(false);
  activeAssignmentCount = signal(0);

  routines = signal<RoutineListDto[]>([]);
  slots = signal<RoutineSlot[]>([{ routineId: '', label: '' }]);

  // Weekly grid state (Phase 5 — UI projection, NOT persisted as cells).
  // The trainer drags routines into day cells purely as a planning aid.
  // The list of routines on the right (sidebar) mirrors `routines` directly.
  sidebarRoutines = computed<RoutineListDto[]>(() => this.routines());
  weeklyGrid = signal<WeekRow[]>([]);
  overrides = signal<Map<number, string>>(new Map());
  savingNotes = signal<Set<number>>(new Set());

  // Connected drop-list IDs. Recomputed from `weeklyGrid()` so the CDK
  // wiring updates whenever the duration changes.
  cellLists = computed<string[]>(() =>
    this.weeklyGrid().flatMap((w) => w.days.map((_, i) => this.cellId(w.weekIndex, i))),
  );

  name = '';
  description = '';
  durationWeeks = 8;

  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  private programId = '';

  // Keep the grid sized to durationWeeks (preserve any cells still in range,
  // grow with empty rows, shrink by trimming overflow). Called explicitly from
  // ngOnInit, onDurationChange, and loadProgram — `durationWeeks` is a plain
  // field bound via [(ngModel)], so we can't react to it with effect().
  private resizeGrid() {
    const weeks = Math.max(1, Math.min(52, this.durationWeeks || 1));
    const current = this.weeklyGrid();
    if (current.length === weeks) return;
    const next: WeekRow[] = [];
    for (let i = 1; i <= weeks; i++) {
      const existing = current.find((w) => w.weekIndex === i);
      next.push(existing ?? { weekIndex: i, days: this.emptyDays() });
    }
    this.weeklyGrid.set(next);
  }

  slotLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  cellId(week: number, day: number): string {
    return `cell-${week}-${day}`;
  }

  // Each cell's connected-to list excludes itself + the sidebar (sidebar drops
  // *into* cells, not the reverse — sidebar is a one-way source).
  allListsExcept(week: number, day: number): string[] {
    const self = this.cellId(week, day);
    return this.cellLists().filter((id) => id !== self);
  }

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit.set(!!this.programId);
    this.resizeGrid(); // initial 8-week grid for create flow

    this.api
      .get<RoutineListDto[]>('/routines')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.routines.set(data);
          if (this.isEdit()) {
            this.loadProgram();
            this.loadOverrides();
            this.api
              .get<ProgramAssignmentDto[]>('/program-assignments?activeOnly=true')
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (assignments) => {
                  const count = assignments.filter((a) => a.programId === this.programId).length;
                  this.activeAssignmentCount.set(count);
                },
              });
          } else {
            this.loadingData.set(false);
          }
        },
        error: () => this.loadingData.set(false),
      });
  }

  addSlot() {
    this.slots.update((s) => [...s, { routineId: '', label: '' }]);
  }

  removeSlot(index: number) {
    this.slots.update((s) => s.filter((_, i) => i !== index));
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.slots.update((s) => {
      const arr = [...s];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }

  moveDown(index: number) {
    if (index === this.slots().length - 1) return;
    this.slots.update((s) => {
      const arr = [...s];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  onDurationChange(value: number) {
    this.durationWeeks = value;
    this.resizeGrid();
  }

  onDrop(weekIndex: number, dayIndex: number, event: CdkDragDrop<(RoutineListDto | null)[]>) {
    const targetWeek = this.weeklyGrid().find((w) => w.weekIndex === weekIndex);
    if (!targetWeek) return;

    const fromContainer = event.previousContainer;
    const toContainer = event.container;

    // Drop from sidebar → COPY routine into the cell (don't mutate sidebar).
    if (fromContainer.id !== toContainer.id && fromContainer.data === this.sidebarRoutines()) {
      const routine = event.item.data as RoutineListDto;
      this.weeklyGrid.update((grid) =>
        grid.map((w) =>
          w.weekIndex === weekIndex
            ? { ...w, days: w.days.map((c, i) => (i === dayIndex ? routine : c)) }
            : w,
        ),
      );
      return;
    }

    // Cell → cell move/swap. CDK passes us the *target* cell's days array via
    // cdkDropListData — but for cell-to-cell we want explicit slot replacement
    // rather than splice/insert (each cell holds at most one routine).
    if (fromContainer.id !== toContainer.id) {
      const dragged = event.item.data as RoutineListDto;
      // Parse week/day from the source container id ("cell-<week>-<day>")
      const m = /^cell-(\d+)-(\d+)$/.exec(fromContainer.id);
      if (!m) return;
      const srcWeek = Number(m[1]);
      const srcDay = Number(m[2]);
      const targetCell = targetWeek.days[dayIndex];

      this.weeklyGrid.update((grid) =>
        grid.map((w) => {
          if (w.weekIndex === srcWeek) {
            return {
              ...w,
              days: w.days.map((c, i) => (i === srcDay ? targetCell : c)),
            };
          }
          if (w.weekIndex === weekIndex) {
            return {
              ...w,
              days: w.days.map((c, i) => (i === dayIndex ? dragged : c)),
            };
          }
          return w;
        }),
      );
      return;
    }

    // Same container drop — single-cell, nothing to reorder. Suppress the
    // unused-import lint by referencing the helpers (tree-shaken otherwise).
    void moveItemInArray;
    void transferArrayItem;
    void copyArrayItem;
  }

  clearCell(weekIndex: number, dayIndex: number) {
    this.weeklyGrid.update((grid) =>
      grid.map((w) =>
        w.weekIndex === weekIndex
          ? { ...w, days: w.days.map((c, i) => (i === dayIndex ? null : c)) }
          : w,
      ),
    );
  }

  onOverrideBlur(weekIndex: number, event: Event) {
    if (!this.programId) return;
    const value = (event.target as HTMLInputElement).value;
    const previous = this.overrides().get(weekIndex) ?? '';
    if (value === previous) return; // nothing changed

    const trimmed = value.trim();
    this.savingNotes.update((s) => new Set(s).add(weekIndex));

    this.api
      .put(`/programs/${this.programId}/week-overrides/${weekIndex}`, { notes: trimmed })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.overrides.update((m) => {
            const map = new Map(m);
            if (trimmed) map.set(weekIndex, trimmed);
            else map.delete(weekIndex);
            return map;
          });
          this.savingNotes.update((s) => {
            const next = new Set(s);
            next.delete(weekIndex);
            return next;
          });
        },
        error: (err) => {
          this.savingNotes.update((s) => {
            const next = new Set(s);
            next.delete(weekIndex);
            return next;
          });
          this.toast.show(err.error?.error ?? 'No se pudo guardar la nota', 'error');
        },
      });
  }

  save() {
    const validSlots = this.slots().filter((s) => s.routineId);
    if (!this.name.trim()) {
      this.error.set('El nombre es requerido');
      return;
    }
    if (validSlots.length === 0) {
      this.error.set('Agregá al menos una rutina al programa');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const body = {
      name: this.name.trim(),
      description: this.description.trim() || null,
      durationWeeks: this.durationWeeks,
      routines: validSlots.map((s, i) => ({
        routineId: s.routineId,
        sortOrder: i,
        label: s.label.trim() || null,
      })),
    };

    const req = this.isEdit()
      ? this.api.put<ProgramDetailDto>(`/programs/${this.programId}`, body)
      : this.api.post<ProgramDetailDto>('/programs', body);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.show(this.isEdit() ? 'Programa actualizado' : 'Programa creado');
        this.router.navigate(['/trainer/programs']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al guardar');
        this.saving.set(false);
      },
    });
  }

  confirmDelete() {
    this.showDeleteDialog.set(false);
    this.api
      .delete(`/programs/${this.programId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('Programa eliminado');
          this.router.navigate(['/trainer/programs']);
        },
        error: (err) => this.toast.show(err.error?.error || 'No pudimos eliminar el programa', 'error'),
      });
  }

  private loadProgram() {
    this.api
      .get<ProgramDetailDto>(`/programs/${this.programId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.name = data.name;
          this.description = data.description ?? '';
          this.durationWeeks = data.durationWeeks;
          this.resizeGrid();
          const sorted = [...data.routines].sort((a, b) => a.sortOrder - b.sortOrder);
          this.slots.set(
            sorted.map((r) => ({
              routineId: r.routineId,
              label: r.label ?? '',
            })),
          );
          this.loadingData.set(false);
        },
        error: () => this.loadingData.set(false),
      });
  }

  private loadOverrides() {
    this.api
      .get<ProgramWeekOverrideDto[]>(`/programs/${this.programId}/week-overrides`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          const map = new Map<number, string>();
          for (const o of list) map.set(o.weekIndex, o.notes);
          this.overrides.set(map);
        },
      });
  }

  private emptyDays(): (RoutineListDto | null)[] {
    return [null, null, null, null, null, null, null];
  }
}

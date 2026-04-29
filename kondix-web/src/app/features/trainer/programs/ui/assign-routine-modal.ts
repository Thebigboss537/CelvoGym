import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, X, Search, ArrowLeft, Check, Plus } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProgramDetail } from '../../../../shared/models';
import { suggestWeekdayMapping } from '../utils/weekday-mapping';
import { environment } from '../../../../../environments/environment';

interface RoutineListItem { id: string; name: string; category?: string | null; dayCount: number; }
interface RoutineDetail { id: string; name: string; days: { id: string; name: string; }[]; }

@Component({
  selector: 'kx-assign-routine-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ X, Search, ArrowLeft, Check, Plus }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-[200] bg-black/70" (click)="close.emit()"></div>

    <!-- Modal -->
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201]
                w-[min(780px,calc(100vw-32px))] max-h-[calc(100vh-40px)]
                bg-bg border border-border rounded-2xl shadow-lg flex flex-col">

      @if (step() === 1) {
        <!-- STEP 1 HEADER -->
        <header class="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <div>
            <div class="text-overline text-text-muted">Paso 1 de 2 · Rutina</div>
            <h2 class="font-display text-xl font-bold tracking-tight">Selecciona una rutina</h2>
          </div>
          <button type="button" (click)="close.emit()" class="p-2 hover:bg-card-hover rounded-md transition">
            <lucide-icon name="x" [size]="16"></lucide-icon>
          </button>
        </header>

        <!-- SEARCH -->
        <div class="px-6 py-3 border-b border-border-light flex gap-2 items-center">
          <lucide-icon name="search" [size]="14" class="text-text-muted shrink-0"></lucide-icon>
          <input
            class="flex-1 px-3 py-2 bg-bg-raised border border-border rounded-md text-sm text-text outline-none focus:border-primary"
            [ngModel]="query()" (ngModelChange)="query.set($event)"
            placeholder="Buscar rutina…" />
        </div>

        <!-- LIST -->
        <div class="flex-1 overflow-auto p-3 min-h-[200px]">
          @if (loadingLib()) {
            <div class="p-10 text-center text-sm text-text-muted">Cargando rutinas…</div>
          } @else if (filtered().length === 0) {
            <div class="p-10 text-center text-sm text-text-muted">No se encontraron rutinas.</div>
          } @else {
            <div class="flex flex-col gap-1.5">
              @for (r of filtered(); track r.id) {
                <button type="button"
                        class="flex gap-3 items-center p-3 rounded-md border border-border-light bg-card hover:border-primary hover:bg-card-hover text-left transition"
                        [disabled]="loadingDetailFor() !== null"
                        (click)="pick(r)">
                  <div class="w-1 h-8 bg-primary rounded-sm shrink-0"></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-text truncate">{{ r.name }}</div>
                    <div class="text-[10px] text-text-muted font-mono mt-0.5">
                      {{ r.dayCount }} días{{ r.category ? ' · ' + r.category : '' }}
                    </div>
                  </div>
                  @if (loadingDetailFor() === r.id) {
                    <span class="text-[10px] text-text-muted font-mono">Cargando…</span>
                  } @else {
                    <lucide-icon name="plus" [size]="14" class="text-text-muted shrink-0"></lucide-icon>
                  }
                </button>
              }
            </div>
          }
        </div>

        <!-- FOOTER -->
        <footer class="px-6 py-3 border-t border-border-light flex justify-end">
          <button type="button"
                  class="px-4 py-2 text-sm text-text-secondary hover:text-text transition"
                  (click)="close.emit()">
            Cancelar
          </button>
        </footer>

      } @else {
        <!-- STEP 2 HEADER -->
        <header class="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <div class="text-overline text-text-muted">Paso 2 de 2 · Mapeo</div>
            <h2 class="font-display text-xl font-bold tracking-tight truncate">{{ routine()?.name }}</h2>
          </div>
          <button type="button" (click)="close.emit()" class="p-2 hover:bg-card-hover rounded-md transition ml-4 shrink-0">
            <lucide-icon name="x" [size]="16"></lucide-icon>
          </button>
        </header>

        <div class="flex-1 overflow-auto p-6">
          <!-- SCOPE -->
          <div class="text-overline text-text-muted mb-2">En qué semanas</div>
          <div class="flex gap-2 mb-3 flex-wrap">
            <button type="button"
                    class="px-3 py-1.5 text-sm rounded-md border transition font-mono"
                    [class.bg-primary-light]="scope() === 'all'"
                    [class.border-primary]="scope() === 'all'"
                    [class.text-primary]="scope() === 'all'"
                    [class.border-border]="scope() !== 'all'"
                    [class.text-text-secondary]="scope() !== 'all'"
                    [class.hover:bg-card-hover]="scope() !== 'all'"
                    (click)="scope.set('all')">
              Todas
            </button>
            <button type="button"
                    class="px-3 py-1.5 text-sm rounded-md border transition font-mono"
                    [class.bg-primary-light]="scope() === 'range'"
                    [class.border-primary]="scope() === 'range'"
                    [class.text-primary]="scope() === 'range'"
                    [class.border-border]="scope() !== 'range'"
                    [class.text-text-secondary]="scope() !== 'range'"
                    [class.hover:bg-card-hover]="scope() !== 'range'"
                    (click)="scope.set('range')">
              Un rango
            </button>
            <button type="button"
                    class="px-3 py-1.5 text-sm rounded-md border transition font-mono"
                    [class.bg-primary-light]="scope() === 'one'"
                    [class.border-primary]="scope() === 'one'"
                    [class.text-primary]="scope() === 'one'"
                    [class.border-border]="scope() !== 'one'"
                    [class.text-text-secondary]="scope() !== 'one'"
                    [class.hover:bg-card-hover]="scope() !== 'one'"
                    (click)="scope.set('one')">
              Una sola
            </button>
          </div>

          @if (scope() === 'range') {
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs text-text-muted">Semana</span>
              <input type="number" [min]="1" [max]="totalWeeks()"
                     class="w-16 px-2 py-1.5 bg-bg-raised border border-border rounded-md text-center text-sm font-mono text-text outline-none focus:border-primary"
                     [ngModel]="rangeStart()" (ngModelChange)="rangeStart.set(+$event)" />
              <span class="text-xs text-text-muted">a</span>
              <input type="number" [min]="1" [max]="totalWeeks()"
                     class="w-16 px-2 py-1.5 bg-bg-raised border border-border rounded-md text-center text-sm font-mono text-text outline-none focus:border-primary"
                     [ngModel]="rangeEnd()" (ngModelChange)="rangeEnd.set(+$event)" />
              <span class="text-xs text-text-muted">de {{ totalWeeks() }}</span>
            </div>
          }

          @if (scope() === 'one') {
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs text-text-muted">Semana</span>
              <input type="number" [min]="1" [max]="totalWeeks()"
                     class="w-16 px-2 py-1.5 bg-bg-raised border border-border rounded-md text-center text-sm font-mono text-text outline-none focus:border-primary"
                     [ngModel]="singleWeek()" (ngModelChange)="singleWeek.set(+$event)" />
              <span class="text-xs text-text-muted">de {{ totalWeeks() }}</span>
            </div>
          }

          <div class="text-[11px] text-text-muted font-mono mb-5">
            APLICA A {{ weeksSelected().length }} SEMANA{{ weeksSelected().length === 1 ? '' : 'S' }}
          </div>

          <!-- WEEK MODE: weekday mapping (1 row per routine day) -->
          @if (program().scheduleType === 'Week') {
            <div class="text-overline text-text-muted mb-2">Asignar días a la semana</div>

            @if (hasCollision()) {
              <div class="mb-3 px-3 py-2 rounded-md text-xs text-amber-400 font-mono"
                   style="border:1px solid var(--color-warning);background:color-mix(in srgb,var(--color-warning) 12%,transparent)">
                ⚠ Dos días de la rutina usan el mismo día de la semana. Corrige antes de continuar.
              </div>
            }

            <div class="flex flex-col gap-3">
              @for (day of routine()?.days ?? []; track day.id) {
                <div class="flex flex-col gap-1.5">
                  <div class="text-xs font-semibold text-text-secondary">{{ day.name }}</div>
                  <div class="flex gap-1.5 flex-wrap">
                    @for (label of weekdayLabels; track $index) {
                      <button type="button"
                              class="px-2.5 py-1 text-xs rounded-md border transition font-mono"
                              [class.bg-primary-light]="mapping()[day.id] === $index"
                              [class.border-primary]="mapping()[day.id] === $index"
                              [class.text-primary]="mapping()[day.id] === $index"
                              [class.bg-card]="mapping()[day.id] !== $index"
                              [class.border-border-light]="mapping()[day.id] !== $index"
                              [class.text-text-secondary]="mapping()[day.id] !== $index"
                              [class.hover:bg-card-hover]="mapping()[day.id] !== $index"
                              (click)="setMapping(day.id, $index)">
                        {{ label }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- NUMBERED MODE: select routine days to add (in order) -->
          @if (program().scheduleType === 'Numbered') {
            <div class="text-overline text-text-muted mb-2">Selecciona los días a añadir</div>
            <div class="text-[11px] text-text-muted font-mono mb-3">
              {{ numberedSelected().length }} SELECCIONADO{{ numberedSelected().length === 1 ? '' : 'S' }}
              · MÁX {{ program().daysPerWeek ?? '?' }} POR SEMANA
            </div>

            @if (numberedSelected().length > (program().daysPerWeek ?? 0)) {
              <div class="mb-3 px-3 py-2 rounded-md text-xs text-amber-400 font-mono"
                   style="border:1px solid var(--color-warning);background:color-mix(in srgb,var(--color-warning) 12%,transparent)">
                ⚠ Has seleccionado más días de los permitidos por semana (máx {{ program().daysPerWeek }}).
              </div>
            }

            <div class="flex flex-col gap-1.5">
              @for (day of routine()?.days ?? []; track day.id; let idx = $index) {
                <button type="button"
                        class="flex items-center gap-3 p-3 rounded-md border text-left transition"
                        [class.bg-primary-light]="numberedSelected().includes(day.id)"
                        [class.border-primary]="numberedSelected().includes(day.id)"
                        [class.bg-card]="!numberedSelected().includes(day.id)"
                        [class.border-border-light]="!numberedSelected().includes(day.id)"
                        [class.hover:bg-card-hover]="!numberedSelected().includes(day.id)"
                        (click)="toggleNumberedDay(day.id)">
                  <div class="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition"
                       [class.bg-primary]="numberedSelected().includes(day.id)"
                       [class.border-primary]="numberedSelected().includes(day.id)"
                       [class.border-border]="!numberedSelected().includes(day.id)">
                    @if (numberedSelected().includes(day.id)) {
                      <lucide-icon name="check" [size]="11" class="text-white"></lucide-icon>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-text">{{ day.name }}</div>
                    <div class="text-[10px] text-text-muted font-mono">Día {{ idx + 1 }}</div>
                  </div>
                  @if (numberedSelected().includes(day.id)) {
                    <div class="text-[10px] font-mono text-primary">
                      #{{ numberedSelected().indexOf(day.id) + 1 }}
                    </div>
                  }
                </button>
              }
            </div>
          }
        </div>

        <footer class="px-6 py-3 border-t border-border-light flex justify-between items-center gap-3">
          <button type="button"
                  class="px-4 py-2 text-sm text-text-secondary hover:text-text transition flex items-center gap-2"
                  (click)="step.set(1)">
            <lucide-icon name="arrow-left" [size]="14"></lucide-icon>
            Cambiar rutina
          </button>
          <div class="flex gap-2">
            <button type="button"
                    class="px-4 py-2 bg-card hover:bg-card-hover border border-border text-text-secondary text-sm rounded-lg transition"
                    (click)="close.emit()">
              Cancelar
            </button>
            <button type="button"
                    class="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition press flex items-center gap-2"
                    [disabled]="!canSubmit()" (click)="submit()">
              <lucide-icon name="check" [size]="14"></lucide-icon>
              Asignar a {{ weeksSelected().length }} sem
            </button>
          </div>
        </footer>
      }
    </div>
  `,
})
export class AssignRoutineModal implements OnInit {
  private http = inject(HttpClient);

  readonly program = input.required<ProgramDetail>();
  readonly initialWeek = input(0);

  readonly close = output<void>();
  readonly assigned = output<{ routineId: string; weeks: number[]; mapping?: Record<string, number>; dayIds?: string[]; }>();

  protected readonly weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  protected readonly step = signal<1 | 2>(1);
  protected readonly query = signal('');
  protected readonly library = signal<RoutineListItem[]>([]);
  protected readonly loadingLib = signal(false);
  protected readonly loadingDetailFor = signal<string | null>(null);
  protected readonly routine = signal<RoutineDetail | null>(null);
  protected readonly mapping = signal<Record<string, number | null>>({});
  protected readonly numberedSelected = signal<string[]>([]);

  protected readonly scope = signal<'all' | 'range' | 'one'>('all');
  protected readonly rangeStart = signal(1);
  protected readonly rangeEnd = signal(1);
  protected readonly singleWeek = signal(1);

  protected readonly totalWeeks = computed(() => this.program().weeks.length);
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.library().filter(r => !q || r.name.toLowerCase().includes(q));
  });

  protected readonly weeksSelected = computed<number[]>(() => {
    const total = this.totalWeeks();
    if (total === 0) return [];
    if (this.scope() === 'all') return Array.from({ length: total }, (_, i) => i);
    if (this.scope() === 'one') {
      const idx = Math.max(0, Math.min(total - 1, this.singleWeek() - 1));
      return [idx];
    }
    const s = Math.max(0, Math.min(this.rangeStart(), this.rangeEnd()) - 1);
    const e = Math.min(total - 1, Math.max(this.rangeStart(), this.rangeEnd()) - 1);
    if (e < s) return [];
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  });

  protected readonly hasCollision = computed(() => {
    const m = this.mapping();
    const taken = new Map<number, number>();
    for (const v of Object.values(m)) {
      if (v == null) continue;
      taken.set(v, (taken.get(v) ?? 0) + 1);
    }
    return Array.from(taken.values()).some(c => c > 1);
  });

  protected readonly canSubmit = computed(() => {
    if (this.weeksSelected().length === 0) return false;
    if (this.program().scheduleType === 'Week') {
      const m = this.mapping();
      const allMapped = (this.routine()?.days ?? []).every(d => m[d.id] != null);
      return allMapped && !this.hasCollision();
    }
    const sel = this.numberedSelected();
    const max = this.program().daysPerWeek ?? 0;
    return sel.length > 0 && sel.length <= max;
  });

  ngOnInit() {
    this.rangeStart.set((this.initialWeek() ?? 0) + 1);
    this.rangeEnd.set(this.totalWeeks());
    this.singleWeek.set((this.initialWeek() ?? 0) + 1);
    this.loadingLib.set(true);
    firstValueFrom(this.http.get<RoutineListItem[]>(`${environment.apiUrl}/routines`, { withCredentials: true }))
      .then(rs => this.library.set(rs ?? []))
      .catch(() => this.library.set([]))
      .finally(() => this.loadingLib.set(false));
  }

  async pick(r: RoutineListItem) {
    if (this.loadingDetailFor()) return;
    this.loadingDetailFor.set(r.id);
    try {
      const detail = await firstValueFrom(
        this.http.get<{ id: string; name: string; days: { id: string; name: string; blocks: unknown[] }[] }>(
          `${environment.apiUrl}/routines/${r.id}`, { withCredentials: true }));
      const lite: RoutineDetail = { id: detail.id, name: detail.name, days: detail.days.map(d => ({ id: d.id, name: d.name })) };
      this.routine.set(lite);
      if (this.program().scheduleType === 'Week') {
        this.mapping.set(suggestWeekdayMapping(lite.days.map(d => d.id)));
      } else {
        this.numberedSelected.set([]);
      }
      this.step.set(2);
    } catch {
      // swallow — global error interceptor will toast
    } finally {
      this.loadingDetailFor.set(null);
    }
  }

  protected setMapping(dayId: string, weekdayIdx: number) {
    const cur = this.mapping();
    if (cur[dayId] === weekdayIdx) {
      this.mapping.set({ ...cur, [dayId]: null });
    } else {
      this.mapping.set({ ...cur, [dayId]: weekdayIdx });
    }
  }

  protected toggleNumberedDay(dayId: string) {
    const cur = this.numberedSelected();
    if (cur.includes(dayId)) {
      this.numberedSelected.set(cur.filter(x => x !== dayId));
    } else {
      this.numberedSelected.set([...cur, dayId]);
    }
  }

  protected submit() {
    if (!this.canSubmit()) return;
    const r = this.routine()!;
    if (this.program().scheduleType === 'Week') {
      const m = this.mapping();
      const cleaned: Record<string, number> = {};
      for (const [k, v] of Object.entries(m)) if (v != null) cleaned[k] = v;
      this.assigned.emit({ routineId: r.id, weeks: this.weeksSelected(), mapping: cleaned });
    } else {
      this.assigned.emit({ routineId: r.id, weeks: this.weeksSelected(), dayIds: this.numberedSelected() });
    }
    this.close.emit();
  }
}

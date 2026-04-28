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
    const unnamedDayIdx = this.routine().days.findIndex(d => !d.name.trim());
    if (unnamedDayIdx !== -1) {
      this.toast.show(`El día ${unnamedDayIdx + 1} necesita un nombre`, 'error');
      this.activeDayIndex.set(unnamedDayIdx);
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

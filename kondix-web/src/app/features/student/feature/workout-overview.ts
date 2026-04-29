import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import {
  ExerciseDto,
  NextWorkoutDto,
  SetLogDto,
  StudentRoutineDetailDto,
  WorkoutSessionDto,
} from '../../../shared/models';
import { KxConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { KxProgressBar } from '../../../shared/ui/progress-bar';
import { KxSpinner } from '../../../shared/ui/spinner';

type ExerciseState = 'completed' | 'in-progress' | 'pending';

interface ExerciseWithState {
  exercise: ExerciseDto;
  state: ExerciseState;
  index: number;
  completedSets: number;
  totalSets: number;
  maxWeight: string | null;
}

@Component({
  selector: 'app-workout-overview',
  imports: [KxProgressBar, KxSpinner, KxConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="flex items-center justify-center min-h-screen bg-bg">
        <kx-spinner />
      </div>
    } @else if (error()) {
      <div class="flex flex-col items-center justify-center min-h-screen bg-bg px-6 text-center">
        <p class="text-danger text-sm mb-4">{{ error() }}</p>
        <button (click)="reload()" class="text-primary text-sm hover:underline">Reintentar</button>
      </div>
    } @else {
      <div class="min-h-screen bg-bg flex flex-col animate-fade-up">

        <!-- Top bar -->
        <header class="flex items-center justify-between px-4 pt-safe-top pt-6 pb-4 shrink-0">
          <button
            (click)="confirmExit()"
            class="flex items-center gap-1.5 text-text-muted text-sm hover:text-text transition press"
            aria-label="Salir del entrenamiento">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Salir
          </button>

          <div class="flex flex-col items-center min-w-0 px-3">
            <p class="font-display font-bold text-sm text-text truncate max-w-[180px]">
              {{ nextWorkout()?.routineName ?? '' }}
            </p>
            @if (nextWorkout()) {
              <p class="text-text-muted text-xs">Semana {{ nextWorkout()!.weekIndex ?? '' }}</p>
            }
          </div>

          <div class="flex items-center gap-1 text-text-muted text-sm tabular-nums min-w-[60px] justify-end">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ formattedTime() }}
          </div>
        </header>

        <!-- Progress bar -->
        <div class="px-4 pb-4 shrink-0">
          <kx-progress-bar [percentage]="progressPercentage()" [showLabel]="true" size="md" />
        </div>

        <!-- Exercise list -->
        <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          @for (item of exercisesWithState(); track item.exercise.id; let i = $index) {
            @if (item.state === 'completed') {
              <!-- Completed card -->
              <div class="bg-success/[0.06] border border-success/20 rounded-xl px-4 py-3.5 flex items-center gap-3">
                <!-- Check circle -->
                <div class="w-9 h-9 rounded-full bg-success/20 border border-success/40 flex items-center justify-center shrink-0 animate-check">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-text truncate">{{ item.exercise.name }}</p>
                  <p class="text-success text-xs font-medium mt-0.5">Completado</p>
                </div>
                @if (item.maxWeight) {
                  <p class="text-text-secondary text-sm font-semibold tabular-nums shrink-0">
                    {{ item.maxWeight }}
                  </p>
                }
              </div>
            } @else if (item.state === 'in-progress') {
              <!-- Current (in-progress) card -->
              <div class="bg-primary/[0.08] border-[1.5px] border-primary/30 rounded-xl px-4 py-3.5 flex items-center gap-3"
                style="box-shadow: 0 0 20px rgba(230,38,57,0.12)">
                <!-- Number circle -->
                <div class="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <span class="text-primary font-bold text-sm">{{ item.index + 1 }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-text truncate">{{ item.exercise.name }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <p class="text-primary text-xs font-medium">En curso →</p>
                    <p class="text-text-muted text-xs">
                      {{ item.completedSets }}/{{ item.totalSets }} series
                    </p>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Pending card -->
              <div class="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center gap-3 transition"
                [style.opacity]="pendingOpacity(item.index)">
                <!-- Number circle -->
                <div class="w-9 h-9 rounded-full bg-bg-raised border border-border-light flex items-center justify-center shrink-0">
                  <span class="text-text-muted font-bold text-sm">{{ item.index + 1 }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-text truncate">{{ item.exercise.name }}</p>
                  <p class="text-text-muted text-xs mt-0.5">
                    {{ item.totalSets }} {{ item.totalSets === 1 ? 'serie' : 'series' }}
                  </p>
                </div>
              </div>
            }
          }
        </div>

        <!-- Bottom CTA -->
        <div class="px-4 pb-safe-bottom pb-8 pt-4 shrink-0">
          @if (allCompleted()) {
            <button
              (click)="navigateToComplete()"
              class="w-full bg-success hover:bg-success/80 text-white font-semibold py-4 rounded-xl transition press text-base">
              Completar entrenamiento ✓
            </button>
          } @else {
            <button
              (click)="navigateToCurrent()"
              class="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-4 rounded-xl transition press text-base">
              Continuar ejercicio →
            </button>
          }
        </div>

      </div>
    }

    <!-- Confirm exit dialog -->
    <kx-confirm-dialog
      [open]="showExitDialog()"
      title="¿Salir del entreno?"
      message="Tu progreso se guardará automáticamente."
      confirmLabel="Salir"
      variant="danger"
      (confirmed)="exitWorkout()"
      (cancelled)="showExitDialog.set(false)" />
  `,
})
export class WorkoutOverview implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal('');
  routine = signal<StudentRoutineDetailDto | null>(null);
  nextWorkout = signal<NextWorkoutDto | null>(null);
  sessionId = signal<string | null>(null);
  setLogMap = signal<Map<string, SetLogDto>>(new Map());
  elapsedSeconds = signal(0);
  showExitDialog = signal(false);

  private elapsedInterval: ReturnType<typeof setInterval> | null = null;

  exercises = computed<ExerciseDto[]>(() => {
    const r = this.routine();
    const nw = this.nextWorkout();
    if (!r || !nw) return [];
    const day = r.days.find(d => d.id === nw.dayId);
    if (!day) return [];
    return day.blocks.flatMap(g => g.exercises);
  });

  exercisesWithState = computed<ExerciseWithState[]>(() => {
    const exList = this.exercises();
    const logMap = this.setLogMap();
    let foundInProgress = false;

    return exList.map((exercise, index) => {
      const effectiveSets = exercise.sets.filter(s => s.setType !== 'Warmup');
      const totalSets = effectiveSets.length;
      const completedSets = effectiveSets.filter(s => logMap.get(s.id)?.completed).length;

      // Also check warmup sets for overall completion
      const allSets = exercise.sets;
      const totalAll = allSets.length;
      const completedAll = allSets.filter(s => logMap.get(s.id)?.completed).length;

      let state: ExerciseState;
      if (totalAll > 0 && completedAll === totalAll) {
        state = 'completed';
      } else if (!foundInProgress && completedAll > 0) {
        state = 'in-progress';
        foundInProgress = true;
      } else if (!foundInProgress && completedAll === 0) {
        // First non-completed exercise becomes in-progress
        state = 'in-progress';
        foundInProgress = true;
      } else {
        state = 'pending';
      }

      // Max weight across completed sets
      let maxWeight: string | null = null;
      for (const s of allSets) {
        const log = logMap.get(s.id);
        if (log?.completed && log.actualWeight) {
          const w = parseFloat(log.actualWeight);
          if (!isNaN(w)) {
            const current = maxWeight ? parseFloat(maxWeight) : -Infinity;
            if (w > current) maxWeight = log.actualWeight;
          }
        }
      }

      return { exercise, state, index, completedSets, totalSets, maxWeight };
    });
  });

  // Progress percentage based on effective sets for the current day
  progressPercentage = computed<number>(() => {
    const r = this.routine();
    const nw = this.nextWorkout();
    if (!r || !nw) return 0;
    const day = r.days.find(d => d.id === nw.dayId);
    if (!day) return 0;
    return day.progress.percentage;
  });

  allCompleted = computed<boolean>(() =>
    this.exercisesWithState().length > 0 &&
    this.exercisesWithState().every(e => e.state === 'completed')
  );

  currentExerciseIndex = computed<number>(() => {
    const list = this.exercisesWithState();
    const idx = list.findIndex(e => e.state === 'in-progress');
    return idx >= 0 ? idx : 0;
  });

  formattedTime = computed<string>(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.elapsedInterval) {
      clearInterval(this.elapsedInterval);
      this.elapsedInterval = null;
    }
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  private loadData() {
    const params = this.route.snapshot.queryParamMap;
    const presetSessionId = params.get('sessionId');
    const presetRoutineId = params.get('routineId');
    const presetDayId = params.get('dayId');
    const presetWeekIndex = params.get('weekIndex');
    const presetSlotIndex = params.get('slotIndex');

    if (presetSessionId && presetRoutineId && presetDayId) {
      // Recovery flow: session already created by the caller. Skip next-workout fetch,
      // load the routine directly by id and use the preset session.
      this.loadRoutineAndUseSession(presetRoutineId, presetDayId, presetSessionId);
    } else if (presetRoutineId && presetDayId) {
      // Direct start (Week or Numbered home click): no sessionId yet.
      const wIdx = presetWeekIndex !== null ? Number(presetWeekIndex) : null;
      const sIdx = presetSlotIndex !== null ? Number(presetSlotIndex) : null;
      this.loadRoutineAndStartSession(presetRoutineId, presetDayId, wIdx, sIdx);
    } else {
      this.loadFromNextWorkout();
    }
  }

  private loadFromNextWorkout() {
    this.api.get<NextWorkoutDto>('/public/my/next-workout').subscribe({
      next: (nw) => {
        this.nextWorkout.set(nw);
        this.api.get<StudentRoutineDetailDto>(`/public/my/routines/${nw.routineId!}`).subscribe({
          next: (r) => {
            this.routine.set(r);
            // Build setLogMap from the current day only
            const day = r.days.find(d => d.id === nw.dayId!);
            const map = new Map<string, SetLogDto>();
            if (day) {
              day.setLogs.forEach(sl => map.set(sl.setId, sl));
            }
            this.setLogMap.set(map);
            this.checkOrStartSession(nw.routineId!, nw.dayId!);
          },
          error: (err) => {
            this.error.set(err.error?.error || 'No pudimos cargar la rutina.');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No hay entrenamiento disponible.');
        this.loading.set(false);
      },
    });
  }

  private loadRoutineAndUseSession(routineId: string, dayId: string, sessionId: string) {
    this.api.get<StudentRoutineDetailDto>(`/public/my/routines/${routineId}`).subscribe({
      next: (r) => {
        // Build a minimal NextWorkoutDto so the template renders correctly.
        this.nextWorkout.set({
          kind: 'Routine',
          routineId,
          routineName: r.name,
          dayId,
          dayName: r.days.find(d => d.id === dayId)?.name ?? '',
          weekIndex: null,
          slotIndex: null,
        });
        this.routine.set(r);
        // Build setLogMap from the target day
        const day = r.days.find(d => d.id === dayId);
        const map = new Map<string, SetLogDto>();
        if (day) {
          day.setLogs.forEach(sl => map.set(sl.setId, sl));
        }
        this.setLogMap.set(map);
        // Session already created — wire it directly and start the timer.
        this.sessionId.set(sessionId);
        this.startTimer();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar la rutina.');
        this.loading.set(false);
      },
    });
  }

  private loadRoutineAndStartSession(routineId: string, dayId: string, weekIndex: number | null, slotIndex: number | null) {
    this.api.get<StudentRoutineDetailDto>(`/public/my/routines/${routineId}`).subscribe({
      next: (r) => {
        this.nextWorkout.set({
          kind: 'Routine',
          routineId,
          routineName: r.name,
          dayId,
          dayName: r.days.find(d => d.id === dayId)?.name ?? '',
          weekIndex,
          slotIndex,
        });
        this.routine.set(r);
        const day = r.days.find(d => d.id === dayId);
        const map = new Map<string, SetLogDto>();
        if (day) {
          day.setLogs.forEach(sl => map.set(sl.setId, sl));
        }
        this.setLogMap.set(map);

        const startBody: { routineId: string; dayId: string; weekIndex?: number; slotIndex?: number; } = { routineId, dayId };
        if (weekIndex !== null) startBody.weekIndex = weekIndex;
        if (slotIndex !== null) startBody.slotIndex = slotIndex;

        // Check for an existing in-progress session, else start one.
        this.api.get<WorkoutSessionDto | null>('/public/my/sessions/active').subscribe({
          next: (active) => {
            if (active) {
              this.sessionId.set(active.id);
              const start = new Date(active.startedAt).getTime();
              const initialElapsed = Math.floor((Date.now() - start) / 1000);
              this.elapsedSeconds.set(initialElapsed > 0 ? initialElapsed : 0);
              this.startTimer();
              this.loading.set(false);
            } else {
              this.api.post<WorkoutSessionDto>('/public/my/sessions/start', startBody).subscribe({
                next: (session) => {
                  this.sessionId.set(session.id);
                  this.startTimer();
                  this.loading.set(false);
                },
                error: (err) => {
                  this.error.set(err.error?.error || 'No se pudo iniciar la sesión.');
                  this.loading.set(false);
                },
              });
            }
          },
          error: () => {
            // Can't check active session — try to start one anyway.
            this.api.post<WorkoutSessionDto>('/public/my/sessions/start', startBody).subscribe({
              next: (session) => {
                this.sessionId.set(session.id);
                this.startTimer();
                this.loading.set(false);
              },
              error: (err) => {
                this.error.set(err.error?.error || 'No se pudo iniciar la sesión.');
                this.loading.set(false);
              },
            });
          },
        });
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar la rutina.');
        this.loading.set(false);
      },
    });
  }

  private checkOrStartSession(routineId: string, dayId: string) {
    this.api.get<WorkoutSessionDto | null>('/public/my/sessions/active').subscribe({
      next: (active) => {
        if (active) {
          this.sessionId.set(active.id);
          const start = new Date(active.startedAt).getTime();
          const initialElapsed = Math.floor((Date.now() - start) / 1000);
          this.elapsedSeconds.set(initialElapsed > 0 ? initialElapsed : 0);
        } else {
          this.api.post<WorkoutSessionDto>('/public/my/sessions/start', { routineId, dayId }).subscribe({
            next: (session) => {
              this.sessionId.set(session.id);
            },
            error: () => {
              // Session start failed — continue without session
            },
          });
        }
        this.startTimer();
        this.loading.set(false);
      },
      error: () => {
        // Can't check active session — try to start one
        this.api.post<WorkoutSessionDto>('/public/my/sessions/start', { routineId, dayId }).subscribe({
          next: (session) => this.sessionId.set(session.id),
          error: () => {},
        });
        this.startTimer();
        this.loading.set(false);
      },
    });
  }

  private startTimer() {
    if (this.elapsedInterval) return;
    this.elapsedInterval = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  pendingOpacity(globalIndex: number): number {
    const list = this.exercisesWithState();
    // Count how many pending exercises are before this one
    let pendingRank = 0;
    for (const item of list) {
      if (item.index === globalIndex) break;
      if (item.state === 'pending') pendingRank++;
    }
    return Math.max(0.35, 1 - pendingRank * 0.15);
  }

  confirmExit() {
    this.showExitDialog.set(true);
  }

  exitWorkout() {
    this.showExitDialog.set(false);
    this.router.navigate(['/workout/home']);
  }

  navigateToCurrent() {
    const nw = this.nextWorkout();
    const sid = this.sessionId();
    if (!nw || !sid) return;
    this.router.navigate(['/workout/session/exercise', this.currentExerciseIndex()], {
      queryParams: { routineId: nw.routineId, dayId: nw.dayId, sessionId: sid },
    });
  }

  navigateToComplete() {
    const sid = this.sessionId();
    if (!sid) return;
    this.router.navigate(['/workout/session/complete'], {
      queryParams: { sessionId: sid },
    });
  }
}

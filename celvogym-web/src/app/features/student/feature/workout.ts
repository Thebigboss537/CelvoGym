import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { StudentRoutineDetailDto, SetLogDto } from '../../../shared/models';

@Component({
  selector: 'app-workout',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (routine()) {
        <a routerLink="/workout" class="text-text-muted text-sm hover:text-text transition">← Mis rutinas</a>
        <h2 class="font-[var(--font-display)] text-2xl font-bold mt-1 mb-1">{{ routine()!.name }}</h2>

        <!-- Total progress -->
        <div class="flex items-center gap-2 mb-6">
          <div class="flex-1 h-2 bg-bg-raised rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 progress-fill"
              [style.width.%]="routine()!.progress.percentage"></div>
          </div>
          <span class="text-sm font-bold"
            [class.text-primary]="routine()!.progress.percentage < 100"
            [class.text-success]="routine()!.progress.percentage === 100">
            {{ routine()!.progress.percentage }}%
          </span>
        </div>

        <!-- Days -->
        <div class="space-y-4">
          @for (day of routine()!.days; track day.id; let di = $index) {
            <div class="bg-card border border-border rounded-xl overflow-hidden"
              [class.glow-complete]="day.progress.percentage === 100">
              <!-- Day header (collapsible) -->
              <button (click)="toggleDay(di)"
                class="w-full px-4 py-3 flex items-center justify-between bg-bg-raised border-b border-border-light">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-sm">{{ day.name }}</h3>
                  @if (day.progress.percentage === 100) {
                    <span class="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">LISTO</span>
                  }
                </div>
                <span class="text-xs font-bold"
                  [class.text-primary]="day.progress.percentage < 100"
                  [class.text-success]="day.progress.percentage === 100">
                  {{ day.progress.percentage }}%
                </span>
              </button>

              @if (expandedDays().has(di)) {
                <div class="divide-y divide-border-light">
                  @for (group of day.groups; track group.id) {
                    <div class="px-4 py-3">
                      @if (group.groupType !== 'Single') {
                        <span class="text-xs text-primary font-medium uppercase mb-2 block">
                          {{ group.groupType }}
                        </span>
                      }

                      @for (exercise of group.exercises; track exercise.id) {
                        <div class="py-2">
                          <div class="flex items-center justify-between mb-1.5">
                            <span class="font-medium text-sm">{{ exercise.name }}</span>
                            @if (exercise.tempo) {
                              <span class="text-text-muted text-xs">{{ exercise.tempo }}</span>
                            }
                          </div>

                          <!-- Sets -->
                          <div class="space-y-1.5">
                            @for (set of exercise.sets; track set.id; let si = $index) {
                              <div class="flex items-center gap-2 text-xs">
                                <!-- Checkbox -->
                                <button (click)="toggleSet(set.id, routine()!.id)"
                                  class="w-6 h-6 rounded border flex items-center justify-center shrink-0 transition"
                                  [class.bg-primary]="isSetCompleted(set.id)"
                                  [class.border-primary]="isSetCompleted(set.id)"
                                  [class.border-border]="!isSetCompleted(set.id)"
                                  [class.animate-check]="isSetCompleted(set.id)">
                                  @if (isSetCompleted(set.id)) {
                                    <span class="text-white text-xs">✓</span>
                                  }
                                </button>

                                <!-- Set info -->
                                <span class="w-16 text-text-muted">
                                  {{ set.setType === 'Warmup' ? 'Warmup' : (set.setType === 'AMRAP' ? 'AMRAP' : set.setType) }}
                                </span>
                                <span class="text-text-secondary">
                                  {{ set.targetReps ?? '-' }} × {{ set.targetWeight ?? '-' }}
                                </span>
                                @if (set.targetRpe) {
                                  <span class="text-primary">RPE {{ set.targetRpe }}</span>
                                }

                                <!-- Actual inputs -->
                                <input type="text" [value]="getLogWeight(set.id)"
                                  (change)="updateSetData(set.id, routine()!.id, $event, 'weight')"
                                  class="w-14 bg-bg-raised border border-border-light rounded px-1.5 py-0.5 text-center text-text"
                                  placeholder="Peso" />
                                <input type="text" [value]="getLogReps(set.id)"
                                  (change)="updateSetData(set.id, routine()!.id, $event, 'reps')"
                                  class="w-12 bg-bg-raised border border-border-light rounded px-1.5 py-0.5 text-center text-text"
                                  placeholder="Reps" />
                              </div>
                            }
                          </div>

                          @if (group.restSeconds > 0) {
                            <div class="mt-1.5 flex items-center gap-1.5">
                              <button (click)="startTimer(group.restSeconds)"
                                class="text-xs text-primary hover:underline">
                                ⏱ {{ group.restSeconds }}s
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Rest timer overlay -->
        @if (timerActive()) {
          <div class="fixed inset-0 bg-bg/90 flex items-center justify-center z-50" (click)="stopTimer()">
            <div class="text-center animate-fade-up">
              <p class="text-text-muted text-sm mb-2">Descanso</p>
              <p class="font-[var(--font-display)] text-7xl font-bold"
                [class.text-primary]="timerSeconds() > 0"
                [class.text-success]="timerSeconds() === 0">
                @if (timerSeconds() > 0) {
                  {{ timerSeconds() }}
                } @else {
                  GO!
                }
              </p>
              <p class="text-text-muted text-xs mt-4">Toca para cerrar</p>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class Workout implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  routine = signal<StudentRoutineDetailDto | null>(null);
  loading = signal(true);
  expandedDays = signal(new Set<number>([0]));
  setLogMap = signal(new Map<string, SetLogDto>());

  timerActive = signal(false);
  timerSeconds = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<StudentRoutineDetailDto>(`/public/my/routines/${id}`).subscribe({
      next: (data) => {
        this.routine.set(data);
        const map = new Map<string, SetLogDto>();
        data.days.forEach(d => d.setLogs.forEach(sl => map.set(sl.setId, sl)));
        this.setLogMap.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleDay(index: number) {
    this.expandedDays.update(s => {
      const next = new Set(s);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  isSetCompleted(setId: string): boolean {
    return this.setLogMap().get(setId)?.completed ?? false;
  }

  getLogWeight(setId: string): string {
    return this.setLogMap().get(setId)?.actualWeight ?? '';
  }

  getLogReps(setId: string): string {
    return this.setLogMap().get(setId)?.actualReps ?? '';
  }

  toggleSet(setId: string, routineId: string) {
    this.api.post<SetLogDto>('/public/my/sets/toggle', { setId, routineId }).subscribe({
      next: (log) => {
        this.setLogMap.update(m => { const n = new Map(m); n.set(log.setId, log); return n; });
      },
    });
  }

  updateSetData(setId: string, routineId: string, event: Event, field: 'weight' | 'reps') {
    const value = (event.target as HTMLInputElement).value;
    const current = this.setLogMap().get(setId);
    this.api.post<SetLogDto>('/public/my/sets/update', {
      setId,
      routineId,
      weight: field === 'weight' ? value : (current?.actualWeight ?? null),
      reps: field === 'reps' ? value : (current?.actualReps ?? null),
      rpe: current?.actualRpe ?? null,
    }).subscribe({
      next: (log) => {
        this.setLogMap.update(m => { const n = new Map(m); n.set(log.setId, log); return n; });
      },
    });
  }

  startTimer(seconds: number) {
    this.timerSeconds.set(seconds);
    this.timerActive.set(true);
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds() > 0) {
        this.timerSeconds.update(s => s - 1);
      } else {
        this.stopTimer();
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  }

  stopTimer() {
    this.timerActive.set(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

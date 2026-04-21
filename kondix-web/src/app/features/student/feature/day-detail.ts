import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import {
  ActiveProgramDto,
  CalendarDayDto,
  CalendarMonthDto,
  MyProgramDto,
  NextWorkoutDto,
} from '../../../shared/models';
import { KxBadge } from '../../../shared/ui/badge';
import { KxEmptyState } from '../../../shared/ui/empty-state';
import { KxProgressBar } from '../../../shared/ui/progress-bar';
import { KxSpinner } from '../../../shared/ui/spinner';

@Component({
  selector: 'app-day-detail',
  imports: [RouterLink, KxSpinner, KxEmptyState, KxBadge, KxProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-up pt-4">
      @if (loading()) {
        <kx-spinner />
      } @else {
        <!-- Back + Header -->
        <div class="mb-6">
          <a routerLink="/workout/calendar"
            class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Calendario
          </a>

          <h1 class="font-display text-2xl font-bold text-text capitalize leading-tight">
            {{ formattedDate() }}
          </h1>

          <div class="flex items-center gap-2 mt-1.5">
            @if (program()) {
              <p class="text-sm text-text-muted">
                Semana {{ program()!.currentWeek }}
                @if (isToday()) {
                  · <span class="text-primary font-semibold">Hoy</span>
                }
              </p>
            }
            @if (isTrainingDay()) {
              <kx-badge text="Día de entrenamiento" variant="info" [dot]="true" />
            } @else {
              <kx-badge text="Día de descanso" variant="neutral" />
            }
          </div>
        </div>

        @if (!program()) {
          <kx-empty-state
            title="Sin programa activo"
            subtitle="Tu entrenador te asignará un programa pronto." />
        } @else if (!isTrainingDay()) {
          <!-- Rest day -->
          <kx-empty-state
            title="Día de descanso"
            subtitle="No tienes entreno programado para este día." />
        } @else {
          <!-- Assignment badges -->
          <div class="flex flex-wrap gap-2 mb-5">
            <kx-badge
              [text]="program()!.mode === 'Rotation' ? 'Modo Rotación' : 'Modo Fijo'"
              variant="info" />
            @if (routinePositionLabel()) {
              <kx-badge [text]="routinePositionLabel()" variant="neutral" />
            }
          </div>

          @if (session(); as sess) {
            <!-- Completed / in-progress session card -->
            <div class="border border-border-active rounded-2xl p-6 space-y-4 mb-4"
                 style="background: linear-gradient(135deg, #1a0a0d 0%, #16161A 100%)">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-primary text-[11px] font-bold tracking-widest uppercase mb-1">
                    RUTINA ASIGNADA
                  </p>
                  <p class="text-text text-xl font-bold leading-tight">{{ sess.dayName }}</p>
                  @if (program()) {
                    <p class="text-text-secondary text-sm mt-0.5">
                      Parte del programa: {{ program()!.name }}
                    </p>
                  }
                </div>
                @if (sess.status === 'completed') {
                  <kx-badge text="✓ Completado" variant="success" />
                } @else {
                  <kx-badge text="En progreso" variant="warning" [dot]="true" />
                }
              </div>

              <!-- Session stats -->
              <div class="flex gap-3">
                <div class="bg-white/5 rounded-xl p-3 text-center flex-1">
                  <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">SERIES</p>
                  <p class="text-text text-sm font-bold">{{ sess.completedSets }}/{{ sess.totalSets }}</p>
                </div>
                @if (sess.durationMinutes) {
                  <div class="bg-white/5 rounded-xl p-3 text-center flex-1">
                    <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">DURACIÓN</p>
                    <p class="text-text text-sm font-bold">{{ sess.durationMinutes }} min</p>
                  </div>
                }
                <div class="bg-white/5 rounded-xl p-3 text-center flex-1">
                  <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">SEMANA</p>
                  <p class="text-text text-sm font-bold">{{ program()!.currentWeek }}/{{ program()!.totalWeeks }}</p>
                </div>
              </div>

              <!-- Progress bar -->
              @if (sess.totalSets > 0) {
                <kx-progress-bar
                  [percentage]="setsPercentage()"
                  [label]="sess.completedSets + ' de ' + sess.totalSets + ' series'"
                  [showLabel]="true"
                  size="md" />
              }

              @if (sess.status === 'in_progress') {
                <button
                  type="button"
                  (click)="onStartWorkout()"
                  class="w-full bg-primary hover:bg-primary-hover text-white rounded-xl py-3.5 font-bold text-base transition">
                  Continuar Entreno →
                </button>
              }
            </div>
          } @else {
            <!-- Upcoming training day card -->
            <div class="border border-border-active rounded-2xl p-6 space-y-4"
                 style="background: linear-gradient(135deg, #1a0a0d 0%, #16161A 100%)">
              <p class="text-primary text-[11px] font-bold tracking-widest uppercase">
                RUTINA ASIGNADA
              </p>

              <div class="space-y-0.5">
                @if (nextWorkout()) {
                  <p class="text-text text-xl font-bold leading-tight">{{ nextWorkout()!.routineName }}</p>
                  <p class="text-text-secondary text-sm">
                    {{ nextWorkout()!.dayName }} · {{ nextWorkout()!.programName }}
                  </p>
                } @else {
                  <p class="text-text text-xl font-bold leading-tight">{{ program()!.name }}</p>
                  <p class="text-text-secondary text-sm">Programa activo</p>
                }
              </div>

              <!-- Mini stats -->
              <div class="flex gap-3">
                <div class="bg-white/5 rounded-xl p-2 text-center flex-1">
                  <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">SEMANA</p>
                  <p class="text-text text-sm font-bold">
                    {{ program()!.currentWeek }}/{{ program()!.totalWeeks }}
                  </p>
                </div>
                <div class="bg-white/5 rounded-xl p-2 text-center flex-1">
                  <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">MODO</p>
                  <p class="text-text text-sm font-bold">
                    {{ program()!.mode === 'Rotation' ? 'Rotación' : 'Fijo' }}
                  </p>
                </div>
                <div class="bg-white/5 rounded-xl p-2 text-center flex-1">
                  <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">ESTADO</p>
                  <p class="text-text text-sm font-bold">Pendiente</p>
                </div>
              </div>

              @if (isToday()) {
                <button
                  type="button"
                  (click)="onStartWorkout()"
                  class="w-full bg-primary hover:bg-primary-hover text-white rounded-xl py-3.5 font-bold text-base transition">
                  Empezar Entreno →
                </button>
              } @else {
                <p class="text-center text-text-muted text-sm py-1">
                  Este día aún no ha llegado.
                </p>
              }
            </div>
          }
        }
      }
    </div>
  `,
})
export class DayDetail implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  dateParam = signal('');
  session = signal<CalendarDayDto | null>(null);
  program = signal<ActiveProgramDto | null>(null);
  nextWorkout = signal<NextWorkoutDto | null>(null);
  isTrainingDay = signal(false);
  isToday = signal(false);

  private myProgram = signal<MyProgramDto | null>(null);

  formattedDate = computed(() => {
    const d = this.dateParam();
    if (!d) return '';
    // Parse as local date to avoid UTC offset shift
    const [year, month, day] = d.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  });

  routinePositionLabel = computed(() => {
    const prog = this.myProgram();
    if (!prog) return '';
    const count = prog.routines.length;
    if (count === 0) return '';
    // Derive label from next-workout or just show total count
    const nw = this.nextWorkout();
    if (!nw) return `${count} rutina${count !== 1 ? 's' : ''}`;
    const idx = prog.routines.findIndex(r => r.id === nw.routineId);
    const pos = idx >= 0 ? idx + 1 : 1;
    return `Rutina ${String.fromCharCode(64 + pos)} de ${count}`;
  });

  setsPercentage = computed(() => {
    const sess = this.session();
    if (!sess || sess.totalSets === 0) return 0;
    return Math.round((sess.completedSets / sess.totalSets) * 100);
  });

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const date = params['date'] as string;
      this.dateParam.set(date);

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      this.isToday.set(date === today);

      const [year, month] = date.split('-').map(Number);

      this.loading.set(true);
      let pending = 3;

      const done = () => {
        pending--;
        if (pending === 0) this.loading.set(false);
      };

      // 1. Calendar data for this month
      this.api.get<CalendarMonthDto>(`/public/my/calendar?year=${year}&month=${month}`).subscribe({
        next: (data) => {
          this.program.set(data.activeProgram);

          // Check if this date is a training day
          const dow = new Date(Number(date.split('-')[0]), Number(date.split('-')[1]) - 1, Number(date.split('-')[2])).getDay();
          const isSuggested = data.suggestedDays.includes(dow);
          this.isTrainingDay.set(isSuggested);

          // Find session for this date
          const sess = data.sessions.find(s => s.date === date) ?? null;
          this.session.set(sess);
          // If there's a session, it's a training day regardless
          if (sess) this.isTrainingDay.set(true);

          done();
        },
        error: () => done(),
      });

      // 2. Full program data (for routine count/position)
      this.api.get<MyProgramDto>('/public/my/program').subscribe({
        next: (data) => { this.myProgram.set(data); done(); },
        error: () => done(),
      });

      // 3. Next workout for context
      this.api.get<NextWorkoutDto>('/public/my/next-workout').subscribe({
        next: (data) => { this.nextWorkout.set(data); done(); },
        error: () => done(),
      });
    });
  }

  onStartWorkout(): void {
    this.router.navigate(['/workout/session/overview']);
  }
}

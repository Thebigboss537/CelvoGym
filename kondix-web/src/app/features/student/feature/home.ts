import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, ArrowRight } from 'lucide-angular';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiService } from '../../../core/services/api.service';
import {
  MyProgramDto, NextWorkoutDto, PersonalRecordDto, RecoverableSessionDto,
  ThisWeekDto, ThisWeekPendingSlot,
} from '../../../shared/models';
import { KxAvatar } from '../../../shared/ui/avatar';
import { KxEmptyState } from '../../../shared/ui/empty-state';
import { KxHeroCard } from '../../../shared/ui/hero-card';
import { KxRecoveryBanner } from '../../../shared/ui/recovery-banner';
import { KxSpinner } from '../../../shared/ui/spinner';
import { KxStatCard } from '../../../shared/ui/stat-card';
import { ToastService } from '../../../shared/ui/toast';
import { relativeDate as relativeDateBase } from '../../../shared/utils/format-date';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function relativeDate(iso: string): string {
  return capitalize(relativeDateBase(iso));
}

@Component({
  selector: 'app-student-home',
  imports: [KxHeroCard, KxStatCard, KxAvatar, KxEmptyState, KxSpinner, KxRecoveryBanner, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowRight }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-up space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-overline text-text-muted capitalize">{{ todayLabel }}</p>
          <h1 class="font-display text-2xl font-bold text-text leading-tight">
            Hola, {{ firstName() }}
          </h1>
        </div>
        @if (firstName()) {
          <kx-avatar [name]="firstName()" size="md" />
        }
      </div>

      @if (!loading() && missed() && nextWorkout()?.kind !== 'Numbered') {
        <kx-recovery-banner
          [missedSession]="missed()!"
          (recover)="onRecover()"
          (dismiss)="missed.set(null)" />
      }

      @if (loading()) {
        <kx-spinner />
      } @else {
        @switch (nextWorkout()?.kind ?? 'Done') {
          @case ('Routine') {
            <kx-hero-card
              [routineName]="nextWorkout()?.routineName ?? ''"
              [dayName]="nextWorkout()?.dayName ?? ''"
              [programName]="programName()"
              [week]="programWeek()"
              [totalWeeks]="programTotalWeeks()"
              (start)="onStartWorkout()" />
          }
          @case ('Rest') {
            <kx-empty-state
              title="Día de descanso"
              subtitle="Hoy toca recuperar. Mañana sigues entrenando." />
          }
          @case ('Empty') {
            <kx-empty-state
              title="Día libre"
              subtitle="No tienes entreno programado para hoy." />
          }
          @case ('Numbered') {
            <section>
              <h2 class="font-display text-2xl font-bold mb-1">Esta semana</h2>
              <p class="text-sm text-text-muted mb-4">
                {{ thisWeek()?.completedCount ?? 0 }} de {{ thisWeek()?.total ?? 0 }} entrenamientos completados
              </p>

              @if ((thisWeek()?.pending?.length ?? 0) === 0) {
                <kx-empty-state title="¡Listo!" subtitle="Completaste todos los entrenamientos de esta semana." />
              } @else {
                <ul class="flex flex-col gap-2.5">
                  @for (slot of thisWeek()?.pending ?? []; track slot.slotIndex) {
                    <li>
                      <button type="button"
                              class="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-left hover:border-primary transition"
                              (click)="startNumberedSession(slot)">
                        <div class="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center font-display font-bold">
                          D{{ slot.slotIndex + 1 }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-semibold text-text">{{ slot.dayName }}</div>
                          <div class="text-xs text-text-muted">{{ slot.routineName }}</div>
                        </div>
                        <lucide-icon name="arrow-right" [size]="16"></lucide-icon>
                      </button>
                    </li>
                  }
                </ul>
              }
            </section>
          }
          @case ('Done') {
            @if (program()) {
              <kx-empty-state
                title="¡Programa completado!"
                subtitle="Has terminado este programa. Tu entrenador te asignará uno nuevo pronto." />
            } @else {
              <kx-empty-state
                title="Sin programa asignado"
                subtitle="Tu entrenador aún no te ha asignado un programa." />
            }
          }
        }

        <!-- "ESTA SEMANA" stats — hide on Numbered (already shown above) -->
        @if (nextWorkout()?.kind !== 'Numbered') {
          <section>
            <p class="text-overline text-text-muted mb-3">ESTA SEMANA</p>
            <div class="flex gap-3">
              <div class="flex-1">
                <kx-stat-card label="Semana" [value]="weekLabel()" />
              </div>
              <div class="flex-1">
                <kx-stat-card label="PRs nuevos" [value]="recentPrCount()" />
              </div>
              <div class="flex-1">
                <kx-stat-card label="Volumen" value="—" />
              </div>
            </div>
          </section>
        }

        <!-- PRs RECIENTES -->
        <section>
          <p class="text-overline text-text-muted mb-3">PRs RECIENTES 🏆</p>
          @if (records().length === 0) {
            <p class="text-text-muted text-sm text-center py-6">
              Aún no tienes records. ¡Completa un entreno para empezar!
            </p>
          } @else {
            <div class="space-y-2 stagger">
              @for (pr of records(); track pr.id) {
                <div class="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p class="font-medium text-text text-sm">{{ pr.exerciseName }}</p>
                    <p class="text-text-muted text-xs">{{ relativeDate(pr.achievedAt) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-primary font-bold text-lg tabular-nums">{{ pr.weight }}</p>
                    @if (pr.reps) {
                      <p class="text-text-muted text-xs">× {{ pr.reps }} reps</p>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class Home implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  relativeDate = relativeDate;

  todayLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  loading = signal(true);
  nextWorkout = signal<NextWorkoutDto | null>(null);
  thisWeek = signal<ThisWeekDto | null>(null);
  program = signal<MyProgramDto | null>(null);
  records = signal<PersonalRecordDto[]>([]);
  missed = signal<RecoverableSessionDto | null>(null);

  private pending = signal(3);

  firstName = computed(() => this.authStore.user()?.firstName ?? 'Atleta');

  programName = computed(() => this.program()?.programName ?? '');
  programWeek = computed(() => this.program()?.currentWeek ?? 1);
  programTotalWeeks = computed(() => this.program()?.totalWeeks ?? 0);

  weekLabel = computed(() => {
    const p = this.program();
    if (!p) return '—';
    return `${p.currentWeek}/${p.totalWeeks}`;
  });

  recentPrCount = computed(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const count = this.records().filter(r => new Date(r.achievedAt).getTime() >= cutoff).length;
    return count > 0 ? String(count) : '—';
  });

  ngOnInit() {
    this.api.get<NextWorkoutDto>('/public/my/next-workout')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          this.nextWorkout.set(data);
          if (data?.kind === 'Numbered') this.loadThisWeek();
          this.done();
        },
        error: () => this.done(),
      });

    this.api.get<MyProgramDto>('/public/my/program')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => { this.program.set(data); this.done(); },
        error: () => this.done(),
      });

    this.api.get<PersonalRecordDto[]>('/public/my/records')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => { this.records.set(data); this.done(); },
        error: () => this.done(),
      });

    this.api.get<RecoverableSessionDto>('/public/my/missed-sessions')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => this.missed.set(data ?? null),
        error: () => this.missed.set(null),
      });
  }

  private loadThisWeek() {
    this.api.get<ThisWeekDto>('/public/my/this-week')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => this.thisWeek.set(data),
        error: () => this.thisWeek.set(null),
      });
  }

  onStartWorkout() {
    const nw = this.nextWorkout();
    if (!nw || nw.kind !== 'Routine') return;
    this.router.navigate(['/workout/session/overview'], {
      queryParams: {
        routineId: nw.routineId,
        dayId: nw.dayId,
        weekIndex: nw.weekIndex,
        slotIndex: nw.slotIndex,
      },
    });
  }

  startNumberedSession(slot: ThisWeekPendingSlot) {
    const tw = this.thisWeek();
    if (!tw) return;
    this.router.navigate(['/workout/session/overview'], {
      queryParams: {
        routineId: slot.routineId,
        dayId: slot.dayId,
        weekIndex: tw.weekIndex,
        slotIndex: slot.slotIndex,
      },
    });
  }

  onRecover(): void {
    const m = this.missed();
    if (!m) return;
    this.api.post<{ id: string }>('/public/my/sessions/start', {
      routineId: m.routineId,
      dayId: m.dayId,
      recoversPlannedDate: m.plannedDate,
    }).subscribe({
      next: (res) => this.router.navigate(['/workout/session/overview'], {
        queryParams: { sessionId: res.id, routineId: m.routineId, dayId: m.dayId },
      }),
      error: (err) => this.toast.show(err.error?.error ?? 'No se pudo iniciar', 'error'),
    });
  }

  private done() {
    this.pending.update(n => n - 1);
    if (this.pending() === 0) {
      this.loading.set(false);
    }
  }
}

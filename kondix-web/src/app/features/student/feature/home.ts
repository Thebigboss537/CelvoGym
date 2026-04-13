import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiService } from '../../../core/services/api.service';
import { MyProgramDto, NextWorkoutDto, PersonalRecordDto } from '../../../shared/models';
import { KxAvatar } from '../../../shared/ui/avatar';
import { KxEmptyState } from '../../../shared/ui/empty-state';
import { KxHeroCard } from '../../../shared/ui/hero-card';
import { KxSpinner } from '../../../shared/ui/spinner';
import { KxStatCard } from '../../../shared/ui/stat-card';
import { relativeDate as relativeDateBase } from '../../../shared/utils/format-date';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function relativeDate(iso: string): string {
  return capitalize(relativeDateBase(iso));
}

@Component({
  selector: 'app-student-home',
  imports: [KxHeroCard, KxStatCard, KxAvatar, KxEmptyState, KxSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-up space-y-6">

      <!-- Header: date + greeting + avatar -->
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

      @if (loading()) {
        <kx-spinner />
      } @else if (!program()) {
        <!-- No program assigned yet -->
        <kx-empty-state
          title="Sin programa asignado"
          subtitle="Tu entrenador aún no te ha asignado un programa." />
      } @else {
        <!-- Hero card: today's workout or rest day -->
        @if (workout()) {
          <kx-hero-card
            [routineName]="workout()!.routineName"
            [dayName]="workout()!.dayName"
            [programName]="workout()!.programName"
            [week]="workout()!.currentWeek"
            [totalWeeks]="workout()!.totalWeeks"
            (start)="onStartWorkout()" />
        } @else {
          <kx-empty-state
            title="Día de descanso"
            subtitle="No tienes entreno programado para hoy. Revisa tu calendario." />
        }

        <!-- Esta semana section -->
        <section>
          <p class="text-overline text-text-muted mb-3">ESTA SEMANA</p>
          <div class="flex gap-3">
            <div class="flex-1">
              <kx-stat-card
                label="Semana"
                [value]="weekLabel()" />
            </div>
            <div class="flex-1">
              <kx-stat-card
                label="PRs nuevos"
                [value]="recentPrCount()" />
            </div>
            <div class="flex-1">
              <kx-stat-card
                label="Volumen"
                value="—" />
            </div>
          </div>
        </section>

        <!-- PRs recientes section -->
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

  relativeDate = relativeDate;

  todayLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  loading = signal(true);
  workout = signal<NextWorkoutDto | null>(null);
  program = signal<MyProgramDto | null>(null);
  records = signal<PersonalRecordDto[]>([]);

  private pending = signal(3);

  firstName = computed(() => this.authStore.user()?.firstName ?? 'Atleta');

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
    this.api.get<NextWorkoutDto>('/public/my/next-workout').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.workout.set(data); this.done(); },
      error: () => this.done(),
    });

    this.api.get<MyProgramDto>('/public/my/program').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.program.set(data); this.done(); },
      error: () => this.done(),
    });

    this.api.get<PersonalRecordDto[]>('/public/my/records').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.records.set(data); this.done(); },
      error: () => this.done(),
    });
  }

  onStartWorkout() {
    this.router.navigate(['/workout/session/overview']);
  }

  private done() {
    this.pending.update(n => n - 1);
    if (this.pending() === 0) {
      this.loading.set(false);
    }
  }
}

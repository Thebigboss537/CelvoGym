import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiService } from '../../../core/services/api.service';
import { CalendarMonthDto, MyProgramDto, PersonalRecordDto } from '../../../shared/models';
import { CgBadge } from '../../../shared/ui/badge';
import { CgEmptyState } from '../../../shared/ui/empty-state';
import { CgProgressBar } from '../../../shared/ui/progress-bar';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgStatCard } from '../../../shared/ui/stat-card';

@Component({
  selector: 'app-student-profile',
  imports: [CgStatCard, CgBadge, CgProgressBar, CgSpinner, CgEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-up space-y-6 pb-8">

      @if (loading()) {
        <cg-spinner />
      } @else {

        <!-- Profile header -->
        <div class="flex flex-col items-center gap-3 pt-4 pb-2">
          <div
            class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-extrabold text-white
                   bg-gradient-to-br from-primary to-[#B31D2C]
                   shadow-[0_0_24px_rgba(230,38,57,0.25)]">
            {{ initial() }}
          </div>
          <div class="text-center">
            <h2 class="text-xl font-extrabold text-text">{{ displayName() }}</h2>
            <p class="text-text-muted text-sm mt-0.5">Miembro desde {{ memberSince() }}</p>
          </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-3">
          <cg-stat-card label="Sesiones" [value]="sessionCount().toString()" />
          <cg-stat-card label="Racha" value="—" />
          <cg-stat-card label="PRs" [value]="prCount().toString()" />
        </div>

        <!-- Mi Entrenador -->
        <section>
          <p class="text-overline text-text-muted mb-3">MI ENTRENADOR</p>
          <div class="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white
                        bg-gradient-to-br from-blue-500 to-blue-700 shrink-0">
              T
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-text text-sm">Tu entrenador</p>
              <p class="text-text-muted text-xs">Entrenamiento personalizado</p>
            </div>
            <button class="w-9 h-9 rounded-xl bg-border/60 hover:bg-border flex items-center justify-center text-text-muted hover:text-text transition shrink-0"
                    aria-label="Mensaje">
              💬
            </button>
          </div>
        </section>

        <!-- Programa Actual -->
        <section>
          <p class="text-overline text-text-muted mb-3">PROGRAMA ACTUAL</p>
          @if (program()) {
            <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-bold text-text truncate">{{ program()!.programName }}</p>
                  <p class="text-text-muted text-xs mt-0.5">
                    {{ modeLabel() }} · {{ program()!.routines.length }} rutinas
                  </p>
                </div>
                <cg-badge [text]="statusLabel()" [variant]="statusVariant()" [dot]="true" />
              </div>
              <cg-progress-bar
                [percentage]="progressPct()"
                [label]="'Semana ' + program()!.currentWeek + ' de ' + program()!.totalWeeks"
                [showLabel]="true"
                size="md" />
            </div>
          } @else {
            <cg-empty-state
              title="Sin programa asignado"
              subtitle="Tu entrenador aún no te ha asignado un programa." />
          }
        </section>

        <!-- Menu items -->
        <section class="bg-card border border-border rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between py-3.5 px-4 border-b border-border-light">
            <div class="flex items-center gap-3">
              <span class="text-base">⚙️</span>
              <span class="text-sm font-medium text-text">Configuración</span>
            </div>
            <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" stroke-width="2"
                 viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <div class="flex items-center justify-between py-3.5 px-4 border-b border-border-light">
            <div class="flex items-center gap-3">
              <span class="text-base">🔔</span>
              <span class="text-sm font-medium text-text">Notificaciones</span>
            </div>
            <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" stroke-width="2"
                 viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <button
            (click)="authStore.logout()"
            class="w-full flex items-center gap-3 py-3.5 px-4 hover:bg-danger/5 transition text-left">
            <span class="text-base">🚪</span>
            <span class="text-sm font-semibold text-danger">Cerrar sesión</span>
          </button>
        </section>

      }
    </div>
  `,
})
export class Profile implements OnInit {
  private api = inject(ApiService);
  authStore = inject(AuthStore);

  loading = signal(true);
  program = signal<MyProgramDto | null>(null);
  prCount = signal(0);
  sessionCount = signal(0);

  initial = computed(() => {
    const name = this.authStore.user()?.firstName ?? this.authStore.user()?.email ?? 'A';
    return name.charAt(0).toUpperCase();
  });

  displayName = computed(() => {
    const user = this.authStore.user();
    return user?.firstName ?? user?.email ?? 'Atleta';
  });

  memberSince = computed(() => {
    const p = this.program();
    if (p?.startDate) {
      const year = new Date(p.startDate).getFullYear();
      return String(year);
    }
    return '2026';
  });

  modeLabel = computed(() => {
    const mode = this.program()?.mode;
    return mode === 'Rotation' ? 'Rotación' : 'Días fijos';
  });

  statusLabel = computed(() => {
    const status = this.program()?.status;
    if (status === 'Active') return 'Activo';
    if (status === 'Completed') return 'Completado';
    if (status === 'Cancelled') return 'Cancelado';
    return '';
  });

  statusVariant = computed((): 'success' | 'neutral' | 'danger' => {
    const status = this.program()?.status;
    if (status === 'Active') return 'success';
    if (status === 'Completed') return 'neutral';
    return 'danger';
  });

  progressPct = computed(() => {
    const p = this.program();
    if (!p || p.totalWeeks === 0) return 0;
    return Math.round((p.currentWeek / p.totalWeeks) * 100);
  });

  ngOnInit() {
    const now = new Date();
    forkJoin({
      program: this.api.get<MyProgramDto>('/public/my/program'),
      records: this.api.get<PersonalRecordDto[]>('/public/my/records'),
      calendar: this.api.get<CalendarMonthDto>(`/public/my/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
    }).subscribe({
      next: ({ program, records, calendar }) => {
        this.program.set(program);
        this.prCount.set(records.length);
        this.sessionCount.set(calendar.sessions.filter(s => s.status === 'completed').length);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}

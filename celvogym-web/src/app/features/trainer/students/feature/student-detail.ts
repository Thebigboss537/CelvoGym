import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import {
  StudentDto,
  StudentOverviewDto,
  ProgramAssignmentDto,
  ProgramListDto,
} from '../../../../shared/models';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/ui/toast';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgStatCard } from '../../../../shared/ui/stat-card';
import { CgBadge } from '../../../../shared/ui/badge';
import { CgProgressBar } from '../../../../shared/ui/progress-bar';
import { CgTimeline, TimelineItem } from '../../../../shared/ui/timeline';
import { CgEmptyState } from '../../../../shared/ui/empty-state';
import { formatDateWithYear, formatDate } from '../../../../shared/utils/format-date';
import { GRADIENT_PAIRS, getInitials } from '../../../../shared/utils/display';

@Component({
  selector: 'app-student-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, CgSpinner, CgStatCard, CgBadge, CgProgressBar, CgTimeline, CgEmptyState],
  template: `
    <div class="animate-fade-up h-full overflow-y-auto">
      <!-- Mobile back link (hidden on desktop when used as inline panel) -->
      @if (!studentId()) {
        <a routerLink="/trainer/students"
          class="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text transition mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Alumnos
        </a>
      }

      @if (loading()) {
        <div class="flex justify-center pt-12">
          <cg-spinner />
        </div>
      } @else if (!student()) {
        <cg-empty-state
          title="Alumno no encontrado"
          subtitle="No pudimos cargar la información de este alumno." />
      } @else {

        <!-- Header -->
        <div class="flex items-start gap-4 mb-6">
          <!-- Avatar 56px gradient -->
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            [style.background]="avatarGradient()">
            {{ initials() }}
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="font-display text-xl font-bold text-text leading-tight">{{ student()!.displayName }}</h2>
            <p class="text-text-muted text-xs mt-0.5">Desde {{ formatDateWithYear(student()!.createdAt) }}</p>
            <div class="flex items-center gap-1.5 mt-1.5">
              <cg-badge
                [text]="student()!.isActive ? 'Activo' : 'Inactivo'"
                [variant]="student()!.isActive ? 'success' : 'neutral'"
                [dot]="true" />
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 shrink-0">
            <button
              class="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-border-light transition"
              title="Comentar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
              </svg>
            </button>
            <button
              class="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-border-light transition"
              title="Opciones">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Stats grid (2x2) -->
        @if (overview()) {
          <div class="grid grid-cols-2 gap-3 mb-6">
            <cg-stat-card
              label="Sesiones"
              [value]="overview()!.totalSessions.toString()" />
            <cg-stat-card
              label="Adherencia"
              [value]="overview()!.adherencePercentage + '%'"
              [valueColor]="adherenceColor()" />
            <cg-stat-card
              label="Racha"
              value="—" />
            <cg-stat-card
              label="PRs"
              value="—" />
          </div>
        }

        <!-- Current program card -->
        <div class="mb-6">
          @if (activeAssignment()) {
            <div class="rounded-2xl p-4 overflow-hidden"
              style="background: linear-gradient(135deg, #B31D2C 0%, #E62639 60%, #FF4D5E 100%)">
              <p class="text-overline text-white/60 mb-1">PROGRAMA ACTUAL</p>
              <div class="flex items-start justify-between gap-2 mb-3">
                <h3 class="font-display text-base font-bold text-white leading-tight">
                  {{ activeAssignment()!.programName }}
                </h3>
                <cg-badge
                  [text]="activeAssignment()!.mode === 'Rotation' ? 'Rotación' : 'Fijo'"
                  variant="neutral" />
              </div>
              <p class="text-white/70 text-xs mb-2">
                Semana {{ activeAssignment()!.currentWeek }} de {{ activeAssignment()!.totalWeeks }}
              </p>
              <cg-progress-bar
                [percentage]="weekProgress()"
                [showLabel]="false"
                size="md" />
            </div>
          } @else {
            <div class="bg-card border border-border rounded-2xl p-4">
              <p class="text-overline text-text-secondary mb-1">PROGRAMA ACTUAL</p>
              @if (showAssignForm()) {
                <div class="space-y-3 mt-2">
                  <div>
                    <label class="block text-xs text-text-secondary mb-1">Programa</label>
                    <select
                      [ngModel]="selectedProgramId()"
                      (ngModelChange)="selectedProgramId.set($event)"
                      class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary select-styled">
                      <option value="" disabled>Seleccionar programa</option>
                      @for (p of availablePrograms(); track p.id) {
                        <option [value]="p.id">{{ p.name }} ({{ p.durationWeeks }} sem)</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-text-secondary mb-1">Modo</label>
                    <div class="flex gap-2">
                      <button type="button" (click)="assignMode.set('Rotation')"
                        class="flex-1 py-2 rounded-lg text-xs font-semibold transition"
                        [class]="assignMode() === 'Rotation' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-bg-raised text-text-muted border border-border'">
                        Rotación
                      </button>
                      <button type="button" (click)="assignMode.set('Fixed')"
                        class="flex-1 py-2 rounded-lg text-xs font-semibold transition"
                        [class]="assignMode() === 'Fixed' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-bg-raised text-text-muted border border-border'">
                        Fijo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs text-text-secondary mb-1">Días de entrenamiento</label>
                    <div class="flex gap-1">
                      @for (d of weekDays; track d.value) {
                        <button type="button" (click)="toggleDay(d.value)"
                          class="w-9 h-9 rounded-lg text-[10px] font-semibold transition"
                          [class]="assignDays().includes(d.value) ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-bg-raised text-text-muted border border-border'">
                          {{ d.label }}
                        </button>
                      }
                    </div>
                  </div>
                  <div class="flex gap-2 pt-1">
                    <button type="button" (click)="showAssignForm.set(false)"
                      class="flex-1 py-2 bg-bg-raised border border-border text-text-secondary text-xs rounded-lg">
                      Cancelar
                    </button>
                    <button type="button" (click)="assignProgram()"
                      [disabled]="assigning() || !selectedProgramId() || assignDays().length === 0"
                      class="flex-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 press">
                      @if (assigning()) { Asignando... } @else { Asignar }
                    </button>
                  </div>
                </div>
              } @else {
                <p class="text-text-muted text-sm mb-3">Sin programa asignado</p>
                <button type="button" (click)="openAssignForm()"
                  class="w-full py-2 bg-primary/10 text-primary text-sm font-semibold rounded-lg border border-primary/20 hover:bg-primary/15 transition press">
                  Asignar programa
                </button>
              }
            </div>
          }
        </div>

        <!-- Activity timeline -->
        @if (timelineItems().length > 0) {
          <div class="bg-card border border-border rounded-2xl p-4">
            <h3 class="text-overline text-text-secondary mb-4">Actividad reciente</h3>
            <cg-timeline [items]="timelineItems()" />
          </div>
        }

      }
    </div>
  `,
})
export class StudentDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  /** When used inline from student-list on desktop, pass the studentId as input.
   *  When used as a standalone route, it falls back to reading from route params. */
  studentId = input<string | null>(null);

  formatDateWithYear = formatDateWithYear;
  formatDate = formatDate;

  private resolvedId = signal<string>('');

  loading = signal(true);
  student = signal<StudentDto | null>(null);
  overview = signal<StudentOverviewDto | null>(null);
  assignments = signal<ProgramAssignmentDto[]>([]);

  activeAssignment = computed(() =>
    this.assignments().find(a => a.status === 'Active') ?? null
  );

  // Assignment form state
  showAssignForm = signal(false);
  availablePrograms = signal<ProgramListDto[]>([]);
  selectedProgramId = signal('');
  assignMode = signal<'Rotation' | 'Fixed'>('Rotation');
  assignDays = signal<number[]>([]);
  assigning = signal(false);

  weekDays = [
    { label: 'LUN', value: 1 }, { label: 'MAR', value: 2 }, { label: 'MIÉ', value: 3 },
    { label: 'JUE', value: 4 }, { label: 'VIE', value: 5 }, { label: 'SÁB', value: 6 },
    { label: 'DOM', value: 0 },
  ];

  weekProgress = computed(() => {
    const a = this.activeAssignment();
    if (!a || a.totalWeeks === 0) return 0;
    return Math.round((a.currentWeek / a.totalWeeks) * 100);
  });

  adherenceColor = computed(() => {
    const pct = this.overview()?.adherencePercentage ?? 0;
    if (pct >= 70) return 'text-success';
    if (pct >= 40) return 'text-warning';
    return 'text-danger';
  });

  initials = computed(() => getInitials(this.student()?.displayName ?? ''));

  avatarGradient = computed(() => {
    const idx = this.resolvedId().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENT_PAIRS.length;
    const [from, to] = GRADIENT_PAIRS[idx];
    return `linear-gradient(135deg, ${from}, ${to})`;
  });

  timelineItems = computed<TimelineItem[]>(() => {
    const vol = this.overview()?.weeklyVolume ?? [];
    return vol
      .slice()
      .reverse()
      .slice(0, 6)
      .map(w => {
        const label = formatDate(w.weekStart);
        if (w.sessions === 0) {
          return { color: 'neutral' as const, title: `Semana del ${label}`, subtitle: 'Sin sesiones' };
        }
        const color = w.sessions >= 3 ? 'success' as const : 'info' as const;
        return {
          color,
          title: `Semana del ${label}`,
          subtitle: `${w.sessions} sesión${w.sessions !== 1 ? 'es' : ''} · ${w.completedSets} series`,
        };
      });
  });

  constructor() {
    // React to input changes (desktop inline panel) or stay on route param (mobile standalone)
    effect(() => {
      const inputId = this.studentId();
      if (inputId && inputId !== this.resolvedId()) {
        this.resolvedId.set(inputId);
        this.loadAll(inputId);
      }
    });
  }

  ngOnInit() {
    const routeId = this.route.snapshot.paramMap.get('studentId');
    if (routeId && !this.studentId()) {
      this.resolvedId.set(routeId);
      this.loadAll(routeId);
    }
  }

  private loadAll(id: string) {
    this.loading.set(true);
    this.student.set(null);
    this.overview.set(null);
    this.assignments.set([]);

    // Load student info (find from full list)
    this.api.get<StudentDto[]>('/students').subscribe({
      next: (data) => {
        const found = data.find(s => s.id === id) ?? null;
        this.student.set(found);
        // loading done when overview arrives
      },
    });

    // Overview
    this.api.get<StudentOverviewDto>(`/students/${id}/overview`).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Assignments
    this.api.get<ProgramAssignmentDto[]>(`/program-assignments?studentId=${id}`).subscribe({
      next: (data) => this.assignments.set(data),
    });
  }

  openAssignForm(): void {
    this.api.get<ProgramListDto[]>('/programs').subscribe({
      next: (programs) => {
        this.availablePrograms.set(programs);
        this.selectedProgramId.set('');
        this.assignMode.set('Rotation');
        this.assignDays.set([]);
        this.showAssignForm.set(true);
      },
    });
  }

  toggleDay(day: number): void {
    this.assignDays.update(days =>
      days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    );
  }

  assignProgram(): void {
    const studentId = this.resolvedId();
    const programId = this.selectedProgramId();
    if (!studentId || !programId) return;

    this.assigning.set(true);
    this.api.post<ProgramAssignmentDto>('/program-assignments', {
      programId,
      studentId,
      mode: this.assignMode(),
      trainingDays: this.assignDays(),
    }).subscribe({
      next: (assignment) => {
        this.assignments.update(list => [...list, assignment]);
        this.showAssignForm.set(false);
        this.assigning.set(false);
        this.toast.show('Programa asignado');
      },
      error: (err) => {
        this.assigning.set(false);
        this.toast.show(err.error?.error ?? 'Error al asignar programa', 'error');
      },
    });
  }
}

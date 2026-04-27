import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { StudentDto, StudentOverviewDto, ProgramAssignmentDto, RecentFeedbackDto } from '../../../../shared/models';
import { ToastService } from '../../../../shared/ui/toast';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxBadge } from '../../../../shared/ui/badge';
import { KxEmptyState } from '../../../../shared/ui/empty-state';
import { KxSegmentedControl } from '../../../../shared/ui/segmented-control';
import { GRADIENT_PAIRS, getInitials } from '../../../../shared/utils/display';
import { formatDateWithYear } from '../../../../shared/utils/format-date';
import { StudentDetailSummary } from './student-detail-summary';
import { StudentDetailProgram } from './student-detail-program';
import { StudentDetailProgress } from './student-detail-progress';
import { StudentDetailNotes } from './student-detail-notes';

type TabId = 'summary' | 'program' | 'progress' | 'notes';

@Component({
  selector: 'app-student-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KxSpinner, KxBadge, KxEmptyState, KxSegmentedControl,
    StudentDetailSummary, StudentDetailProgram, StudentDetailProgress, StudentDetailNotes],
  template: `
    <div class="animate-fade-up h-full overflow-y-auto">
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
        <div class="flex justify-center pt-12"><kx-spinner /></div>
      } @else if (!student()) {
        <kx-empty-state
          title="Alumno no encontrado"
          subtitle="No pudimos cargar la información de este alumno." />
      } @else {
        <div class="flex items-start gap-4 mb-6">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            [style.background]="avatarGradient()">
            {{ initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-display text-xl font-bold text-text leading-tight">{{ student()!.displayName }}</h2>
            <p class="text-text-muted text-xs mt-0.5">Desde {{ formatDateWithYear(student()!.createdAt) }}</p>
            <div class="flex items-center gap-1.5 mt-1.5">
              <kx-badge
                [text]="student()!.isActive ? 'Activo' : 'Inactivo'"
                [variant]="student()!.isActive ? 'success' : 'neutral'"
                [dot]="true" />
            </div>
          </div>
        </div>

        <kx-segmented-control
          class="block mb-4"
          [options]="tabOptions()"
          [selected]="selectedTabLabel()"
          (selectedChange)="setTabByLabel($event)" />

        @switch (tab()) {
          @case ('summary') {
            <app-student-detail-summary
              [student]="student()!"
              [overview]="overview()"
              [unreadFeedbackCount]="recentFeedback()?.unreadCount ?? 0"
              (openProgress)="setTab('progress')" />
          }
          @case ('program') {
            <app-student-detail-program
              [studentId]="resolvedId()"
              [assignments]="assignments()"
              (assignmentsChange)="assignments.set($event)" />
          }
          @case ('progress') {
            <app-student-detail-progress [studentId]="resolvedId()" />
          }
          @case ('notes') {
            <app-student-detail-notes [studentId]="resolvedId()" />
          }
        }
      }
    </div>
  `,
})
export class StudentDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  studentId = input<string | null>(null);
  resolvedId = signal<string>('');

  loading = signal(true);
  student = signal<StudentDto | null>(null);
  overview = signal<StudentOverviewDto | null>(null);
  assignments = signal<ProgramAssignmentDto[]>([]);
  recentFeedback = signal<RecentFeedbackDto | null>(null);

  tab = signal<TabId>('summary');

  private readonly TAB_LABELS: Record<TabId, string> = {
    summary: 'Resumen',
    program: 'Programa',
    progress: 'Progreso',
    notes: 'Notas',
  };

  private readonly LABEL_TO_TAB: Record<string, TabId> = {
    'Resumen': 'summary',
    'Programa': 'program',
    'Notas': 'notes',
  };

  tabOptions = computed(() => {
    const unread = this.recentFeedback()?.unreadCount ?? 0;
    const progressLabel = unread > 0 ? `Progreso (${unread})` : 'Progreso';
    this.LABEL_TO_TAB[progressLabel] = 'progress';
    return ['Resumen', 'Programa', progressLabel, 'Notas'];
  });

  selectedTabLabel = computed(() => {
    const unread = this.recentFeedback()?.unreadCount ?? 0;
    if (this.tab() === 'progress' && unread > 0) return `Progreso (${unread})`;
    return this.TAB_LABELS[this.tab()];
  });

  formatDateWithYear = formatDateWithYear;
  initials = computed(() => getInitials(this.student()?.displayName ?? ''));
  avatarGradient = computed(() => {
    const idx = this.resolvedId().split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENT_PAIRS.length;
    const [from, to] = GRADIENT_PAIRS[idx];
    return `linear-gradient(135deg, ${from}, ${to})`;
  });

  setTab(t: TabId): void { this.tab.set(t); }
  setTabByLabel(label: string): void {
    const tab = this.LABEL_TO_TAB[label];
    if (tab) this.tab.set(tab);
  }

  constructor() {
    effect(() => {
      const id = this.studentId();
      if (id && id !== this.resolvedId()) {
        this.resolvedId.set(id);
        this.loadAll(id);
      }
    });
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('studentId');
    if (routeId && !this.studentId()) {
      this.resolvedId.set(routeId);
      this.loadAll(routeId);
    }
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.student.set(null);
    this.overview.set(null);
    this.assignments.set([]);
    this.recentFeedback.set(null);

    this.api.get<StudentDto[]>('/students').subscribe({
      next: (list) => this.student.set(list.find(s => s.id === id) ?? null),
    });
    this.api.get<StudentOverviewDto>(`/students/${id}/overview`).subscribe({
      next: (data) => { this.overview.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<ProgramAssignmentDto[]>(`/program-assignments?studentId=${id}&activeOnly=false`).subscribe({
      next: (data) => this.assignments.set(data),
    });
    this.api.get<RecentFeedbackDto>(`/students/${id}/recent-feedback`).subscribe({
      next: (data) => this.recentFeedback.set(data),
    });
  }
}

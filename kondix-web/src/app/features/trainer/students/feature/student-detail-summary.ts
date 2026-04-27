import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { StudentDto, StudentOverviewDto } from '../../../../shared/models';
import { KxStatCard } from '../../../../shared/ui/stat-card';

@Component({
  selector: 'app-student-detail-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KxStatCard],
  template: `
    @if (unreadFeedbackCount() > 0) {
      <button type="button"
        class="w-full mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-left hover:bg-primary/15 transition press flex items-center gap-3"
        (click)="openProgress.emit()">
        <span class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
          {{ unreadFeedbackCount() }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-primary">Hay feedback nuevo</p>
          <p class="text-xs text-text-muted">Toca para ver las notas y RPE de las últimas sesiones</p>
        </div>
        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    }
    @if (overview(); as ov) {
      <div class="grid grid-cols-2 gap-3 mb-6">
        <kx-stat-card label="Sesiones" [value]="ov.totalSessions.toString()" />
        <kx-stat-card label="Adherencia" [value]="ov.adherencePercentage + '%'"
          [valueColor]="adherenceColor()" />
        <kx-stat-card label="Racha" value="—" />
        <kx-stat-card label="PRs" value="—" />
      </div>
    }
  `,
})
export class StudentDetailSummary {
  student = input.required<StudentDto>();
  overview = input<StudentOverviewDto | null>(null);
  unreadFeedbackCount = input<number>(0);
  openProgress = output<void>();

  adherenceColor = computed(() => {
    const pct = this.overview()?.adherencePercentage ?? 0;
    if (pct >= 70) return 'text-success';
    if (pct >= 40) return 'text-warning';
    return 'text-danger';
  });
}

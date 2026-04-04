import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { PersonalRecordDto, BodyMetricDto, StudentOverviewDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgLineChart, ChartPoint } from '../../../../shared/ui/line-chart';

@Component({
  selector: 'app-student-detail',
  imports: [RouterLink, CgSpinner, CgLineChart],
  template: `
    <div class="animate-fade-up">
      <a routerLink="/trainer/students" class="text-text-muted text-sm hover:text-text transition">← Alumnos</a>
      <h1 class="font-display text-2xl font-bold mt-1 mb-6">{{ studentName() }}</h1>

      @if (loading()) {
        <cg-spinner />
      } @else {
        <!-- Overview stats -->
        @if (overview()) {
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="bg-card border border-border rounded-xl p-3 text-center">
              <p class="text-xl font-bold text-text">{{ overview()!.totalSessions }}</p>
              <p class="text-xs text-text-muted">Sesiones</p>
            </div>
            <div class="bg-card border border-border rounded-xl p-3 text-center">
              <p class="text-xl font-bold text-primary">{{ overview()!.sessionsThisWeek }}</p>
              <p class="text-xs text-text-muted">Esta semana</p>
            </div>
            <div class="bg-card border border-border rounded-xl p-3 text-center">
              <p class="text-xl font-bold"
                [class.text-success]="overview()!.adherencePercentage >= 70"
                [class.text-warning]="overview()!.adherencePercentage >= 40 && overview()!.adherencePercentage < 70"
                [class.text-danger]="overview()!.adherencePercentage < 40">
                {{ overview()!.adherencePercentage }}%
              </p>
              <p class="text-xs text-text-muted">Adherencia</p>
            </div>
          </div>

          <!-- Weekly volume chart -->
          @if (volumeChartData().length > 1) {
            <div class="bg-card border border-border rounded-xl p-4 mb-6">
              <h3 class="text-overline text-text-secondary mb-3">Volumen semanal (series)</h3>
              <cg-line-chart [points]="volumeChartData()" />
            </div>
          }
        }

        <!-- Body weight chart -->
        @if (weightChartData().length > 1) {
          <div class="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 class="text-overline text-text-secondary mb-3">Peso corporal (kg)</h3>
            <cg-line-chart [points]="weightChartData()" />
          </div>
        }

        <!-- PRs -->
        @if (records().length > 0) {
          <div class="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 class="text-overline text-text-secondary mb-3">Records personales</h3>
            <div class="space-y-1.5">
              @for (pr of records(); track pr.id) {
                <div class="flex items-center justify-between bg-bg-raised rounded-lg px-3 py-2">
                  <span class="text-sm text-text">{{ pr.exerciseName }}</span>
                  <span class="text-primary font-bold text-sm">{{ pr.weight }}</span>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class StudentDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  studentName = signal('');
  loading = signal(true);
  overview = signal<StudentOverviewDto | null>(null);
  records = signal<PersonalRecordDto[]>([]);
  bodyMetrics = signal<BodyMetricDto[]>([]);
  volumeChartData = signal<ChartPoint[]>([]);
  weightChartData = signal<ChartPoint[]>([]);

  private studentId = '';

  ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('studentId')!;
    this.studentName.set(this.route.snapshot.queryParamMap.get('name') ?? 'Alumno');
    this.loadAll();
  }

  private loadAll() {
    // Overview
    this.api.get<StudentOverviewDto>(`/analytics/student/${this.studentId}/overview`).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.volumeChartData.set(data.weeklyVolume.map(w => ({
          label: w.weekStart.slice(5),
          value: w.completedSets,
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // PRs
    this.api.get<PersonalRecordDto[]>(`/analytics/student/${this.studentId}/records`).subscribe({
      next: (data) => this.records.set(data),
    });

    // Body metrics
    this.api.get<BodyMetricDto[]>(`/analytics/student/${this.studentId}/body-metrics`).subscribe({
      next: (data) => {
        this.bodyMetrics.set(data);
        const withWeight = data.filter(m => m.weight != null).reverse();
        this.weightChartData.set(withWeight.map(m => ({
          label: m.recordedAt,
          value: m.weight!,
        })));
      },
    });
  }
}

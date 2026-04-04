import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PersonalRecordDto } from '../../../shared/models';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgEmptyState } from '../../../shared/ui/empty-state';
import { formatDateWithYear } from '../../../shared/utils/format-date';

@Component({
  selector: 'app-my-records',
  imports: [RouterLink, CgSpinner, CgEmptyState],
  template: `
    <div class="animate-fade-up">
      <a routerLink="/workout" class="text-text-muted text-sm hover:text-text transition">← Volver</a>
      <h1 class="font-display text-2xl font-bold mt-1 mb-6">Mis Records</h1>

      @if (loading()) {
        <cg-spinner />
      } @else if (records().length === 0) {
        <cg-empty-state
          title="Sin records aún"
          subtitle="Completa entrenamientos para registrar tus PRs" />
      } @else {
        <div class="space-y-2 stagger">
          @for (pr of records(); track pr.id) {
            <div class="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p class="font-medium text-text text-sm">{{ pr.exerciseName }}</p>
                <p class="text-text-muted text-xs">{{ formatDateWithYear(pr.achievedAt) }}</p>
              </div>
              <div class="text-right">
                <p class="text-primary font-bold text-lg tabular-nums">{{ pr.weight }}</p>
                @if (pr.reps) {
                  <p class="text-text-muted text-xs">{{ pr.reps }} reps</p>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyRecords implements OnInit {
  private api = inject(ApiService);
  formatDateWithYear = formatDateWithYear;

  records = signal<PersonalRecordDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<PersonalRecordDto[]>('/public/my/records').subscribe({
      next: (data) => { this.records.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

}

import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgAvatar } from '../../../shared/ui/avatar';

interface DashboardData {
  totalStudents: number;
  activeThisWeek: number;
  recentActivity: { studentId: string; studentName: string; dayName: string; status: string; timeAgo: string }[];
  alerts: { type: string; message: string; studentId: string | null }[];
  pinnedNotes: { studentId: string; studentName: string; text: string }[];
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CgSpinner, CgAvatar],
  template: `
    <div class="animate-fade-up">
      <h1 class="font-display text-2xl font-bold mb-6">Dashboard</h1>

      @if (loading()) {
        <cg-spinner />
      } @else if (data()) {
        <!-- Summary -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-card border border-border rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-text">{{ data()!.totalStudents }}</p>
            <p class="text-xs text-text-muted">Alumnos</p>
          </div>
          <div class="bg-card border border-border rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-primary">{{ data()!.activeThisWeek }}</p>
            <p class="text-xs text-text-muted">Activos esta semana</p>
          </div>
        </div>

        <!-- Alerts -->
        @if (data()!.alerts.length > 0) {
          <div class="bg-warning/5 border border-warning/20 rounded-xl p-4 mb-6">
            <h3 class="text-overline text-warning mb-2">Requieren atención</h3>
            <div class="space-y-1.5">
              @for (alert of data()!.alerts; track $index) {
                <p class="text-sm text-text">{{ alert.message }}</p>
              }
            </div>
          </div>
        }

        <!-- Recent Activity -->
        <div class="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 class="text-overline text-text-secondary mb-3">Actividad reciente</h3>
          @if (data()!.recentActivity.length > 0) {
            <div class="space-y-2">
              @for (activity of data()!.recentActivity; track $index) {
                <div class="flex items-center gap-2">
                  <span class="text-xs" [class.text-success]="activity.status === 'completed'" [class.text-warning]="activity.status !== 'completed'">
                    {{ activity.status === 'completed' ? '✓' : '◐' }}
                  </span>
                  <cg-avatar [name]="activity.studentName" size="sm" />
                  <div class="flex-1 min-w-0">
                    <span class="text-sm text-text truncate">{{ activity.studentName }}</span>
                    <span class="text-text-muted text-xs ml-1">— {{ activity.dayName }}</span>
                  </div>
                  <span class="text-xs text-text-muted shrink-0">{{ activity.timeAgo }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="text-text-muted text-xs text-center py-2">Sin actividad reciente</p>
          }
        </div>

        <!-- Pinned Notes -->
        @if (data()!.pinnedNotes.length > 0) {
          <div class="bg-card border border-border rounded-xl p-4">
            <h3 class="text-overline text-text-secondary mb-3">Notas fijadas</h3>
            <div class="space-y-2">
              @for (note of data()!.pinnedNotes; track $index) {
                <div class="bg-bg-raised rounded-lg px-3 py-2 border-l-2 border-l-warning">
                  <span class="text-xs text-warning font-medium">{{ note.studentName }}</span>
                  <p class="text-sm text-text mt-0.5">{{ note.text }}</p>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);

  data = signal<DashboardData | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.api.get<DashboardData>('/dashboard').subscribe({
      next: (data) => { this.data.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

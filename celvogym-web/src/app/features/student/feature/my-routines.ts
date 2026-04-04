import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { StudentRoutineListDto } from '../../../shared/models';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgEmptyState } from '../../../shared/ui/empty-state';
import { progressColor } from '../../../shared/utils/labels';

@Component({
  selector: 'app-my-routines',
  imports: [RouterLink, CgSpinner, CgEmptyState],
  template: `
    <div class="animate-fade-up">
      <h1 class="font-display text-2xl font-bold mb-6">Mis rutinas</h1>

      @if (loading()) {
        <cg-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (routines().length === 0) {
        <cg-empty-state
          title="Tu rutina te espera"
          subtitle="Tu entrenador te asignará una rutina pronto" />
      } @else {
        <div class="space-y-3 stagger">
          @for (routine of routines(); track routine.id) {
            <a [routerLink]="routine.id"
              class="block bg-card hover:bg-card-hover border border-border rounded-xl p-4 transition press"
              [class.glow-complete]="routine.progress.percentage === 100">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-text">{{ routine.name }}</h3>
                  @if (routine.description) {
                    <p class="text-text-secondary text-sm mt-0.5 line-clamp-1">{{ routine.description }}</p>
                  }
                </div>
                <span class="text-sm font-bold shrink-0 ml-3 tabular-nums"
                  [style.color]="progressColor(routine.progress.percentage)">
                  {{ routine.progress.percentage }}%
                </span>
              </div>

              <!-- Progress bar -->
              <div class="mt-3 h-1.5 bg-bg-raised rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 progress-fill"
                  [style.width.%]="routine.progress.percentage">
                </div>
              </div>

              <div class="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span>{{ routine.dayCount }} días</span>
                <span>{{ routine.progress.completedEffectiveSets }}/{{ routine.progress.totalEffectiveSets }} series</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class MyRoutines implements OnInit {
  private api = inject(ApiService);
  progressColor = progressColor;

  routines = signal<StudentRoutineListDto[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.loadData();
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  private loadData() {
    this.api.get<StudentRoutineListDto[]>('/public/my/routines').subscribe({
      next: (data) => { this.routines.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar tus rutinas. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }
}

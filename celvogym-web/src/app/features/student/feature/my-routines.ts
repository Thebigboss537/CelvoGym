import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { MyProgramDto, StudentRoutineListDto } from '../../../shared/models';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgEmptyState } from '../../../shared/ui/empty-state';
import { progressColor } from '../../../shared/utils/labels';

@Component({
  selector: 'app-my-routines',
  imports: [RouterLink, CgSpinner, CgEmptyState],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <cg-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (!program()) {
        <cg-empty-state
          title="Tu programa te espera"
          subtitle="Tu entrenador te asignará un programa pronto" />
      } @else {
        <!-- Program header -->
        <div class="mb-6">
          <h1 class="font-display text-2xl font-bold">{{ program()!.programName }}</h1>
          @if (program()!.description) {
            <p class="text-text-secondary text-sm mt-1">{{ program()!.description }}</p>
          }
          <div class="flex items-center gap-3 mt-3">
            <span class="text-xs bg-bg-raised text-text-muted px-2.5 py-1 rounded-lg">
              Semana {{ program()!.currentWeek }}/{{ program()!.totalWeeks }}
            </span>
            <span class="text-xs bg-bg-raised text-text-muted px-2.5 py-1 rounded-lg">
              {{ program()!.mode === 'Rotation' ? 'Rotación' : 'Días fijos' }}
            </span>
          </div>
          <!-- Program progress bar -->
          <div class="mt-3 h-2 bg-bg-raised rounded-full overflow-hidden">
            <div class="h-full rounded-full bg-primary transition-all duration-500"
              [style.width.%]="Math.min(100, (program()!.currentWeek / program()!.totalWeeks) * 100)">
            </div>
          </div>
        </div>

        <!-- Routines list -->
        <h2 class="font-display text-lg font-semibold mb-3">Rutinas</h2>
        <div class="space-y-3 stagger">
          @for (routine of program()!.routines; track routine.id) {
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
  Math = Math;

  program = signal<MyProgramDto | null>(null);
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
    this.api.get<MyProgramDto>('/public/my/program').subscribe({
      next: (data) => { this.program.set(data); this.loading.set(false); },
      error: (err) => {
        if (err.status === 204) {
          this.program.set(null);
          this.loading.set(false);
          return;
        }
        this.error.set(err.error?.error || 'No pudimos cargar tu programa. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }
}

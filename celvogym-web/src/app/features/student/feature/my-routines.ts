import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { StudentRoutineListDto } from '../../../shared/models';

@Component({
  selector: 'app-my-routines',
  imports: [RouterLink],
  template: `
    <div class="animate-fade-up">
      <h2 class="font-[var(--font-display)] text-2xl font-bold mb-6">Mis rutinas</h2>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (routines().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-muted text-lg">No tienes rutinas asignadas</p>
          <p class="text-text-muted text-sm mt-1">Espera a que tu entrenador te asigne una rutina</p>
        </div>
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
                <span class="text-sm font-bold shrink-0 ml-3"
                  [class.text-primary]="routine.progress.percentage < 100"
                  [class.text-success]="routine.progress.percentage === 100">
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

  routines = signal<StudentRoutineListDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<StudentRoutineListDto[]>('/public/my/routines').subscribe({
      next: (data) => { this.routines.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

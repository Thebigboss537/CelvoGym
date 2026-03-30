import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineListDto } from '../../../../shared/models';

@Component({
  selector: 'app-routine-list',
  imports: [RouterLink],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-[var(--font-display)] text-2xl font-bold">Rutinas</h2>
        <a
          routerLink="new"
          class="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition press"
        >+ Nueva rutina</a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (routines().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-muted text-lg">No tienes rutinas aún</p>
          <p class="text-text-muted text-sm mt-1">Crea tu primera rutina para comenzar</p>
        </div>
      } @else {
        <div class="space-y-3 stagger">
          @for (routine of routines(); track routine.id) {
            <a
              [routerLink]="routine.id"
              class="block bg-card hover:bg-card-hover border border-border rounded-xl p-4 transition press"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-text">{{ routine.name }}</h3>
                  @if (routine.description) {
                    <p class="text-text-secondary text-sm mt-0.5 line-clamp-1">{{ routine.description }}</p>
                  }
                </div>
                <span class="text-text-muted text-xs shrink-0 ml-3">{{ routine.dayCount }} días</span>
              </div>
              <div class="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span>{{ routine.exerciseCount }} ejercicios</span>
                <span>·</span>
                <span>{{ formatDate(routine.updatedAt) }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class RoutineList implements OnInit {
  private api = inject(ApiService);

  routines = signal<RoutineListDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<RoutineListDto[]>('/routines').subscribe({
      next: (data) => {
        this.routines.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

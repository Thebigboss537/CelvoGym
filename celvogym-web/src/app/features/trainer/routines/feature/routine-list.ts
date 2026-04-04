import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineListDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgEmptyState } from '../../../../shared/ui/empty-state';
import { formatDateWithYear } from '../../../../shared/utils/format-date';

@Component({
  selector: 'app-routine-list',
  imports: [RouterLink, CgSpinner, CgEmptyState],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold">Rutinas</h1>
        <a
          routerLink="new"
          class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition press"
        >+ Nueva rutina</a>
      </div>

      @if (loading()) {
        <cg-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (routines().length === 0) {
        <cg-empty-state
          title="Aún no hay rutinas"
          subtitle="Creá tu primera rutina para empezar">
          <a routerLink="new"
            class="inline-block mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition press">
            + Crear rutina
          </a>
        </cg-empty-state>
      } @else {
        <!-- Category filter -->
        @if (categories().length > 0) {
          <div class="flex gap-1.5 mb-4 flex-wrap">
            <button (click)="filterCategory.set(null)"
              class="text-xs px-2.5 py-1 rounded-full border transition"
              [class]="!filterCategory() ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'">
              Todas
            </button>
            @for (cat of categories(); track cat) {
              <button (click)="filterCategory.set(cat)"
                class="text-xs px-2.5 py-1 rounded-full border transition"
                [class]="filterCategory() === cat ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'">
                {{ cat }}
              </button>
            }
          </div>
        }

        <div class="space-y-3 stagger">
          @for (routine of filtered(); track routine.id) {
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
              @if (routine.tags.length > 0) {
                <div class="flex gap-1 mt-1.5 flex-wrap">
                  @for (tag of routine.tags; track tag) {
                    <span class="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{{ tag }}</span>
                  }
                </div>
              }
              <div class="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span>{{ routine.exerciseCount }} ejercicios</span>
                @if (routine.category) {
                  <span>·</span>
                  <span>{{ routine.category }}</span>
                }
                <span>·</span>
                <span>{{ formatDateWithYear(routine.updatedAt) }}</span>
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
  formatDateWithYear = formatDateWithYear;

  routines = signal<RoutineListDto[]>([]);
  loading = signal(true);
  error = signal('');
  filterCategory = signal<string | null>(null);

  categories = computed(() => {
    const cats = new Set(this.routines().map(r => r.category).filter((c): c is string => !!c));
    return [...cats].sort();
  });

  filtered = computed(() => {
    const cat = this.filterCategory();
    if (!cat) return this.routines();
    return this.routines().filter(r => r.category === cat);
  });

  ngOnInit() {
    this.loadData();
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  private loadData() {
    this.api.get<RoutineListDto[]>('/routines').subscribe({
      next: (data) => {
        this.routines.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar las rutinas. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }

}

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineListDto } from '../../../../shared/models';
import { KxBadge } from '../../../../shared/ui/badge';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxEmptyState } from '../../../../shared/ui/empty-state';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';
import { relativeDate } from '../../../../shared/utils/format-date';

@Component({
  selector: 'app-routine-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KxBadge, KxSpinner, KxEmptyState, KxConfirmDialog],
  template: `
    <div class="animate-fade-up px-4 sm:px-6 md:px-8 pt-6 pb-nav-safe md:pb-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 data-testid="routine-list-title" class="font-display text-2xl font-extrabold">Rutinas</h1>
        <a
          routerLink="new"
          data-testid="routine-list-new"
          class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition press"
        >+ Nueva rutina</a>
      </div>

      @if (loading()) {
        <kx-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (routines().length === 0) {
        <kx-empty-state
          data-testid="routine-list-empty"
          title="Sin rutinas"
          subtitle="Creá tu primera rutina para empezar">
          <a routerLink="new"
            data-testid="routine-list-empty-new"
            class="inline-block mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition press">
            + Crear rutina
          </a>
        </kx-empty-state>
      } @else {
        <!-- Category filter chips -->
        @if (categories().length > 0) {
          <div class="flex gap-1.5 mb-4 flex-wrap">
            <button (click)="filterCategory.set(null)"
              data-testid="routine-chip-all"
              class="text-xs px-3 py-1 rounded-full border transition"
              [class]="!filterCategory()
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-card text-text-secondary border-border hover:border-border-light'">
              Todas
            </button>
            @for (cat of categories(); track cat) {
              <button (click)="filterCategory.set(cat)"
                [attr.data-testid]="'routine-chip-' + cat"
                class="text-xs px-3 py-1 rounded-full border transition"
                [class]="filterCategory() === cat
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-card text-text-secondary border-border hover:border-border-light'">
                {{ cat }}
              </button>
            }
          </div>
        }

        <!-- Routine cards -->
        <div class="flex flex-col gap-3 stagger">
          @for (routine of filtered(); track routine.id) {
            <!-- Overlay to close menu on click-outside -->
            @if (openMenuId() === routine.id) {
              <div class="fixed inset-0 z-10" (click)="openMenuId.set(null)"></div>
            }
            <div
              (click)="navigateTo(routine.id)"
              [attr.data-testid]="'routine-card-' + routine.id"
              class="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:bg-card-hover transition-colors"
            >
              <!-- Top row -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap min-w-0">
                  <span class="font-semibold text-text truncate">{{ routine.name }}</span>
                  @if (routine.category) {
                    <kx-badge [text]="routine.category" variant="info" />
                  }
                </div>
                <!-- Context menu -->
                <div class="relative z-20 shrink-0">
                  <button
                    (click)="$event.stopPropagation(); toggleMenu(routine.id)"
                    [attr.data-testid]="'routine-card-' + routine.id + '-menu'"
                    class="text-text-muted hover:text-text w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-raised transition text-lg leading-none"
                    aria-label="Más opciones"
                  >⋯</button>
                  @if (openMenuId() === routine.id) {
                    <div class="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-xl py-1 w-36 z-30"
                      (click)="$event.stopPropagation()">
                      <button
                        (click)="openMenuId.set(null); navigateTo(routine.id + '/edit')"
                        [attr.data-testid]="'routine-card-' + routine.id + '-edit'"
                        class="w-full text-left text-sm px-3 py-2 hover:bg-bg-raised text-text transition">
                        Editar
                      </button>
                      <button
                        (click)="openMenuId.set(null); duplicateRoutine(routine.id)"
                        [attr.data-testid]="'routine-card-' + routine.id + '-duplicate'"
                        class="w-full text-left text-sm px-3 py-2 hover:bg-bg-raised text-text transition">
                        Duplicar
                      </button>
                      <button
                        (click)="openMenuId.set(null); requestDelete(routine.id)"
                        [attr.data-testid]="'routine-card-' + routine.id + '-delete'"
                        class="w-full text-left text-sm px-3 py-2 hover:bg-bg-raised text-danger transition">
                        Eliminar
                      </button>
                    </div>
                  }
                </div>
              </div>
              <!-- Bottom row -->
              <p class="text-xs text-text-secondary mt-2">
                {{ routine.dayCount }} días · {{ routine.exerciseCount }} ejercicios · Editada {{ relativeDate(routine.updatedAt) }}
              </p>
            </div>
          }
        </div>
      }
    </div>

    <!-- Delete confirm dialog -->
    <kx-confirm-dialog
      data-testid="routine-delete-dialog"
      [open]="showDeleteDialog()"
      title="Eliminar rutina"
      message="Esta acción no se puede deshacer. ¿Estás seguro?"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="confirmDelete()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class RoutineList implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);
  relativeDate = relativeDate;

  routines = signal<RoutineListDto[]>([]);
  loading = signal(true);
  error = signal('');
  filterCategory = signal<string | null>(null);
  openMenuId = signal<string | null>(null);
  showDeleteDialog = signal(false);
  private deleteTargetId = signal<string | null>(null);

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

  navigateTo(path: string) {
    this.router.navigate(['/trainer/routines', path]);
  }

  toggleMenu(id: string) {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  duplicateRoutine(id: string) {
    this.api.post<RoutineListDto>(`/routines/${id}/duplicate`, {}).subscribe({
      next: () => {
        this.toast.show('Rutina duplicada');
        this.loadData();
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'No pudimos duplicar la rutina', 'error');
      },
    });
  }

  requestDelete(id: string) {
    this.deleteTargetId.set(id);
    this.showDeleteDialog.set(true);
  }

  confirmDelete() {
    const id = this.deleteTargetId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.api.delete(`/routines/${id}`).subscribe({
      next: () => {
        this.toast.show('Rutina eliminada');
        this.loadData();
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'No pudimos eliminar la rutina', 'error');
      },
    });
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

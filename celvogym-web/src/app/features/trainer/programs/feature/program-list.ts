import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ProgramListDto } from '../../../../shared/models';
import { CgBadge } from '../../../../shared/ui/badge';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgEmptyState } from '../../../../shared/ui/empty-state';
import { CgConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';

function relativeDate(iso: string): string {
  const date = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  const today = new Date();
  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`;
}

@Component({
  selector: 'app-program-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CgBadge, CgSpinner, CgEmptyState, CgConfirmDialog],
  template: `
    <div class="animate-fade-up">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-extrabold">Programas</h1>
        <a
          routerLink="new"
          class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition press"
        >+ Nuevo programa</a>
      </div>

      @if (loading()) {
        <cg-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (programs().length === 0) {
        <cg-empty-state
          title="Sin programas"
          subtitle="Crea un programa para agrupar rutinas con duración y asignarlo a tus alumnos">
          <a routerLink="new"
            class="inline-block mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition press">
            + Nuevo programa
          </a>
        </cg-empty-state>
      } @else {
        <!-- Program grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 stagger">
          @for (program of programs(); track program.id) {
            <!-- Click-outside overlay for context menu -->
            @if (openMenuId() === program.id) {
              <div class="fixed inset-0 z-10" (click)="openMenuId.set(null)"></div>
            }
            <div
              (click)="navigateTo(program.id)"
              class="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:bg-card-hover transition-colors"
            >
              <!-- Top row -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap min-w-0">
                  <span class="font-semibold text-text truncate">{{ program.name }}</span>
                  <cg-badge [text]="program.durationWeeks + ' sem'" variant="neutral" />
                </div>
                <!-- Context menu -->
                <div class="relative z-20 shrink-0">
                  <button
                    (click)="$event.stopPropagation(); toggleMenu(program.id)"
                    class="text-text-muted hover:text-text w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-raised transition text-lg leading-none"
                    aria-label="Más opciones"
                  >⋯</button>
                  @if (openMenuId() === program.id) {
                    <div class="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-xl py-1 w-36 z-30"
                      (click)="$event.stopPropagation()">
                      <button
                        (click)="openMenuId.set(null); navigateTo(program.id + '/edit')"
                        class="w-full text-left text-sm px-3 py-2 hover:bg-bg-raised text-text transition">
                        Editar
                      </button>
                      <button
                        (click)="openMenuId.set(null); requestDelete(program.id)"
                        class="w-full text-left text-sm px-3 py-2 hover:bg-bg-raised text-danger transition">
                        Eliminar
                      </button>
                    </div>
                  }
                </div>
              </div>

              @if (program.description) {
                <p class="text-xs text-text-secondary mt-1.5 line-clamp-1">{{ program.description }}</p>
              }

              <!-- Bottom row -->
              <p class="text-xs text-text-secondary mt-2">
                {{ program.routineCount }} rutina{{ program.routineCount !== 1 ? 's' : '' }} · Editado {{ relativeDate(program.updatedAt) }}
              </p>
            </div>
          }
        </div>
      }
    </div>

    <!-- Delete confirm dialog -->
    <cg-confirm-dialog
      [open]="showDeleteDialog()"
      title="Eliminar programa"
      message="Esta acción no se puede deshacer. ¿Estás seguro?"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="confirmDelete()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class ProgramList implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);
  relativeDate = relativeDate;

  programs = signal<ProgramListDto[]>([]);
  loading = signal(true);
  error = signal('');
  openMenuId = signal<string | null>(null);
  showDeleteDialog = signal(false);
  private deleteTargetId = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  navigateTo(path: string) {
    this.router.navigate(['/trainer/programs', path]);
  }

  toggleMenu(id: string) {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  requestDelete(id: string) {
    this.deleteTargetId.set(id);
    this.showDeleteDialog.set(true);
  }

  confirmDelete() {
    const id = this.deleteTargetId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.api.delete(`/programs/${id}`).subscribe({
      next: () => {
        this.toast.show('Programa eliminado');
        this.loadData();
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'No pudimos eliminar el programa', 'error');
      },
    });
  }

  private loadData() {
    this.api.get<ProgramListDto[]>('/programs').subscribe({
      next: (data) => {
        this.programs.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar los programas. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }
}

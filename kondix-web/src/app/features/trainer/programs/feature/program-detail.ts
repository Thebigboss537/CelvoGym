import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ProgramDetailDto } from '../../../../shared/models';
import { CgBadge } from '../../../../shared/ui/badge';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';
import { formatDateWithYear } from '../../../../shared/utils/format-date';

@Component({
  selector: 'app-program-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CgBadge, CgSpinner, CgConfirmDialog],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <cg-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (program()) {

        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-sm text-text-secondary mb-4">
          <a routerLink="/trainer/programs" class="hover:text-text transition">Programas</a>
          <span class="text-text-muted">/</span>
          <span class="text-text truncate">{{ program()!.name }}</span>
        </nav>

        <!-- Header row -->
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0">
            <h1 class="font-display text-xl font-extrabold text-text">{{ program()!.name }}</h1>
            @if (program()!.description) {
              <p class="text-text-secondary text-sm mt-1">{{ program()!.description }}</p>
            }
          </div>
          <div class="flex gap-2 shrink-0">
            <a
              routerLink="edit"
              class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition"
            >Editar</a>
            <button (click)="showDeleteDialog.set(true)"
              class="bg-danger/10 text-danger border border-danger/20 text-sm px-3 py-1.5 rounded-lg transition hover:bg-danger/20">
              Eliminar
            </button>
          </div>
        </div>

        <!-- Info chips -->
        <div class="flex gap-2 flex-wrap mb-6">
          <cg-badge [text]="program()!.durationWeeks + ' semanas'" variant="neutral" />
          <cg-badge
            [text]="program()!.routines.length + (program()!.routines.length === 1 ? ' rutina' : ' rutinas')"
            variant="neutral" />
          <span class="text-xs text-text-muted self-center">
            Creado {{ formatDateWithYear(program()!.createdAt) }}
          </span>
        </div>

        <!-- Routine list -->
        <div class="bg-card border border-border rounded-2xl overflow-hidden">
          <div class="px-4 py-3 border-b border-border">
            <h2 class="font-semibold text-sm text-text">Rutinas del programa</h2>
          </div>

          @if (program()!.routines.length === 0) {
            <p class="text-text-muted text-sm px-4 py-6 text-center">Sin rutinas asignadas</p>
          } @else {
            <div class="divide-y divide-border-light">
              @for (pr of sortedRoutines(); track pr.id; let i = $index) {
                <div class="flex items-center gap-3 px-4 py-3 hover:bg-bg-raised transition">
                  <!-- Slot label -->
                  <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {{ slotLetter(i) }}
                  </span>

                  <!-- Routine info -->
                  <div class="flex-1 min-w-0">
                    <a [routerLink]="'/trainer/routines/' + pr.routineId"
                      (click)="$event.stopPropagation()"
                      class="text-sm text-text hover:text-primary transition font-medium">
                      {{ pr.routineName }}
                    </a>
                    @if (pr.label) {
                      <span class="text-xs text-text-muted ml-2">{{ pr.label }}</span>
                    }
                  </div>
                </div>
              }
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
export class ProgramDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  formatDateWithYear = formatDateWithYear;

  program = signal<ProgramDetailDto | null>(null);
  loading = signal(true);
  error = signal('');
  showDeleteDialog = signal(false);

  private programId = '';

  slotLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  sortedRoutines() {
    const p = this.program();
    if (!p) return [];
    return [...p.routines].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id')!;
    this.loadData();
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  confirmDelete() {
    this.showDeleteDialog.set(false);
    this.api.delete(`/programs/${this.programId}`).subscribe({
      next: () => {
        this.toast.show('Programa eliminado');
        this.router.navigate(['/trainer/programs']);
      },
      error: (err) => this.toast.show(err.error?.error || 'No pudimos eliminar el programa', 'error'),
    });
  }

  private loadData() {
    this.api.get<ProgramDetailDto>(`/programs/${this.programId}`).subscribe({
      next: (data) => {
        this.program.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar el programa.');
        this.loading.set(false);
      },
    });
  }
}

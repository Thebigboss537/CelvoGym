import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';
import { groupTypeLabel } from '../../../../shared/utils/labels';

@Component({
  selector: 'app-routine-detail',
  imports: [RouterLink, CgSpinner, CgConfirmDialog],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <cg-spinner />
      } @else if (routine()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <a routerLink="/trainer/routines" class="text-text-muted text-sm hover:text-text transition">← Volver</a>
            <h1 class="font-display text-2xl font-bold mt-1">{{ routine()!.name }}</h1>
            @if (routine()!.description) {
              <p class="text-text-secondary text-sm mt-1">{{ routine()!.description }}</p>
            }
          </div>
          <div class="flex gap-2">
            <button (click)="duplicate()"
              [disabled]="duplicating()"
              class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition disabled:opacity-50">
              {{ duplicating() ? 'Duplicando...' : 'Duplicar' }}
            </button>
            <a
              [routerLink]="'edit'"
              class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition"
            >Editar</a>
            <button (click)="showDeleteDialog.set(true)"
              class="bg-card hover:bg-danger hover:text-white border border-border text-danger text-sm px-3 py-1.5 rounded-lg transition">
              Eliminar
            </button>
          </div>
        </div>

        <!-- Routine days -->
        <div class="space-y-5 stagger">
          @for (day of routine()!.days; track day.id) {
            <div class="bg-card border border-border rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-border-light bg-bg-raised">
                <h3 class="font-semibold">{{ day.name }}</h3>
              </div>
              <div class="divide-y divide-border-light">
                @for (group of day.groups; track group.id) {
                  <div class="px-4 py-3">
                    @if (group.groupType !== 'Single') {
                      <span class="text-overline text-primary mb-2 block">
                        {{ groupTypeLabel(group.groupType) }} · {{ group.restSeconds }}s descanso
                      </span>
                    }
                    @for (exercise of group.exercises; track exercise.id) {
                      <div class="py-2.5">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1.5">
                            <span class="text-text font-medium text-sm truncate">{{ exercise.name }}</span>
                            @if (exercise.videoSource !== 'None' && exercise.videoUrl) {
                              <a [href]="exercise.videoUrl" target="_blank" rel="noopener noreferrer"
                                class="text-danger hover:text-danger/80 transition" title="Ver video">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                                </svg>
                              </a>
                            }
                          </div>
                          @if (exercise.tempo) {
                            <span class="text-text-muted text-xs">Tempo: {{ exercise.tempo }}</span>
                          }
                        </div>
                        <div class="flex flex-wrap gap-1.5 mt-1">
                          @for (set of exercise.sets; track set.id; let i = $index) {
                            <span class="text-xs px-2 py-0.5 rounded bg-bg-raised text-text-secondary border border-border-light">
                              {{ set.setType === 'Warmup' ? 'C' : (i + 1) }}:
                              {{ set.targetReps ?? '-' }} × {{ set.targetWeight ?? '-' }}
                              @if (set.targetRpe) { <span class="text-primary">RPE {{ set.targetRpe }}</span> }
                            </span>
                          }
                        </div>
                      </div>
                    }
                    @if (group.groupType === 'Single' && group.restSeconds > 0) {
                      <span class="text-xs text-text-muted">{{ group.restSeconds }}s descanso</span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <cg-confirm-dialog
        [open]="showDeleteDialog()"
        title="Eliminar rutina"
        message="Esta acción no se puede deshacer. ¿Estás seguro?"
        confirmLabel="Eliminar"
        variant="danger"
        (confirmed)="confirmDelete()"
        (cancelled)="showDeleteDialog.set(false)" />
    </div>
  `,
})
export class RoutineDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  groupTypeLabel = groupTypeLabel;

  routine = signal<RoutineDetailDto | null>(null);
  loading = signal(true);
  showDeleteDialog = signal(false);
  duplicating = signal(false);

  private routineId = '';

  ngOnInit() {
    this.routineId = this.route.snapshot.paramMap.get('id')!;
    this.api.get<RoutineDetailDto>(`/routines/${this.routineId}`).subscribe({
      next: (data) => { this.routine.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  duplicate() {
    this.duplicating.set(true);
    this.api.post<RoutineDetailDto>(`/routines/${this.routineId}/duplicate`, {}).subscribe({
      next: (copy) => {
        this.duplicating.set(false);
        this.toast.show('Rutina duplicada');
        this.router.navigate(['/trainer/routines', copy.id, 'edit']);
      },
      error: (err) => {
        this.duplicating.set(false);
        this.toast.show(err.error?.error || 'No pudimos duplicar la rutina', 'error');
      },
    });
  }

  confirmDelete() {
    this.showDeleteDialog.set(false);
    this.api.delete(`/routines/${this.routineId}`).subscribe({
      next: () => {
        this.toast.show('Rutina eliminada');
        this.router.navigate(['/trainer/routines']);
      },
      error: (err) => this.toast.show(err.error?.error || 'No pudimos eliminar la rutina', 'error'),
    });
  }
}

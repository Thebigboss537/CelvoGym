import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ExerciseSetDto, RoutineDetailDto } from '../../../../shared/models';
import { KxBadge } from '../../../../shared/ui/badge';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';
import { groupTypeLabel } from '../../../../shared/utils/labels';

const SET_TYPE_ABBREV: Record<string, string> = {
  Warmup: 'W',
  Effective: 'E',
  DropSet: 'D',
  RestPause: 'RP',
  AMRAP: 'A',
};

const SET_TYPE_LABEL: Record<string, string> = {
  Warmup: 'Calentamiento',
  Effective: 'Efectivas',
  DropSet: 'Drop set',
  RestPause: 'Rest-pause',
  AMRAP: 'AMRAP',
};

function summarizeSets(sets: ExerciseSetDto[]): string {
  if (sets.length === 0) return '';
  const counts: Record<string, number> = {};
  for (const s of sets) {
    counts[s.setType] = (counts[s.setType] ?? 0) + 1;
  }
  const keys = Object.keys(counts);
  if (keys.length === 1) {
    const type = keys[0];
    return `${counts[type]} ${SET_TYPE_LABEL[type] ?? type}`;
  }
  return keys.map(k => `${counts[k]}${SET_TYPE_ABBREV[k] ?? k}`).join(' + ');
}

@Component({
  selector: 'app-routine-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KxBadge, KxSpinner, KxConfirmDialog],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <kx-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (routine()) {
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-sm text-text-secondary mb-4">
          <a routerLink="/trainer/routines" class="hover:text-text transition">Rutinas</a>
          <span class="text-text-muted">/</span>
          <span class="text-text truncate">{{ routine()!.name }}</span>
        </nav>

        <!-- Header row -->
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="font-display text-xl font-extrabold text-text" data-testid="routine-detail-name">{{ routine()!.name }}</h1>
              @if (routine()!.category) {
                <kx-badge [text]="routine()!.category!" variant="info" />
              }
            </div>
            @if (routine()!.description) {
              <p class="text-text-secondary text-sm mt-1">{{ routine()!.description }}</p>
            }
          </div>
          <div class="flex gap-2 shrink-0">
            <a
              routerLink="edit"
              data-testid="routine-detail-edit"
              class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition"
            >Editar</a>
            <button (click)="duplicate()"
              [disabled]="duplicating()"
              data-testid="routine-detail-duplicate"
              class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition disabled:opacity-50">
              {{ duplicating() ? 'Duplicando...' : 'Duplicar' }}
            </button>
            <button (click)="showDeleteDialog.set(true)"
              data-testid="routine-detail-delete"
              class="bg-danger/10 text-danger border border-danger/20 text-sm px-3 py-1.5 rounded-lg transition hover:bg-danger/20">
              Eliminar
            </button>
          </div>
        </div>

        <!-- Days -->
        <div class="flex flex-col gap-3 stagger">
          @for (day of routine()!.days; track day.id; let i = $index) {
            <div class="bg-card border border-border rounded-2xl overflow-hidden">
              <!-- Day header (clickable to expand/collapse) -->
              <button
                type="button"
                class="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-raised transition text-left"
                (click)="toggleDay(i)"
                [attr.data-testid]="'routine-day-toggle-' + i"
              >
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-text">{{ day.name }}</span>
                  <kx-badge [text]="exerciseCountLabel(day)" variant="neutral" />
                </div>
                <!-- Chevron -->
                <svg
                  class="w-4 h-4 text-text-muted transition-transform duration-200"
                  [class.rotate-180]="expandedDays().has(i)"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <!-- Day content (collapsible) -->
              @if (expandedDays().has(i)) {
                <div class="border-t border-border divide-y divide-border-light" [attr.data-testid]="'routine-day-content-' + i">
                  @for (group of day.groups; track group.id) {
                    <div class="px-4 py-3">
                      @if (group.groupType !== 'Single') {
                        <span class="text-overline text-primary mb-2 block">
                          {{ groupTypeLabel(group.groupType) }} · {{ group.restSeconds }}s descanso
                        </span>
                      }
                      @for (exercise of group.exercises; track exercise.id) {
                        <div class="py-2">
                          <div class="flex items-center gap-2">
                            <span class="text-text font-medium text-sm">{{ exercise.name }}</span>
                            @if (group.groupType !== 'Single') {
                              <kx-badge [text]="groupTypeLabel(group.groupType)" variant="info" />
                            }
                          </div>
                          <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-text-secondary">{{ summarizeSets(exercise.sets) }}</span>
                            @if (exercise.notes) {
                              <span class="text-xs text-text-muted truncate max-w-[180px]">· {{ exercise.notes }}</span>
                            }
                          </div>
                        </div>
                      }
                      @if (group.groupType === 'Single' && group.restSeconds > 0) {
                        <span class="text-xs text-text-muted block mt-1">{{ group.restSeconds }}s descanso</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Delete confirm dialog -->
    <kx-confirm-dialog
      data-testid="routine-detail-delete-dialog"
      [open]="showDeleteDialog()"
      title="Eliminar rutina"
      message="Esta acción no se puede deshacer. ¿Estás seguro?"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="confirmDelete()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class RoutineDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  groupTypeLabel = groupTypeLabel;
  summarizeSets = summarizeSets;

  routine = signal<RoutineDetailDto | null>(null);
  loading = signal(true);
  error = signal('');
  showDeleteDialog = signal(false);
  duplicating = signal(false);
  expandedDays = signal(new Set<number>());

  private routineId = '';

  ngOnInit() {
    this.routineId = this.route.snapshot.paramMap.get('id')!;
    this.loadData();
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  toggleDay(index: number) {
    const s = new Set(this.expandedDays());
    if (s.has(index)) {
      s.delete(index);
    } else {
      s.add(index);
    }
    this.expandedDays.set(s);
  }

  exerciseCountLabel(day: RoutineDetailDto['days'][number]): string {
    const count = day.groups.reduce((acc, g) => acc + g.exercises.length, 0);
    return `${count} ej.`;
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

  private loadData() {
    this.api.get<RoutineDetailDto>(`/routines/${this.routineId}`).subscribe({
      next: (data) => {
        this.routine.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar la rutina.');
        this.loading.set(false);
      },
    });
  }
}

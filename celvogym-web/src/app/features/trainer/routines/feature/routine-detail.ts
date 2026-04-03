import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto, StudentDto, AssignmentDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgAvatar } from '../../../../shared/ui/avatar';
import { CgConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';

@Component({
  selector: 'app-routine-detail',
  imports: [RouterLink, CgSpinner, CgAvatar, CgConfirmDialog],
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

        <!-- Assign to students -->
        <div class="bg-card border border-border rounded-xl p-4 mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-sm">Alumnos asignados</h3>
            @if (!showAssign()) {
              <button (click)="openAssign()"
                class="text-primary text-xs hover:underline">+ Asignar</button>
            }
          </div>

          @if (showAssign()) {
            <div class="space-y-2 mb-3">
              @for (student of availableStudents(); track student.id) {
                <button (click)="assign(student.id)"
                  class="w-full flex items-center gap-2 bg-bg-raised hover:bg-card-hover border border-border-light rounded-lg px-3 py-2 text-left transition press">
                  <cg-avatar [name]="student.displayName" />
                  <span class="text-sm text-text">{{ student.displayName }}</span>
                </button>
              } @empty {
                <p class="text-text-muted text-xs text-center py-2">No hay alumnos disponibles para asignar</p>
              }
              <button (click)="showAssign.set(false)" class="text-text-muted text-xs hover:text-text">Cancelar</button>
            </div>
          }

          @if (assignedStudents().length > 0) {
            <div class="space-y-1.5">
              @for (a of assignedStudents(); track a.id) {
                <div class="flex items-center justify-between bg-bg-raised rounded-lg px-3 py-2">
                  <div class="flex items-center gap-2">
                    <cg-avatar [name]="a.studentName" />
                    <span class="text-sm text-text">{{ a.studentName }}</span>
                  </div>
                  <button (click)="unassign(a.id)" class="text-text-muted hover:text-danger text-xs">Quitar</button>
                </div>
              }
            </div>
          } @else if (!showAssign()) {
            <p class="text-text-muted text-xs">Ningún alumno asignado a esta rutina</p>
          }

          @if (assignError()) {
            <p class="text-danger text-xs mt-2">{{ assignError() }}</p>
          }
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
                                class="text-danger hover:text-danger/80 transition" title="Ver video en YouTube">
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

  routine = signal<RoutineDetailDto | null>(null);
  loading = signal(true);
  showDeleteDialog = signal(false);

  showAssign = signal(false);
  allStudents = signal<StudentDto[]>([]);
  assignments = signal<AssignmentDto[]>([]);
  assignError = signal('');

  private routineId = '';

  assignedStudents = signal<AssignmentDto[]>([]);
  availableStudents = signal<StudentDto[]>([]);

  ngOnInit() {
    this.routineId = this.route.snapshot.paramMap.get('id')!;

    this.api.get<RoutineDetailDto>(`/routines/${this.routineId}`).subscribe({
      next: (data) => { this.routine.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.loadAssignments();
  }

  openAssign() {
    this.showAssign.set(true);
    this.api.get<StudentDto[]>('/students').subscribe({
      next: (students) => {
        this.allStudents.set(students);
        this.updateAvailable();
      },
    });
  }

  assign(studentId: string) {
    this.assignError.set('');
    this.api.post<AssignmentDto>('/assignments', {
      routineId: this.routineId,
      studentId,
    }).subscribe({
      next: () => {
        this.showAssign.set(false);
        this.loadAssignments();
      },
      error: (err) => this.assignError.set(err.error?.error || 'No pudimos asignar al alumno. Intentá de nuevo.'),
    });
  }

  unassign(assignmentId: string) {
    this.api.delete(`/assignments/${assignmentId}`).subscribe({
      next: () => this.loadAssignments(),
    });
  }

  private loadAssignments() {
    this.api.get<AssignmentDto[]>('/assignments').subscribe({
      next: (all) => {
        const forRoutine = all.filter(a => a.routineId === this.routineId);
        this.assignments.set(all);
        this.assignedStudents.set(forRoutine);
        this.updateAvailable();
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
      error: (err) => this.assignError.set(err.error?.error || 'No pudimos eliminar la rutina. Intentá de nuevo.'),
    });
  }

  groupTypeLabel(type: string): string {
    const labels: Record<string, string> = { Single: 'Individual', Superset: 'Biserie', Triset: 'Triserie', Circuit: 'Circuito' };
    return labels[type] ?? type;
  }

  private updateAvailable() {
    const assignedIds = new Set(this.assignedStudents().map(a => a.studentId));
    this.availableStudents.set(this.allStudents().filter(s => !assignedIds.has(s.id)));
  }
}

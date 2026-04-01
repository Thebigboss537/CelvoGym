import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto, StudentDto, AssignmentDto } from '../../../../shared/models';

@Component({
  selector: 'app-routine-detail',
  imports: [RouterLink],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (routine()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <a routerLink="/trainer/routines" class="text-text-muted text-sm hover:text-text transition">← Volver</a>
            <h2 class="font-[var(--font-display)] text-2xl font-bold mt-1">{{ routine()!.name }}</h2>
            @if (routine()!.description) {
              <p class="text-text-secondary text-sm mt-1">{{ routine()!.description }}</p>
            }
          </div>
          <a
            [routerLink]="'edit'"
            class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition"
          >Editar</a>
        </div>

        <!-- Assign to students -->
        <div class="bg-card border border-border rounded-xl p-4 mb-4">
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
                  <div class="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs">
                    {{ student.displayName.charAt(0).toUpperCase() }}
                  </div>
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
                    <div class="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs">
                      {{ a.studentName.charAt(0).toUpperCase() }}
                    </div>
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
        <div class="space-y-4 stagger">
          @for (day of routine()!.days; track day.id) {
            <div class="bg-card border border-border rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-border-light bg-bg-raised">
                <h3 class="font-semibold">{{ day.name }}</h3>
              </div>
              <div class="divide-y divide-border-light">
                @for (group of day.groups; track group.id) {
                  <div class="px-4 py-3">
                    @if (group.groupType !== 'Single') {
                      <span class="text-xs text-primary font-medium uppercase mb-2 block">
                        {{ group.groupType }} · {{ group.restSeconds }}s descanso
                      </span>
                    }
                    @for (exercise of group.exercises; track exercise.id) {
                      <div class="py-1.5">
                        <div class="flex items-center justify-between">
                          <span class="text-text font-medium text-sm">{{ exercise.name }}</span>
                          @if (exercise.tempo) {
                            <span class="text-text-muted text-xs">Tempo: {{ exercise.tempo }}</span>
                          }
                        </div>
                        <div class="flex flex-wrap gap-1.5 mt-1">
                          @for (set of exercise.sets; track set.id; let i = $index) {
                            <span class="text-xs px-2 py-0.5 rounded bg-bg-raised text-text-secondary border border-border-light">
                              {{ set.setType === 'Warmup' ? 'W' : (i + 1) }}:
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
    </div>
  `,
})
export class RoutineDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  routine = signal<RoutineDetailDto | null>(null);
  loading = signal(true);

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
      error: (err) => this.assignError.set(err.error?.error || 'Error al asignar'),
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

  private updateAvailable() {
    const assignedIds = new Set(this.assignedStudents().map(a => a.studentId));
    this.availableStudents.set(this.allStudents().filter(s => !assignedIds.has(s.id)));
  }
}

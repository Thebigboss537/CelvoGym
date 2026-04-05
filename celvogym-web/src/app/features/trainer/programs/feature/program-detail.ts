import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ProgramDetailDto, StudentDto, ProgramAssignmentDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgAvatar } from '../../../../shared/ui/avatar';
import { CgConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';

@Component({
  selector: 'app-program-detail',
  imports: [RouterLink, CgSpinner, CgAvatar, CgConfirmDialog],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <cg-spinner />
      } @else if (program()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <a routerLink="/trainer/programs" class="text-text-muted text-sm hover:text-text transition">← Volver</a>
            <h1 class="font-display text-2xl font-bold mt-1">{{ program()!.name }}</h1>
            @if (program()!.description) {
              <p class="text-text-secondary text-sm mt-1">{{ program()!.description }}</p>
            }
          </div>
          <div class="flex gap-2">
            <a [routerLink]="'edit'"
              class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition">
              Editar
            </a>
            <button (click)="showDeleteDialog.set(true)"
              class="bg-card hover:bg-danger hover:text-white border border-border text-danger text-sm px-3 py-1.5 rounded-lg transition">
              Eliminar
            </button>
          </div>
        </div>

        <!-- Program info -->
        <div class="flex gap-3 mb-6">
          <span class="text-xs bg-bg-raised text-text-muted px-2.5 py-1 rounded-lg">
            {{ program()!.durationWeeks }} semanas
          </span>
          <span class="text-xs bg-bg-raised text-text-muted px-2.5 py-1 rounded-lg">
            {{ program()!.routines.length }} rutina{{ program()!.routines.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Routines in program -->
        <div class="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 class="font-semibold text-sm mb-3">Rutinas del programa</h3>
          <div class="space-y-2">
            @for (pr of program()!.routines; track pr.id; let i = $index) {
              <div class="flex items-center gap-3 bg-bg-raised rounded-lg px-3 py-2">
                <span class="text-xs text-text-muted w-5">{{ i + 1 }}.</span>
                <a [routerLink]="'/trainer/routines/' + pr.routineId"
                  class="text-sm text-text hover:text-primary transition">{{ pr.routineName }}</a>
                @if (pr.label) {
                  <span class="text-xs text-text-muted ml-auto">{{ pr.label }}</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Assignment panel -->
        <div class="bg-card border border-border rounded-xl p-4 mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-sm">Alumnos asignados</h3>
            @if (!showAssign()) {
              <button (click)="openAssign()"
                class="text-primary text-xs hover:underline">+ Asignar</button>
            }
          </div>

          @if (showAssign()) {
            <div class="space-y-3 mb-3">
              <!-- Mode selector -->
              <div>
                <span class="text-xs text-text-muted block mb-1.5">Modo</span>
                <div class="flex gap-2">
                  <button type="button" (click)="mode.set('Rotation')"
                    class="flex-1 text-xs font-medium px-3 py-2 rounded-lg transition border text-center"
                    [class]="mode() === 'Rotation'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg-raised text-text-muted border-border hover:border-primary/40'">
                    Rotación
                  </button>
                  <button type="button" (click)="mode.set('Fixed')"
                    class="flex-1 text-xs font-medium px-3 py-2 rounded-lg transition border text-center"
                    [class]="mode() === 'Fixed'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg-raised text-text-muted border-border hover:border-primary/40'">
                    Días fijos
                  </button>
                </div>
              </div>

              @if (mode() === 'Rotation') {
                <!-- Day picker for rotation -->
                <div>
                  <span class="text-xs text-text-muted block mb-1.5">Días de entrenamiento</span>
                  <div class="flex gap-1.5">
                    @for (d of weekdayOptions; track d.value) {
                      <button type="button" (click)="toggleDay(d.value)"
                        class="w-9 h-9 rounded-lg text-xs font-medium transition border"
                        [class]="selectedDays().includes(d.value)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-bg-raised text-text-muted border-border hover:border-primary/40'">
                        {{ d.label }}
                      </button>
                    }
                  </div>
                </div>
              } @else {
                <!-- Fixed schedule: day picker per routine -->
                <div class="space-y-3">
                  <span class="text-xs text-text-muted block">Asignar días a cada rutina</span>
                  @for (pr of program()!.routines; track pr.id) {
                    <div class="bg-bg-raised rounded-lg p-3">
                      <span class="text-sm text-text font-medium block mb-1.5">{{ pr.routineName }}</span>
                      <div class="flex gap-1.5">
                        @for (d of weekdayOptions; track d.value) {
                          <button type="button" (click)="toggleFixedDay(pr.routineId, d.value)"
                            class="w-8 h-8 rounded-lg text-xs font-medium transition border"
                            [class]="getFixedDays(pr.routineId).includes(d.value)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-card text-text-muted border-border hover:border-primary/40'">
                            {{ d.label }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Start date -->
              <div>
                <span class="text-xs text-text-muted block mb-1.5">Fecha de inicio</span>
                <input type="date" [value]="startDate()"
                  (change)="startDate.set($any($event.target).value)"
                  class="bg-bg-raised border border-border rounded-lg px-3 py-1.5 text-sm text-text w-full" />
              </div>

              <!-- Multi-select students -->
              <div>
                @if (availableStudents().length > 1) {
                  <button type="button" (click)="toggleSelectAll()"
                    class="text-xs text-primary hover:underline mb-1.5">
                    {{ selectedStudentIds().length === availableStudents().length ? 'Deseleccionar todos' : 'Seleccionar todos' }}
                  </button>
                }
                @for (student of availableStudents(); track student.id) {
                  <label class="w-full flex items-center gap-2 bg-bg-raised hover:bg-card-hover border border-border-light rounded-lg px-3 py-2 cursor-pointer transition mb-1.5">
                    <input type="checkbox" [checked]="selectedStudentIds().includes(student.id)"
                      (change)="toggleStudentSelection(student.id)"
                      class="w-4 h-4 rounded accent-primary" />
                    <cg-avatar [name]="student.displayName" />
                    <span class="text-sm text-text">{{ student.displayName }}</span>
                  </label>
                } @empty {
                  <p class="text-text-muted text-xs text-center py-2">No hay alumnos disponibles</p>
                }
              </div>

              <div class="flex gap-2">
                @if (selectedStudentIds().length > 0) {
                  <button type="button" (click)="bulkAssign()"
                    class="bg-primary hover:bg-primary-hover text-white text-xs px-4 py-2 rounded-lg transition press">
                    Asignar {{ selectedStudentIds().length }} alumno{{ selectedStudentIds().length > 1 ? 's' : '' }}
                  </button>
                }
                <button type="button" (click)="showAssign.set(false)"
                  class="text-text-muted text-xs hover:text-text py-2">Cancelar</button>
              </div>
            </div>
          }

          @if (assignedStudents().length > 0) {
            <div class="space-y-1.5">
              @for (a of assignedStudents(); track a.id) {
                <div class="flex items-center justify-between bg-bg-raised rounded-lg px-3 py-2">
                  <div class="flex items-center gap-2">
                    <cg-avatar [name]="a.studentName" />
                    <div>
                      <span class="text-sm text-text">{{ a.studentName }}</span>
                      <span class="text-xs text-text-muted ml-2">
                        Semana {{ a.currentWeek }}/{{ a.totalWeeks }} · {{ a.mode === 'Rotation' ? 'Rotación' : 'Fijo' }}
                      </span>
                    </div>
                  </div>
                  <button (click)="cancelAssignment(a.id)"
                    class="text-text-muted hover:text-danger text-xs">Quitar</button>
                </div>
              }
            </div>
          } @else if (!showAssign()) {
            <p class="text-text-muted text-xs">Ningún alumno asignado a este programa</p>
          }

          @if (assignError()) {
            <p class="text-danger text-xs mt-2">{{ assignError() }}</p>
          }
        </div>
      }

      <cg-confirm-dialog
        [open]="showDeleteDialog()"
        title="Eliminar programa"
        message="Esta acción no se puede deshacer. ¿Estás seguro?"
        confirmLabel="Eliminar"
        variant="danger"
        (confirmed)="confirmDelete()"
        (cancelled)="showDeleteDialog.set(false)" />
    </div>
  `,
})
export class ProgramDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  program = signal<ProgramDetailDto | null>(null);
  loading = signal(true);
  showDeleteDialog = signal(false);

  showAssign = signal(false);
  allStudents = signal<StudentDto[]>([]);
  assignedStudents = signal<ProgramAssignmentDto[]>([]);
  availableStudents = signal<StudentDto[]>([]);
  selectedStudentIds = signal<string[]>([]);
  assignError = signal('');

  mode = signal<'Rotation' | 'Fixed'>('Rotation');
  selectedDays = signal<number[]>([]);
  fixedSchedule = signal<Record<string, number[]>>({});
  startDate = signal(new Date().toISOString().split('T')[0]);

  weekdayOptions = [
    { label: 'Lu', value: 1 },
    { label: 'Ma', value: 2 },
    { label: 'Mi', value: 3 },
    { label: 'Ju', value: 4 },
    { label: 'Vi', value: 5 },
    { label: 'Sa', value: 6 },
    { label: 'Do', value: 0 },
  ];

  private programId = '';

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id')!;

    this.api.get<ProgramDetailDto>(`/programs/${this.programId}`).subscribe({
      next: (data) => { this.program.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.loadAssignments();
  }

  openAssign() {
    this.showAssign.set(true);
    this.selectedStudentIds.set([]);
    this.fixedSchedule.set({});
    this.api.get<StudentDto[]>('/students').subscribe({
      next: (students) => {
        this.allStudents.set(students);
        this.updateAvailable();
      },
    });
  }

  toggleDay(value: number) {
    this.selectedDays.update(days =>
      days.includes(value) ? days.filter(d => d !== value) : [...days, value]
    );
  }

  toggleFixedDay(routineId: string, day: number) {
    this.fixedSchedule.update(schedule => {
      const current = schedule[routineId] ?? [];
      const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
      return { ...schedule, [routineId]: updated };
    });
  }

  getFixedDays(routineId: string): number[] {
    return this.fixedSchedule()[routineId] ?? [];
  }

  toggleStudentSelection(studentId: string) {
    this.selectedStudentIds.update(ids =>
      ids.includes(studentId) ? ids.filter(id => id !== studentId) : [...ids, studentId]
    );
  }

  toggleSelectAll() {
    const available = this.availableStudents();
    if (this.selectedStudentIds().length === available.length) {
      this.selectedStudentIds.set([]);
    } else {
      this.selectedStudentIds.set(available.map(s => s.id));
    }
  }

  bulkAssign() {
    const ids = this.selectedStudentIds();
    if (ids.length === 0) return;
    this.assignError.set('');

    const body: any = {
      programId: this.programId,
      studentIds: ids,
      mode: this.mode(),
      startDate: this.startDate(),
    };

    if (this.mode() === 'Rotation') {
      body.trainingDays = this.selectedDays();
    } else {
      body.fixedSchedule = Object.entries(this.fixedSchedule())
        .filter(([_, days]) => days.length > 0)
        .map(([routineId, days]) => ({ routineId, days }));
    }

    this.api.post('/program-assignments/bulk', body).subscribe({
      next: () => {
        this.showAssign.set(false);
        this.selectedStudentIds.set([]);
        this.selectedDays.set([]);
        this.fixedSchedule.set({});
        this.loadAssignments();
        this.toast.show(`${ids.length} alumno${ids.length > 1 ? 's' : ''} asignado${ids.length > 1 ? 's' : ''}`);
      },
      error: (err) => this.assignError.set(err.error?.error || 'Error al asignar'),
    });
  }

  cancelAssignment(assignmentId: string) {
    this.api.delete(`/program-assignments/${assignmentId}`).subscribe({
      next: () => {
        this.loadAssignments();
        this.toast.show('Asignación cancelada');
      },
    });
  }

  confirmDelete() {
    this.showDeleteDialog.set(false);
    this.api.delete(`/programs/${this.programId}`).subscribe({
      next: () => {
        this.toast.show('Programa eliminado');
        this.router.navigate(['/trainer/programs']);
      },
      error: (err) => this.toast.show(err.error?.error || 'Error al eliminar', 'error'),
    });
  }

  private loadAssignments() {
    this.api.get<ProgramAssignmentDto[]>('/program-assignments').subscribe({
      next: (all) => {
        this.assignedStudents.set(all.filter(a => a.programId === this.programId));
        this.updateAvailable();
      },
    });
  }

  private updateAvailable() {
    const assignedIds = new Set(this.assignedStudents().map(a => a.studentId));
    this.availableStudents.set(this.allStudents().filter(s => !assignedIds.has(s.id)));
  }
}

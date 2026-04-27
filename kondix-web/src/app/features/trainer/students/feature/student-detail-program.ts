import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ProgramAssignmentDto, ProgramListDto } from '../../../../shared/models';
import { ToastService } from '../../../../shared/ui/toast';
import { KxBadge } from '../../../../shared/ui/badge';
import { KxProgressBar } from '../../../../shared/ui/progress-bar';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';

@Component({
  selector: 'app-student-detail-program',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, KxBadge, KxProgressBar, KxConfirmDialog],
  template: `
    <div class="animate-fade-up">
      <!-- Current program card -->
      <div class="mb-6">
        @if (activeAssignment()) {
          <div class="rounded-2xl p-4 overflow-hidden"
            style="background: linear-gradient(135deg, #B31D2C 0%, #E62639 60%, #FF4D5E 100%)">
            <p class="text-overline text-white/60 mb-1">PROGRAMA ACTUAL</p>
            <div class="flex items-start justify-between gap-2 mb-3">
              <h3 class="font-display text-base font-bold text-white leading-tight">
                {{ activeAssignment()!.programName }}
              </h3>
              <kx-badge
                [text]="activeAssignment()!.mode === 'Rotation' ? 'Rotación' : 'Fijo'"
                variant="neutral" />
            </div>
            <p class="text-white/70 text-xs mb-2">
              Semana {{ activeAssignment()!.currentWeek }} de {{ activeAssignment()!.totalWeeks }}
            </p>
            <kx-progress-bar
              [percentage]="weekProgress()"
              [showLabel]="false"
              size="md" />
            <button type="button" (click)="confirmCancel.set(true)"
              class="mt-3 w-full py-2 bg-white/10 text-white/80 text-xs rounded-lg border border-white/20
                     hover:bg-white/20 transition press">
              @if (cancelling()) { Cancelando... } @else { Cancelar programa }
            </button>
          </div>
        } @else {
          <div class="bg-card border border-border rounded-2xl p-4">
            <p class="text-overline text-text-secondary mb-1">PROGRAMA ACTUAL</p>
            @if (showAssignForm()) {
              <div class="space-y-3 mt-2">
                <div>
                  <label class="block text-xs text-text-secondary mb-1">Programa</label>
                  <select
                    [ngModel]="selectedProgramId()"
                    (ngModelChange)="selectedProgramId.set($event)"
                    class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary select-styled">
                    <option value="" disabled>Seleccionar programa</option>
                    @for (p of availablePrograms(); track p.id) {
                      <option [value]="p.id">{{ p.name }} ({{ p.durationWeeks }} sem)</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-text-secondary mb-1">Modo</label>
                  <div class="flex gap-2">
                    <button type="button" (click)="assignMode.set('Rotation')"
                      class="flex-1 py-2 rounded-lg text-xs font-semibold transition"
                      [class]="assignMode() === 'Rotation' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-bg-raised text-text-muted border border-border'">
                      Rotación
                    </button>
                    <button type="button" (click)="assignMode.set('Fixed')"
                      class="flex-1 py-2 rounded-lg text-xs font-semibold transition"
                      [class]="assignMode() === 'Fixed' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-bg-raised text-text-muted border border-border'">
                      Fijo
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs text-text-secondary mb-1">Días de entrenamiento</label>
                  <div class="flex gap-1">
                    @for (d of weekDays; track d.value) {
                      <button type="button" (click)="toggleDay(d.value)"
                        class="w-9 h-9 rounded-lg text-[10px] font-semibold transition"
                        [class]="assignDays().includes(d.value) ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-bg-raised text-text-muted border border-border'">
                        {{ d.label }}
                      </button>
                    }
                  </div>
                </div>
                <div class="flex gap-2 pt-1">
                  <button type="button" (click)="showAssignForm.set(false)"
                    class="flex-1 py-2 bg-bg-raised border border-border text-text-secondary text-xs rounded-lg">
                    Cancelar
                  </button>
                  <button type="button" (click)="assignProgram()"
                    [disabled]="assigning() || !selectedProgramId() || assignDays().length === 0"
                    class="flex-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 press">
                    @if (assigning()) { Asignando... } @else { Asignar }
                  </button>
                </div>
              </div>
            } @else {
              <p class="text-text-muted text-sm mb-3">Sin programa asignado</p>
              <button type="button" (click)="openAssignForm()"
                class="w-full py-2 bg-primary/10 text-primary text-sm font-semibold rounded-lg border border-primary/20 hover:bg-primary/15 transition press">
                Asignar programa
              </button>
            }
          </div>
        }
      </div>

      <!-- Assignment history -->
      @if (pastAssignments().length > 0) {
        <div class="mb-6">
          <div class="bg-card border border-border rounded-2xl p-4">
            <p class="text-overline text-text-secondary mb-3">HISTORIAL DE PROGRAMAS</p>
            @for (pa of pastAssignments(); track pa.id) {
              <div class="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p class="text-sm text-text font-medium">{{ pa.programName }}</p>
                  <p class="text-xs text-text-muted">
                    {{ pa.startDate | date:'dd MMM yyyy' }} — {{ pa.endDate | date:'dd MMM yyyy' }}
                  </p>
                </div>
                <kx-badge
                  [text]="pa.status === 'Completed' ? 'Completado' : 'Cancelado'"
                  [variant]="pa.status === 'Completed' ? 'success' : 'neutral'" />
              </div>
            }
          </div>
        </div>
      }
    </div>

    <kx-confirm-dialog
      [open]="confirmCancel()"
      title="Cancelar programa"
      message="El alumno dejará de ver este programa. El historial de sesiones se conserva. ¿Continuar?"
      confirmLabel="Cancelar programa"
      variant="danger"
      (confirmed)="cancelAssignment(); confirmCancel.set(false)"
      (cancelled)="confirmCancel.set(false)" />
  `,
})
export class StudentDetailProgram {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  studentId = input.required<string>();
  assignments = input<ProgramAssignmentDto[]>([]);

  assignmentsChange = output<ProgramAssignmentDto[]>();

  // Computed from input signal
  activeAssignment = computed(() =>
    this.assignments().find(a => a.status === 'Active') ?? null
  );

  pastAssignments = computed(() =>
    this.assignments().filter(a => a.status !== 'Active')
  );

  weekProgress = computed(() => {
    const a = this.activeAssignment();
    if (!a || a.totalWeeks === 0) return 0;
    return Math.round((a.currentWeek / a.totalWeeks) * 100);
  });

  // Assignment form state
  showAssignForm = signal(false);
  availablePrograms = signal<ProgramListDto[]>([]);
  selectedProgramId = signal('');
  assignMode = signal<'Rotation' | 'Fixed'>('Rotation');
  assignDays = signal<number[]>([]);
  assigning = signal(false);
  cancelling = signal(false);
  confirmCancel = signal(false);

  weekDays = [
    { label: 'LUN', value: 1 }, { label: 'MAR', value: 2 }, { label: 'MIÉ', value: 3 },
    { label: 'JUE', value: 4 }, { label: 'VIE', value: 5 }, { label: 'SÁB', value: 6 },
    { label: 'DOM', value: 0 },
  ];

  openAssignForm(): void {
    this.api.get<ProgramListDto[]>('/programs').subscribe({
      next: (programs) => {
        this.availablePrograms.set(programs);
        this.selectedProgramId.set('');
        this.assignMode.set('Rotation');
        this.assignDays.set([]);
        this.showAssignForm.set(true);
      },
    });
  }

  toggleDay(day: number): void {
    this.assignDays.update(days =>
      days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    );
  }

  assignProgram(): void {
    const studentId = this.studentId();
    const programId = this.selectedProgramId();
    if (!studentId || !programId) return;

    this.assigning.set(true);
    this.api.post<ProgramAssignmentDto>('/program-assignments', {
      programId,
      studentId,
      mode: this.assignMode(),
      trainingDays: this.assignDays(),
    }).subscribe({
      next: (assignment) => {
        this.assignmentsChange.emit([...this.assignments(), assignment]);
        this.showAssignForm.set(false);
        this.assigning.set(false);
        this.toast.show('Programa asignado');
      },
      error: (err) => {
        this.assigning.set(false);
        this.toast.show(err.error?.error ?? 'Error al asignar programa', 'error');
      },
    });
  }

  cancelAssignment(): void {
    const assignment = this.activeAssignment();
    if (!assignment) return;

    this.cancelling.set(true);
    this.api.delete<void>(`/program-assignments/${assignment.id}`).subscribe({
      next: () => {
        const updated = this.assignments().map(a =>
          a.id === assignment.id ? { ...a, status: 'Cancelled' as const } : a
        );
        this.assignmentsChange.emit(updated);
        this.cancelling.set(false);
        this.toast.show('Programa cancelado');
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toast.show(err.error?.error ?? 'Error al cancelar', 'error');
      },
    });
  }
}

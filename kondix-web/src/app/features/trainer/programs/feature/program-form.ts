import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ProgramAssignmentDto, ProgramDetailDto, RoutineListDto } from '../../../../shared/models';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';

interface RoutineSlot {
  routineId: string;
  label: string;
}

@Component({
  selector: 'app-program-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, KxSpinner, KxConfirmDialog],
  template: `
    <div class="animate-fade-up px-4 sm:px-6 md:px-8 pt-6 pb-nav-safe md:pb-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-1.5 text-sm text-text-secondary mb-4">
        <a routerLink="/trainer/programs" class="hover:text-text transition">Programas</a>
        <span class="text-text-muted">/</span>
        <span class="text-text">{{ isEdit() ? 'Editar programa' : 'Nuevo programa' }}</span>
      </nav>

      <h1 class="font-display text-2xl font-extrabold mb-6">
        {{ isEdit() ? 'Editar programa' : 'Nuevo programa' }}
      </h1>

      @if (activeAssignmentCount() > 0) {
        <div class="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4">
          <p class="text-warning text-sm font-semibold">Programa con alumnos asignados</p>
          <p class="text-warning/70 text-xs mt-1">
            {{ activeAssignmentCount() }} alumno(s) tienen este programa activo.
            Puedes cambiar nombre y duración, pero para modificar las rutinas
            debes cancelar las asignaciones primero.
          </p>
        </div>
      }

      @if (loadingData()) {
        <kx-spinner />
      } @else {
        <form (ngSubmit)="save()" class="space-y-5 max-w-xl">

          <!-- Name -->
          <div>
            <label class="block text-xs text-text-secondary mb-1">Nombre</label>
            <input type="text" [(ngModel)]="name" name="name" required maxlength="200"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition"
              placeholder="Ej: Torso-Pierna 12 semanas" />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs text-text-secondary mb-1">Descripción <span class="text-text-muted">(opcional)</span></label>
            <textarea [(ngModel)]="description" name="description" maxlength="2000" rows="2"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition resize-none"
              placeholder="Describe el objetivo o estructura del programa..."></textarea>
          </div>

          <!-- Duration -->
          <div>
            <label class="block text-xs text-text-secondary mb-1">Duración</label>
            <div class="flex items-center gap-2">
              <input type="number" [(ngModel)]="durationWeeks" name="durationWeeks" required min="1" max="52"
                class="w-24 bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition text-center" />
              <span class="text-sm text-text-secondary">semanas</span>
            </div>
          </div>

          <!-- Routine slots -->
          <div>
            <label class="block text-xs text-text-secondary mb-2">Rutinas en rotación</label>
            <div class="space-y-2">
              @for (slot of slots(); track $index; let i = $index) {
                <div class="flex items-center gap-2 bg-bg-raised border border-border rounded-xl px-3 py-2">
                  <!-- Label letter (A, B, C…) -->
                  <span class="text-xs font-bold text-text-muted w-5 shrink-0">{{ slotLetter(i) }}</span>

                  <!-- Routine selector -->
                  <select [(ngModel)]="slot.routineId" [name]="'routine-' + i"
                    class="select-styled flex-1 bg-bg-raised text-sm text-text border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary transition cursor-pointer">
                    <option value="" disabled>Seleccionar rutina</option>
                    @for (r of routines(); track r.id) {
                      <option [value]="r.id">{{ r.name }}</option>
                    }
                  </select>

                  <!-- Custom label -->
                  <input type="text" [(ngModel)]="slot.label" [name]="'label-' + i" maxlength="100"
                    class="w-28 bg-card border border-border-light rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary transition"
                    placeholder="Etiqueta" />

                  <!-- Reorder buttons -->
                  <div class="flex flex-col gap-0.5 shrink-0">
                    <button type="button" (click)="moveUp(i)"
                      [disabled]="i === 0"
                      class="text-text-muted hover:text-text disabled:opacity-30 text-xs leading-none px-1"
                      aria-label="Subir">▲</button>
                    <button type="button" (click)="moveDown(i)"
                      [disabled]="i === slots().length - 1"
                      class="text-text-muted hover:text-text disabled:opacity-30 text-xs leading-none px-1"
                      aria-label="Bajar">▼</button>
                  </div>

                  <!-- Remove -->
                  @if (slots().length > 1) {
                    <button type="button" (click)="removeSlot(i)"
                      class="text-danger hover:text-danger/70 text-sm shrink-0 transition"
                      aria-label="Eliminar rutina">✕</button>
                  }
                </div>
              }
            </div>

            @if (routines().length > 0) {
              <button type="button" (click)="addSlot()"
                class="text-primary text-xs hover:underline mt-2 transition">
                + Agregar rutina
              </button>
            } @else {
              <p class="text-text-muted text-xs mt-2">No tenés rutinas creadas. <a routerLink="/trainer/routines/new" class="text-primary hover:underline">Crear una</a>.</p>
            }
          </div>

          @if (error()) {
            <p class="text-danger text-xs">{{ error() }}</p>
          }

          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button type="submit" [disabled]="saving()"
              class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition press disabled:opacity-60">
              {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Crear programa') }}
            </button>
            <a routerLink="/trainer/programs"
              class="bg-card hover:bg-card-hover border border-border text-text-secondary text-sm px-4 py-2.5 rounded-lg transition">
              Cancelar
            </a>
            @if (isEdit()) {
              <button type="button" (click)="showDeleteDialog.set(true)"
                class="ml-auto bg-danger/10 text-danger border border-danger/20 text-sm px-4 py-2.5 rounded-lg transition hover:bg-danger/20">
                Eliminar
              </button>
            }
          </div>

        </form>
      }
    </div>

    <kx-confirm-dialog
      [open]="showDeleteDialog()"
      title="Eliminar programa"
      message="Esta acción no se puede deshacer. ¿Estás seguro?"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="confirmDelete()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class ProgramForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  isEdit = signal(false);
  loadingData = signal(true);
  saving = signal(false);
  error = signal('');
  showDeleteDialog = signal(false);
  activeAssignmentCount = signal(0);

  routines = signal<RoutineListDto[]>([]);
  slots = signal<RoutineSlot[]>([{ routineId: '', label: '' }]);

  name = '';
  description = '';
  durationWeeks = 8;

  private programId = '';

  slotLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit.set(!!this.programId);

    this.api.get<RoutineListDto[]>('/routines').subscribe({
      next: (data) => {
        this.routines.set(data);
        if (this.isEdit()) {
          this.loadProgram();
          this.api.get<ProgramAssignmentDto[]>('/program-assignments?activeOnly=true').subscribe({
            next: (assignments) => {
              const count = assignments.filter(a => a.programId === this.programId).length;
              this.activeAssignmentCount.set(count);
            },
          });
        } else {
          this.loadingData.set(false);
        }
      },
      error: () => this.loadingData.set(false),
    });
  }

  addSlot() {
    this.slots.update(s => [...s, { routineId: '', label: '' }]);
  }

  removeSlot(index: number) {
    this.slots.update(s => s.filter((_, i) => i !== index));
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.slots.update(s => {
      const arr = [...s];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }

  moveDown(index: number) {
    if (index === this.slots().length - 1) return;
    this.slots.update(s => {
      const arr = [...s];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  save() {
    const validSlots = this.slots().filter(s => s.routineId);
    if (!this.name.trim()) {
      this.error.set('El nombre es requerido');
      return;
    }
    if (validSlots.length === 0) {
      this.error.set('Agregá al menos una rutina al programa');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const body = {
      name: this.name.trim(),
      description: this.description.trim() || null,
      durationWeeks: this.durationWeeks,
      routines: validSlots.map((s, i) => ({
        routineId: s.routineId,
        sortOrder: i,
        label: s.label.trim() || null,
      })),
    };

    const req = this.isEdit()
      ? this.api.put<ProgramDetailDto>(`/programs/${this.programId}`, body)
      : this.api.post<ProgramDetailDto>('/programs', body);

    req.subscribe({
      next: () => {
        this.toast.show(this.isEdit() ? 'Programa actualizado' : 'Programa creado');
        this.router.navigate(['/trainer/programs']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al guardar');
        this.saving.set(false);
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
      error: (err) => this.toast.show(err.error?.error || 'No pudimos eliminar el programa', 'error'),
    });
  }

  private loadProgram() {
    this.api.get<ProgramDetailDto>(`/programs/${this.programId}`).subscribe({
      next: (data) => {
        this.name = data.name;
        this.description = data.description ?? '';
        this.durationWeeks = data.durationWeeks;
        const sorted = [...data.routines].sort((a, b) => a.sortOrder - b.sortOrder);
        this.slots.set(sorted.map(r => ({
          routineId: r.routineId,
          label: r.label ?? '',
        })));
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false),
    });
  }
}

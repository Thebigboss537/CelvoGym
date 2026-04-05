import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ProgramDetailDto, RoutineListDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { ToastService } from '../../../../shared/ui/toast';
import { CgConfirmDialog } from '../../../../shared/ui/confirm-dialog';

interface RoutineSlot {
  routineId: string;
  label: string;
}

@Component({
  selector: 'app-program-form',
  imports: [FormsModule, RouterLink, CgSpinner, CgConfirmDialog],
  template: `
    <div class="animate-fade-up">
      <a routerLink="/trainer/programs" class="text-text-muted text-sm hover:text-text transition">← Programas</a>
      <h1 class="font-display text-2xl font-bold mt-1 mb-6">{{ isEdit() ? 'Editar programa' : 'Nuevo programa' }}</h1>

      @if (loadingRoutines()) {
        <cg-spinner />
      } @else {
        <form (ngSubmit)="save()" class="space-y-5">
          <div>
            <label class="block text-xs text-text-secondary mb-1">Nombre</label>
            <input type="text" [(ngModel)]="name" name="name" required maxlength="200"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition"
              placeholder="Ej: Torso-Pierna 12 semanas" />
          </div>

          <div>
            <label class="block text-xs text-text-secondary mb-1">Descripción (opcional)</label>
            <textarea [(ngModel)]="description" name="description" maxlength="2000" rows="2"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition resize-none"
              placeholder="Descripción del programa..."></textarea>
          </div>

          <div>
            <label class="block text-xs text-text-secondary mb-1">Duración (semanas)</label>
            <input type="number" [(ngModel)]="durationWeeks" name="durationWeeks" required min="1" max="52"
              class="w-24 bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition" />
          </div>

          <!-- Routine slots -->
          <div>
            <label class="block text-xs text-text-secondary mb-2">Rutinas en rotación</label>
            <div class="space-y-2">
              @for (slot of slots(); track $index; let i = $index) {
                <div class="flex items-center gap-2 bg-bg-raised border border-border-light rounded-lg px-3 py-2">
                  <span class="text-xs text-text-muted w-5">{{ i + 1 }}.</span>
                  <select [(ngModel)]="slot.routineId" [name]="'routine-' + i"
                    class="flex-1 bg-bg-raised text-sm text-text border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary transition appearance-none cursor-pointer"
                    style="background-image: url('data:image/svg+xml,<%3Fxml version=%271.0%27 encoding=%27UTF-8%27%3F><svg viewBox=%270 0 24 24%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27><path d=%27M6 9l6 6 6-6%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/></svg>'); background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1rem; padding-right: 2rem;">
                    <option value="" disabled>Seleccionar rutina</option>
                    @for (r of routines(); track r.id) {
                      <option [value]="r.id">{{ r.name }}</option>
                    }
                  </select>
                  <input type="text" [(ngModel)]="slot.label" [name]="'label-' + i" maxlength="100"
                    class="w-28 bg-card border border-border-light rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-primary"
                    placeholder="Etiqueta" />
                  @if (slots().length > 1) {
                    <button type="button" (click)="removeSlot(i)" class="text-danger text-xs hover:text-danger/80">✕</button>
                  }
                </div>
              }
            </div>
            <button type="button" (click)="addSlot()"
              class="text-primary text-xs hover:underline mt-2">+ Agregar rutina</button>
          </div>

          @if (error()) { <p class="text-danger text-xs">{{ error() }}</p> }

          <div class="flex gap-2">
            <button type="submit" [disabled]="saving()"
              class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition press">
              {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar' : 'Crear programa') }}
            </button>
            @if (isEdit()) {
              <button type="button" (click)="showDeleteDialog.set(true)"
                class="bg-card hover:bg-danger hover:text-white border border-border text-danger text-sm px-4 py-2.5 rounded-lg transition">
                Eliminar
              </button>
            }
          </div>
        </form>
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
export class ProgramForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  isEdit = signal(false);
  loadingRoutines = signal(true);
  saving = signal(false);
  error = signal('');
  showDeleteDialog = signal(false);

  routines = signal<RoutineListDto[]>([]);
  slots = signal<RoutineSlot[]>([{ routineId: '', label: '' }]);

  name = '';
  description = '';
  durationWeeks = 8;

  private programId = '';

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit.set(!!this.programId);

    this.api.get<RoutineListDto[]>('/routines').subscribe({
      next: (data) => {
        this.routines.set(data);
        this.loadingRoutines.set(false);

        if (this.isEdit()) this.loadProgram();
      },
      error: () => this.loadingRoutines.set(false),
    });
  }

  addSlot() {
    this.slots.update(s => [...s, { routineId: '', label: '' }]);
  }

  removeSlot(index: number) {
    this.slots.update(s => s.filter((_, i) => i !== index));
  }

  save() {
    const validSlots = this.slots().filter(s => s.routineId);
    if (!this.name.trim() || validSlots.length === 0) {
      this.error.set('Nombre y al menos una rutina son requeridos');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const body = {
      name: this.name.trim(),
      description: this.description.trim() || null,
      durationWeeks: this.durationWeeks,
      routines: validSlots.map(s => ({ routineId: s.routineId, label: s.label.trim() || null })),
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
      error: (err) => this.error.set(err.error?.error || 'Error al eliminar'),
    });
  }

  private loadProgram() {
    this.api.get<ProgramDetailDto>(`/programs/${this.programId}`).subscribe({
      next: (data) => {
        this.name = data.name;
        this.description = data.description ?? '';
        this.durationWeeks = data.durationWeeks;
        this.slots.set(data.routines.map(r => ({
          routineId: r.routineId,
          label: r.label ?? '',
        })));
      },
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgEmptyState } from '../../../../shared/ui/empty-state';
import { CgConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';

interface CatalogExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoSource: string;
  videoUrl: string | null;
  notes: string | null;
  updatedAt: string;
}

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule, CgSpinner, CgEmptyState, CgConfirmDialog],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold">Ejercicios</h1>
        <button (click)="showForm.set(true)"
          class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition press">
          + Agregar
        </button>
      </div>

      <!-- Search -->
      <input type="text" [(ngModel)]="searchTerm" (input)="search()" name="search"
        class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition mb-4"
        placeholder="Buscar ejercicio..." />

      <!-- Add/Edit form -->
      @if (showForm()) {
        <div class="bg-card border border-border rounded-xl p-4 mb-4 animate-fade-up">
          <form (ngSubmit)="saveExercise()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-text-secondary mb-1">Nombre</label>
                <input type="text" [(ngModel)]="formName" name="name" required maxlength="200"
                  class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label class="block text-xs text-text-secondary mb-1">Grupo muscular</label>
                <input type="text" [(ngModel)]="formMuscleGroup" name="muscleGroup" maxlength="100"
                  class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                  placeholder="Ej: Pecho, Espalda..." />
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">Notas</label>
              <textarea [(ngModel)]="formNotes" name="notes" maxlength="2000" rows="2"
                class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary resize-none"
                placeholder="Indicaciones, tips..."></textarea>
            </div>
            <div class="flex gap-2">
              <button type="submit" [disabled]="saving()"
                class="bg-primary hover:bg-primary-hover text-white text-xs px-4 py-2 rounded-lg transition">
                {{ editingId ? 'Guardar' : 'Agregar' }}
              </button>
              <button type="button" (click)="cancelForm()" class="text-text-muted text-xs hover:text-text">Cancelar</button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <cg-spinner />
      } @else if (exercises().length === 0) {
        <cg-empty-state
          title="Tu biblioteca está vacía"
          subtitle="Agrega ejercicios para reutilizarlos al crear rutinas" />
      } @else {
        <div class="space-y-1.5 stagger">
          @for (ex of exercises(); track ex.id) {
            <div class="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between group">
              <div class="min-w-0">
                <p class="font-medium text-text text-sm truncate">{{ ex.name }}</p>
                <div class="flex items-center gap-2 text-xs text-text-muted">
                  @if (ex.muscleGroup) { <span>{{ ex.muscleGroup }}</span> }
                  @if (ex.notes) { <span class="truncate max-w-[200px]">{{ ex.notes }}</span> }
                </div>
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button (click)="editExercise(ex)" class="text-xs text-primary hover:underline">Editar</button>
                <button (click)="deleteTarget = ex; showDeleteDialog.set(true)" class="text-xs text-danger hover:underline">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }

      <cg-confirm-dialog
        [open]="showDeleteDialog()"
        title="Eliminar ejercicio"
        [message]="'¿Eliminar ' + (deleteTarget?.name ?? '') + ' del catálogo?'"
        confirmLabel="Eliminar"
        variant="danger"
        (confirmed)="confirmDelete()"
        (cancelled)="showDeleteDialog.set(false)" />
    </div>
  `,
})
export class CatalogList implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  exercises = signal<CatalogExercise[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  showDeleteDialog = signal(false);
  deleteTarget: CatalogExercise | null = null;

  searchTerm = '';
  formName = '';
  formMuscleGroup = '';
  formNotes = '';
  editingId = '';

  ngOnInit() {
    this.loadExercises();
  }

  search() {
    this.loadExercises();
  }

  saveExercise() {
    if (!this.formName.trim()) return;
    this.saving.set(true);

    const body = {
      name: this.formName.trim(),
      muscleGroup: this.formMuscleGroup.trim() || null,
      notes: this.formNotes.trim() || null,
    };

    const req = this.editingId
      ? this.api.put<CatalogExercise>(`/catalog/${this.editingId}`, body)
      : this.api.post<CatalogExercise>('/catalog', body);

    req.subscribe({
      next: () => {
        this.toast.show(this.editingId ? 'Ejercicio actualizado' : 'Ejercicio agregado');
        this.cancelForm();
        this.loadExercises();
      },
      error: () => this.saving.set(false),
    });
  }

  editExercise(ex: CatalogExercise) {
    this.editingId = ex.id;
    this.formName = ex.name;
    this.formMuscleGroup = ex.muscleGroup ?? '';
    this.formNotes = ex.notes ?? '';
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.saving.set(false);
    this.editingId = '';
    this.formName = '';
    this.formMuscleGroup = '';
    this.formNotes = '';
  }

  confirmDelete() {
    if (!this.deleteTarget) return;
    this.showDeleteDialog.set(false);
    this.api.delete(`/catalog/${this.deleteTarget.id}`).subscribe({
      next: () => {
        this.toast.show('Ejercicio eliminado');
        this.loadExercises();
      },
    });
  }

  private loadExercises() {
    const q = this.searchTerm.trim();
    const url = q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog';
    this.api.get<CatalogExercise[]>(url).subscribe({
      next: (data) => { this.exercises.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

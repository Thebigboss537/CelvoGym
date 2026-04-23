import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxEmptyState } from '../../../../shared/ui/empty-state';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';

interface CatalogExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoSource: string;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
  updatedAt: string;
}

const MUSCLE_CHIPS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombro', 'Brazos', 'Core'];
const EXTRA_CHIPS = ['Glúteos', 'Cardio', 'Movilidad', 'Funcional'];

@Component({
  selector: 'app-catalog-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, KxSpinner, KxEmptyState, KxConfirmDialog],
  template: `
    <div class="animate-fade-up px-4 sm:px-6 md:px-8 pt-6 pb-nav-safe md:pb-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-2xl font-extrabold font-display">Catálogo de Ejercicios</h1>
        <button (click)="openCreate()" data-testid="catalog-new"
          class="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition press">
          + Nuevo ejercicio
        </button>
      </div>

      <!-- Search + filter row -->
      <div class="flex gap-3 mb-4 flex-col sm:flex-row">
        <!-- Search input -->
        <div class="relative flex-1">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none select-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (input)="onSearchInput()"
            name="search"
            data-testid="catalog-search"
            placeholder="Buscar ejercicio..."
            class="w-full bg-card border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-text
                   focus:outline-none focus:border-primary transition placeholder:text-text-muted"
          />
        </div>
      </div>

      <!-- Muscle group filter chips -->
      <div class="flex flex-wrap gap-2 mb-5">
        @for (chip of visibleChips(); track chip) {
          <button
            (click)="selectGroup(chip)"
            [attr.data-testid]="'catalog-chip-' + chip.toLowerCase()"
            class="text-xs font-medium px-3 py-1.5 rounded-full border transition press"
            [class.bg-primary]="selectedGroup() === chip"
            [class.border-primary]="selectedGroup() === chip"
            [class.text-white]="selectedGroup() === chip"
            [class.bg-card]="selectedGroup() !== chip"
            [class.border-border]="selectedGroup() !== chip"
            [class.text-text-muted]="selectedGroup() !== chip"
            [class.hover:border-primary]="selectedGroup() !== chip"
            [class.hover:text-text]="selectedGroup() !== chip"
          >
            {{ chip }}
          </button>
        }
        <button
          (click)="toggleMoreChips()"
          data-testid="catalog-more-chips"
          class="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card text-text-muted
                 hover:border-primary hover:text-text transition press"
        >
          {{ showMoreChips() ? 'Menos ▴' : 'Más ▾' }}
        </button>
      </div>

      <!-- Create / Edit form -->
      @if (editingExercise() !== undefined) {
        <div class="bg-card border border-border rounded-2xl p-5 mb-5 animate-fade-up" data-testid="catalog-form">
          <h2 class="font-display font-bold text-base mb-4">
            {{ editingExercise() === null ? 'Nuevo ejercicio' : 'Editar ejercicio' }}
          </h2>
          <form (ngSubmit)="saveExercise()" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-text-secondary mb-1">Nombre *</label>
                <input type="text" [(ngModel)]="formName" name="name" data-testid="catalog-form-name" required maxlength="200"
                  class="w-full bg-bg-raised border border-border rounded-xl px-3.5 py-2.5 text-sm text-text
                         focus:outline-none focus:border-primary transition"
                  placeholder="Ej: Press de banca" />
              </div>
              <div>
                <label class="block text-xs text-text-secondary mb-1">Grupo muscular</label>
                <input type="text" [(ngModel)]="formMuscleGroup" name="muscleGroup" data-testid="catalog-form-muscle" maxlength="100"
                  class="w-full bg-bg-raised border border-border rounded-xl px-3.5 py-2.5 text-sm text-text
                         focus:outline-none focus:border-primary transition"
                  placeholder="Ej: Pecho, Espalda..." />
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">Video URL (YouTube)</label>
              <input type="url" [(ngModel)]="formVideoUrl" name="videoUrl" data-testid="catalog-form-video" maxlength="500"
                class="w-full bg-bg-raised border border-border rounded-xl px-3.5 py-2.5 text-sm text-text
                       focus:outline-none focus:border-primary transition"
                placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">Miniatura</label>
              @if (formImageUrl) {
                <div class="flex items-start gap-3">
                  <img [src]="formImageUrl" alt="miniatura"
                    class="w-20 h-20 rounded-xl object-cover border border-border" />
                  <button type="button" (click)="formImageUrl = ''" data-testid="catalog-form-image-clear"
                    class="text-xs text-text-muted hover:text-danger transition">Quitar imagen</button>
                </div>
              } @else {
                <label class="inline-flex items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-border
                              hover:border-primary cursor-pointer transition bg-bg-raised"
                  [class.opacity-60]="uploadingImage()">
                  @if (uploadingImage()) {
                    <kx-spinner />
                  } @else {
                    <svg class="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 5v14M5 12h14" />
                    </svg>
                  }
                  <input type="file" accept="image/jpeg,image/png,image/webp" data-testid="catalog-form-image"
                    (change)="onImageUpload($event)" [disabled]="uploadingImage()" class="hidden" />
                </label>
              }
              <p class="text-[11px] text-text-muted mt-1">JPG, PNG o WebP · máx 5 MB</p>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">Instrucciones / notas</label>
              <textarea [(ngModel)]="formNotes" name="notes" data-testid="catalog-form-notes" maxlength="2000" rows="3"
                class="w-full bg-bg-raised border border-border rounded-xl px-3.5 py-2.5 text-sm text-text
                       focus:outline-none focus:border-primary transition resize-none"
                placeholder="Indicaciones técnicas, tips de ejecución..."></textarea>
            </div>
            <div class="flex items-center gap-3 pt-1">
              <button type="submit" [disabled]="saving()" data-testid="catalog-form-submit"
                class="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition press">
                {{ editingExercise() === null ? 'Crear ejercicio' : 'Guardar cambios' }}
              </button>
              <button type="button" (click)="cancelForm()" data-testid="catalog-form-cancel"
                class="text-sm text-text-muted hover:text-text transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Exercise grid -->
      @if (loading()) {
        <kx-spinner />
      } @else if (filtered().length === 0) {
        <kx-empty-state
          data-testid="catalog-empty"
          [title]="searchTerm.trim() || selectedGroup() !== 'Todos' ? 'Sin resultados' : 'Tu biblioteca está vacía'"
          [subtitle]="searchTerm.trim() || selectedGroup() !== 'Todos'
            ? 'Prueba con otro término o filtro'
            : 'Agrega ejercicios para reutilizarlos al crear rutinas'" />
        @if (allExercises().length === 0 && !searchTerm.trim() && selectedGroup() === 'Todos') {
          <div class="max-w-sm mx-auto mt-4 text-center">
            <button type="button" (click)="seedCatalog()" [disabled]="seeding()"
              data-testid="catalog-seed"
              class="bg-card border border-primary/30 hover:bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-lg transition press inline-flex items-center gap-2">
              @if (seeding()) {
                <kx-spinner size="sm" />
                Cargando...
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Cargar 50 ejercicios base
              }
            </button>
            <p class="text-text-muted text-xs mt-2">Te damos una biblioteca inicial para arrancar. Los podés editar o borrar después.</p>
          </div>
        }
      } @else {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          @for (ex of filtered(); track ex.id) {
            <div
              [attr.data-testid]="'catalog-card-' + ex.id"
              class="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer
                     hover:border-primary/40 transition group"
              (click)="editExercise(ex)"
            >
              <!-- Thumbnail -->
              <div class="h-24 bg-bg-raised flex items-center justify-center relative overflow-hidden">
                @if (ex.imageUrl) {
                  <img [src]="ex.imageUrl" [alt]="ex.name" class="w-full h-full object-cover" loading="lazy" />
                  @if (ex.videoUrl) {
                    <span class="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                      <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z"/></svg>
                      video
                    </span>
                  }
                } @else if (ex.videoUrl) {
                  <svg class="w-10 h-10 text-text-muted/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z"/>
                  </svg>
                } @else {
                  <svg class="w-8 h-8 text-text-muted/30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M6.5 6.5h11M6.5 17.5h11M4 12h1.5m13 0H20M6 8.5A2.5 2.5 0 018.5 6h7A2.5 2.5 0 0118 8.5v7A2.5 2.5 0 0115.5 18h-7A2.5 2.5 0 016 15.5v-7z"/>
                  </svg>
                }
              </div>
              <!-- Card body -->
              <div class="p-3">
                <p class="text-sm font-semibold text-text leading-tight line-clamp-2">{{ ex.name }}</p>
                @if (ex.muscleGroup) {
                  <p class="text-[11px] text-text-muted mt-1 truncate">{{ ex.muscleGroup }}</p>
                }
                <!-- Delete button (visible on hover) -->
                <div class="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition">
                  <button
                    [attr.data-testid]="'catalog-delete-' + ex.id"
                    (click)="requestDelete(ex, $event)"
                    class="text-[11px] text-danger hover:underline"
                  >Eliminar</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Delete confirmation -->
    <kx-confirm-dialog
      data-testid="catalog-delete-dialog"
      [open]="showDeleteDialog()"
      title="Eliminar ejercicio"
      [message]="'¿Eliminar ' + (deleteTarget?.name ?? '') + ' del catálogo?'"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="confirmDelete()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class CatalogList implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // Data
  allExercises = signal<CatalogExercise[]>([]);
  loading = signal(true);
  saving = signal(false);

  // Filtering
  selectedGroup = signal('Todos');
  showMoreChips = signal(false);

  visibleChips = computed(() =>
    this.showMoreChips() ? [...MUSCLE_CHIPS, ...EXTRA_CHIPS] : MUSCLE_CHIPS
  );

  filtered = computed(() => {
    const group = this.selectedGroup();
    if (group === 'Todos') return this.allExercises();
    return this.allExercises().filter(ex =>
      (ex.muscleGroup ?? '').toLowerCase().includes(group.toLowerCase())
    );
  });

  // Editing: undefined = not editing, null = create mode, CatalogExercise = edit mode
  editingExercise = signal<CatalogExercise | null | undefined>(undefined);

  // Delete dialog
  showDeleteDialog = signal(false);
  deleteTarget: CatalogExercise | null = null;

  // Search
  searchTerm = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Form fields
  formName = '';
  formMuscleGroup = '';
  formVideoUrl = '';
  formImageUrl = '';
  formNotes = '';
  uploadingImage = signal(false);
  seeding = signal(false);

  ngOnInit() {
    this.loadExercises();
  }

  onSearchInput() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadExercises(), 300);
  }

  selectGroup(group: string) {
    this.selectedGroup.set(group);
  }

  toggleMoreChips() {
    this.showMoreChips.update(v => !v);
  }

  openCreate() {
    this.resetFormFields();
    this.editingExercise.set(null);
  }

  editExercise(ex: CatalogExercise) {
    this.formName = ex.name;
    this.formMuscleGroup = ex.muscleGroup ?? '';
    this.formVideoUrl = ex.videoUrl ?? '';
    this.formImageUrl = ex.imageUrl ?? '';
    this.formNotes = ex.notes ?? '';
    this.editingExercise.set(ex);
  }

  cancelForm() {
    this.editingExercise.set(undefined);
    this.saving.set(false);
    this.resetFormFields();
  }

  saveExercise() {
    if (!this.formName.trim()) return;
    this.saving.set(true);

    const editing = this.editingExercise();
    const videoUrl = this.formVideoUrl.trim() || null;
    const body = {
      name: this.formName.trim(),
      muscleGroup: this.formMuscleGroup.trim() || null,
      videoSource: videoUrl ? 'YouTube' : 'None',
      videoUrl,
      imageUrl: this.formImageUrl.trim() || null,
      notes: this.formNotes.trim() || null,
    };

    const req = editing
      ? this.api.put<CatalogExercise>(`/catalog/${editing.id}`, body)
      : this.api.post<CatalogExercise>('/catalog', body);

    req.subscribe({
      next: () => {
        this.toast.show(editing ? 'Ejercicio actualizado' : 'Ejercicio creado');
        this.cancelForm();
        this.loadExercises();
      },
      error: () => this.saving.set(false),
    });
  }

  requestDelete(ex: CatalogExercise, event: Event) {
    event.stopPropagation();
    this.deleteTarget = ex;
    this.showDeleteDialog.set(true);
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

  seedCatalog() {
    this.seeding.set(true);
    this.api.post<{ inserted: number }>('/catalog/seed', {}).subscribe({
      next: (res) => {
        this.toast.show(`${res.inserted} ejercicios agregados al catálogo`);
        this.seeding.set(false);
        this.loadExercises();
      },
      error: () => {
        this.seeding.set(false);
        this.toast.show('No se pudo cargar la biblioteca base', 'error');
      },
    });
  }

  private loadExercises() {
    const q = this.searchTerm.trim();
    const url = q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog';
    this.loading.set(true);
    this.api.get<CatalogExercise[]>(url).subscribe({
      next: (data) => {
        this.allExercises.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private resetFormFields() {
    this.formName = '';
    this.formMuscleGroup = '';
    this.formVideoUrl = '';
    this.formImageUrl = '';
    this.formNotes = '';
    this.uploadingImage.set(false);
  }

  onImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toast.show('La imagen no puede superar 5MB', 'error');
      return;
    }
    this.uploadingImage.set(true);
    const formData = new FormData();
    formData.append('file', file);
    this.api.upload<{ url: string; key: string }>('/images/upload', formData).subscribe({
      next: (res) => {
        this.formImageUrl = res.url;
        this.uploadingImage.set(false);
      },
      error: () => {
        this.uploadingImage.set(false);
        this.toast.show('Error al subir imagen', 'error');
      },
    });
  }
}

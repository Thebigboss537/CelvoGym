import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LucideIconProvider, LUCIDE_ICONS } from 'lucide-angular';
import { Pin, Trash2, Pencil, Plus, X, Check } from 'lucide-angular';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/ui/toast';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxEmptyState } from '../../../../shared/ui/empty-state';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { TrainerNoteDto } from '../../../../shared/models';

@Component({
  selector: 'app-student-detail-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, KxSpinner, KxEmptyState, KxConfirmDialog],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Pin, Trash2, Pencil, Plus, X, Check }) },
  ],
  template: `
    <div class="space-y-4 animate-fade-up">

      <!-- Add note form -->
      @if (showForm()) {
        <div class="bg-card border border-primary/30 rounded-2xl p-4 space-y-3">
          <textarea
            class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text
                   focus:outline-none focus:border-primary resize-none placeholder:text-text-muted"
            rows="4"
            placeholder="Escribe una nota privada sobre este alumno…"
            [ngModel]="formText()"
            (ngModelChange)="formText.set($event)">
          </textarea>
          <div class="flex items-center justify-between gap-3">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                (click)="formPinned.set(!formPinned())"
                class="w-5 h-5 rounded border transition flex items-center justify-center"
                [class]="formPinned()
                  ? 'bg-primary border-primary text-white'
                  : 'border-border text-text-muted hover:border-border-light'">
                @if (formPinned()) {
                  <lucide-icon name="check" [size]="12" [strokeWidth]="2.5" />
                }
              </button>
              <span class="text-xs text-text-secondary">Fijar nota</span>
            </label>
            <div class="flex gap-2">
              <button type="button" (click)="cancelForm()"
                class="px-3 py-1.5 text-xs text-text-muted border border-border rounded-lg hover:text-text transition">
                Cancelar
              </button>
              <button type="button" (click)="saveNote()"
                [disabled]="saving() || !formText().trim()"
                class="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg
                       disabled:opacity-50 hover:bg-primary-hover transition press">
                @if (saving()) { Guardando… } @else if (editingId()) { Guardar cambios } @else { Añadir nota }
              </button>
            </div>
          </div>
        </div>
      } @else {
        <button type="button" (click)="openAddForm()"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed
                 border-border text-text-muted text-sm hover:border-primary/40 hover:text-primary transition">
          <lucide-icon name="plus" [size]="16" [strokeWidth]="2" />
          Nueva nota privada
        </button>
      }

      <!-- Loading state -->
      @if (loading()) {
        <div class="flex justify-center py-8">
          <kx-spinner />
        </div>
      }

      <!-- Empty state -->
      @else if (!loading() && notes().length === 0 && !showForm()) {
        <kx-empty-state
          title="Sin notas"
          subtitle="Las notas son privadas — solo tú puedes verlas."
          icon="pencil" />
      }

      <!-- Notes list -->
      @else if (!loading()) {
        <div class="space-y-3">
          @for (note of notes(); track note.id) {
            <div class="bg-card border rounded-2xl p-4 transition"
              [class]="note.isPinned ? 'border-primary/30' : 'border-border'">
              <!-- Header row -->
              <div class="flex items-start gap-2 mb-2">
                @if (note.isPinned) {
                  <lucide-icon name="pin"
                    class="text-primary mt-0.5 shrink-0"
                    [size]="14" [strokeWidth]="2" />
                }
                <p class="flex-1 text-sm text-text leading-relaxed whitespace-pre-wrap">{{ note.text }}</p>
              </div>
              <!-- Footer row -->
              <div class="flex items-center justify-between mt-3">
                <p class="text-[11px] text-text-muted">{{ formatNoteDate(note.updatedAt) }}</p>
                <div class="flex gap-1">
                  <button type="button" (click)="openEditForm(note)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted
                           hover:text-text hover:bg-bg-raised transition"
                    title="Editar">
                    <lucide-icon name="pencil" [size]="13" [strokeWidth]="2" />
                  </button>
                  <button type="button" (click)="togglePin(note)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center transition"
                    [class]="note.isPinned
                      ? 'text-primary hover:text-text-muted hover:bg-bg-raised'
                      : 'text-text-muted hover:text-primary hover:bg-bg-raised'"
                    [title]="note.isPinned ? 'Desfijar' : 'Fijar'">
                    <lucide-icon name="pin" [size]="13" [strokeWidth]="2" />
                  </button>
                  <button type="button" (click)="confirmDelete.set(note.id)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted
                           hover:text-danger hover:bg-bg-raised transition"
                    title="Eliminar">
                    <lucide-icon name="trash-2" [size]="13" [strokeWidth]="2" />
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

    </div>

    <!-- Delete confirmation dialog -->
    <kx-confirm-dialog
      [open]="!!confirmDelete()"
      title="Eliminar nota"
      message="Esta acción no se puede deshacer. ¿Eliminar la nota?"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="deleteNote()"
      (cancelled)="confirmDelete.set(null)" />
  `,
})
export class StudentDetailNotes implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  studentId = input.required<string>();

  loading = signal(true);
  notes = signal<TrainerNoteDto[]>([]);

  // Form state
  showForm = signal(false);
  editingId = signal<string | null>(null);
  formText = signal('');
  formPinned = signal(false);
  saving = signal(false);

  // Delete confirm
  confirmDelete = signal<string | null>(null);

  ngOnInit(): void {
    this.loadNotes();
  }

  private loadNotes(): void {
    this.loading.set(true);
    this.api
      .get<TrainerNoteDto[]>(`/students/${this.studentId()}/notes`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.notes.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.show('Error al cargar notas', 'error');
        },
      });
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.formText.set('');
    this.formPinned.set(false);
    this.showForm.set(true);
  }

  openEditForm(note: TrainerNoteDto): void {
    this.editingId.set(note.id);
    this.formText.set(note.text);
    this.formPinned.set(note.isPinned);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formText.set('');
    this.formPinned.set(false);
  }

  saveNote(): void {
    const text = this.formText().trim();
    if (!text) return;

    this.saving.set(true);
    const id = this.editingId();
    const studentId = this.studentId();
    const body = { text, isPinned: this.formPinned() };

    const req$ = id
      ? this.api.put<TrainerNoteDto>(`/students/${studentId}/notes/${id}`, body)
      : this.api.post<TrainerNoteDto>(`/students/${studentId}/notes`, body);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.notes.update((list) =>
          id
            ? list.map((n) => (n.id === id ? saved : n)).sort(this.noteSort)
            : [saved, ...list].sort(this.noteSort)
        );
        this.saving.set(false);
        this.cancelForm();
        this.toast.show(id ? 'Nota actualizada' : 'Nota añadida');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err.error?.error ?? 'Error al guardar nota', 'error');
      },
    });
  }

  togglePin(note: TrainerNoteDto): void {
    const studentId = this.studentId();
    this.api
      .put<TrainerNoteDto>(`/students/${studentId}/notes/${note.id}`, {
        text: note.text,
        isPinned: !note.isPinned,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.notes.update((list) =>
            list.map((n) => (n.id === note.id ? saved : n)).sort(this.noteSort)
          );
        },
        error: () => this.toast.show('Error al actualizar nota', 'error'),
      });
  }

  deleteNote(): void {
    const id = this.confirmDelete();
    if (!id) return;

    this.api
      .delete(`/students/${this.studentId()}/notes/${id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notes.update((list) => list.filter((n) => n.id !== id));
          this.confirmDelete.set(null);
          this.toast.show('Nota eliminada');
        },
        error: () => {
          this.confirmDelete.set(null);
          this.toast.show('Error al eliminar nota', 'error');
        },
      });
  }

  formatNoteDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private readonly noteSort = (a: TrainerNoteDto, b: TrainerNoteDto): number => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  };
}

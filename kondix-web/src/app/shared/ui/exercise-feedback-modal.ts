import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KxRpeStepper } from './rpe-stepper';

export interface ExerciseFeedbackPayload { rpe: number; notes: string | null; }

@Component({
  selector: 'kx-exercise-feedback-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, KxRpeStepper],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-up"
        role="dialog" aria-modal="true">
        <div class="w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-border">
            <p class="text-overline text-text-muted">Cómo te fue</p>
            <h3 class="text-h3 text-text font-display mt-0.5">{{ exerciseName() }}</h3>
          </div>
          <div class="px-5 py-5 space-y-5">
            <kx-rpe-stepper
              [value]="rpe()"
              (valueChange)="rpe.set($event)"
            />
            <div>
              <label class="block text-overline text-text-muted mb-2">Notas (opcional)</label>
              <textarea
                class="w-full bg-bg-raised border border-border rounded-lg p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                rows="3"
                placeholder="Algo que quieras decirle al coach…"
                [(ngModel)]="notesValue"
                maxlength="2000"
              ></textarea>
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button"
                class="flex-1 py-2.5 bg-bg-raised border border-border text-text-muted text-sm rounded-lg hover:text-text transition press"
                (click)="skip.emit()">
                Saltar
              </button>
              <button type="button"
                [disabled]="rpe() == null"
                class="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-primary-hover transition press"
                (click)="onSubmit()">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class KxExerciseFeedbackModal {
  exerciseName = input.required<string>();
  open = input<boolean>(false);
  submit = output<ExerciseFeedbackPayload>();
  skip = output<void>();

  rpe = signal<number | null>(null);
  notesValue = '';

  onSubmit(): void {
    const r = this.rpe();
    if (r == null) return;
    const notes = this.notesValue.trim();
    this.submit.emit({ rpe: r, notes: notes.length > 0 ? notes : null });
    this.rpe.set(null);
    this.notesValue = '';
  }
}

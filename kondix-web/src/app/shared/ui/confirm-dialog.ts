import { Component, input, output } from '@angular/core';

@Component({
  selector: 'cg-confirm-dialog',
  template: `
    @if (open()) {
      <div class="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        role="dialog" aria-modal="true" [attr.aria-label]="title()"
        (click)="cancelled.emit()">
        <div class="bg-card border border-border rounded-xl p-6 max-w-sm w-full animate-fade-up"
          (click)="$event.stopPropagation()">
          <h2 class="font-display text-lg font-bold mb-2">{{ title() }}</h2>
          <p class="text-text-secondary text-sm mb-6">{{ message() }}</p>
          <div class="flex gap-3">
            <button (click)="cancelled.emit()"
              class="flex-1 bg-card border border-border text-text-secondary py-2.5 rounded-lg transition hover:bg-card-hover">
              Cancelar
            </button>
            <button (click)="confirmed.emit()"
              class="flex-1 text-white font-semibold py-2.5 rounded-lg transition press"
              [class.bg-danger]="variant() === 'danger'"
              [class.hover:bg-danger/80]="variant() === 'danger'"
              [class.bg-primary]="variant() === 'primary'"
              [class.hover:bg-primary-hover]="variant() === 'primary'">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CgConfirmDialog {
  open = input(false);
  title = input('Confirmar acción');
  message = input('¿Estás seguro?');
  confirmLabel = input('Confirmar');
  variant = input<'danger' | 'primary'>('danger');

  confirmed = output<void>();
  cancelled = output<void>();
}

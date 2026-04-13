import { Component, Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<Toast | null>(null);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: Toast['type'] = 'success', duration = 3000) {
    if (this.timeout) clearTimeout(this.timeout);
    this.toast.set({ message, type });
    this.timeout = setTimeout(() => this.toast.set(null), duration);
  }

  dismiss() {
    if (this.timeout) clearTimeout(this.timeout);
    this.toast.set(null);
  }
}

@Component({
  selector: 'cg-toast',
  template: `
    @if (toastService.toast(); as t) {
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up"
        role="status" aria-live="polite">
        <div class="px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-md"
          [class.bg-success-dark]="t.type === 'success'"
          [class.border-success/30]="t.type === 'success'"
          [class.text-success]="t.type === 'success'"
          [class.bg-danger/20]="t.type === 'error'"
          [class.border-danger/30]="t.type === 'error'"
          [class.text-danger]="t.type === 'error'"
          [class.bg-card]="t.type === 'info'"
          [class.border-border]="t.type === 'info'"
          [class.text-text]="t.type === 'info'">
          {{ t.message }}
        </div>
      </div>
    }
  `,
})
export class CgToast {
  toastService: ToastService;
  constructor(toastService: ToastService) {
    this.toastService = toastService;
  }
}

import { Component, Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'pr';
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<Toast | null>(null);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: Exclude<Toast['type'], 'pr'> = 'success', duration = 3000) {
    if (this.timeout) clearTimeout(this.timeout);
    this.toast.set({ message, type });
    this.timeout = setTimeout(() => this.toast.set(null), duration);
  }

  showPR(exerciseName: string, weight: string, reps: number | null) {
    if (this.timeout) clearTimeout(this.timeout);
    const repsLabel = reps != null ? ` × ${reps}` : '';
    this.toast.set({
      title: '¡Nuevo récord!',
      message: `${exerciseName} · ${weight}kg${repsLabel}`,
      type: 'pr',
    });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([100, 60, 100, 60, 200]); } catch { /* not supported */ }
    }
    this.timeout = setTimeout(() => this.toast.set(null), 4000);
  }

  dismiss() {
    if (this.timeout) clearTimeout(this.timeout);
    this.toast.set(null);
  }
}

@Component({
  selector: 'kx-toast',
  template: `
    @if (toastService.toast(); as t) {
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up"
        role="status" aria-live="polite">
        @if (t.type === 'pr') {
          <div class="px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
            style="background: linear-gradient(135deg, #B45309 0%, #E62639 60%, #FBBF24 100%); min-width: 280px;">
            <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🏆
            </div>
            <div class="text-white">
              <p class="text-[10px] uppercase tracking-wider font-bold opacity-80">{{ t.title }}</p>
              <p class="text-sm font-semibold">{{ t.message }}</p>
            </div>
          </div>
        } @else {
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
        }
      </div>
    }
  `,
})
export class KxToast {
  toastService: ToastService;
  constructor(toastService: ToastService) {
    this.toastService = toastService;
  }
}

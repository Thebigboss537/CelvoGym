import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RecoverableSessionDto } from '../models';

@Component({
  selector: 'kx-recovery-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl p-4 border border-warning/30 bg-warning/10 mb-4 animate-fade-up"
      role="region" aria-label="Sesión por recuperar">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 0118 0M3 12l4-4M3 12l4 4M21 12a9 9 0 01-18 0M21 12l-4 4M21 12l-4-4"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-text">Recupera el entreno del {{ dayLabel() }}</p>
          <p class="text-xs text-text-muted mt-0.5">{{ deadlineLabel() }}</p>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <button type="button"
          class="flex-1 py-2 bg-bg-raised border border-border text-text-muted text-xs rounded-lg hover:text-text transition press"
          (click)="dismiss.emit()">
          Saltar
        </button>
        <button type="button"
          class="flex-1 py-2 bg-warning text-bg text-xs font-semibold rounded-lg hover:bg-warning/90 transition press"
          (click)="recover.emit()">
          Recuperar
        </button>
      </div>
    </div>
  `,
})
export class KxRecoveryBanner {
  missedSession = input.required<RecoverableSessionDto>();
  recover = output<void>();
  dismiss = output<void>();

  dayLabel = computed(() => {
    const d = new Date(this.missedSession().plannedDate);
    return d.toLocaleDateString('es', { weekday: 'long' });
  });

  deadlineLabel = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(this.missedSession().deadlineDate);
    deadline.setHours(0, 0, 0, 0);
    const diff = Math.round((deadline.getTime() - today.getTime()) / 86400000);
    if (diff <= 0) return 'Vence hoy';
    if (diff === 1) return 'Vence mañana';
    return `Vence en ${diff} días`;
  });
}

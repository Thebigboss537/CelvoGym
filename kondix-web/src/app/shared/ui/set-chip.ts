import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'kx-set-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium"
      [class]="containerClass()"
      [title]="note() ?? ''"
    >
      @if (isPR()) {
        <span class="text-[10px]" aria-label="Récord">🏆</span>
      }
      <span class="font-bold tabular-nums">{{ weight() }}kg</span>
      <span class="text-text-muted">×</span>
      <span class="tabular-nums">{{ reps() }}</span>
      @if (note()) {
        <span class="text-[10px]" aria-label="Tiene nota">💬</span>
      }
    </span>
  `,
})
export class KxSetChip {
  weight = input.required<string>();
  reps = input.required<number>();
  isPR = input<boolean>(false);
  note = input<string | null>(null);
  setType = input<string>('Effective');

  containerClass = computed(() => {
    if (this.isPR()) return 'border-amber-500/50 bg-amber-500/10 text-amber-200';
    return 'border-border bg-card text-text';
  });
}

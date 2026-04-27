import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

const RPE_COLORS: Record<number, string> = {
  1: '#22C55E', 2: '#22C55E', 3: '#22C55E', 4: '#84CC16',
  5: '#84CC16', 6: '#F59E0B', 7: '#F59E0B', 8: '#F97316',
  9: '#EF4444', 10: '#EF4444',
};

@Component({
  selector: 'kx-rpe-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      @if (showLabel()) {
        <p class="text-overline text-text-muted">RPE percibido</p>
      }
      <div class="grid grid-cols-10 gap-1">
        @for (n of steps; track n) {
          <button
            type="button"
            class="h-10 rounded-md border text-sm font-bold transition press"
            [class.border-border]="value() !== n"
            [class.text-text-muted]="value() !== n"
            [class.bg-card]="value() !== n"
            [class.border-primary]="value() === n"
            [class.bg-primary]="value() === n"
            [class.text-white]="value() === n"
            [style.boxShadow]="value() === n ? '0 0 12px ' + colorFor(n) + '60' : 'none'"
            (click)="valueChange.emit(n)"
            [attr.aria-pressed]="value() === n"
            [attr.aria-label]="'RPE ' + n"
          >
            {{ n }}
          </button>
        }
      </div>
      @if (value() != null) {
        <p class="text-xs text-text-muted text-center">
          {{ describeRpe(value()!) }}
        </p>
      }
    </div>
  `,
})
export class KxRpeStepper {
  value = input<number | null>(null);
  showLabel = input<boolean>(true);
  valueChange = output<number>();

  steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  colorFor(n: number): string {
    return RPE_COLORS[n] ?? '#71717A';
  }

  describeRpe(n: number): string {
    if (n <= 3) return 'Muy fácil — sobraban muchas reps';
    if (n <= 5) return 'Cómodo — sobraban varias reps';
    if (n <= 7) return 'Exigente — 2 a 3 reps en reserva';
    if (n <= 8) return 'Duro — 1 a 2 reps en reserva';
    if (n === 9) return 'Casi al fallo — 1 rep en reserva';
    return 'Al fallo';
  }
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type DayCellState = 'completed' | 'recovered' | 'today' | 'scheduled' | 'rest' | 'other-month';

@Component({
  selector: 'kx-day-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="aspect-square rounded-xl flex flex-col items-center justify-center w-full relative"
      [class]="containerClasses()"
      (click)="onSelect()"
      [attr.aria-label]="state() !== 'other-month' ? 'Día ' + day() : null"
    >
      @if (state() === 'recovered') {
        <span class="absolute top-1 right-1 text-warning" aria-hidden="true">
          <!-- rotate-ccw icon (curved arrow counterclockwise) -->
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.5 8A9.5 9.5 0 1 1 5 4.5"/>
            <polyline stroke-linecap="round" stroke-linejoin="round" points="2 2 2 8 8 8"/>
          </svg>
        </span>
      }
      <span class="text-sm leading-none" [class]="numberClasses()">{{ day() }}</span>
      @if (hasDot()) {
        <span class="w-1.5 h-1.5 rounded-full mt-1" [class]="dotClasses()"></span>
      }
    </button>
  `,
})
export class KxDayCell {
  day = input.required<number>();
  state = input.required<DayCellState>();

  select = output<void>();

  onSelect(): void {
    if (this.state() !== 'other-month') {
      this.select.emit();
    }
  }

  containerClasses(): string {
    switch (this.state()) {
      case 'completed':
        return 'bg-success-dark border border-success/25 cursor-pointer';
      case 'recovered':
        return 'bg-warning-dark border border-warning/30 cursor-pointer';
      case 'today':
        return 'bg-primary/12 border-[1.5px] border-primary shadow-[0_0_12px_rgba(230,38,57,0.2)] cursor-pointer';
      case 'scheduled':
        return 'bg-card border border-border cursor-pointer';
      case 'rest':
        return 'bg-card';
      case 'other-month':
        return 'opacity-25';
      default:
        return '';
    }
  }

  numberClasses(): string {
    switch (this.state()) {
      case 'completed':
        return 'text-success font-bold';
      case 'recovered':
        return 'text-warning font-bold';
      case 'today':
        return 'text-primary font-extrabold';
      case 'scheduled':
        return 'text-text';
      case 'rest':
        return 'text-text-muted';
      case 'other-month':
        return 'text-text-muted';
      default:
        return 'text-text';
    }
  }

  hasDot(): boolean {
    return this.state() === 'completed' || this.state() === 'recovered' || this.state() === 'today' || this.state() === 'scheduled';
  }

  dotClasses(): string {
    switch (this.state()) {
      case 'completed':
        return 'bg-success';
      case 'recovered':
        return 'bg-warning';
      case 'today':
        return 'bg-primary';
      case 'scheduled':
        return 'bg-primary opacity-50';
      default:
        return '';
    }
  }
}

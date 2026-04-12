import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type DayCellState = 'completed' | 'today' | 'scheduled' | 'rest' | 'other-month';

@Component({
  selector: 'cg-day-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="aspect-square rounded-xl flex flex-col items-center justify-center w-full"
      [class]="containerClasses()"
      (click)="onSelect()"
      [attr.aria-label]="state() !== 'other-month' ? 'Día ' + day() : null"
    >
      <span class="text-sm leading-none" [class]="numberClasses()">{{ day() }}</span>
      @if (hasDot()) {
        <span class="w-1.5 h-1.5 rounded-full mt-1" [class]="dotClasses()"></span>
      }
    </button>
  `,
})
export class CgDayCell {
  day = input.required<number>();
  state = input.required<DayCellState>();

  select = output<void>();

  onSelect(): void {
    if (this.state() !== 'rest' && this.state() !== 'other-month') {
      this.select.emit();
    } else if (this.state() === 'rest') {
      this.select.emit();
    }
  }

  containerClasses(): string {
    switch (this.state()) {
      case 'completed':
        return 'bg-success-dark border border-success/25 cursor-pointer';
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
    return this.state() === 'completed' || this.state() === 'today' || this.state() === 'scheduled';
  }

  dotClasses(): string {
    switch (this.state()) {
      case 'completed':
        return 'bg-success';
      case 'today':
        return 'bg-primary';
      case 'scheduled':
        return 'bg-primary opacity-50';
      default:
        return '';
    }
  }
}

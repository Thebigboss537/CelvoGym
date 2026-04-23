import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, icons } from 'lucide-angular';

type Variant = 'ghost' | 'primary' | 'danger';
type Size = 'sm' | 'md';

@Component({
  selector: 'kx-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
  ],
  template: `
    <button
      type="button"
      [attr.aria-label]="ariaLabel()"
      [attr.title]="ariaLabel()"
      [disabled]="disabled()"
      (click)="clicked.emit($event)"
      [class]="classes()"
    >
      <lucide-icon [name]="icon()" [size]="iconSize()" [strokeWidth]="1.75" />
      @if (label()) {
        <span class="text-xs font-medium">{{ label() }}</span>
      }
    </button>
  `,
})
export class KxIconButton {
  icon = input.required<string>();
  ariaLabel = input.required<string>();
  label = input<string | null>(null);
  variant = input<Variant>('ghost');
  size = input<Size>('md');
  active = input(false);
  disabled = input(false);
  clicked = output<MouseEvent>();

  classes() {
    const base = 'inline-flex items-center gap-1.5 rounded-lg transition press disabled:opacity-40 disabled:cursor-not-allowed';
    const sz = this.size() === 'sm' ? 'h-7 px-2' : 'h-9 px-2.5';
    const variant = this.variantClass();
    return `${base} ${sz} ${variant}`;
  }

  private variantClass(): string {
    if (this.variant() === 'primary') {
      return 'bg-primary hover:bg-primary-hover text-white';
    }
    if (this.variant() === 'danger') {
      return 'text-text-muted hover:bg-danger/10 hover:text-danger';
    }
    // ghost
    return this.active()
      ? 'bg-primary/10 text-primary hover:bg-primary/20'
      : 'bg-card hover:bg-card-hover text-text-muted hover:text-text';
  }

  iconSize(): number {
    return this.size() === 'sm' ? 14 : 16;
  }
}

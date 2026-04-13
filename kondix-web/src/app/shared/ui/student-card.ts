import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'cg-student-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors"
      [class]="cardClass()"
      (click)="select.emit()"
    >
      <!-- Avatar -->
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        [style.background]="'linear-gradient(135deg, ' + gradientFrom() + ', ' + gradientTo() + ')'"
      >
        {{ initials() }}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-text text-sm font-semibold">{{ name() }}</p>
        <p class="text-text-muted text-[11px] truncate">{{ subtitle() }}</p>
      </div>

      <!-- Status dot -->
      <div class="w-2 h-2 rounded-full shrink-0" [class]="dotClass()"></div>
    </div>
  `,
})
export class CgStudentCard {
  name = input.required<string>();
  initials = input.required<string>();
  gradientFrom = input<string>('#E62639');
  gradientTo = input<string>('#B31D2C');
  subtitle = input.required<string>();
  status = input.required<string>();
  statusText = input.required<string>();
  selected = input<boolean>(false);

  select = output<void>();

  cardClass = computed(() => {
    if (this.selected()) return 'bg-primary/[0.08] border border-primary/20';
    if (this.status() === 'warning') return 'bg-card border border-warning/20';
    return 'bg-card border border-border';
  });

  dotClass = computed(() => {
    switch (this.status()) {
      case 'training':
      case 'completed':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'resting':
        return 'bg-text-muted';
      case 'no-program':
        return 'bg-[#A78BFA]';
      default:
        return 'bg-text-muted';
    }
  });
}

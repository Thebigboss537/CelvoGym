import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { GRADIENT_PAIRS } from '../utils/display';

const gradientMap: Record<string, [string, string]> = {
  crimson: GRADIENT_PAIRS[0],
  purple: GRADIENT_PAIRS[1],
  amber: GRADIENT_PAIRS[2],
  cyan: GRADIENT_PAIRS[3],
  pink: GRADIENT_PAIRS[4],
  blue: GRADIENT_PAIRS[5],
};

@Component({
  selector: 'kx-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rounded-full flex items-center justify-center font-bold shrink-0"
      [class]="containerClasses()"
      [style.background]="gradientBackground()"
    >
      {{ initial() }}
    </div>
  `,
})
export class KxAvatar {
  name = input.required<string>();
  size = input<'sm' | 'md'>('sm');
  gradient = input<'crimson' | 'purple' | 'amber' | 'cyan' | 'pink' | 'blue'>();

  initial = computed(() => this.name().charAt(0).toUpperCase());

  gradientBackground = computed(() => {
    const g = this.gradient();
    if (!g) return null;
    const colors = gradientMap[g];
    return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
  });

  containerClasses = computed(() => {
    const sizeClass = this.size() === 'md' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs';
    const colorClasses = this.gradient()
      ? 'text-white'
      : 'bg-primary-light text-primary';
    return `${sizeClass} ${colorClasses}`;
  });
}

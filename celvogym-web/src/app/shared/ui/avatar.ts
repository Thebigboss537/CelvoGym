import { Component, input, computed } from '@angular/core';

const gradientMap: Record<string, [string, string]> = {
  crimson: ['#E62639', '#B31D2C'],
  purple: ['#A78BFA', '#7C3AED'],
  amber: ['#F59E0B', '#D97706'],
  cyan: ['#22D3EE', '#0891B2'],
  pink: ['#F472B6', '#DB2777'],
  blue: ['#3B82F6', '#1D4ED8'],
};

@Component({
  selector: 'cg-avatar',
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
export class CgAvatar {
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

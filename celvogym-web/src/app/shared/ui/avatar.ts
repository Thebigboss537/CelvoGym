import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'cg-avatar',
  template: `
    <div
      class="rounded-full bg-primary-light flex items-center justify-center text-primary font-bold shrink-0"
      [class]="sizeClasses()"
    >
      {{ initial() }}
    </div>
  `,
})
export class CgAvatar {
  name = input.required<string>();
  size = input<'sm' | 'md'>('sm');

  initial = computed(() => this.name().charAt(0).toUpperCase());

  sizeClasses = computed(() =>
    this.size() === 'md'
      ? 'w-10 h-10 text-sm'
      : 'w-7 h-7 text-xs'
  );
}

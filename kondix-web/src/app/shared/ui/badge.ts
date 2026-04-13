import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

@Component({
  selector: 'cg-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold" [class]="variantClass()">
      @if (dot()) {
        <span class="w-1.5 h-1.5 rounded-full" [class]="dotClass()"></span>
      }
      {{ text() }}
    </span>
  `,
})
export class CgBadge {
  text = input.required<string>();
  variant = input<'success' | 'warning' | 'danger' | 'info' | 'neutral'>('neutral');
  dot = input<boolean>(false);

  variantClass = computed(() => {
    const map: Record<string, string> = {
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      danger: 'bg-danger/10 text-danger',
      info: 'bg-primary/10 text-primary',
      neutral: 'bg-border text-text-muted',
    };
    return map[this.variant()];
  });

  dotClass = computed(() => {
    const map: Record<string, string> = {
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-primary',
      neutral: 'bg-text-muted',
    };
    return map[this.variant()];
  });
}

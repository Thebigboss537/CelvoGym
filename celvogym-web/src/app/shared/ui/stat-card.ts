import { Component, input } from '@angular/core';

@Component({
  selector: 'cg-stat-card',
  template: `
    <div class="bg-card border border-border rounded-2xl p-5 text-center">
      <p class="text-text-muted text-[11px] font-semibold tracking-wide uppercase">{{ label() }}</p>
      <p class="text-2xl font-extrabold mt-2" [class]="valueColor()">{{ value() }}</p>
      @if (trend()) {
        <p class="text-xs mt-1" [class]="trendPositive() ? 'text-success' : 'text-text-secondary'">{{ trend() }}</p>
      }
    </div>
  `,
})
export class CgStatCard {
  value = input.required<string>();
  label = input.required<string>();
  trend = input<string>();
  valueColor = input<string>('text-text');
  trendPositive = input<boolean>(true);
}

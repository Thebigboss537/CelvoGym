import { Component, input, computed } from '@angular/core';

export interface ChartPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'kx-line-chart',
  template: `
    @if (points().length > 1) {
      <div class="relative">
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="w-full" preserveAspectRatio="none">
          <!-- Grid lines -->
          @for (y of gridLines(); track y) {
            <line [attr.x1]="padding" [attr.y1]="y" [attr.x2]="width - padding" [attr.y2]="y"
              stroke="var(--color-border)" stroke-width="0.5" />
          }
          <!-- Line -->
          <polyline [attr.points]="svgPoints()" fill="none" stroke="var(--color-primary)"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Dots -->
          @for (p of scaledPoints(); track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="var(--color-primary)" />
          }
        </svg>
        <!-- Labels -->
        <div class="flex justify-between text-xs text-text-muted mt-1 px-1">
          <span>{{ points()[0].label }}</span>
          <span>{{ points()[points().length - 1].label }}</span>
        </div>
      </div>
    } @else {
      <p class="text-text-muted text-xs text-center py-4">Datos insuficientes para gráfico</p>
    }
  `,
})
export class KxLineChart {
  points = input.required<ChartPoint[]>();
  width = 300;
  height = 120;
  padding = 10;

  scaledPoints = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return [];
    const values = pts.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const usableW = this.width - this.padding * 2;
    const usableH = this.height - this.padding * 2;
    return pts.map((p, i) => ({
      x: this.padding + (i / (pts.length - 1)) * usableW,
      y: this.padding + (1 - (p.value - min) / range) * usableH,
    }));
  });

  svgPoints = computed(() =>
    this.scaledPoints().map(p => `${p.x},${p.y}`).join(' ')
  );

  gridLines = computed(() => {
    const lines: number[] = [];
    for (let i = 0; i <= 3; i++) {
      lines.push(this.padding + (i / 3) * (this.height - this.padding * 2));
    }
    return lines;
  });
}

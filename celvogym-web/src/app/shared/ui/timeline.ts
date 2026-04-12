import { Component, input } from '@angular/core';

export interface TimelineItem {
  color: 'success' | 'info' | 'neutral';
  title: string;
  subtitle: string;
}

@Component({
  selector: 'cg-timeline',
  template: `
    <div class="ml-3 border-l-2 border-border pl-5 flex flex-col gap-0">
      @for (item of items(); track $index) {
        <div class="relative pb-4">
          <!-- Dot: positioned on the line -->
          <div
            class="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full border-2 border-bg"
            [class]="dotClass(item.color)"
          ></div>
          <p class="text-text text-sm font-semibold">{{ item.title }}</p>
          <p class="text-text-muted text-[11px]">{{ item.subtitle }}</p>
        </div>
      }
    </div>
  `,
})
export class CgTimeline {
  items = input.required<TimelineItem[]>();

  dotClass(color: TimelineItem['color']): string {
    switch (color) {
      case 'success':
        return 'bg-success';
      case 'info':
        return 'bg-[#3B82F6]';
      case 'neutral':
        return 'bg-text-muted';
    }
  }
}

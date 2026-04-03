import { Component, input } from '@angular/core';

@Component({
  selector: 'cg-empty-state',
  template: `
    <div class="text-center py-16">
      <!-- Brand mark as ambient visual -->
      <div class="relative inline-block mb-5">
        <div class="absolute inset-0 blur-xl opacity-10 bg-primary rounded-full scale-150"></div>
        <svg class="relative w-12 h-12 text-primary/30" viewBox="0 0 48 48" fill="none">
          <path d="M10 30 L24 14 L38 30" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 38 L38 38" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="font-display text-lg font-bold text-text">{{ title() }}</p>
      @if (subtitle()) {
        <p class="text-text-muted text-sm mt-1.5">{{ subtitle() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class CgEmptyState {
  title = input.required<string>();
  subtitle = input('');
}

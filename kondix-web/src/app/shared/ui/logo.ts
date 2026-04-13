import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'kx-logo',
  template: `
    <a [attr.href]="href()" class="flex items-center gap-2.5 group">
      <!-- Mark: "Apex K" — geometric K with peak extension -->
      <svg
        [attr.width]="size()"
        [attr.height]="markHeight()"
        viewBox="0 0 48 60"
        fill="none"
        class="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <path d="M7 54V6" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" class="text-primary"/>
        <path d="M7 32L33 6" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" class="text-primary"/>
        <path d="M7 32L33 54" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" class="text-primary"/>
        <path d="M33 6L43 0" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" class="text-primary" opacity="0.6"/>
      </svg>

      @if (showText()) {
        <span class="font-display text-xl font-bold tracking-tight">
          <span class="text-primary font-bold tracking-wider">KONDIX</span>
        </span>
      }
    </a>
  `,
})
export class KxLogo {
  size = input(28);
  showText = input(true);
  href = input<string | null>(null);
  markHeight = computed(() => Math.round(this.size() * 60 / 48));
}

import { Component, input } from '@angular/core';

@Component({
  selector: 'cg-logo',
  template: `
    <a [attr.href]="href()" class="flex items-center gap-2.5 group">
      <!-- Mark: "The Lift" — chevron (progress) + bar (strength) -->
      <svg
        [attr.width]="size()"
        [attr.height]="size()"
        viewBox="0 0 48 48"
        fill="none"
        class="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <path
          d="M10 30 L24 14 L38 30"
          stroke="currentColor"
          stroke-width="4.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-primary"
        />
        <path
          d="M10 38 L38 38"
          stroke="currentColor"
          stroke-width="4.5"
          stroke-linecap="round"
          class="text-primary"
        />
      </svg>

      @if (showText()) {
        <span class="font-display text-xl font-bold tracking-tight">
          <span class="text-text">Celvo</span><span class="text-primary">Gym</span>
        </span>
      }
    </a>
  `,
})
export class CgLogo {
  size = input(28);
  showText = input(true);
  href = input<string | null>(null);
}

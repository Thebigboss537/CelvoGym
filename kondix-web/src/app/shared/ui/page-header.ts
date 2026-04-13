import { Component, input } from '@angular/core';

@Component({
  selector: 'kx-page-header',
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <ng-content select="[backLink]" />
        <h1 class="font-display text-2xl font-bold" [class.mt-1]="hasBack()">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="text-text-secondary text-sm mt-1">{{ subtitle() }}</p>
        }
      </div>
      <ng-content select="[actions]" />
    </div>
  `,
})
export class KxPageHeader {
  title = input.required<string>();
  subtitle = input('');
  hasBack = input(false);
}

import { Component, input, output } from '@angular/core';

@Component({
  selector: 'cg-segmented-control',
  template: `
    <div class="flex bg-card border border-border rounded-xl p-1">
      @for (option of options(); track option) {
        <button (click)="selectedChange.emit(option)"
          class="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors"
          [class]="option === selected() ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary'">
          {{ option }}
        </button>
      }
    </div>
  `,
})
export class CgSegmentedControl {
  options = input.required<string[]>();
  selected = input.required<string>();
  selectedChange = output<string>();
}

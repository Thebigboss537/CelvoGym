import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import type { WizardDay } from './types';

@Component({
  selector: 'kx-day-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs p-4">[day-panel placeholder]</div>`,
})
export class KxDayPanel {
  day = input.required<WizardDay>();
  dayIndex = input.required<number>();
  isLocked = input<boolean>(false);

  dayChange = output<WizardDay>();
  removeDay = output<void>();
  addExercise = output<void>();
  addSuperset = output<void>();
}

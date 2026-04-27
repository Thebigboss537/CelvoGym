import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import type { WizardRoutine } from './types';

@Component({
  selector: 'kx-routine-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs p-4">[routine-sidebar placeholder]</div>`,
})
export class KxRoutineSidebar {
  routine = input.required<WizardRoutine>();
  activeDayIndex = input.required<number>();
  isLocked = input<boolean>(false);

  routineChange = output<WizardRoutine>();
  selectDay = output<number>();
  addDay = output<void>();
  removeDay = output<number>();
  reorderDays = output<{ from: number; to: number }>();
}

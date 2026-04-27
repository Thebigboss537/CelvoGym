import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import type { WizardExercise, GroupActionEvent, GroupOption } from './types';

@Component({
  selector: 'kx-exercise-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs p-2">[exercise-card placeholder]</div>`,
})
export class KxExerciseCard {
  exercise = input.required<WizardExercise>();
  badge = input<{ label: string; color: string } | null>(null);
  isInCluster = input<boolean>(false);
  groupOptions = input<GroupOption[]>([]);
  isLocked = input<boolean>(false);

  exerciseChange = output<WizardExercise>();
  delete = output<void>();
  duplicate = output<void>();
  groupAction = output<GroupActionEvent>();
}

import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';

export interface PickerSelection {
  name: string;
  catalogExerciseId: string | null;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

@Component({
  selector: 'kx-exercise-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<div class="text-text-muted text-xs">[exercise-picker placeholder]</div>`,
})
export class KxExercisePicker {
  value = input<string>('');
  catalogId = input<string | null>(null);
  autoFocus = input<boolean>(false);
  selected = output<PickerSelection>();
}

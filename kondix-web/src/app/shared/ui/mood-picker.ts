import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type MoodValue = 'Great' | 'Good' | 'Ok' | 'Tough';

interface Mood { value: MoodValue; emoji: string; label: string; }

const MOODS: Mood[] = [
  { value: 'Great', emoji: '🔥', label: 'Brutal' },
  { value: 'Good',  emoji: '✅', label: 'Bien' },
  { value: 'Ok',    emoji: '😐', label: 'Normal' },
  { value: 'Tough', emoji: '😮‍💨', label: 'Duro' },
];

@Component({
  selector: 'kx-mood-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-4 gap-2">
      @for (m of moods; track m.value) {
        <button
          type="button"
          class="flex flex-col items-center gap-1 py-3 rounded-xl border transition press"
          [class.border-border]="value() !== m.value"
          [class.bg-card]="value() !== m.value"
          [class.border-primary]="value() === m.value"
          [style.backgroundColor]="value() === m.value ? 'rgba(230,38,57,0.10)' : null"
          (click)="valueChange.emit(m.value)"
          [attr.aria-pressed]="value() === m.value"
          [attr.aria-label]="m.label"
        >
          <span class="text-2xl">{{ m.emoji }}</span>
          <span class="text-[10px] font-semibold uppercase tracking-wider"
            [class.text-text-muted]="value() !== m.value"
            [class.text-primary]="value() === m.value">
            {{ m.label }}
          </span>
        </button>
      }
    </div>
  `,
})
export class KxMoodPicker {
  value = input<MoodValue | null>(null);
  valueChange = output<MoodValue>();
  moods = MOODS;
}

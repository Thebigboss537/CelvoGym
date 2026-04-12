import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

interface SetTypeConfig {
  bg: string;
  color: string;
  label: (setNumber: number) => string;
}

const SET_TYPE_CONFIG: Record<string, SetTypeConfig> = {
  Warmup: { bg: '#F59E0B18', color: '#F59E0B', label: () => 'W' },
  Effective: { bg: 'rgba(230,38,57,0.1)', color: '#E62639', label: (n) => String(n) },
  DropSet: { bg: '#A78BFA22', color: '#A78BFA', label: () => 'D' },
  RestPause: { bg: '#22D3EE22', color: '#22D3EE', label: () => 'R' },
  AMRAP: { bg: '#F9731622', color: '#F97316', label: () => 'A' },
};

export interface SetCompleteEvent {
  kg: number;
  reps: number;
  rpe: number | null;
}

@Component({
  selector: 'cg-set-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="grid grid-cols-[44px_1fr_1fr_1fr_48px] gap-2 py-2.5 px-1 items-center"
      [class]="rowClass()"
    >
      <!-- Column 1: SET label badge -->
      <div class="flex items-center justify-center">
        <span
          class="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold"
          [style.background]="badgeConfig().bg"
          [style.color]="badgeConfig().color"
        >
          {{ badgeConfig().label(setNumber()) }}
        </span>
      </div>

      <!-- Column 2: KG input -->
      <input
        type="number"
        inputmode="decimal"
        class="w-full bg-[#1E1E24] rounded-lg p-2 text-center text-sm outline-none"
        [class]="inputClass()"
        [placeholder]="kgPlaceholder()"
        [value]="kg() ?? ''"
        (input)="onKgInput($event)"
      />

      <!-- Column 3: REPS input -->
      <input
        type="number"
        inputmode="numeric"
        class="w-full bg-[#1E1E24] rounded-lg p-2 text-center text-sm outline-none"
        [class]="inputClass()"
        [placeholder]="'—'"
        [value]="reps() ?? ''"
        (input)="onRepsInput($event)"
      />

      <!-- Column 4: RPE input -->
      <input
        type="number"
        inputmode="decimal"
        class="w-full bg-[#1E1E24] rounded-lg p-2 text-center text-sm outline-none"
        [class]="inputClass()"
        [placeholder]="'—'"
        [value]="rpe() ?? ''"
        (input)="onRpeInput($event)"
      />

      <!-- Column 5: CHECK button -->
      <div class="flex items-center justify-center">
        @if (state() === 'completed') {
          <div class="w-8 h-8 rounded-full bg-success flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        } @else if (state() === 'active') {
          <button
            type="button"
            class="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center press transition"
            (click)="onComplete()"
            aria-label="Completar serie"
          ></button>
        } @else {
          <div class="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-50"></div>
        }
      </div>
    </div>
  `,
})
export class CgSetRow {
  setNumber = input.required<number>();
  setType = input.required<string>();
  state = input.required<string>();
  kg = input<number | null>(null);
  reps = input<number | null>(null);
  rpe = input<number | null>(null);
  previousKg = input<number | null>(null);

  complete = output<SetCompleteEvent>();
  kgChange = output<number>();
  repsChange = output<number>();
  rpeChange = output<number>();

  badgeConfig = computed((): SetTypeConfig => {
    return SET_TYPE_CONFIG[this.setType()] ?? SET_TYPE_CONFIG['Effective'];
  });

  rowClass = computed((): string => {
    switch (this.state()) {
      case 'completed':
        return 'opacity-60';
      case 'active':
        return 'bg-primary/[0.04] rounded-xl border border-primary/15';
      case 'pending':
        return 'opacity-35';
      default:
        return '';
    }
  });

  inputClass = computed((): string => {
    switch (this.state()) {
      case 'active':
        return 'border-[1.5px] border-primary text-text font-bold';
      case 'completed':
        return 'text-text-muted border border-transparent';
      case 'pending':
      default:
        return 'text-text-muted opacity-50 border border-transparent';
    }
  });

  kgPlaceholder = computed((): string => {
    const prev = this.previousKg();
    return prev != null ? String(prev) : '—';
  });

  onKgInput(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      this.kgChange.emit(value);
    }
  }

  onRepsInput(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value)) {
      this.repsChange.emit(value);
    }
  }

  onRpeInput(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      this.rpeChange.emit(value);
    }
  }

  onComplete(): void {
    const kg = this.kg();
    const reps = this.reps();
    if (kg == null || reps == null) return;
    this.complete.emit({ kg, reps, rpe: this.rpe() });
  }
}

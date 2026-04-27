import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

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

const SET_TYPE_NAME: Record<string, string> = {
  Warmup: 'Calent.',
  Effective: 'Efectiva',
  DropSet: 'Drop',
  RestPause: 'Rest-P',
  AMRAP: 'AMRAP',
};

export interface SetCompleteEvent {
  kg: number;
  reps: number;
  rpe: number | null;
}

@Component({
  selector: 'kx-set-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="grid grid-cols-[44px_60px_1fr_1fr_1fr_28px_28px] gap-2 py-2.5 px-1 items-center"
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

      <!-- Column 2: SET type name -->
      <span
        class="text-[10px] font-semibold text-center px-1.5 py-1 rounded-md"
        [style.background]="badgeConfig().bg"
        [style.color]="badgeConfig().color"
      >
        {{ typeName() }}
      </span>

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

      <!-- Column 6: NOTE toggle -->
      @if (showNoteToggle()) {
        <button
          type="button"
          class="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-primary transition"
          [class.text-primary]="(note() ?? '').length > 0 || noteOpen()"
          (click)="toggleNote()"
          [attr.aria-label]="noteOpen() ? 'Cerrar nota' : 'Añadir nota'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.243-.95L3 20l1.05-3.757A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </button>
      } @else {
        <span></span>
      }
    </div>

    @if (showNoteToggle()) {
      <div class="collapse-content" [class.expanded]="noteOpen()">
        <div class="overflow-hidden pl-12 pr-2 pb-2">
          <input
            type="text"
            class="w-full bg-card-hover border border-border-light rounded-md px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
            placeholder="Nota para esta serie…"
            [value]="draftNote"
            (input)="onNoteInput($event)"
            (blur)="commitNote()"
            (keydown.enter)="commitNote()"
            maxlength="2000"
          />
        </div>
      </div>
    }
  `,
})
export class KxSetRow {
  setNumber = input.required<number>();
  setType = input.required<string>();
  state = input.required<string>();
  kg = input<number | null>(null);
  reps = input<number | null>(null);
  rpe = input<number | null>(null);
  previousKg = input<number | null>(null);

  note = input<string | null>(null);
  showNoteToggle = input<boolean>(false);

  complete = output<SetCompleteEvent>();
  kgChange = output<number>();
  repsChange = output<number>();
  rpeChange = output<number>();
  noteChange = output<string>();

  readonly noteOpen = signal(false);
  draftNote = '';

  badgeConfig = computed((): SetTypeConfig => {
    return SET_TYPE_CONFIG[this.setType()] ?? SET_TYPE_CONFIG['Effective'];
  });

  typeName = computed((): string => {
    return SET_TYPE_NAME[this.setType()] ?? 'Efectiva';
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

  toggleNote(): void {
    this.draftNote = this.note() ?? '';
    this.noteOpen.update(v => !v);
  }

  onNoteInput(event: Event): void {
    this.draftNote = (event.target as HTMLInputElement).value;
  }

  commitNote(): void {
    const trimmed = this.draftNote.trim();
    if (trimmed !== (this.note() ?? '')) this.noteChange.emit(trimmed);
    this.noteOpen.set(false);
  }
}

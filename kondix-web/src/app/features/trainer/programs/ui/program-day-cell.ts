import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Plus, Moon } from 'lucide-angular';
import { ProgramSlot } from '../../../../shared/models';

const OBJECTIVE_COLORS: Record<string, string> = {
  'Hipertrofia': '#E62639',
  'Fuerza': '#f59e0b',
  'Resistencia': '#22c55e',
  'Funcional': '#60a5fa',
  'Rendimiento': '#a78bfa',
  'Otro': '#78787f',
};

@Component({
  selector: 'kx-program-day-cell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus, Moon }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button"
            (click)="select.emit()"
            [attr.aria-pressed]="isSelected()"
            class="relative w-full min-h-[64px] rounded-md text-left p-2 transition-colors"
            [class.ring-2]="isSelected()"
            [class.ring-primary]="isSelected()"
            [ngStyle]="cellStyle()">
      @switch (slot().kind) {
        @case ('Empty') {
          <div class="flex flex-col items-center justify-center h-full text-text-muted">
            <lucide-icon name="plus" [size]="14"></lucide-icon>
            <span class="text-[9px] font-mono mt-1">VACÍO</span>
          </div>
        }
        @case ('Rest') {
          <div class="flex flex-col items-center justify-center h-full text-text-muted">
            <lucide-icon name="moon" [size]="14"></lucide-icon>
            <span class="text-[9px] font-mono mt-1">DESCANSO</span>
          </div>
        }
        @case ('RoutineDay') {
          <div class="flex flex-col gap-1">
            <div class="text-[9px] font-mono uppercase tracking-wider truncate"
                 [style.color]="accentColor()">
              {{ slot().routineName }}
            </div>
            <div class="text-xs font-semibold leading-tight line-clamp-2">
              {{ slot().dayName }}
            </div>
          </div>
        }
      }
    </button>
  `,
})
export class ProgramDayCell {
  readonly slot = input.required<ProgramSlot>();
  readonly category = input<string | null>(null);
  readonly isSelected = input(false);

  readonly select = output<void>();

  protected readonly accentColor = computed(() =>
    OBJECTIVE_COLORS[this.category() ?? 'Otro'] ?? OBJECTIVE_COLORS['Otro']);

  protected readonly cellStyle = computed(() => {
    const slot = this.slot();
    if (slot.kind === 'RoutineDay') {
      const c = this.accentColor();
      return {
        background: `${c}10`,
        border: `1px solid ${c}55`,
        borderLeft: `3px solid ${c}`,
      };
    }
    return {
      background: 'var(--color-card)',
      border: '1px solid var(--color-border-light)',
    };
  });
}

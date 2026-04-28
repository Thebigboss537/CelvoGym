import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, MoreVertical, Copy, Trash } from 'lucide-angular';
import { ProgramDayCell } from './program-day-cell';
import { ProgramWeek } from '../../../../shared/models';

@Component({
  selector: 'kx-program-week-row',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ProgramDayCell],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ MoreVertical, Copy, Trash }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-1.5 items-stretch" [style.grid-template-columns]="gridTemplate()">
      <!-- Week label -->
      <div class="bg-card border border-border-light rounded-md p-2 flex flex-col justify-center">
        <div class="font-display text-sm font-bold tracking-tight">Sem {{ week().weekIndex + 1 }}</div>
        <div class="text-[9px] text-text-muted font-mono mt-0.5">
          {{ filledCount() }}/{{ slotCount() }} SESIONES
        </div>
      </div>

      <!-- Day cells -->
      @for (slot of week().slots; track slot.id) {
        <kx-program-day-cell
          [slot]="slot"
          [category]="categoryFor(slot)"
          [isSelected]="selectedDayIndex() === slot.dayIndex"
          (select)="selectCell.emit(slot.dayIndex)" />
      }

      <!-- Week menu (hidden when hideMenu=true, e.g. loop mode) -->
      @if (!hideMenu()) {
        <div class="relative flex items-center justify-center">
          <button type="button"
                  (click)="menuOpen.set(!menuOpen())"
                  class="p-1.5 rounded-md hover:bg-card-hover">
            <lucide-icon name="more-vertical" [size]="14"></lucide-icon>
          </button>
          @if (menuOpen()) {
            <div class="absolute right-0 top-full mt-1 z-10 bg-bg border border-border rounded-md shadow-lg py-1 min-w-[160px]">
              <button class="w-full text-left px-3 py-2 text-sm hover:bg-card-hover flex items-center gap-2"
                      (click)="duplicate.emit(); menuOpen.set(false)">
                <lucide-icon name="copy" [size]="13"></lucide-icon> Duplicar
              </button>
              @if (canDelete()) {
                <button class="w-full text-left px-3 py-2 text-sm text-danger hover:bg-card-hover flex items-center gap-2"
                        (click)="delete.emit(); menuOpen.set(false)">
                  <lucide-icon name="trash" [size]="13"></lucide-icon> Eliminar
                </button>
              }
            </div>
          }
        </div>
      } @else {
        <div></div>
      }
    </div>
  `,
})
export class ProgramWeekRow {
  readonly week = input.required<ProgramWeek>();
  readonly selectedDayIndex = input<number | null>(null);
  readonly hideMenu = input(false);
  readonly canDelete = input(true);
  readonly programObjective = input<string | null>(null);

  readonly selectCell = output<number>();
  readonly duplicate = output<void>();
  readonly delete = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly slotCount = computed(() => this.week().slots.length);
  protected readonly filledCount = computed(() =>
    this.week().slots.filter(s => s.kind === 'RoutineDay').length);
  protected readonly gridTemplate = computed(() => {
    const cells = this.slotCount();
    return `90px repeat(${cells}, minmax(82px, 1fr)) 40px`;
  });

  categoryFor(_slot: any): string | null { return this.programObjective(); }
}

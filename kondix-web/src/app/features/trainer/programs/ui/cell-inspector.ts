import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Plus, Moon, Trash, X } from 'lucide-angular';
import { ProgramSlot } from '../../../../shared/models';

@Component({
  selector: 'kx-cell-inspector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ Plus, Moon, Trash, X }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (slot(); as s) {
      <div class="p-5">
        <div class="text-overline mb-1">Semana {{ (weekIndex() ?? 0) + 1 }} · {{ dayLabel() }}</div>
        @switch (s.kind) {
          @case ('Empty') {
            <h3 class="font-display text-lg my-2">Día vacío</h3>
            <p class="text-xs text-text-muted leading-relaxed mb-4">
              Elige qué hacer en este día: asignar una rutina o marcar descanso explícito.
            </p>
            <div class="flex flex-col gap-2">
              <button type="button"
                      class="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg transition press flex items-center justify-center gap-2 text-sm"
                      (click)="assign.emit()">
                <lucide-icon name="plus" [size]="14"></lucide-icon> Asignar rutina
              </button>
              @if (canMarkRest()) {
                <button type="button"
                        class="w-full bg-card hover:bg-card-hover border border-border text-text-secondary text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                        (click)="setKind.emit('Rest')">
                  <lucide-icon name="moon" [size]="14"></lucide-icon> Marcar como descanso
                </button>
              }
            </div>
          }
          @case ('Rest') {
            <div class="flex items-center gap-2 mt-1">
              <div class="w-8 h-8 rounded-md bg-bg-raised border border-border flex items-center justify-center">
                <lucide-icon name="moon" [size]="14"></lucide-icon>
              </div>
              <div>
                <h3 class="font-display text-lg leading-tight">Descanso</h3>
                <div class="text-[11px] text-text-muted font-mono">DÍA DE RECUPERACIÓN</div>
              </div>
            </div>
            <p class="text-xs text-text-muted leading-relaxed my-3">
              El estudiante verá este día marcado como descanso.
            </p>
            <button type="button"
                    class="w-full bg-card hover:bg-card-hover border border-border text-text-secondary text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                    (click)="setKind.emit('Empty')">
              Quitar descanso
            </button>
          }
          @case ('RoutineDay') {
            <div class="rounded-xl p-3 mt-1"
                 style="border:1px solid color-mix(in srgb, var(--color-primary) 33%, transparent);border-left:3px solid var(--color-primary);background:color-mix(in srgb, var(--color-primary) 6%, transparent);">
              <div class="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">{{ s.routineName }}</div>
              <h3 class="font-display text-lg leading-tight">{{ s.dayName }}</h3>
            </div>
            <div class="flex gap-1.5 mt-3 flex-wrap">
              @if (s.blockId) {
                <button type="button"
                        class="bg-card hover:bg-card-hover border border-border text-text-secondary text-xs px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
                        (click)="removeBlock.emit(s.blockId!)">
                  <lucide-icon name="trash" [size]="13"></lucide-icon> Quitar rutina
                </button>
              } @else {
                <button type="button"
                        class="bg-card hover:bg-card-hover border border-border text-text-secondary text-xs px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
                        (click)="setKind.emit('Empty')">
                  <lucide-icon name="trash" [size]="13"></lucide-icon> Quitar
                </button>
              }
            </div>
          }
        }
      </div>
    } @else {
      <div class="p-5">
        <div class="text-overline mb-2">Detalle</div>
        <div class="p-5 border border-dashed border-border rounded-lg text-center text-xs text-text-muted leading-relaxed">
          Selecciona un día del calendario para ver y editar sus detalles.
        </div>
      </div>
    }
  `,
})
export class CellInspector {
  readonly slot = input<ProgramSlot | null>(null);
  readonly weekIndex = input<number | null>(null);
  readonly dayLabel = input<string | null>(null);
  readonly canMarkRest = input(true);

  readonly setKind = output<'Empty' | 'Rest'>();
  readonly assign = output<void>();
  readonly removeBlock = output<string>();
}

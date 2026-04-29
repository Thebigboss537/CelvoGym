import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, MoreVertical, Users, Copy, Trash, ArrowRight } from 'lucide-angular';
import { ProgramSummary } from '../../../../shared/models';
import { objectiveColor } from '../../../../shared/utils/objective-color';

@Component({
  selector: 'kx-program-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ MoreVertical, Users, Copy, Trash, ArrowRight }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary hover:-translate-y-0.5 relative"
             (click)="open.emit()">
      <!-- Top: timeline preview + badges + menu -->
      <div class="h-[90px] relative border-b border-border-light p-3 flex flex-col justify-between"
           [style.background]="gradient()">
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold tracking-wider"
                [style.background]="badgeBg()" [style.color]="color()" [style.borderColor]="color() + '55'"
                style="border:1px solid">{{ program().objective }}</span>
          @if (!program().isPublished) {
            <span class="px-2 py-0.5 rounded-md text-[10px] font-mono border border-border text-text-muted">BORRADOR</span>
          }
          @if (program().mode === 'Loop') {
            <span class="px-2 py-0.5 rounded-md text-[10px] font-mono border border-border text-text-muted">EN BUCLE</span>
          }
        </div>

        <!-- Mini timeline: simple bars per week (max 16 visible) -->
        <div class="flex gap-0.5 items-end">
          @for (i of weekIndices(); track i) {
            <div class="flex-1 h-3 rounded-sm" [style.background]="color()" style="opacity:0.85;"></div>
          }
        </div>

        <button type="button" class="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 hover:bg-black/70"
                (click)="$event.stopPropagation(); menuOpen.set(!menuOpen())"
                aria-label="Menú">
          <lucide-icon name="more-vertical" [size]="14"></lucide-icon>
        </button>
        @if (menuOpen()) {
          <div class="absolute right-2 top-10 z-10 bg-bg border border-border rounded-md shadow-lg py-1 min-w-[180px]"
               (click)="$event.stopPropagation()">
            <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-card-hover flex items-center gap-2"
                    (click)="assign.emit(); menuOpen.set(false)">
              <lucide-icon name="users" [size]="13"></lucide-icon> Asignar a estudiantes
            </button>
            <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-card-hover flex items-center gap-2"
                    (click)="duplicate.emit(); menuOpen.set(false)">
              <lucide-icon name="copy" [size]="13"></lucide-icon> Duplicar
            </button>
            <div class="h-px bg-border my-1"></div>
            <button type="button" class="w-full text-left px-3 py-2 text-sm text-danger hover:bg-card-hover flex items-center gap-2"
                    (click)="delete.emit(); menuOpen.set(false)">
              <lucide-icon name="trash" [size]="13"></lucide-icon> Eliminar
            </button>
          </div>
        }
      </div>

      <!-- Body -->
      <div class="p-4">
        <div class="font-display text-base font-bold tracking-tight leading-tight">{{ program().name }}</div>
        @if (program().description) {
          <p class="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">{{ program().description }}</p>
        }

        <div class="grid grid-cols-3 gap-2 mt-3 font-mono">
          <div class="bg-bg-raised border border-border-light rounded-md px-2 py-1.5">
            <div class="text-[9px] text-text-muted uppercase tracking-wider">Semanas</div>
            <div class="text-sm font-semibold mt-0.5">{{ program().mode === 'Loop' ? '∞' : program().weeksCount }}</div>
          </div>
          <div class="bg-bg-raised border border-border-light rounded-md px-2 py-1.5">
            <div class="text-[9px] text-text-muted uppercase tracking-wider">Sesiones</div>
            <div class="text-sm font-semibold mt-0.5">{{ program().sessionsCount }}</div>
          </div>
          <div class="bg-bg-raised border border-border-light rounded-md px-2 py-1.5">
            <div class="text-[9px] text-text-muted uppercase tracking-wider">Nivel</div>
            <div class="text-sm font-semibold mt-0.5">{{ program().level }}</div>
          </div>
        </div>

        <div class="mt-3 pt-2.5 border-t border-border-light flex items-center justify-between">
          <div class="text-[11px] text-text-muted font-mono flex items-center gap-1">
            <lucide-icon name="users" [size]="11"></lucide-icon>
            {{ program().assignedCount }} asignad{{ program().assignedCount === 1 ? 'o' : 'os' }}
          </div>
          <div class="flex items-center gap-1 text-[11px] font-semibold text-text-muted">
            Editar <lucide-icon name="arrow-right" [size]="11"></lucide-icon>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class ProgramCard {
  readonly program = input.required<ProgramSummary>();

  readonly open = output<void>();
  readonly assign = output<void>();
  readonly duplicate = output<void>();
  readonly delete = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly color = computed(() => objectiveColor(this.program().objective));
  protected readonly badgeBg = computed(() => this.color() + '30');
  protected readonly gradient = computed(() => `linear-gradient(135deg, ${this.color()}20 0%, #0a0a0b 85%)`);
  protected readonly weekIndices = computed(() =>
    Array.from({ length: Math.min(this.program().weeksCount, 16) }, (_, i) => i));
}

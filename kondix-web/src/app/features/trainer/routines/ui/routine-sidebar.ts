import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray,
} from '@angular/cdk/drag-drop';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  ChevronDown, ClipboardList, GripVertical, Plus, X,
} from 'lucide-angular';
import type { WizardRoutine } from './types';

const ICONS = { ChevronDown, ClipboardList, GripVertical, Plus, X };

const CATEGORIES = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Otro'];

const CATEGORY_COLORS: Record<string, string> = {
  Hipertrofia: '#E62639',
  Fuerza: '#F59E0B',
  Resistencia: '#22C55E',
  Funcional: '#60a5fa',
  Otro: '#71717A',
};

@Component({
  selector: 'kx-routine-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgClass, CdkDropList, CdkDrag, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(ICONS) }],
  template: `
    <aside class="w-full h-full bg-bg flex flex-col overflow-hidden md:w-[280px] md:border-r md:border-border">

      <!-- Meta header -->
      <div class="px-5 py-4 border-b border-border-light">
        <div class="text-overline text-primary mb-2 flex items-center gap-1">
          <lucide-angular name="clipboard-list" [size]="10"></lucide-angular>
          Rutina
        </div>
        <input type="text"
          [ngModel]="routine().name"
          (ngModelChange)="patchRoutine({ name: $event })"
          [disabled]="isLocked()"
          placeholder="Nombre de la rutina…"
          class="w-full font-display text-xl font-bold text-text bg-transparent focus:outline-none border-b border-transparent focus:border-primary leading-tight" />
        <textarea
          [ngModel]="routine().description"
          (ngModelChange)="patchRoutine({ description: $event })"
          [disabled]="isLocked()"
          placeholder="Añade una descripción…"
          rows="2"
          class="w-full mt-2 text-xs text-text-muted bg-transparent focus:outline-none resize-none"></textarea>

        <!-- Category picker -->
        <div class="mt-2.5 relative">
          <button type="button" (click)="toggleCatMenu()" [disabled]="isLocked()"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50"
                  [style.background]="catTint(routine().category)"
                  [style.borderColor]="catBorder(routine().category)"
                  [style.color]="catColor(routine().category)"
                  style="border: 1px solid">
            <span class="w-1.5 h-1.5 rounded-full" [style.background]="catColor(routine().category)"></span>
            {{ routine().category || 'Sin categoría' }}
            <lucide-angular name="chevron-down" [size]="10" class="opacity-70"></lucide-angular>
          </button>
          @if (catMenuOpen()) {
            <div class="fixed inset-0 z-40" (click)="catMenuOpen.set(false)"></div>
            <div class="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg p-1 min-w-[180px]">
              @for (c of categories; track c) {
                <button type="button" (click)="patchRoutine({ category: c }); catMenuOpen.set(false)"
                        class="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text hover:bg-card-hover rounded text-left">
                  <span class="w-2 h-2 rounded-full" [style.background]="catColor(c)"></span>
                  <span class="flex-1">{{ c }}</span>
                  @if (c === routine().category) {
                    <span class="text-primary">✓</span>
                  }
                </button>
              }
            </div>
          }
        </div>
      </div>

      <!-- Days list -->
      <div class="text-overline text-text-muted px-5 pt-3.5 pb-1.5">
        Días · {{ routine().days.length }}
      </div>
      <div cdkDropList (cdkDropListDropped)="onDrop($event)"
           class="flex-1 overflow-y-auto px-2.5 pb-4">
        @for (d of routine().days; track $index; let i = $index) {
          <div cdkDrag [cdkDragDisabled]="isLocked()"
               (click)="selectDay.emit(i)"
               class="flex items-center gap-2.5 px-3 py-2.5 my-0.5 rounded-lg cursor-pointer transition border"
               [ngClass]="activeDayIndex() === i
                 ? ['bg-primary/10', 'border-primary/35']
                 : ['border-transparent', 'hover:bg-card']">
            <span class="font-mono text-[11px] font-bold min-w-[18px]"
                  [ngClass]="activeDayIndex() === i ? 'text-primary' : 'text-text-muted'">{{ pad(i + 1) }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold truncate"
                   [ngClass]="activeDayIndex() === i ? 'text-text' : 'text-text-secondary'">
                @if (d.name) { {{ d.name }} }
                @else { <span class="italic text-text-muted">Sin nombre</span> }
              </div>
              <div class="text-[11px] text-text-muted font-mono">{{ exCount(d) }} ejercicio{{ exCount(d) === 1 ? '' : 's' }}</div>
            </div>
            @if (routine().days.length > 1) {
              <button type="button" (click)="$event.stopPropagation(); removeDay.emit(i)"
                      [disabled]="isLocked()"
                      class="text-text-muted hover:text-danger text-xs p-1 disabled:opacity-50"
                      aria-label="Eliminar día">
                <lucide-angular name="x" [size]="12"></lucide-angular>
              </button>
            }
            <lucide-angular name="grip-vertical" [size]="12" class="text-text-muted opacity-50"></lucide-angular>
          </div>
        }
        <button type="button" (click)="addDay.emit()" [disabled]="isLocked()"
                class="w-full mt-2 px-3 py-2.5 bg-transparent border border-dashed border-border rounded-lg text-text-muted text-xs font-medium hover:border-primary hover:text-primary transition disabled:opacity-50 flex items-center justify-center gap-1.5">
          <lucide-angular name="plus" [size]="14"></lucide-angular>
          Añadir día
        </button>
      </div>
    </aside>
  `,
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

  categories = CATEGORIES;
  catMenuOpen = signal(false);

  toggleCatMenu() { if (!this.isLocked()) this.catMenuOpen.update(o => !o); }

  catColor(cat: string): string { return CATEGORY_COLORS[cat] ?? '#71717A'; }
  catTint(cat: string): string { return `color-mix(in oklch, ${this.catColor(cat)} 15%, transparent)`; }
  catBorder(cat: string): string { return `color-mix(in oklch, ${this.catColor(cat)} 35%, transparent)`; }

  pad(n: number): string { return n.toString().padStart(2, '0'); }
  exCount(day: { blocks: { exercises: unknown[] }[] }): number {
    return day.blocks.reduce((s, b) => s + b.exercises.length, 0);
  }

  patchRoutine(patch: Partial<WizardRoutine>) {
    this.routineChange.emit({ ...this.routine(), ...patch });
  }

  onDrop(event: CdkDragDrop<unknown>) {
    if (event.previousIndex === event.currentIndex) return;
    this.reorderDays.emit({ from: event.previousIndex, to: event.currentIndex });
  }
}

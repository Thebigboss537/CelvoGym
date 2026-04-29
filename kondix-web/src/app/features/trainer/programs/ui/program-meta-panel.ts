import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramDetail, ProgramLevel, ProgramMode, ProgramObjective } from '../../../../shared/models';

interface MetaPatch {
  name?: string;
  description?: string | null;
  notes?: string | null;
  objective?: ProgramObjective;
  level?: ProgramLevel;
  mode?: ProgramMode;
}

const OBJECTIVES: ProgramObjective[] = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Rendimiento', 'Otro'];
const LEVELS: ProgramLevel[] = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

@Component({
  selector: 'kx-program-meta-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="border-r border-border-light bg-bg p-5 overflow-auto">
      <div class="text-overline mb-2">Programa</div>
      <input class="w-full bg-transparent border-none outline-none font-display text-2xl font-bold tracking-tight text-text mb-1.5"
             [(ngModel)]="nameDraft" (blur)="commitName()" />
      <textarea class="w-full bg-transparent border-none outline-none resize-none text-text-secondary text-sm leading-relaxed font-sans min-h-[48px]"
                placeholder="Describe el objetivo del programa…"
                [(ngModel)]="descriptionDraft"
                (blur)="commitDescription()"></textarea>

      <div class="h-px bg-border-light my-4"></div>

      <label class="block mb-3">
        <span class="text-overline">Objetivo</span>
        <select class="select-styled w-full mt-1"
                [ngModel]="program().objective"
                (ngModelChange)="patch.emit({ objective: $event })">
          @for (o of objectives; track o) { <option [value]="o">{{ o }}</option> }
        </select>
      </label>

      <label class="block mb-3">
        <span class="text-overline">Nivel</span>
        <select class="select-styled w-full mt-1"
                [ngModel]="program().level"
                (ngModelChange)="patch.emit({ level: $event })">
          @for (l of levels; track l) { <option [value]="l">{{ l }}</option> }
        </select>
      </label>

      <div class="mb-3">
        <span class="text-overline">Duración</span>
        <div class="flex gap-1.5 mt-1">
          <button type="button"
                  class="flex-1 px-3 py-2 rounded-md border text-left"
                  [class.border-primary]="program().mode === 'Fixed'"
                  [class.bg-primary-light]="program().mode === 'Fixed'"
                  [class.text-primary]="program().mode === 'Fixed'"
                  [class.border-border]="program().mode !== 'Fixed'"
                  (click)="onModeChange('Fixed')">
            <div class="text-sm font-semibold">Fija</div>
            <div class="text-[10px] font-mono text-text-muted">{{ program().weeks.length }} sem</div>
          </button>
          <button type="button"
                  class="flex-1 px-3 py-2 rounded-md border text-left"
                  [class.border-primary]="program().mode === 'Loop'"
                  [class.bg-primary-light]="program().mode === 'Loop'"
                  [class.text-primary]="program().mode === 'Loop'"
                  [class.border-border]="program().mode !== 'Loop'"
                  (click)="onModeChange('Loop')">
            <div class="text-sm font-semibold">En bucle</div>
            <div class="text-[10px] font-mono text-text-muted">∞</div>
          </button>
        </div>
      </div>

      <div class="h-px bg-border-light my-4"></div>

      <div class="text-overline mb-2">Notas internas</div>
      <textarea class="w-full bg-bg-raised border border-border rounded-md outline-none p-2.5 text-text text-xs font-sans resize-y min-h-[72px] leading-relaxed"
                placeholder="Notas privadas para ti, no visibles al estudiante."
                [(ngModel)]="notesDraft"
                (blur)="commitNotes()"></textarea>

      <div class="h-px bg-border-light my-4"></div>
      <div class="text-[11px] text-text-muted font-mono leading-relaxed">
        <div>{{ program().weeks.length }} semanas · {{ totalSessions() }} sesiones</div>
        <div>{{ program().assignedCount }} estudiantes asignados</div>
      </div>
    </aside>
  `,
})
export class ProgramMetaPanel {
  readonly program = input.required<ProgramDetail>();
  readonly patch = output<MetaPatch>();
  readonly modeChange = output<ProgramMode>();

  protected readonly objectives = OBJECTIVES;
  protected readonly levels = LEVELS;

  protected nameDraft = '';
  protected descriptionDraft = '';
  protected notesDraft = '';

  private readonly programWatcher = effect(() => {
    const p = this.program();
    if (!p) return;
    this.nameDraft = p.name;
    this.descriptionDraft = p.description ?? '';
    this.notesDraft = p.notes ?? '';
  });

  protected readonly totalSessions = computed(() =>
    this.program().weeks.reduce((a, w) => a + w.slots.filter(s => s.kind === 'RoutineDay').length, 0));

  protected commitName() {
    const v = (this.nameDraft ?? '').trim();
    const cur = this.program().name;
    if (v && v !== cur) this.patch.emit({ name: v });
    else if (!v) this.nameDraft = cur;  // bounce back if empty
  }

  protected commitDescription() {
    const v = this.descriptionDraft;
    const cur = this.program().description ?? '';
    if (v !== cur) this.patch.emit({ description: v.length ? v : null });
  }

  protected commitNotes() {
    const v = this.notesDraft;
    const cur = this.program().notes ?? '';
    if (v !== cur) this.patch.emit({ notes: v.length ? v : null });
  }

  onModeChange(mode: ProgramMode) {
    if (this.program().mode === mode) return;
    this.modeChange.emit(mode);  // parent confirms + may collapse weeks before issuing the patch
  }
}

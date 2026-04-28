import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, X, Check } from 'lucide-angular';
import { ProgramsService } from '../data-access/programs.service';
import { ProgramLevel, ProgramMode, ProgramObjective, ProgramScheduleType } from '../../../../shared/models';

const OBJECTIVES: ProgramObjective[] = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Rendimiento', 'Otro'];
const LEVELS: ProgramLevel[] = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

@Component({
  selector: 'kx-create-program-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X, Check }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] bg-black/70" (click)="close.emit()"></div>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201]
                w-[min(560px,calc(100vw-32px))] max-h-[calc(100vh-40px)]
                bg-bg border border-border rounded-2xl shadow-lg flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-border-light">
        <div>
          <div class="text-overline text-text-muted">Nuevo</div>
          <h2 class="text-h2 font-display">Crear programa</h2>
        </div>
        <button (click)="close.emit()" aria-label="Cerrar"
                class="p-2 rounded-md hover:bg-card-hover transition-colors">
          <lucide-icon name="x" [size]="16"></lucide-icon>
        </button>
      </header>

      <div class="flex-1 overflow-auto p-6 flex flex-col gap-4" style="scrollbar-width: thin;">
        <label class="flex flex-col gap-1">
          <span class="text-overline text-text-muted">Nombre del programa</span>
          <input class="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text
                        placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                 [(ngModel)]="name" placeholder="Ej: Hipertrofia 8 semanas" autofocus />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-overline text-text-muted">Objetivo</span>
            <select class="select-styled w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text
                           focus:outline-none focus:border-primary transition-colors"
                    [(ngModel)]="objective">
              @for (o of objectives; track o) { <option [value]="o">{{ o }}</option> }
            </select>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-overline text-text-muted">Nivel</span>
            <select class="select-styled w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text
                           focus:outline-none focus:border-primary transition-colors"
                    [(ngModel)]="level">
              @for (l of levels; track l) { <option [value]="l">{{ l }}</option> }
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-overline text-text-muted">Duración</span>
          <div class="flex gap-2">
            <button type="button"
                    [ngClass]="mode() === 'Fixed'
                      ? ['flex-1','px-3','py-2.5','rounded-md','border','border-primary','bg-primary-light','text-primary','text-left','transition-colors']
                      : ['flex-1','px-3','py-2.5','rounded-md','border','border-border','text-left','hover:bg-card-hover','transition-colors']"
                    (click)="mode.set('Fixed')">
              <div class="text-sm font-semibold">Fija</div>
              <div class="text-[10px] font-mono text-text-muted">N semanas</div>
            </button>
            <button type="button"
                    [ngClass]="mode() === 'Loop'
                      ? ['flex-1','px-3','py-2.5','rounded-md','border','border-primary','bg-primary-light','text-primary','text-left','transition-colors']
                      : ['flex-1','px-3','py-2.5','rounded-md','border','border-border','text-left','hover:bg-card-hover','transition-colors']"
                    (click)="mode.set('Loop')">
              <div class="text-sm font-semibold">En bucle</div>
              <div class="text-[10px] font-mono text-text-muted">Se repite</div>
            </button>
          </div>
        </div>

        @if (mode() === 'Fixed') {
          <label class="flex flex-col gap-1">
            <span class="text-overline text-text-muted">Duración del programa</span>
            <div class="flex items-center gap-3">
              <input type="number" min="1" max="52" [(ngModel)]="durationWeeks"
                class="w-20 bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text text-center font-mono
                       focus:outline-none focus:border-primary transition-colors" />
              <span class="text-sm text-text-muted">semanas</span>
            </div>
          </label>
        }

        <div class="flex flex-col gap-1">
          <span class="text-overline text-text-muted">Días de la semana</span>
          <div class="flex gap-2">
            <button type="button"
                    [ngClass]="scheduleType() === 'Week'
                      ? ['flex-1','px-3','py-2.5','rounded-md','border','border-primary','bg-primary-light','text-primary','text-left','transition-colors']
                      : ['flex-1','px-3','py-2.5','rounded-md','border','border-border','text-left','hover:bg-card-hover','transition-colors']"
                    (click)="scheduleType.set('Week')">
              <div class="text-sm font-semibold">L–D</div>
              <div class="text-[10px] font-mono text-text-muted">Días reales</div>
            </button>
            <button type="button"
                    [ngClass]="scheduleType() === 'Numbered'
                      ? ['flex-1','px-3','py-2.5','rounded-md','border','border-primary','bg-primary-light','text-primary','text-left','transition-colors']
                      : ['flex-1','px-3','py-2.5','rounded-md','border','border-border','text-left','hover:bg-card-hover','transition-colors']"
                    (click)="scheduleType.set('Numbered')">
              <div class="text-sm font-semibold">Día 1–N</div>
              <div class="text-[10px] font-mono text-text-muted">Sin calendario</div>
            </button>
          </div>
        </div>

        @if (scheduleType() === 'Numbered') {
          <label class="flex flex-col gap-1">
            <span class="text-overline text-text-muted">Días por semana</span>
            <input type="number" min="1" max="7" [(ngModel)]="daysPerWeek"
                   class="w-20 bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text text-center font-mono
                          focus:outline-none focus:border-primary transition-colors" />
          </label>
        }
      </div>

      <footer class="px-6 py-3 border-t border-border-light flex justify-end gap-2">
        <button class="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text
                       hover:bg-card-hover rounded-lg transition-colors"
                (click)="close.emit()">Cancelar</button>
        <button class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors press"
                [disabled]="!isValid() || saving()" (click)="submit()">
          <lucide-icon name="check" [size]="14"></lucide-icon>
          Crear y editar
        </button>
      </footer>
    </div>
  `,
})
export class CreateProgramModal {
  private programs = inject(ProgramsService);
  private router = inject(Router);

  readonly close = output<void>();
  readonly created = output<string>();

  protected readonly objectives = OBJECTIVES;
  protected readonly levels = LEVELS;
  protected readonly name = signal('');
  protected readonly objective = signal<ProgramObjective>('Hipertrofia');
  protected readonly level = signal<ProgramLevel>('Intermedio');
  protected readonly mode = signal<ProgramMode>('Fixed');
  protected readonly scheduleType = signal<ProgramScheduleType>('Week');
  protected readonly durationWeeks = signal(8);
  protected readonly daysPerWeek = signal(3);
  protected readonly saving = signal(false);

  protected readonly isValid = computed(() => {
    if (this.name().trim().length === 0) return false;
    if (this.mode() === 'Fixed' && (this.durationWeeks() < 1 || this.durationWeeks() > 52)) return false;
    if (this.scheduleType() === 'Numbered' && (this.daysPerWeek() < 1 || this.daysPerWeek() > 7)) return false;
    return true;
  });

  submit() {
    if (!this.isValid() || this.saving()) return;
    this.saving.set(true);
    const payload = {
      name: this.name().trim(),
      description: null,
      objective: this.objective(),
      level: this.level(),
      mode: this.mode(),
      scheduleType: this.scheduleType(),
      daysPerWeek: this.scheduleType() === 'Numbered' ? this.daysPerWeek() : null,
      durationWeeks: this.mode() === 'Loop' ? 1 : this.durationWeeks(),
    };
    this.programs.create(payload).subscribe({
      next: (resp) => {
        this.saving.set(false);
        this.created.emit(resp.id);
        this.close.emit();
        this.router.navigate(['/trainer/programs', resp.id]);
      },
      error: () => this.saving.set(false),
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Plus } from 'lucide-angular';
import { ProgramsService } from '../data-access/programs.service';
import { ProgramLevel, ProgramObjective, ProgramSummary } from '../../../../shared/models';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxEmptyState } from '../../../../shared/ui/empty-state';
import { KxConfirmDialog } from '../../../../shared/ui/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast';
import { CreateProgramModal } from '../ui/create-program-modal';
import { ProgramCard } from '../ui/program-card';
import { AssignProgramModal } from '../ui/assign-program-modal';

const OBJECTIVES: ProgramObjective[] = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Rendimiento', 'Otro'];
const LEVELS: ProgramLevel[] = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

@Component({
  selector: 'app-program-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, LucideAngularModule,
    KxSpinner, KxEmptyState, KxConfirmDialog,
    CreateProgramModal, ProgramCard, AssignProgramModal,
  ],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus }) }],
  template: `
    <div class="animate-fade-up px-4 sm:px-6 md:px-8 pt-6 pb-nav-safe md:pb-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="font-display text-2xl font-extrabold">Programas</h1>
        <button type="button"
                (click)="showCreate.set(true)"
                class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition press flex items-center gap-1.5">
          <lucide-icon name="plus" [size]="14"></lucide-icon> Nuevo programa
        </button>
      </div>

      @if (!loading() && !error() && programs().length > 0) {
        <!-- Filters -->
        <div class="flex gap-2 mb-4 flex-wrap items-center">
          <input class="flex-1 min-w-[200px] px-3 py-2 bg-bg-raised border border-border rounded-md text-sm text-text outline-none focus:border-primary"
                 placeholder="Buscar…"
                 [ngModel]="query()" (ngModelChange)="query.set($event)" />
          <select class="select-styled" [ngModel]="filterObjective()" (ngModelChange)="filterObjective.set($event)">
            <option value="">Todos los objetivos</option>
            @for (o of objectives; track o) { <option [value]="o">{{ o }}</option> }
          </select>
          <select class="select-styled" [ngModel]="filterLevel()" (ngModelChange)="filterLevel.set($event)">
            <option value="">Todos los niveles</option>
            @for (l of levels; track l) { <option [value]="l">{{ l }}</option> }
          </select>
          <select class="select-styled" [ngModel]="filterPublished()" (ngModelChange)="filterPublished.set($event)">
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
          </select>
        </div>
      }

      @if (loading()) {
        <kx-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button type="button" (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (programs().length === 0) {
        <kx-empty-state
          title="Sin programas"
          subtitle="Crea un programa para agrupar rutinas con duración y asignarlo a tus alumnos">
          <button type="button" (click)="showCreate.set(true)"
                  class="inline-flex items-center gap-1.5 mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition press">
            <lucide-icon name="plus" [size]="14"></lucide-icon> Nuevo programa
          </button>
        </kx-empty-state>
      } @else if (filtered().length === 0) {
        <div class="text-center py-12 text-text-muted text-sm">
          No hay programas que coincidan con los filtros.
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 stagger">
          @for (p of filtered(); track p.id) {
            <kx-program-card
              [program]="p"
              (open)="navigateTo(p.id)"
              (assign)="onAssign(p)"
              (duplicate)="onDuplicate(p.id)"
              (delete)="requestDelete(p.id)" />
          }
        </div>
      }
    </div>

    <!-- Delete confirm dialog -->
    <kx-confirm-dialog
      [open]="showDeleteDialog()"
      title="Eliminar programa"
      message="Esta acción no se puede deshacer. ¿Estás seguro?"
      confirmLabel="Eliminar"
      variant="danger"
      (confirmed)="confirmDelete()"
      (cancelled)="showDeleteDialog.set(false)" />

    @if (showCreate()) {
      <kx-create-program-modal
        (close)="showCreate.set(false)"
        (created)="onProgramCreated($event)" />
    }

    @if (assignTarget(); as t) {
      <kx-assign-program-modal
        [programId]="t.id"
        [programName]="t.name"
        (close)="assignTarget.set(null)"
        (assigned)="onAssigned()" />
    }
  `,
})
export class ProgramList implements OnInit {
  private programsService = inject(ProgramsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected readonly objectives = OBJECTIVES;
  protected readonly levels = LEVELS;

  programs = signal<ProgramSummary[]>([]);
  loading = signal(true);
  error = signal('');

  showDeleteDialog = signal(false);
  showCreate = signal(false);
  assignTarget = signal<ProgramSummary | null>(null);
  private deleteTargetId = signal<string | null>(null);

  protected readonly query = signal('');
  protected readonly filterObjective = signal<ProgramObjective | ''>('');
  protected readonly filterLevel = signal<ProgramLevel | ''>('');
  protected readonly filterPublished = signal<'all' | 'published' | 'draft'>('all');

  protected readonly filtered = computed<ProgramSummary[]>(() => {
    const all = this.programs();
    const obj = this.filterObjective();
    const lvl = this.filterLevel();
    const pub = this.filterPublished();
    const q = this.query().trim().toLowerCase();
    return all.filter(p =>
      (!obj || p.objective === obj) &&
      (!lvl || p.level === lvl) &&
      (pub === 'all' || (pub === 'published' && p.isPublished) || (pub === 'draft' && !p.isPublished)) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  });

  ngOnInit() {
    this.loadData();
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  navigateTo(idOrPath: string) {
    this.router.navigate(['/trainer/programs', idOrPath]);
  }

  onAssign(p: ProgramSummary) {
    if (!p.isPublished) {
      this.toast.show('Publicá el programa primero', 'error');
      return;
    }
    this.assignTarget.set(p);
  }

  onAssigned() {
    this.toast.show('Programa asignado');
    this.loadData();
  }

  onDuplicate(id: string) {
    this.programsService.duplicate(id).subscribe({
      next: (res) => {
        this.toast.show('Programa duplicado');
        if (res?.id) this.router.navigate(['/trainer/programs', res.id]);
        else this.loadData();
      },
      error: (err) => this.toast.show(err.error?.error || 'No pudimos duplicar', 'error'),
    });
  }

  requestDelete(id: string) {
    this.deleteTargetId.set(id);
    this.showDeleteDialog.set(true);
  }

  confirmDelete() {
    const id = this.deleteTargetId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.programsService.delete(id).subscribe({
      next: () => {
        this.toast.show('Programa eliminado');
        this.loadData();
      },
      error: (err) => this.toast.show(err.error?.error || 'No pudimos eliminar el programa', 'error'),
    });
  }

  onProgramCreated(_id: string) {
    // Modal handles its own navigation; nothing else to do.
  }

  private loadData() {
    this.programsService.list().subscribe({
      next: (data) => {
        this.programs.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar los programas. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }
}

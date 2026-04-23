import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto, BlockType, SetType, RoutineUsageDto } from '../../../../shared/models';
import { ToastService } from '../../../../shared/ui/toast';
import { KxWizardStepper } from '../../../../shared/ui/wizard-stepper';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxIconButton } from '../../../../shared/ui/icon-button';

// ── Wizard data model ──

interface WizardSet {
  setType: SetType;
  targetReps: string;
  targetWeight: string;
  targetRpe: number | null;
  restSeconds: number | null;
}

interface WizardExercise {
  name: string;
  notes: string;
  tempo: string;
  catalogExerciseId: string | null;
  sets: WizardSet[];
  // Read-only preview from the linked catalog entry — not edited here, shown
  // so the trainer can recognize the exercise at a glance while building.
  // Trainer edits media on the catalog screen.
  catalogImageUrl: string | null;
  catalogVideoUrl: string | null;
}

interface WizardBlock {
  // null = implicit Individual (1 exercise in the block). Superset/Triset/
  // Circuit are only set when a second exercise joins the block.
  blockType: BlockType | null;
  restSeconds: number;
  exercises: WizardExercise[];
}

interface WizardDay {
  name: string;
  blocks: WizardBlock[];
}

interface CatalogSuggestion {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

const CATEGORIES = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Otro'];

@Component({
  selector: 'app-routine-wizard',
  imports: [FormsModule, KxWizardStepper, KxSpinner, KxIconButton],
  template: `
    <div class="animate-fade-up max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-nav-safe md:pb-8">

      <!-- Wizard stepper -->
      <div class="mb-6">
        <kx-wizard-stepper [currentStep]="currentStep()" [totalSteps]="4" />
      </div>

      @if (loading()) {
        <kx-spinner />
      } @else {

        @switch (currentStep()) {

          <!-- ═══════════════════════════════════════════════════ -->
          <!-- STEP 1: Info basica                                -->
          <!-- ═══════════════════════════════════════════════════ -->
          @case (1) {
            <div class="animate-fade-up space-y-6">
              <h2 class="text-h1 text-text">{{ isEdit() ? 'Editar rutina' : 'Nueva rutina' }}</h2>
              @if (usage()?.hasSessions) {
                <div class="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4 mt-3">
                  <p class="text-warning text-sm font-semibold">Rutina con sesiones registradas</p>
                  <p class="text-warning/70 text-xs mt-1">
                    No se puede editar porque tiene sesiones. Usa "Duplicar" desde la lista para crear una versión nueva.
                  </p>
                </div>
              } @else if (usage()?.activeAssignmentCount) {
                <div class="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4 mt-3">
                  <p class="text-warning text-sm font-semibold">Rutina en uso</p>
                  <p class="text-warning/70 text-xs mt-1">
                    Esta rutina está en {{ usage()!.activeProgramCount }} programa(s) con
                    {{ usage()!.activeAssignmentCount }} alumno(s) activo(s).
                    Los cambios se aplicarán en su próxima sesión.
                  </p>
                </div>
              }

              <!-- Name -->
              <div>
                <label for="routine-name" class="block text-sm text-text-secondary mb-1.5">Nombre de la rutina *</label>
                <input id="routine-name" type="text" [(ngModel)]="name" name="name"
                  data-testid="wizard-name"
                  class="w-full bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="Ej: Push / Pull / Legs" />
              </div>

              <!-- Category chips -->
              <div>
                <label class="block text-sm text-text-secondary mb-2">Categoria</label>
                <div class="flex flex-wrap gap-2">
                  @for (cat of categories; track cat) {
                    <button type="button" (click)="toggleCategory(cat)"
                      [attr.data-testid]="'wizard-category-' + cat"
                      class="bg-card border rounded-xl px-4 py-2 text-sm cursor-pointer transition"
                      [class.border-border]="category !== cat"
                      [class.text-text-secondary]="category !== cat"
                      [class.bg-primary/10]="category === cat"
                      [class.text-primary]="category === cat"
                      [class.border-primary/30]="category === cat">
                      {{ cat }}
                    </button>
                  }
                </div>
              </div>

              <!-- Description -->
              <div>
                <label for="routine-desc" class="block text-sm text-text-secondary mb-1.5">Descripcion (opcional)</label>
                <textarea id="routine-desc" [(ngModel)]="description" name="description" rows="3"
                  data-testid="wizard-description"
                  class="w-full bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition resize-none"
                  placeholder="Describe el objetivo de esta rutina..."></textarea>
              </div>

              <!-- Tags -->
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Tags</label>
                <div class="flex items-center gap-1.5 flex-wrap bg-card border border-border rounded-xl px-3 py-2 min-h-[48px]">
                  @for (tag of tags(); track tag) {
                    <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                      {{ tag }}
                      <button type="button" (click)="removeTag(tag)" class="hover:text-danger">x</button>
                    </span>
                  }
                  <input type="text" [(ngModel)]="tagInput" name="tagInput" maxlength="50"
                    data-testid="wizard-tag-input"
                    (keydown.enter)="addTag($event)"
                    class="bg-transparent text-text text-sm flex-1 min-w-[60px] focus:outline-none"
                    placeholder="Agregar tag..." />
                </div>
              </div>

              <!-- Navigation -->
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="cancel()"
                  data-testid="wizard-btn-cancel"
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  Cancelar
                </button>
                <button type="button" (click)="goToStep(2)" [disabled]="!name.trim()"
                  data-testid="wizard-btn-next"
                  class="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition press">
                  Siguiente: Dias
                </button>
              </div>
            </div>
          }

          <!-- ═══════════════════════════════════════════════════ -->
          <!-- STEP 2: Dias                                       -->
          <!-- ═══════════════════════════════════════════════════ -->
          @case (2) {
            <div class="animate-fade-up space-y-4">
              <h2 class="text-h1 text-text">Dias de entrenamiento</h2>
              <p class="text-sm text-text-muted">Agrega los dias que componen esta rutina.</p>

              <div class="space-y-3 stagger">
                @for (day of days(); track $index; let di = $index) {
                  <div class="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                    <!-- Number badge -->
                    <span class="w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {{ di + 1 }}
                    </span>

                    <!-- Editable name -->
                    <input type="text" [ngModel]="day.name" (ngModelChange)="updateDayName(di, $event)" [name]="'day-' + di"
                      [attr.data-testid]="'wizard-day-' + di + '-name'"
                      class="flex-1 bg-transparent text-text font-medium focus:outline-none border-b border-transparent focus:border-primary pb-0.5"
                      placeholder="Nombre del dia (ej: Pecho y Triceps)" />

                    <!-- Reorder -->
                    @if (days().length > 1) {
                      <div class="flex flex-col gap-1">
                        @if (di > 0) {
                          <kx-icon-button icon="arrow-up" ariaLabel="Subir día" size="sm"
                            (clicked)="moveDay(di, -1)" />
                        }
                        @if (di < days().length - 1) {
                          <kx-icon-button icon="arrow-down" ariaLabel="Bajar día" size="sm"
                            (clicked)="moveDay(di, 1)" />
                        }
                      </div>
                    }

                    <!-- Delete -->
                    <kx-icon-button icon="x" ariaLabel="Eliminar día" variant="danger" size="sm"
                      [attr.data-testid]="'wizard-day-' + di + '-remove'"
                      (clicked)="removeDay(di)" />
                  </div>
                }
              </div>

              <!-- Add day -->
              <button type="button" (click)="addDay()"
                data-testid="wizard-day-add"
                class="w-full border border-dashed border-border text-text-secondary hover:text-primary hover:border-primary rounded-xl py-3 text-sm transition">
                + Agregar dia
              </button>

              <!-- Navigation -->
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="goToStep(1)"
                  data-testid="wizard-btn-back"
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  &larr; Anterior
                </button>
                <button type="button" (click)="goToStep(3)" [disabled]="!canAdvanceFromDays()"
                  data-testid="wizard-btn-next"
                  class="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition press">
                  Siguiente: Ejercicios
                </button>
              </div>
            </div>
          }

          <!-- ═══════════════════════════════════════════════════ -->
          <!-- STEP 3: Ejercicios (per day)                       -->
          <!-- ═══════════════════════════════════════════════════ -->
          @case (3) {
            <div class="animate-fade-up">
              <h2 class="text-h1 text-text mb-4">Ejercicios por dia</h2>

              <div class="flex gap-4">
                <!-- Left panel: day tabs -->
                <div class="w-[180px] shrink-0 space-y-1">
                  @for (day of days(); track $index; let di = $index) {
                    <button type="button" (click)="selectedDayIndex.set(di)"
                      [attr.data-testid]="'wizard-day-tab-' + di"
                      class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition border-l-2"
                      [class.border-primary]="selectedDayIndex() === di"
                      [class.bg-primary/5]="selectedDayIndex() === di"
                      [class.text-text]="selectedDayIndex() === di"
                      [class.font-semibold]="selectedDayIndex() === di"
                      [class.border-transparent]="selectedDayIndex() !== di"
                      [class.text-text-muted]="selectedDayIndex() !== di"
                      [class.hover:text-text]="selectedDayIndex() !== di"
                      [class.hover:bg-card]="selectedDayIndex() !== di">
                      <div>{{ day.name || 'Dia ' + (di + 1) }}</div>
                      <div class="text-xs mt-0.5 text-text-muted">
                        {{ countExercises(di) }} ejercicio{{ countExercises(di) !== 1 ? 's' : '' }}
                      </div>
                    </button>
                  }
                </div>

                <!-- Right panel: exercise editor for selected day -->
                <div class="flex-1 min-w-0">
                  @if (currentDay(); as day) {
                    <div class="space-y-3">
                      @for (block of day.blocks; track $index; let bi = $index) {
                        <div class="bg-card border border-border rounded-xl overflow-hidden">
                          <!-- Block header — selector + inter-round rest only show
                               when the block actually groups 2+ exercises. A single-
                               exercise block is the implicit Individual and needs
                               neither a type nor a group-level rest. -->
                          @if (block.exercises.length > 1) {
                            <div class="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-bg-raised border-b border-border-light">
                              <select [ngModel]="block.blockType" (ngModelChange)="updateBlockType(bi, $event)" [name]="'gt-' + bi"
                                class="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-text"
                                [attr.aria-label]="'Tipo de bloque'"
                                [attr.data-testid]="'wizard-block-' + bi + '-type'">
                                <option value="Superset">Superset</option>
                                <option value="Triset">Triset</option>
                                <option value="Circuit">Circuito</option>
                              </select>
                              <div class="flex items-center gap-1.5">
                                <input type="number" [ngModel]="block.restSeconds" (ngModelChange)="updateBlockRest(bi, $event)" [name]="'grest-' + bi"
                                  class="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-text w-16 text-center" placeholder="90"
                                  [attr.aria-label]="'Descanso entre rondas'"
                                  [attr.data-testid]="'wizard-block-' + bi + '-rest'" />
                                <span class="text-text-muted text-xs">seg entre rondas</span>
                              </div>
                              <button type="button" (click)="removeBlock(bi)"
                                class="text-text-muted hover:text-danger text-xs px-2 py-1 rounded transition ml-auto" aria-label="Eliminar bloque"
                                [attr.data-testid]="'wizard-block-' + bi + '-remove'">&#10005;</button>
                            </div>
                          } @else {
                            <div class="flex justify-end px-3 pt-2">
                              <button type="button" (click)="removeBlock(bi)"
                                class="text-text-muted hover:text-danger text-xs px-2 py-0.5 rounded transition"
                                aria-label="Eliminar ejercicio"
                                [attr.data-testid]="'wizard-block-' + bi + '-remove'">&#10005;</button>
                            </div>
                          }

                          <!-- Exercises within block -->
                          <div class="p-3 space-y-2">
                            @for (ex of block.exercises; track $index; let ei = $index) {
                              @if (isExerciseExpanded(bi, ei)) {
                                <!-- Expanded exercise -->
                                <div class="bg-bg-raised rounded-lg border border-border-light overflow-hidden expanded">
                                  <!-- Exercise header -->
                                  <div class="flex items-center gap-2 px-3 py-2.5 cursor-pointer" (click)="toggleExercise(bi, ei)">
                                    <span class="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                      {{ ei + 1 }}
                                    </span>
                                    <div class="flex-1 relative" (click)="$event.stopPropagation()">
                                      <input type="text" [ngModel]="ex.name" (ngModelChange)="updateExerciseName(bi, ei, $event)"
                                        (input)="searchCatalog(bi, ei)"
                                        (focus)="searchCatalog(bi, ei)"
                                        (blur)="hideSuggestionsDelayed()"
                                        [name]="'ex-' + bi + '-' + ei"
                                        autocomplete="off"
                                        [attr.data-testid]="'wizard-exercise-' + bi + '-' + ei + '-name'"
                                        class="w-full bg-transparent text-sm font-medium text-text focus:outline-none border-b border-border-light focus:border-primary pb-0.5"
                                        placeholder="Nombre del ejercicio" />
                                      @if (catalogSuggestions().length > 0 && activeGroupIndex === bi && activeExerciseIndex === ei) {
                                        <div class="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                          @for (s of catalogSuggestions(); track s.id) {
                                            <button type="button" (mousedown)="selectCatalogExercise(bi, ei, s)"
                                              class="w-full px-3 py-2 text-left text-sm hover:bg-card-hover transition flex items-center justify-between">
                                              <span class="text-text">{{ s.name }}</span>
                                              @if (s.muscleGroup) {
                                                <span class="text-text-muted text-xs">{{ s.muscleGroup }}</span>
                                              }
                                            </button>
                                          }
                                        </div>
                                      }
                                    </div>
                                    @if (!ex.catalogExerciseId && ex.name.trim().length > 1) {
                                      <span class="text-[10px] font-semibold text-warning bg-warning/10 border border-warning/30 px-1.5 py-0.5 rounded uppercase tracking-wide"
                                        title="Este ejercicio no está en el catálogo. Al guardar la rutina se agregará automáticamente."
                                        data-testid="wizard-exercise-new-badge">nuevo</span>
                                    }
                                    <button type="button" (click)="$event.stopPropagation(); removeExercise(bi, ei)"
                                      class="text-text-muted hover:text-danger text-xs px-1.5 py-1 rounded transition" aria-label="Eliminar ejercicio"
                                      [attr.data-testid]="'wizard-exercise-' + bi + '-' + ei + '-remove'">&#10005;</button>
                                    <span class="text-text-muted text-xs cursor-pointer">&#9650;</span>
                                  </div>

                                  <!-- Catalog media preview (read-only) -->
                                  @if (ex.catalogImageUrl || ex.catalogVideoUrl) {
                                    <div class="mx-3 mb-2 flex items-center gap-2 text-xs text-text-muted">
                                      @if (ex.catalogImageUrl) {
                                        <img [src]="ex.catalogImageUrl" [alt]="ex.name"
                                          class="w-10 h-10 rounded object-cover border border-border-light" />
                                      }
                                      @if (ex.catalogVideoUrl) {
                                        <span class="flex items-center gap-1 text-text-muted">
                                          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7L8 5z"/>
                                          </svg>
                                          video
                                        </span>
                                      }
                                      <span class="text-text-subtle">· editable en catálogo</span>
                                    </div>
                                  }

                                  <!-- Notes -->
                                  <div class="mx-3 mb-2">
                                    <input type="text" [ngModel]="ex.notes" (ngModelChange)="updateExerciseNotes(bi, ei, $event)"
                                      [name]="'notes-' + bi + '-' + ei"
                                      [attr.data-testid]="'wizard-exercise-' + bi + '-' + ei + '-notes'"
                                      class="w-full bg-card border border-border-light rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                      placeholder="Notas del ejercicio (opcional)" />
                                  </div>

                                  <!-- Sets table -->
                                  <div class="px-3 pb-3 space-y-2">
                                    <!-- Sets header -->
                                    <div class="flex items-center gap-2 text-xs text-text-muted px-1">
                                      <span class="w-8 text-center">SET</span>
                                      <span class="w-24">TIPO</span>
                                      <span class="w-14 text-center">REPS</span>
                                      <span class="w-14 text-center">PESO</span>
                                      <span class="w-14 text-center">RPE</span>
                                      <span class="w-16 text-center">DESC.</span>
                                      <span class="w-6"></span>
                                    </div>

                                    @for (set of ex.sets; track $index; let si = $index) {
                                      <div class="flex items-center gap-2 text-sm">
                                        <span class="w-8 text-center text-text-muted text-xs font-medium">{{ si + 1 }}</span>
                                        <select [ngModel]="set.setType" (ngModelChange)="updateSetType(bi, ei, si, $event)"
                                          [name]="'st-' + bi + '-' + ei + '-' + si"
                                          class="w-24 bg-bg-raised border border-border-light rounded-lg px-1.5 py-1.5 text-xs text-text select-styled"
                                          [attr.aria-label]="'Tipo de serie'"
                                          [attr.data-testid]="'wizard-set-' + bi + '-' + ei + '-' + si + '-type'">
                                          <option value="Warmup">Calentam.</option>
                                          <option value="Effective">Efectiva</option>
                                          <option value="DropSet">Drop set</option>
                                          <option value="RestPause">Rest-pause</option>
                                          <option value="AMRAP">AMRAP</option>
                                        </select>
                                        <input type="text" [ngModel]="set.targetReps" (ngModelChange)="updateSetField(bi, ei, si, 'targetReps', $event)"
                                          [name]="'reps-' + bi + '-' + ei + '-' + si"
                                          class="w-14 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="Reps"
                                          [attr.aria-label]="'Repeticiones'"
                                          [attr.data-testid]="'wizard-set-' + bi + '-' + ei + '-' + si + '-reps'" />
                                        <input type="text" [ngModel]="set.targetWeight" (ngModelChange)="updateSetField(bi, ei, si, 'targetWeight', $event)"
                                          [name]="'wt-' + bi + '-' + ei + '-' + si"
                                          class="w-14 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="kg"
                                          [attr.aria-label]="'Peso'"
                                          [attr.data-testid]="'wizard-set-' + bi + '-' + ei + '-' + si + '-weight'" />
                                        <input type="number" [ngModel]="set.targetRpe" (ngModelChange)="updateSetRpe(bi, ei, si, $event)"
                                          [name]="'rpe-' + bi + '-' + ei + '-' + si"
                                          class="w-14 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="RPE"
                                          min="1" max="10" [attr.aria-label]="'RPE'"
                                          [attr.data-testid]="'wizard-set-' + bi + '-' + ei + '-' + si + '-rpe'" />
                                        <input type="number" [ngModel]="set.restSeconds" (ngModelChange)="updateSetRest(bi, ei, si, $event)"
                                          [name]="'srest-' + bi + '-' + ei + '-' + si"
                                          class="w-16 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="seg"
                                          [attr.aria-label]="'Descanso'"
                                          [attr.data-testid]="'wizard-set-' + bi + '-' + ei + '-' + si + '-rest'" />
                                        <kx-icon-button icon="x" ariaLabel="Eliminar serie" variant="danger" size="sm"
                                          [attr.data-testid]="'wizard-set-' + bi + '-' + ei + '-' + si + '-remove'"
                                          (clicked)="removeSet(bi, ei, si)" />
                                      </div>
                                    }

                                    <div class="mt-1">
                                      <kx-icon-button icon="plus" ariaLabel="Agregar serie" label="Serie" size="sm"
                                        [attr.data-testid]="'wizard-set-add-' + bi + '-' + ei"
                                        (clicked)="addSet(bi, ei)" />
                                    </div>
                                  </div>
                                </div>

                              } @else {
                                <!-- Collapsed exercise -->
                                <div class="flex items-center gap-2 px-3 py-2.5 bg-bg-raised rounded-lg cursor-pointer hover:bg-card-hover transition"
                                  (click)="toggleExercise(bi, ei)"
                                  [attr.data-testid]="'wizard-exercise-' + bi + '-' + ei + '-toggle'">
                                  <span class="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                    {{ ei + 1 }}
                                  </span>
                                  <span class="flex-1 text-sm text-text font-medium truncate">{{ ex.name || 'Sin nombre' }}</span>
                                  <span class="text-xs text-text-muted">{{ ex.sets.length }} serie{{ ex.sets.length !== 1 ? 's' : '' }}</span>
                                  <span class="text-text-muted text-xs">&#9660;</span>
                                </div>
                              }
                            }

                            <!-- Add exercise into this block — labels the outcome, not the
                                 internal concept: a single-exercise block invites grouping
                                 into a Superset (trainer can switch to Triset/Circuito from
                                 the selector that appears). A multi-exercise block already
                                 has a type, so we just offer to extend it. -->
                            <div>
                              @if (block.exercises.length === 1) {
                                <kx-icon-button icon="link-2" ariaLabel="Convertir en superset"
                                  label="Hacer superset" size="sm" variant="primary"
                                  [attr.data-testid]="'wizard-exercise-add-' + bi"
                                  (clicked)="addExercise(bi)" />
                              } @else {
                                <kx-icon-button icon="plus" ariaLabel="Agregar ejercicio al bloque"
                                  label="Otro ejercicio" size="sm"
                                  [attr.data-testid]="'wizard-exercise-add-' + bi"
                                  (clicked)="addExercise(bi)" />
                              }
                            </div>
                          </div>
                        </div>
                      }

                      <!-- Add new standalone block (individual exercise by default) -->
                      <button type="button" (click)="addBlock()"
                        data-testid="wizard-block-add"
                        class="w-full border border-dashed border-border text-text-secondary hover:text-primary hover:border-primary rounded-xl py-2.5 text-sm transition">
                        + Nuevo ejercicio
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Navigation -->
              <div class="flex gap-3 pt-4">
                <button type="button" (click)="goToStep(2)"
                  data-testid="wizard-btn-back"
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  &larr; Dias
                </button>
                <button type="button" (click)="goToStep(4)"
                  data-testid="wizard-btn-next"
                  class="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition press">
                  Siguiente: Revisar
                </button>
              </div>
            </div>
          }

          <!-- ═══════════════════════════════════════════════════ -->
          <!-- STEP 4: Revisar                                    -->
          <!-- ═══════════════════════════════════════════════════ -->
          @case (4) {
            <div class="animate-fade-up space-y-6">
              <h2 class="text-h1 text-text">Revisar rutina</h2>

              <!-- Summary card -->
              <div class="bg-card border border-border rounded-xl p-5 space-y-3">
                <div>
                  <span class="text-overline text-text-muted">Nombre</span>
                  <p class="text-text font-semibold text-lg">{{ name }}</p>
                </div>
                @if (category) {
                  <div>
                    <span class="text-overline text-text-muted">Categoria</span>
                    <p class="text-text">{{ category }}</p>
                  </div>
                }
                @if (description) {
                  <div>
                    <span class="text-overline text-text-muted">Descripcion</span>
                    <p class="text-text-secondary text-sm">{{ description }}</p>
                  </div>
                }
                @if (tags().length > 0) {
                  <div>
                    <span class="text-overline text-text-muted">Tags</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                      @for (tag of tags(); track tag) {
                        <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{{ tag }}</span>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Days summary -->
              <div class="space-y-3">
                @for (day of days(); track $index; let di = $index) {
                  <div class="bg-card border border-border rounded-xl overflow-hidden">
                    <div class="flex items-center gap-2 px-4 py-3 bg-bg-raised border-b border-border-light">
                      <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {{ di + 1 }}
                      </span>
                      <span class="font-semibold text-text">{{ day.name }}</span>
                      <span class="text-xs text-text-muted ml-auto">{{ countExercisesInDay(day) }} ejercicio{{ countExercisesInDay(day) !== 1 ? 's' : '' }}</span>
                    </div>

                    <div class="p-4 space-y-2">
                      @for (block of day.blocks; track $index) {
                        @if (block.blockType) {
                          <div class="text-xs text-text-muted mb-1">{{ block.blockType }} &middot; {{ block.restSeconds }}s entre rondas</div>
                        }
                        @for (ex of block.exercises; track $index) {
                          <div class="flex items-center gap-2 text-sm">
                            <span class="text-text">{{ ex.name || 'Sin nombre' }}</span>
                            <span class="text-text-muted text-xs ml-auto">{{ summarizeSets(ex) }}</span>
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Navigation -->
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="goToStep(3)"
                  data-testid="wizard-btn-back"
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  &larr; Ejercicios
                </button>
                <button type="button" (click)="save()" [disabled]="saving()"
                  data-testid="wizard-btn-save"
                  class="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition press">
                  @if (saving()) {
                    <kx-spinner size="sm" containerClass="" />
                  } @else {
                    Guardar rutina &#10003;
                  }
                </button>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
})
export class RoutineWizard implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // ── Step state ──
  currentStep = signal(1);

  // ── Form data (plain properties for ngModel, signals for arrays/objects) ──
  name = '';
  description = '';
  category = '';
  tags = signal<string[]>([]);
  tagInput = '';
  days = signal<WizardDay[]>([]);

  // ── UI state ──
  selectedDayIndex = signal(0);
  expandedExercise = signal<{ bi: number; ei: number } | null>(null);
  saving = signal(false);
  loading = signal(false);
  isEdit = signal(false);
  usage = signal<RoutineUsageDto | null>(null);

  // ── Catalog autocomplete ──
  catalogSuggestions = signal<CatalogSuggestion[]>([]);
  activeGroupIndex = -1;
  activeExerciseIndex = -1;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Constants ──
  categories = CATEGORIES;
  private routineId = '';

  // ── Computed: current day for step 3 ──
  currentDay = computed(() => {
    const d = this.days();
    const idx = this.selectedDayIndex();
    return idx >= 0 && idx < d.length ? d[idx] : null;
  });

  ngOnDestroy() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  ngOnInit() {
    this.routineId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.routineId) {
      this.isEdit.set(true);
      this.loadRoutine();
      this.api.get<RoutineUsageDto>(`/routines/${this.routineId}/usage`).subscribe({
        next: (u) => this.usage.set(u),
      });
    } else {
      this.days.set([this.newDay()]);
    }
  }

  // ── Navigation ──

  goToStep(step: number) {
    this.currentStep.set(step);
    // Reset selected day index if going to step 3 and current is out of range
    if (step === 3) {
      const d = this.days();
      if (this.selectedDayIndex() >= d.length) {
        this.selectedDayIndex.set(0);
      }
    }
  }

  cancel() {
    this.router.navigate(['/trainer/routines']);
  }

  canAdvanceFromDays(): boolean {
    const d = this.days();
    return d.length > 0 && d.every(day => day.name.trim().length > 0);
  }

  // ── Category ──

  toggleCategory(cat: string) {
    this.category = this.category === cat ? '' : cat;
  }

  // ── Tags ──

  addTag(event: Event) {
    event.preventDefault();
    const tag = this.tagInput.trim();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update(t => [...t, tag]);
    }
    this.tagInput = '';
  }

  removeTag(tag: string) {
    this.tags.update(t => t.filter(x => x !== tag));
  }

  // ── Day management ──

  addDay() {
    this.days.update(d => [...d, this.newDay()]);
  }

  removeDay(i: number) {
    this.days.update(d => d.filter((_, idx) => idx !== i));
    // Adjust selectedDayIndex
    if (this.selectedDayIndex() >= this.days().length) {
      this.selectedDayIndex.set(Math.max(0, this.days().length - 1));
    }
  }

  moveDay(i: number, direction: number) {
    this.days.update(d => {
      const arr = [...d];
      const target = i + direction;
      [arr[i], arr[target]] = [arr[target], arr[i]];
      return arr;
    });
  }

  updateDayName(di: number, name: string) {
    this.days.update(d => {
      d[di].name = name;
      return [...d];
    });
  }

  // ── Group management (operates on selectedDayIndex) ──

  addBlock() {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks.push(this.newBlock());
      return [...d];
    });
  }

  removeBlock(bi: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks.splice(bi, 1);
      return [...d];
    });
  }

  updateBlockType(bi: number, blockType: BlockType) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].blockType = blockType;
      return [...d];
    });
  }

  updateBlockRest(bi: number, restSeconds: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].restSeconds = restSeconds;
      return [...d];
    });
  }

  // ── Exercise management ──

  addExercise(bi: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      const block = d[di].blocks[bi];
      block.exercises.push(this.newExercise());
      // First grouping: reaching 2 exercises flips the implicit Individual
      // into an explicit Superset. Trainer can change to Triset/Circuit
      // afterwards from the selector that's now visible.
      if (block.exercises.length === 2 && block.blockType === null) {
        block.blockType = 'Superset';
      }
      return [...d];
    });
    // Expand the newly added exercise
    const newEi = this.days()[di].blocks[bi].exercises.length - 1;
    this.expandedExercise.set({ bi, ei: newEi });
  }


  removeExercise(bi: number, ei: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      const block = d[di].blocks[bi];
      block.exercises.splice(ei, 1);
      // Back to 1 exercise — collapse to implicit Individual so the selector
      // and inter-round rest stop being visible. The block itself stays,
      // removing the whole block is a separate action (X in header).
      if (block.exercises.length === 1) {
        block.blockType = null;
      }
      return [...d];
    });
    // Clear expanded if it was this one
    const exp = this.expandedExercise();
    if (exp && exp.bi === bi && exp.ei === ei) {
      this.expandedExercise.set(null);
    }
  }

  updateExerciseName(bi: number, ei: number, name: string) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      const ex = d[di].blocks[bi].exercises[ei];
      ex.name = name;
      // Free-text edits break the catalog link — drop it so stale media doesn't
      // reach the student. selectCatalogExercise re-links and restores preview.
      // Phase 3 auto-cataloging will upsert on save if the name is still new.
      ex.catalogExerciseId = null;
      ex.catalogImageUrl = null;
      ex.catalogVideoUrl = null;
      return [...d];
    });
  }

  updateExerciseNotes(bi: number, ei: number, notes: string) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].exercises[ei].notes = notes;
      return [...d];
    });
  }

  toggleExercise(bi: number, ei: number) {
    const exp = this.expandedExercise();
    if (exp && exp.bi === bi && exp.ei === ei) {
      this.expandedExercise.set(null);
    } else {
      this.expandedExercise.set({ bi, ei });
    }
  }

  isExerciseExpanded(bi: number, ei: number): boolean {
    const exp = this.expandedExercise();
    return !!exp && exp.bi === bi && exp.ei === ei;
  }

  // ── Set management ──

  addSet(bi: number, ei: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].exercises[ei].sets.push(this.newSet());
      return [...d];
    });
  }

  removeSet(bi: number, ei: number, si: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].exercises[ei].sets.splice(si, 1);
      return [...d];
    });
  }

  updateSetType(bi: number, ei: number, si: number, setType: SetType) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].exercises[ei].sets[si].setType = setType;
      return [...d];
    });
  }

  updateSetField(bi: number, ei: number, si: number, field: 'targetReps' | 'targetWeight', value: string) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].exercises[ei].sets[si][field] = value;
      return [...d];
    });
  }

  updateSetRpe(bi: number, ei: number, si: number, value: number | null) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].exercises[ei].sets[si].targetRpe = value;
      return [...d];
    });
  }

  updateSetRest(bi: number, ei: number, si: number, value: number | null) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].blocks[bi].exercises[ei].sets[si].restSeconds = value;
      return [...d];
    });
  }

  // ── Catalog autocomplete ──

  searchCatalog(bi: number, ei: number) {
    this.activeGroupIndex = bi;
    this.activeExerciseIndex = ei;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const di = this.selectedDayIndex();
      const q = this.days()[di].blocks[bi].exercises[ei].name.trim();
      if (q.length < 2) {
        this.catalogSuggestions.set([]);
        return;
      }
      this.api.get<CatalogSuggestion[]>(`/catalog?q=${encodeURIComponent(q)}`).subscribe({
        next: (data) => this.catalogSuggestions.set(data),
        error: () => this.catalogSuggestions.set([]),
      });
    }, 300);
  }

  selectCatalogExercise(bi: number, ei: number, catalog: CatalogSuggestion) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      const ex = d[di].blocks[bi].exercises[ei];
      ex.name = catalog.name;
      ex.catalogExerciseId = catalog.id;
      ex.catalogImageUrl = catalog.imageUrl;
      ex.catalogVideoUrl = catalog.videoUrl;
      if (catalog.notes) ex.notes = catalog.notes;
      return [...d];
    });
    this.catalogSuggestions.set([]);
    this.activeGroupIndex = -1;
    this.activeExerciseIndex = -1;
  }

  hideSuggestionsDelayed() {
    setTimeout(() => {
      this.catalogSuggestions.set([]);
      this.activeGroupIndex = -1;
      this.activeExerciseIndex = -1;
    }, 200);
  }

  // ── Summary helpers (step 4) ──

  countExercises(di: number): number {
    const day = this.days()[di];
    if (!day) return 0;
    return this.countExercisesInDay(day);
  }

  countExercisesInDay(day: WizardDay): number {
    return day.blocks.reduce((sum, g) => sum + g.exercises.length, 0);
  }

  summarizeSets(ex: WizardExercise): string {
    const counts: Record<string, number> = {};
    for (const s of ex.sets) {
      counts[s.setType] = (counts[s.setType] || 0) + 1;
    }
    const labels: Record<string, string> = {
      Warmup: 'Calent.',
      Effective: 'Efect.',
      DropSet: 'Drop',
      RestPause: 'R-P',
      AMRAP: 'AMRAP',
    };
    return Object.entries(counts)
      .map(([type, count]) => `${count} ${labels[type] || type}`)
      .join(', ');
  }

  // ── Load routine (edit mode) ──

  private loadRoutine() {
    this.loading.set(true);
    this.api.get<RoutineDetailDto>(`/routines/${this.routineId}`).subscribe({
      next: (r) => {
        this.name = r.name;
        this.description = r.description ?? '';
        this.category = r.category ?? '';
        this.tags.set(r.tags ?? []);
        this.days.set(
          r.days.map((d) => ({
            name: d.name,
            blocks: d.blocks.map((g) => ({
              blockType: g.blockType,
              restSeconds: g.restSeconds,
              exercises: g.exercises.map((e) => ({
                name: e.name,
                notes: e.notes ?? '',
                tempo: e.tempo ?? '',
                catalogExerciseId: e.catalogExerciseId ?? null,
                catalogImageUrl: e.imageUrl ?? null,
                catalogVideoUrl: e.videoUrl ?? null,
                sets: e.sets.map((s) => ({
                  setType: s.setType,
                  targetReps: s.targetReps ?? '',
                  targetWeight: s.targetWeight ?? '',
                  targetRpe: s.targetRpe,
                  restSeconds: s.restSeconds,
                })),
              })),
            })),
          }))
        );
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Error al cargar la rutina', 'error');
        this.loading.set(false);
        this.router.navigate(['/trainer/routines']);
      },
    });
  }

  // ── Save ──

  save() {
    if (this.usage()?.hasSessions) {
      this.toast.show('Esta rutina tiene sesiones. Duplicala para editarla.', 'error');
      return;
    }
    this.saving.set(true);

    const body = {
      name: this.name,
      description: this.description || null,
      tags: this.tags(),
      category: this.category || null,
      days: this.days().map((d) => ({
        name: d.name,
        blocks: d.blocks.map((g) => ({
          blockType: g.blockType,
          restSeconds: g.restSeconds,
          exercises: g.exercises.map((e) => ({
            name: e.name,
            notes: e.notes || null,
            tempo: e.tempo || null,
            catalogExerciseId: e.catalogExerciseId,
            sets: e.sets.map((s) => ({
              setType: s.setType,
              targetReps: s.targetReps || null,
              targetWeight: s.targetWeight || null,
              targetRpe: s.targetRpe,
              restSeconds: s.restSeconds,
            })),
          })),
        })),
      })),
    };

    const req = this.isEdit()
      ? this.api.put(`/routines/${this.routineId}`, body)
      : this.api.post('/routines', body);

    req.subscribe({
      next: () => {
        this.toast.show(this.isEdit() ? 'Rutina actualizada' : 'Rutina creada');
        this.router.navigate(['/trainer/routines']);
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'No pudimos guardar la rutina. Intenta de nuevo.', 'error');
        this.saving.set(false);
      },
    });
  }

  // ── Factory helpers ──

  private newDay(): WizardDay {
    return { name: '', blocks: [this.newBlock()] };
  }

  private newBlock(): WizardBlock {
    // blockType stays null for a fresh block — it only gets an explicit
    // Superset/Triset/Circuit once the trainer adds a second exercise.
    return { blockType: null, restSeconds: 90, exercises: [this.newExercise()] };
  }

  private newExercise(): WizardExercise {
    return {
      name: '',
      notes: '',
      tempo: '',
      catalogExerciseId: null,
      catalogImageUrl: null,
      catalogVideoUrl: null,
      sets: [this.newSet()],
    };
  }

  private newSet(): WizardSet {
    return { setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null };
  }
}

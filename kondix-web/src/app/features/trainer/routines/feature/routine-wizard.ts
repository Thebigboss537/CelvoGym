import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto, GroupType, SetType, VideoSource } from '../../../../shared/models';
import { ToastService } from '../../../../shared/ui/toast';
import { KxWizardStepper } from '../../../../shared/ui/wizard-stepper';
import { KxSpinner } from '../../../../shared/ui/spinner';

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
  videoSource: VideoSource;
  videoUrl: string;
  tempo: string;
  sets: WizardSet[];
  // UI-only state
  videoInputMode: 'youtube' | 'upload';
  uploading: boolean;
  showVideo: boolean;
}

interface WizardGroup {
  groupType: GroupType;
  restSeconds: number;
  exercises: WizardExercise[];
}

interface WizardDay {
  name: string;
  groups: WizardGroup[];
}

interface CatalogSuggestion {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoUrl: string | null;
  videoSource: VideoSource | null;
  notes: string | null;
}

const CATEGORIES = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Otro'];

@Component({
  selector: 'app-routine-wizard',
  imports: [FormsModule, KxWizardStepper, KxSpinner],
  template: `
    <div class="animate-fade-up max-w-4xl mx-auto">

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

              <!-- Name -->
              <div>
                <label for="routine-name" class="block text-sm text-text-secondary mb-1.5">Nombre de la rutina *</label>
                <input id="routine-name" type="text" [(ngModel)]="name" name="name"
                  class="w-full bg-card border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="Ej: Push / Pull / Legs" />
              </div>

              <!-- Category chips -->
              <div>
                <label class="block text-sm text-text-secondary mb-2">Categoria</label>
                <div class="flex flex-wrap gap-2">
                  @for (cat of categories; track cat) {
                    <button type="button" (click)="toggleCategory(cat)"
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
                    (keydown.enter)="addTag($event)"
                    class="bg-transparent text-text text-sm flex-1 min-w-[60px] focus:outline-none"
                    placeholder="Agregar tag..." />
                </div>
              </div>

              <!-- Navigation -->
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="cancel()"
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  Cancelar
                </button>
                <button type="button" (click)="goToStep(2)" [disabled]="!name.trim()"
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
                      class="flex-1 bg-transparent text-text font-medium focus:outline-none border-b border-transparent focus:border-primary pb-0.5"
                      placeholder="Nombre del dia (ej: Pecho y Triceps)" />

                    <!-- Reorder -->
                    @if (days().length > 1) {
                      <div class="flex flex-col gap-0.5">
                        @if (di > 0) {
                          <button type="button" (click)="moveDay(di, -1)" class="text-text-muted hover:text-primary text-xs transition" aria-label="Mover arriba">&#9650;</button>
                        }
                        @if (di < days().length - 1) {
                          <button type="button" (click)="moveDay(di, 1)" class="text-text-muted hover:text-primary text-xs transition" aria-label="Mover abajo">&#9660;</button>
                        }
                      </div>
                    }

                    <!-- Delete -->
                    <button type="button" (click)="removeDay(di)"
                      class="text-text-muted hover:text-danger text-lg px-1 transition" aria-label="Eliminar dia">&#10005;</button>
                  </div>
                }
              </div>

              <!-- Add day -->
              <button type="button" (click)="addDay()"
                class="w-full border border-dashed border-border text-text-secondary hover:text-primary hover:border-primary rounded-xl py-3 text-sm transition">
                + Agregar dia
              </button>

              <!-- Navigation -->
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="goToStep(1)"
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  &larr; Anterior
                </button>
                <button type="button" (click)="goToStep(3)" [disabled]="!canAdvanceFromDays()"
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
                      @for (group of day.groups; track $index; let gi = $index) {
                        <div class="bg-card border border-border rounded-xl overflow-hidden">
                          <!-- Group header -->
                          <div class="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-bg-raised border-b border-border-light">
                            <select [ngModel]="group.groupType" (ngModelChange)="updateGroupType(gi, $event)" [name]="'gt-' + gi"
                              class="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-text"
                              [attr.aria-label]="'Tipo de grupo'">
                              <option value="Single">Individual</option>
                              <option value="Superset">Superset</option>
                              <option value="Triset">Triset</option>
                              <option value="Circuit">Circuito</option>
                            </select>
                            <div class="flex items-center gap-1.5">
                              <input type="number" [ngModel]="group.restSeconds" (ngModelChange)="updateGroupRest(gi, $event)" [name]="'grest-' + gi"
                                class="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-text w-16 text-center" placeholder="90"
                                [attr.aria-label]="'Descanso del grupo'" />
                              <span class="text-text-muted text-xs">seg</span>
                            </div>
                            <button type="button" (click)="removeGroup(gi)"
                              class="text-text-muted hover:text-danger text-xs px-2 py-1 rounded transition ml-auto" aria-label="Eliminar grupo">&#10005;</button>
                          </div>

                          <!-- Exercises within group -->
                          <div class="p-3 space-y-2">
                            @for (ex of group.exercises; track $index; let ei = $index) {
                              @if (isExerciseExpanded(gi, ei)) {
                                <!-- Expanded exercise -->
                                <div class="bg-bg-raised rounded-lg border border-border-light overflow-hidden expanded">
                                  <!-- Exercise header -->
                                  <div class="flex items-center gap-2 px-3 py-2.5 cursor-pointer" (click)="toggleExercise(gi, ei)">
                                    <span class="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                      {{ ei + 1 }}
                                    </span>
                                    <div class="flex-1 relative" (click)="$event.stopPropagation()">
                                      <input type="text" [ngModel]="ex.name" (ngModelChange)="updateExerciseName(gi, ei, $event)"
                                        (input)="searchCatalog(gi, ei)"
                                        (focus)="searchCatalog(gi, ei)"
                                        (blur)="hideSuggestionsDelayed()"
                                        [name]="'ex-' + gi + '-' + ei"
                                        autocomplete="off"
                                        class="w-full bg-transparent text-sm font-medium text-text focus:outline-none border-b border-border-light focus:border-primary pb-0.5"
                                        placeholder="Nombre del ejercicio" />
                                      @if (catalogSuggestions().length > 0 && activeGroupIndex === gi && activeExerciseIndex === ei) {
                                        <div class="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                          @for (s of catalogSuggestions(); track s.id) {
                                            <button type="button" (mousedown)="selectCatalogExercise(gi, ei, s)"
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
                                    <button type="button" (click)="$event.stopPropagation(); toggleVideo(gi, ei)"
                                      class="text-xs px-2 py-1 rounded transition"
                                      [class.text-primary]="ex.showVideo || ex.videoUrl"
                                      [class.text-text-muted]="!ex.showVideo && !ex.videoUrl">Video</button>
                                    <button type="button" (click)="$event.stopPropagation(); removeExercise(gi, ei)"
                                      class="text-text-muted hover:text-danger text-xs px-1.5 py-1 rounded transition" aria-label="Eliminar ejercicio">&#10005;</button>
                                    <span class="text-text-muted text-xs cursor-pointer">&#9650;</span>
                                  </div>

                                  <!-- Video section -->
                                  @if (ex.showVideo) {
                                    <div class="mx-3 mb-2 bg-card rounded-lg p-2.5 space-y-2">
                                      <div class="flex gap-1">
                                        <button type="button" (click)="setVideoMode(gi, ei, 'youtube')"
                                          class="px-2.5 py-1 text-xs rounded-lg transition"
                                          [class.bg-primary]="ex.videoInputMode === 'youtube'"
                                          [class.text-white]="ex.videoInputMode === 'youtube'"
                                          [class.bg-card-hover]="ex.videoInputMode !== 'youtube'"
                                          [class.text-text-muted]="ex.videoInputMode !== 'youtube'">YouTube</button>
                                        <button type="button" (click)="setVideoMode(gi, ei, 'upload')"
                                          class="px-2.5 py-1 text-xs rounded-lg transition"
                                          [class.bg-primary]="ex.videoInputMode === 'upload'"
                                          [class.text-white]="ex.videoInputMode === 'upload'"
                                          [class.bg-card-hover]="ex.videoInputMode !== 'upload'"
                                          [class.text-text-muted]="ex.videoInputMode !== 'upload'">Subir</button>
                                      </div>
                                      @if (ex.videoInputMode === 'youtube') {
                                        <input type="url" [ngModel]="ex.videoUrl" (ngModelChange)="onVideoUrlChange(gi, ei, $event)"
                                          [name]="'vid-' + gi + '-' + ei"
                                          class="w-full bg-bg-raised border border-border-light rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                          placeholder="URL de YouTube" />
                                      } @else {
                                        @if (ex.uploading) {
                                          <p class="text-xs text-primary py-1">Subiendo video...</p>
                                        } @else {
                                          <input type="file" accept="video/mp4,video/webm,video/quicktime"
                                            (change)="onVideoUpload(gi, ei, $event)"
                                            class="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary file:text-white file:cursor-pointer" />
                                        }
                                      }
                                      @if (ex.videoUrl) {
                                        <p class="text-xs text-success truncate">{{ ex.videoSource === 'Upload' ? 'Video subido' : 'Video agregado' }}</p>
                                      }
                                    </div>
                                  }

                                  <!-- Notes -->
                                  <div class="mx-3 mb-2">
                                    <input type="text" [ngModel]="ex.notes" (ngModelChange)="updateExerciseNotes(gi, ei, $event)"
                                      [name]="'notes-' + gi + '-' + ei"
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
                                        <select [ngModel]="set.setType" (ngModelChange)="updateSetType(gi, ei, si, $event)"
                                          [name]="'st-' + gi + '-' + ei + '-' + si"
                                          class="w-24 bg-bg-raised border border-border-light rounded-lg px-1.5 py-1.5 text-xs text-text select-styled"
                                          [attr.aria-label]="'Tipo de serie'">
                                          <option value="Warmup">Calentam.</option>
                                          <option value="Effective">Efectiva</option>
                                          <option value="DropSet">Drop set</option>
                                          <option value="RestPause">Rest-pause</option>
                                          <option value="AMRAP">AMRAP</option>
                                        </select>
                                        <input type="text" [ngModel]="set.targetReps" (ngModelChange)="updateSetField(gi, ei, si, 'targetReps', $event)"
                                          [name]="'reps-' + gi + '-' + ei + '-' + si"
                                          class="w-14 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="Reps"
                                          [attr.aria-label]="'Repeticiones'" />
                                        <input type="text" [ngModel]="set.targetWeight" (ngModelChange)="updateSetField(gi, ei, si, 'targetWeight', $event)"
                                          [name]="'wt-' + gi + '-' + ei + '-' + si"
                                          class="w-14 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="kg"
                                          [attr.aria-label]="'Peso'" />
                                        <input type="number" [ngModel]="set.targetRpe" (ngModelChange)="updateSetRpe(gi, ei, si, $event)"
                                          [name]="'rpe-' + gi + '-' + ei + '-' + si"
                                          class="w-14 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="RPE"
                                          min="1" max="10" [attr.aria-label]="'RPE'" />
                                        <input type="number" [ngModel]="set.restSeconds" (ngModelChange)="updateSetRest(gi, ei, si, $event)"
                                          [name]="'srest-' + gi + '-' + ei + '-' + si"
                                          class="w-16 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-xs text-text text-center" placeholder="seg"
                                          [attr.aria-label]="'Descanso'" />
                                        <button type="button" (click)="removeSet(gi, ei, si)"
                                          class="w-6 text-text-muted hover:text-danger text-xs transition" aria-label="Eliminar serie">&#10005;</button>
                                      </div>
                                    }

                                    <button type="button" (click)="addSet(gi, ei)"
                                      class="text-primary text-xs hover:underline mt-1">+ Agregar serie</button>
                                  </div>
                                </div>

                              } @else {
                                <!-- Collapsed exercise -->
                                <div class="flex items-center gap-2 px-3 py-2.5 bg-bg-raised rounded-lg cursor-pointer hover:bg-card-hover transition"
                                  (click)="toggleExercise(gi, ei)">
                                  <span class="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                    {{ ei + 1 }}
                                  </span>
                                  <span class="flex-1 text-sm text-text font-medium truncate">{{ ex.name || 'Sin nombre' }}</span>
                                  <span class="text-xs text-text-muted">{{ ex.sets.length }} serie{{ ex.sets.length !== 1 ? 's' : '' }}</span>
                                  <span class="text-text-muted text-xs">&#9660;</span>
                                </div>
                              }
                            }

                            <!-- Add exercise -->
                            <button type="button" (click)="addExercise(gi)"
                              class="text-primary text-xs hover:underline">+ Agregar ejercicio</button>
                          </div>
                        </div>
                      }

                      <!-- Add group -->
                      <button type="button" (click)="addGroup()"
                        class="w-full border border-dashed border-border text-text-secondary hover:text-primary hover:border-primary rounded-xl py-2.5 text-sm transition">
                        + Agregar grupo de ejercicios
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Navigation -->
              <div class="flex gap-3 pt-4">
                <button type="button" (click)="goToStep(2)"
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  &larr; Dias
                </button>
                <button type="button" (click)="goToStep(4)"
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
                      @for (group of day.groups; track $index) {
                        @if (group.groupType !== 'Single') {
                          <div class="text-xs text-text-muted mb-1">{{ group.groupType }} &middot; {{ group.restSeconds }}s descanso</div>
                        }
                        @for (ex of group.exercises; track $index) {
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
                  class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-xl transition hover:bg-card-hover">
                  &larr; Ejercicios
                </button>
                <button type="button" (click)="save()" [disabled]="saving()"
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
  expandedExercise = signal<{ gi: number; ei: number } | null>(null);
  saving = signal(false);
  loading = signal(false);
  isEdit = signal(false);

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

  addGroup() {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups.push(this.newGroup());
      return [...d];
    });
  }

  removeGroup(gi: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups.splice(gi, 1);
      return [...d];
    });
  }

  updateGroupType(gi: number, groupType: GroupType) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].groupType = groupType;
      return [...d];
    });
  }

  updateGroupRest(gi: number, restSeconds: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].restSeconds = restSeconds;
      return [...d];
    });
  }

  // ── Exercise management ──

  addExercise(gi: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises.push(this.newExercise());
      return [...d];
    });
    // Expand the newly added exercise
    const newEi = this.days()[di].groups[gi].exercises.length - 1;
    this.expandedExercise.set({ gi, ei: newEi });
  }

  removeExercise(gi: number, ei: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises.splice(ei, 1);
      return [...d];
    });
    // Clear expanded if it was this one
    const exp = this.expandedExercise();
    if (exp && exp.gi === gi && exp.ei === ei) {
      this.expandedExercise.set(null);
    }
  }

  updateExerciseName(gi: number, ei: number, name: string) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].name = name;
      return [...d];
    });
  }

  updateExerciseNotes(gi: number, ei: number, notes: string) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].notes = notes;
      return [...d];
    });
  }

  toggleExercise(gi: number, ei: number) {
    const exp = this.expandedExercise();
    if (exp && exp.gi === gi && exp.ei === ei) {
      this.expandedExercise.set(null);
    } else {
      this.expandedExercise.set({ gi, ei });
    }
  }

  isExerciseExpanded(gi: number, ei: number): boolean {
    const exp = this.expandedExercise();
    return !!exp && exp.gi === gi && exp.ei === ei;
  }

  // ── Video management ──

  toggleVideo(gi: number, ei: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].showVideo = !d[di].groups[gi].exercises[ei].showVideo;
      return [...d];
    });
  }

  setVideoMode(gi: number, ei: number, mode: 'youtube' | 'upload') {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].videoInputMode = mode;
      return [...d];
    });
  }

  onVideoUrlChange(gi: number, ei: number, url: string) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      const ex = d[di].groups[gi].exercises[ei];
      ex.videoUrl = url;
      ex.videoSource = url ? 'YouTube' : 'None';
      return [...d];
    });
  }

  onVideoUpload(gi: number, ei: number, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toast.show('El video no puede superar 100MB', 'error');
      return;
    }
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].uploading = true;
      return [...d];
    });
    const formData = new FormData();
    formData.append('file', file);
    this.api.upload<{ url: string; key: string }>('/videos/upload', formData).subscribe({
      next: (res) => {
        this.days.update(d => {
          const ex = d[di].groups[gi].exercises[ei];
          ex.videoUrl = res.url;
          ex.videoSource = 'Upload';
          ex.uploading = false;
          return [...d];
        });
      },
      error: () => {
        this.days.update(d => {
          d[di].groups[gi].exercises[ei].uploading = false;
          return [...d];
        });
        this.toast.show('Error al subir video', 'error');
      },
    });
  }

  // ── Set management ──

  addSet(gi: number, ei: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].sets.push(this.newSet());
      return [...d];
    });
  }

  removeSet(gi: number, ei: number, si: number) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].sets.splice(si, 1);
      return [...d];
    });
  }

  updateSetType(gi: number, ei: number, si: number, setType: SetType) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].sets[si].setType = setType;
      return [...d];
    });
  }

  updateSetField(gi: number, ei: number, si: number, field: 'targetReps' | 'targetWeight', value: string) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].sets[si][field] = value;
      return [...d];
    });
  }

  updateSetRpe(gi: number, ei: number, si: number, value: number | null) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].sets[si].targetRpe = value;
      return [...d];
    });
  }

  updateSetRest(gi: number, ei: number, si: number, value: number | null) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      d[di].groups[gi].exercises[ei].sets[si].restSeconds = value;
      return [...d];
    });
  }

  // ── Catalog autocomplete ──

  searchCatalog(gi: number, ei: number) {
    this.activeGroupIndex = gi;
    this.activeExerciseIndex = ei;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const di = this.selectedDayIndex();
      const q = this.days()[di].groups[gi].exercises[ei].name.trim();
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

  selectCatalogExercise(gi: number, ei: number, catalog: CatalogSuggestion) {
    const di = this.selectedDayIndex();
    this.days.update(d => {
      const ex = d[di].groups[gi].exercises[ei];
      ex.name = catalog.name;
      if (catalog.videoUrl) {
        ex.videoUrl = catalog.videoUrl;
        ex.videoSource = catalog.videoSource ?? 'None';
        ex.showVideo = catalog.videoSource !== 'None';
      }
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
    return day.groups.reduce((sum, g) => sum + g.exercises.length, 0);
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
            groups: d.groups.map((g) => ({
              groupType: g.groupType,
              restSeconds: g.restSeconds,
              exercises: g.exercises.map((e) => ({
                name: e.name,
                notes: e.notes ?? '',
                videoSource: e.videoSource,
                videoUrl: e.videoUrl ?? '',
                tempo: e.tempo ?? '',
                sets: e.sets.map((s) => ({
                  setType: s.setType,
                  targetReps: s.targetReps ?? '',
                  targetWeight: s.targetWeight ?? '',
                  targetRpe: s.targetRpe,
                  restSeconds: s.restSeconds,
                })),
                videoInputMode: (e.videoSource === 'Upload' ? 'upload' : 'youtube') as 'youtube' | 'upload',
                uploading: false,
                showVideo: e.videoSource !== 'None',
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
    this.saving.set(true);

    const body = {
      name: this.name,
      description: this.description || null,
      tags: this.tags(),
      category: this.category || null,
      days: this.days().map((d) => ({
        name: d.name,
        groups: d.groups.map((g) => ({
          groupType: g.groupType,
          restSeconds: g.restSeconds,
          exercises: g.exercises.map((e) => ({
            name: e.name,
            notes: e.notes || null,
            videoSource: e.videoSource,
            videoUrl: e.videoUrl || null,
            tempo: e.tempo || null,
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
    return { name: '', groups: [this.newGroup()] };
  }

  private newGroup(): WizardGroup {
    return { groupType: 'Single', restSeconds: 90, exercises: [this.newExercise()] };
  }

  private newExercise(): WizardExercise {
    return {
      name: '',
      notes: '',
      videoSource: 'None',
      videoUrl: '',
      tempo: '',
      sets: [this.newSet()],
      videoInputMode: 'youtube',
      uploading: false,
      showVideo: false,
    };
  }

  private newSet(): WizardSet {
    return { setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null };
  }
}

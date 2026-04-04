import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto, GroupType, SetType, VideoSource } from '../../../../shared/models';
import { ToastService } from '../../../../shared/ui/toast';

interface SetForm { setType: SetType; targetReps: string; targetWeight: string; targetRpe: number | null; restSeconds: number | null; }
interface ExerciseForm { name: string; notes: string; videoSource: VideoSource; videoUrl: string; tempo: string; sets: SetForm[]; videoInputMode: 'youtube' | 'upload'; uploading: boolean; showVideo: boolean; }
interface GroupForm { groupType: GroupType; restSeconds: number; exercises: ExerciseForm[]; }
interface DayForm { name: string; groups: GroupForm[]; }

@Component({
  selector: 'app-routine-form',
  imports: [FormsModule],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold">
          {{ isEdit() ? 'Editar rutina' : 'Nueva rutina' }}
        </h1>
      </div>

      <form (ngSubmit)="save()" class="space-y-4">
        <div>
          <label for="routine-name" class="block text-sm text-text-secondary mb-1">Nombre</label>
          <input id="routine-name" type="text" [(ngModel)]="name" name="name"
            class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
            placeholder="Ej: Semana 1" required />
        </div>

        <div>
          <label for="routine-desc" class="block text-sm text-text-secondary mb-1">Descripción (opcional)</label>
          <textarea id="routine-desc" [(ngModel)]="description" name="description" rows="2"
            class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition resize-none"
            placeholder="Descripción de la rutina"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-text-secondary mb-1">Categoría</label>
            <input type="text" [(ngModel)]="category" name="category" maxlength="100"
              class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
              placeholder="Ej: Principiante" />
          </div>
          <div>
            <label class="block text-sm text-text-secondary mb-1">Tags</label>
            <div class="flex items-center gap-1.5 flex-wrap bg-card border border-border rounded-lg px-3 py-2 min-h-[48px]">
              @for (tag of tags(); track tag) {
                <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                  {{ tag }}
                  <button type="button" (click)="removeTag(tag)" class="hover:text-danger">×</button>
                </span>
              }
              <input type="text" [(ngModel)]="tagInput" name="tagInput" maxlength="50"
                (keydown.enter)="addTag($event)"
                class="bg-transparent text-text text-sm flex-1 min-w-[60px] focus:outline-none"
                placeholder="Agregar tag..." />
            </div>
          </div>
        </div>

        <!-- Days -->
        @for (day of days(); track $index; let di = $index) {
          <div class="bg-card border border-border rounded-xl overflow-hidden">
            <!-- Day header -->
            <div class="flex items-center justify-between px-4 py-3 bg-bg-raised border-b border-border-light">
              <input type="text" [(ngModel)]="day.name" [name]="'day-' + di"
                class="bg-transparent font-semibold text-text focus:outline-none border-b border-transparent focus:border-primary"
                placeholder="Nombre del día" />
              <button type="button" (click)="removeDay(di)"
                class="text-text-muted hover:text-danger text-xs px-2 py-1 rounded transition">Eliminar día</button>
            </div>

            <div class="p-4 space-y-4">
              <!-- Groups within day -->
              @for (group of day.groups; track $index; let gi = $index) {
                <div class="bg-bg-raised rounded-lg p-3 space-y-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <select [(ngModel)]="group.groupType" [name]="'gt-' + di + '-' + gi"
                      [attr.aria-label]="'Tipo de grupo'"
                      class="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-text">
                      <option value="Single">Individual</option>
                      <option value="Superset">Superset</option>
                      <option value="Triset">Triset</option>
                      <option value="Circuit">Circuito</option>
                    </select>
                    <div class="flex items-center gap-1.5">
                      <input type="number" [(ngModel)]="group.restSeconds" [name]="'rest-' + di + '-' + gi"
                        [attr.aria-label]="'Descanso en segundos'"
                        class="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-text w-16 text-center" placeholder="90" />
                      <span class="text-text-muted text-xs">seg</span>
                    </div>
                    <button type="button" (click)="removeGroup(di, gi)"
                      class="text-text-muted hover:text-danger text-xs px-2 py-1 rounded transition ml-auto" aria-label="Eliminar grupo">×</button>
                  </div>

                  <!-- Exercises within group -->
                  @for (ex of group.exercises; track $index; let ei = $index) {
                    <div class="bg-card rounded-lg p-3 space-y-2.5">
                      <!-- Exercise name + autocomplete -->
                      <div class="flex items-center gap-2">
                        <div class="flex-1 relative">
                          <input type="text" [(ngModel)]="ex.name" [name]="'ex-' + di + '-' + gi + '-' + ei"
                            (input)="searchCatalog(ex)"
                            (focus)="searchCatalog(ex)"
                            (blur)="hideSuggestionsDelayed()"
                            autocomplete="off"
                            class="w-full bg-transparent text-sm font-medium text-text focus:outline-none border-b border-border-light focus:border-primary pb-0.5"
                            placeholder="Nombre del ejercicio" />
                          @if (catalogSuggestions().length > 0 && activeExercise === ex) {
                            <div class="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                              @for (s of catalogSuggestions(); track s.id) {
                                <button type="button" (mousedown)="selectCatalogExercise(ex, s)"
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
                        <button type="button" (click)="ex.showVideo = !ex.showVideo"
                          class="text-xs px-2 py-1 rounded transition"
                          [class.text-primary]="ex.showVideo || ex.videoUrl"
                          [class.text-text-muted]="!ex.showVideo && !ex.videoUrl">Video</button>
                        <button type="button" (click)="removeExercise(di, gi, ei)"
                          class="text-text-muted hover:text-danger text-xs px-1.5 py-1 rounded transition" aria-label="Eliminar ejercicio">×</button>
                      </div>

                      <!-- Video section (progressive disclosure) -->
                      @if (ex.showVideo) {
                        <div class="bg-bg-raised rounded-lg p-2.5 space-y-2">
                          <div class="flex gap-1">
                            <button type="button" (click)="ex.videoInputMode = 'youtube'"
                              class="px-2.5 py-1 text-xs rounded-lg transition"
                              [class.bg-primary]="ex.videoInputMode === 'youtube'"
                              [class.text-white]="ex.videoInputMode === 'youtube'"
                              [class.bg-card]="ex.videoInputMode !== 'youtube'"
                              [class.text-text-muted]="ex.videoInputMode !== 'youtube'">YouTube</button>
                            <button type="button" (click)="ex.videoInputMode = 'upload'"
                              class="px-2.5 py-1 text-xs rounded-lg transition"
                              [class.bg-primary]="ex.videoInputMode === 'upload'"
                              [class.text-white]="ex.videoInputMode === 'upload'"
                              [class.bg-card]="ex.videoInputMode !== 'upload'"
                              [class.text-text-muted]="ex.videoInputMode !== 'upload'">Subir</button>
                          </div>
                          @if (ex.videoInputMode === 'youtube') {
                            <input type="url" [ngModel]="ex.videoUrl" (ngModelChange)="onVideoUrlChange(ex, $event)"
                              [name]="'vid-' + di + '-' + gi + '-' + ei"
                              class="w-full bg-card border border-border-light rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                              placeholder="URL de YouTube" />
                          } @else {
                            @if (ex.uploading) {
                              <p class="text-xs text-primary py-1">Subiendo video...</p>
                            } @else {
                              <input type="file" accept="video/mp4,video/webm,video/quicktime"
                                (change)="onVideoUpload(ex, $event)"
                                class="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary file:text-white file:cursor-pointer" />
                            }
                          }
                          @if (ex.videoUrl) {
                            <p class="text-xs text-success truncate">{{ ex.videoSource === 'Upload' ? 'Video subido' : 'Video agregado' }}</p>
                          }
                        </div>
                      }

                      <!-- Sets -->
                      <div class="space-y-2">
                        @for (set of ex.sets; track $index; let si = $index) {
                          <div class="flex flex-wrap items-center gap-2 text-sm">
                            <select [(ngModel)]="set.setType" [name]="'st-' + di + '-' + gi + '-' + ei + '-' + si"
                              [attr.aria-label]="'Tipo de serie'"
                              class="bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-text min-w-[5.5rem]">
                              <option value="Warmup">Calentam.</option>
                              <option value="Effective">Efectiva</option>
                              <option value="DropSet">Drop set</option>
                              <option value="RestPause">Rest-pause</option>
                              <option value="AMRAP">AMRAP</option>
                            </select>
                            <div class="flex items-center gap-1">
                              <input type="text" [(ngModel)]="set.targetReps" [name]="'reps-' + di + '-' + gi + '-' + ei + '-' + si"
                                class="bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-text w-14 text-center" placeholder="Reps"
                                [attr.aria-label]="'Repeticiones'" />
                              <span class="text-text-muted">×</span>
                              <input type="text" [(ngModel)]="set.targetWeight" [name]="'wt-' + di + '-' + gi + '-' + ei + '-' + si"
                                class="bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-text w-14 text-center" placeholder="kg"
                                [attr.aria-label]="'Peso'" />
                            </div>
                            <input type="number" [(ngModel)]="set.targetRpe" [name]="'rpe-' + di + '-' + gi + '-' + ei + '-' + si"
                              class="bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-text w-14 text-center" placeholder="RPE"
                              min="1" max="10" [attr.aria-label]="'RPE'" />
                            <button type="button" (click)="removeSet(di, gi, ei, si)"
                              class="text-text-muted hover:text-danger px-1.5 py-1 rounded transition" aria-label="Eliminar serie">×</button>
                          </div>
                        }
                        <button type="button" (click)="addSet(di, gi, ei)"
                          class="text-primary text-xs hover:underline mt-1">+ Serie</button>
                      </div>
                    </div>
                  }
                  <button type="button" (click)="addExercise(di, gi)"
                    class="text-primary text-xs hover:underline">+ Ejercicio</button>
                </div>
              }
              <button type="button" (click)="addGroup(di)"
                class="text-primary text-sm hover:underline">+ Grupo de ejercicios</button>
            </div>
          </div>
        }

        <button type="button" (click)="addDay()"
          class="w-full border border-dashed border-border text-text-secondary hover:text-primary hover:border-primary rounded-xl py-3 text-sm transition">
          + Agregar día
        </button>

        @if (error()) {
          <p class="text-danger text-sm" role="alert">{{ error() }}</p>
        }

        <div class="flex gap-3 sticky bottom-4">
          <button type="button" (click)="cancel()"
            class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-lg transition hover:bg-card-hover">
            Cancelar
          </button>
          <button type="submit" [disabled]="saving()"
            class="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition press">
            {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Crear rutina') }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class RoutineForm implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  isEdit = signal(false);
  saving = signal(false);
  error = signal('');

  name = '';
  description = '';
  category = '';
  tags = signal<string[]>([]);
  tagInput = '';
  days = signal<DayForm[]>([]);

  catalogSuggestions = signal<{ id: string; name: string; muscleGroup: string | null; videoUrl: string | null; notes: string | null }[]>([]);
  activeExercise: ExerciseForm | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  private routineId = '';

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

  private loadRoutine() {
    this.api.get<RoutineDetailDto>(`/routines/${this.routineId}`).subscribe({
      next: (r) => {
        this.name = r.name;
        this.description = r.description ?? '';
        this.category = r.category ?? '';
        this.tags.set(r.tags ?? []);
        this.days.set(r.days.map(d => ({
          name: d.name,
          groups: d.groups.map(g => ({
            groupType: g.groupType,
            restSeconds: g.restSeconds,
            exercises: g.exercises.map(e => ({
              name: e.name,
              notes: e.notes ?? '',
              videoSource: e.videoSource,
              videoUrl: e.videoUrl ?? '',
              tempo: e.tempo ?? '',
              videoInputMode: e.videoSource === 'Upload' ? 'upload' : 'youtube',
              uploading: false,
              showVideo: e.videoSource !== 'None',
              sets: e.sets.map(s => ({
                setType: s.setType,
                targetReps: s.targetReps ?? '',
                targetWeight: s.targetWeight ?? '',
                targetRpe: s.targetRpe,
                restSeconds: s.restSeconds,
              })),
            })),
          })),
        })));
      },
    });
  }

  save() {
    this.saving.set(true);
    this.error.set('');

    const body = {
      name: this.name,
      description: this.description || null,
      tags: this.tags(),
      category: this.category || null,
      days: this.days().map(d => ({
        name: d.name,
        groups: d.groups.map(g => ({
          groupType: g.groupType,
          restSeconds: g.restSeconds,
          exercises: g.exercises.map(e => ({
            name: e.name,
            notes: e.notes || null,
            videoSource: e.videoSource,
            videoUrl: e.videoUrl || null,
            tempo: e.tempo || null,
            sets: e.sets.map(s => ({
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
        this.error.set(err.error?.error || 'No pudimos guardar la rutina. Intentá de nuevo.');
        this.saving.set(false);
      },
    });
  }

  searchCatalog(ex: ExerciseForm) {
    this.activeExercise = ex;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const q = ex.name.trim();
      if (q.length < 2) { this.catalogSuggestions.set([]); return; }
      this.api.get<any[]>(`/catalog?q=${encodeURIComponent(q)}`).subscribe({
        next: (data) => this.catalogSuggestions.set(data),
        error: () => this.catalogSuggestions.set([]),
      });
    }, 300);
  }

  selectCatalogExercise(ex: ExerciseForm, catalog: any) {
    ex.name = catalog.name;
    if (catalog.videoUrl) {
      ex.videoUrl = catalog.videoUrl;
      ex.videoSource = catalog.videoSource ?? 'None';
      ex.showVideo = catalog.videoSource !== 'None';
    }
    if (catalog.notes) ex.notes = catalog.notes;
    this.catalogSuggestions.set([]);
    this.activeExercise = null;
  }

  hideSuggestionsDelayed() {
    setTimeout(() => {
      this.catalogSuggestions.set([]);
      this.activeExercise = null;
    }, 200);
  }

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

  cancel() { this.router.navigate(['/trainer/routines']); }

  addDay() { this.days.update(d => [...d, this.newDay()]); }
  removeDay(i: number) { this.days.update(d => d.filter((_, idx) => idx !== i)); }

  addGroup(di: number) {
    this.days.update(d => {
      d[di].groups.push(this.newGroup());
      return [...d];
    });
  }
  removeGroup(di: number, gi: number) {
    this.days.update(d => { d[di].groups.splice(gi, 1); return [...d]; });
  }

  addExercise(di: number, gi: number) {
    this.days.update(d => { d[di].groups[gi].exercises.push(this.newExercise()); return [...d]; });
  }
  removeExercise(di: number, gi: number, ei: number) {
    this.days.update(d => { d[di].groups[gi].exercises.splice(ei, 1); return [...d]; });
  }

  addSet(di: number, gi: number, ei: number) {
    this.days.update(d => { d[di].groups[gi].exercises[ei].sets.push(this.newSet()); return [...d]; });
  }
  removeSet(di: number, gi: number, ei: number, si: number) {
    this.days.update(d => { d[di].groups[gi].exercises[ei].sets.splice(si, 1); return [...d]; });
  }

  onVideoUrlChange(ex: ExerciseForm, url: string) {
    ex.videoUrl = url;
    ex.videoSource = url ? 'YouTube' : 'None';
  }

  onVideoUpload(ex: ExerciseForm, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      this.toast.show('El video no puede superar 100MB', 'error');
      return;
    }
    ex.uploading = true;
    const formData = new FormData();
    formData.append('file', file);
    this.api.upload<{ url: string; key: string }>('/videos/upload', formData).subscribe({
      next: (res) => {
        ex.videoUrl = res.url;
        ex.videoSource = 'Upload';
        ex.uploading = false;
        this.days.update(d => [...d]);
      },
      error: () => {
        ex.uploading = false;
        this.days.update(d => [...d]);
      },
    });
  }

  private newDay(): DayForm {
    return { name: '', groups: [this.newGroup()] };
  }
  private newGroup(): GroupForm {
    return { groupType: 'Single', restSeconds: 90, exercises: [this.newExercise()] };
  }
  private newExercise(): ExerciseForm {
    return { name: '', notes: '', videoSource: 'None', videoUrl: '', tempo: '', sets: [this.newSet()], videoInputMode: 'youtube', uploading: false, showVideo: false };
  }
  private newSet(): SetForm {
    return { setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null };
  }
}

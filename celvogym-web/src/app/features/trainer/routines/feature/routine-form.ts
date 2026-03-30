import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto, GroupType, SetType, VideoSource } from '../../../../shared/models';

interface SetForm { setType: SetType; targetReps: string; targetWeight: string; targetRpe: number | null; restSeconds: number | null; }
interface ExerciseForm { name: string; notes: string; videoSource: VideoSource; videoUrl: string; tempo: string; sets: SetForm[]; }
interface GroupForm { groupType: GroupType; restSeconds: number; exercises: ExerciseForm[]; }
interface DayForm { name: string; groups: GroupForm[]; }

@Component({
  selector: 'app-routine-form',
  imports: [FormsModule],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-[var(--font-display)] text-2xl font-bold">
          {{ isEdit() ? 'Editar rutina' : 'Nueva rutina' }}
        </h2>
      </div>

      <form (ngSubmit)="save()" class="space-y-4">
        <div>
          <label class="block text-sm text-text-secondary mb-1">Nombre</label>
          <input type="text" [(ngModel)]="name" name="name"
            class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
            placeholder="Ej: Semana 1" required />
        </div>

        <div>
          <label class="block text-sm text-text-secondary mb-1">Descripción (opcional)</label>
          <textarea [(ngModel)]="description" name="description" rows="2"
            class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition resize-none"
            placeholder="Descripción de la rutina"></textarea>
        </div>

        <!-- Days -->
        @for (day of days(); track $index; let di = $index) {
          <div class="bg-card border border-border rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <input type="text" [(ngModel)]="day.name" [name]="'day-' + di"
                class="bg-transparent font-semibold text-text focus:outline-none border-b border-transparent focus:border-primary"
                placeholder="Nombre del día" />
              <button type="button" (click)="removeDay(di)" class="text-text-muted hover:text-danger text-xs">Eliminar</button>
            </div>

            <!-- Groups within day -->
            @for (group of day.groups; track $index; let gi = $index) {
              <div class="bg-bg-raised rounded-lg p-3 space-y-2">
                <div class="flex items-center gap-2">
                  <select [(ngModel)]="group.groupType" [name]="'gt-' + di + '-' + gi"
                    class="bg-card border border-border rounded px-2 py-1 text-xs text-text">
                    <option value="Single">Individual</option>
                    <option value="Superset">Superset</option>
                    <option value="Triset">Triset</option>
                    <option value="Circuit">Circuito</option>
                  </select>
                  <input type="number" [(ngModel)]="group.restSeconds" [name]="'rest-' + di + '-' + gi"
                    class="bg-card border border-border rounded px-2 py-1 text-xs text-text w-20" placeholder="Desc (s)" />
                  <span class="text-text-muted text-xs">s descanso</span>
                  <button type="button" (click)="removeGroup(di, gi)" class="text-text-muted hover:text-danger text-xs ml-auto">×</button>
                </div>

                <!-- Exercises within group -->
                @for (ex of group.exercises; track $index; let ei = $index) {
                  <div class="bg-card rounded-lg p-2 space-y-2">
                    <div class="flex items-center gap-2">
                      <input type="text" [(ngModel)]="ex.name" [name]="'ex-' + di + '-' + gi + '-' + ei"
                        class="flex-1 bg-transparent text-sm text-text focus:outline-none border-b border-border-light focus:border-primary"
                        placeholder="Nombre del ejercicio" />
                      <button type="button" (click)="removeExercise(di, gi, ei)" class="text-text-muted hover:text-danger text-xs">×</button>
                    </div>

                    <!-- Sets -->
                    <div class="space-y-1">
                      @for (set of ex.sets; track $index; let si = $index) {
                        <div class="flex items-center gap-1.5 text-xs">
                          <select [(ngModel)]="set.setType" [name]="'st-' + di + '-' + gi + '-' + ei + '-' + si"
                            class="bg-bg-raised border border-border-light rounded px-1.5 py-1 text-text w-20">
                            <option value="Warmup">Warmup</option>
                            <option value="Effective">Efectiva</option>
                            <option value="DropSet">Drop set</option>
                            <option value="RestPause">Rest-pause</option>
                            <option value="AMRAP">AMRAP</option>
                          </select>
                          <input type="text" [(ngModel)]="set.targetReps" [name]="'reps-' + di + '-' + gi + '-' + ei + '-' + si"
                            class="bg-bg-raised border border-border-light rounded px-1.5 py-1 text-text w-14 text-center" placeholder="Reps" />
                          <input type="text" [(ngModel)]="set.targetWeight" [name]="'wt-' + di + '-' + gi + '-' + ei + '-' + si"
                            class="bg-bg-raised border border-border-light rounded px-1.5 py-1 text-text w-14 text-center" placeholder="Peso" />
                          <input type="number" [(ngModel)]="set.targetRpe" [name]="'rpe-' + di + '-' + gi + '-' + ei + '-' + si"
                            class="bg-bg-raised border border-border-light rounded px-1.5 py-1 text-text w-12 text-center" placeholder="RPE" min="1" max="10" />
                          <button type="button" (click)="removeSet(di, gi, ei, si)" class="text-text-muted hover:text-danger">×</button>
                        </div>
                      }
                      <button type="button" (click)="addSet(di, gi, ei)"
                        class="text-primary text-xs hover:underline">+ Serie</button>
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
        }

        <button type="button" (click)="addDay()"
          class="w-full border border-dashed border-border text-text-secondary hover:text-primary hover:border-primary rounded-xl py-3 text-sm transition">
          + Agregar día
        </button>

        @if (error()) {
          <p class="text-danger text-sm">{{ error() }}</p>
        }

        <div class="flex gap-3">
          <button type="button" (click)="cancel()"
            class="flex-1 bg-card border border-border text-text-secondary py-3 rounded-lg transition hover:bg-card-hover">
            Cancelar
          </button>
          <button type="submit" [disabled]="saving()"
            class="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition press">
            {{ saving() ? 'Guardando...' : (isEdit() ? 'Guardar cambios' : 'Crear rutina') }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class RoutineForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  isEdit = signal(false);
  saving = signal(false);
  error = signal('');

  name = '';
  description = '';
  days = signal<DayForm[]>([]);

  private routineId = '';

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
      next: () => this.router.navigate(['/trainer/routines']),
      error: (err) => {
        this.error.set(err.error?.error || 'Error al guardar');
        this.saving.set(false);
      },
    });
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

  private newDay(): DayForm {
    return { name: '', groups: [this.newGroup()] };
  }
  private newGroup(): GroupForm {
    return { groupType: 'Single', restSeconds: 90, exercises: [this.newExercise()] };
  }
  private newExercise(): ExerciseForm {
    return { name: '', notes: '', videoSource: 'None', videoUrl: '', tempo: '', sets: [this.newSet()] };
  }
  private newSet(): SetForm {
    return { setType: 'Effective', targetReps: '', targetWeight: '', targetRpe: null, restSeconds: null };
  }
}

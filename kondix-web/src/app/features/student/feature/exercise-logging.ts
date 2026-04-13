import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../../core/services/api.service';
import {
  ExerciseDto,
  ExerciseSetDto,
  SetLogDto,
  StudentRoutineDetailDto,
} from '../../../shared/models';
import { KxSetRow } from '../../../shared/ui/set-row';
import { KxRestTimer } from '../../../shared/ui/rest-timer';
import { KxSpinner } from '../../../shared/ui/spinner';

interface FlatExercise {
  exercise: ExerciseDto;
  groupRestSeconds: number;
  groupType: string;
}

@Component({
  selector: 'app-exercise-logging',
  imports: [KxSetRow, KxRestTimer, KxSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-bg flex flex-col">

      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <kx-spinner />
        </div>
      } @else if (error()) {
        <div class="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <p class="text-danger text-center">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm hover:underline">Reintentar</button>
        </div>
      } @else if (exercise()) {
        <!-- Top bar -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            type="button"
            class="flex items-center gap-1.5 text-text-secondary text-sm hover:text-text transition press"
            (click)="goBack()"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver
          </button>

          <span class="text-sm font-semibold text-text-secondary tabular-nums">
            Ejercicio {{ exerciseIndex() + 1 }}/{{ totalExercises() }}
          </span>

          <div class="w-16"></div>
        </div>

        <!-- Progress bar -->
        <div class="h-[2px] bg-border">
          <div
            class="h-full bg-primary transition-all duration-500"
            [style.width.%]="progressPercent()"
          ></div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-4 pt-5 pb-32 space-y-4 animate-fade-up">

          <!-- Exercise name -->
          <div class="text-center">
            <h1 class="text-xl font-extrabold text-text leading-tight">{{ exercise()!.name }}</h1>
            @if (exercise()!.tempo) {
              <p class="text-text-muted text-xs mt-1 tracking-widest uppercase">Tempo {{ exercise()!.tempo }}</p>
            }
          </div>

          <!-- Video card -->
          @if (exercise()!.videoSource !== 'None' && exercise()!.videoUrl) {
            <div class="rounded-xl overflow-hidden border border-border">
              @if (!showVideo()) {
                <button
                  type="button"
                  class="w-full bg-card flex items-center justify-center gap-3 py-5 hover:bg-card-hover transition press"
                  (click)="showVideo.set(true)"
                >
                  <div class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <svg class="w-5 h-5 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <span class="text-text-secondary text-sm font-medium">Ver demostración</span>
                </button>
              } @else {
                @if (exercise()!.videoSource === 'Upload') {
                  <video
                    [src]="exercise()!.videoUrl!"
                    controls
                    preload="metadata"
                    class="w-full"
                  ></video>
                } @else {
                  <div class="aspect-video">
                    <iframe
                      [src]="getEmbedUrl(exercise()!.videoUrl!)"
                      class="w-full h-full"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                }
              }
            </div>
          }

          <!-- Trainer notes -->
          @if (exercise()!.notes) {
            <div class="bg-primary/[0.06] border-l-[3px] border-primary rounded-r-xl p-2.5">
              <p class="text-sm text-text-secondary leading-relaxed">
                💬 <span class="text-text-muted text-xs font-semibold uppercase tracking-wide">Tu entrenador:</span>
                {{ exercise()!.notes }}
              </p>
            </div>
          }

          <!-- Set table -->
          <div class="bg-card border border-border rounded-xl overflow-hidden">
            <!-- Header -->
            <div class="grid grid-cols-[44px_60px_1fr_1fr_1fr_48px] gap-2 px-1 py-2 border-b border-border">
              <span class="text-[11px] text-text-muted text-center">SET</span>
              <span class="text-[11px] text-text-muted text-center">TIPO</span>
              <span class="text-[11px] text-text-muted text-center">KG</span>
              <span class="text-[11px] text-text-muted text-center">REPS</span>
              <span class="text-[11px] text-text-muted text-center">RPE</span>
              <span class="text-[11px] text-text-muted text-center">✓</span>
            </div>

            <!-- Set rows -->
            <div class="divide-y divide-border/50 px-1">
              @for (row of setRows(); track row.set.id; let i = $index) {
                <kx-set-row
                  [setNumber]="i + 1"
                  [setType]="row.set.setType"
                  [state]="row.state"
                  [kg]="row.kg"
                  [reps]="row.reps"
                  [rpe]="row.rpe"
                  (kgChange)="onKgChange(row.set.id, $event)"
                  (repsChange)="onRepsChange(row.set.id, $event)"
                  (rpeChange)="onRpeChange(row.set.id, $event)"
                  (complete)="onSetComplete(row.set)"
                />
              }
            </div>
          </div>

          <!-- Rest timer -->
          @if (showRestTimer()) {
            <div class="animate-fade-up">
              <kx-rest-timer
                [durationSeconds]="restDuration()"
                [active]="showRestTimer()"
                (finished)="onRestFinished()"
                (skip)="onRestSkip()"
              />
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ExerciseLogging implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  loading = signal(true);
  error = signal('');
  exerciseIndex = signal(0);
  totalExercises = signal(0);
  exercise = signal<ExerciseDto | null>(null);
  sets = signal<ExerciseSetDto[]>([]);
  setLogMap = signal<Map<string, SetLogDto>>(new Map());
  showRestTimer = signal(false);
  restDuration = signal(90);
  showVideo = signal(false);

  routineId = '';
  sessionId = '';
  dayId = '';

  private flatExercises: FlatExercise[] = [];
  private embedUrlCache = new Map<string, SafeResourceUrl>();

  progressPercent = computed(() => {
    const total = this.totalExercises();
    if (total === 0) return 0;
    return Math.round(((this.exerciseIndex() + 1) / total) * 100);
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const query = this.route.snapshot.queryParamMap;

    this.exerciseIndex.set(parseInt(params.get('index') ?? '0', 10));
    this.routineId = query.get('routineId') ?? '';
    this.dayId = query.get('dayId') ?? '';
    this.sessionId = query.get('sessionId') ?? '';

    this.loadData();
  }

  reload(): void {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  private loadData(): void {
    this.api.get<StudentRoutineDetailDto>(`/public/my/routines/${this.routineId}`).subscribe({
      next: (data) => {
        const day = data.days.find(d => d.id === this.dayId);
        if (!day) {
          this.error.set('No se encontró el día de entrenamiento.');
          this.loading.set(false);
          return;
        }

        // Build flat exercise list with group context
        this.flatExercises = [];
        for (const group of day.groups) {
          for (const exercise of group.exercises) {
            this.flatExercises.push({
              exercise,
              groupRestSeconds: group.restSeconds,
              groupType: group.groupType,
            });
          }
        }

        this.totalExercises.set(this.flatExercises.length);

        const index = this.exerciseIndex();
        const flat = this.flatExercises[index];
        if (!flat) {
          this.error.set('Índice de ejercicio inválido.');
          this.loading.set(false);
          return;
        }

        this.exercise.set(flat.exercise);
        this.sets.set(flat.exercise.sets);

        // Determine default rest duration: set-level > group-level > 90s default
        const firstSetRest = flat.exercise.sets.find(s => s.restSeconds != null)?.restSeconds;
        this.restDuration.set(firstSetRest ?? flat.groupRestSeconds > 0 ? (firstSetRest ?? flat.groupRestSeconds) : 90);

        // Build setLogMap from day's setLogs
        const map = new Map<string, SetLogDto>();
        for (const log of day.setLogs) {
          map.set(log.setId, log);
        }
        this.setLogMap.set(map);

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No se pudo cargar el ejercicio. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  setRows = computed(() => {
    const allSets = this.sets();
    const logMap = this.setLogMap();
    let foundActive = false;
    return allSets.map(set => {
      const log = logMap.get(set.id);
      let state: string;
      if (log?.completed) {
        state = 'completed';
      } else if (!foundActive) {
        state = 'active';
        foundActive = true;
      } else {
        state = 'pending';
      }
      return {
        set,
        state,
        kg: log?.actualWeight != null ? parseFloat(log.actualWeight) : null,
        reps: log?.actualReps != null ? parseInt(log.actualReps, 10) : null,
        rpe: log?.actualRpe ?? null,
      };
    });
  });

  onKgChange(setId: string, kg: number): void {
    this.updateSetValue(setId, { weight: String(kg) });
  }

  onRepsChange(setId: string, reps: number): void {
    this.updateSetValue(setId, { reps: String(reps) });
  }

  onRpeChange(setId: string, rpe: number): void {
    this.updateSetValue(setId, { rpe });
  }

  private updateSetValue(setId: string, overrides: { weight?: string; reps?: string; rpe?: number }): void {
    const current = this.setLogMap().get(setId);
    this.api.post<SetLogDto>('/public/my/sets/update', {
      sessionId: this.sessionId,
      setId,
      routineId: this.routineId,
      weight: overrides.weight ?? current?.actualWeight ?? null,
      reps: overrides.reps ?? current?.actualReps ?? null,
      rpe: overrides.rpe ?? current?.actualRpe ?? null,
    }).subscribe({
      next: (log) => this.updateLog(log),
    });
  }

  onSetComplete(set: ExerciseSetDto): void {
    this.api.post<SetLogDto>('/public/my/sets/toggle', {
      sessionId: this.sessionId,
      setId: set.id,
      routineId: this.routineId,
    }).subscribe({
      next: (log) => {
        this.updateLog(log);
        if (log.completed) {
          // Determine rest duration from set-level or group-level
          const flat = this.flatExercises[this.exerciseIndex()];
          const setRest = set.restSeconds;
          const duration = setRest ?? (flat?.groupRestSeconds > 0 ? flat.groupRestSeconds : 90);
          this.restDuration.set(duration);
          this.showRestTimer.set(true);
          this.checkAllSetsCompleted();
        }
      },
    });
  }

  private updateLog(log: SetLogDto): void {
    if (!log?.setId) return;
    this.setLogMap.update(m => {
      const next = new Map(m);
      next.set(log.setId, log);
      return next;
    });
  }

  private checkAllSetsCompleted(): void {
    const allDone = this.sets().every(s => this.setLogMap().get(s.id)?.completed);
    if (!allDone) return;

    const nextIndex = this.exerciseIndex() + 1;
    const total = this.totalExercises();

    // Small delay so the user sees the timer before navigating
    setTimeout(() => {
      if (nextIndex < total) {
        this.router.navigate(
          [`/workout/session/exercise/${nextIndex}`],
          { queryParams: { routineId: this.routineId, dayId: this.dayId, sessionId: this.sessionId } }
        );
      } else {
        this.router.navigate(
          ['/workout/session/complete'],
          { queryParams: { sessionId: this.sessionId } }
        );
      }
    }, 1500);
  }

  onRestFinished(): void {
    this.showRestTimer.set(false);
  }

  onRestSkip(): void {
    this.showRestTimer.set(false);
  }

  goBack(): void {
    this.router.navigate(
      ['/workout/session/overview'],
      { queryParams: { routineId: this.routineId, dayId: this.dayId, sessionId: this.sessionId } }
    );
  }

  getEmbedUrl(url: string): SafeResourceUrl {
    const cached = this.embedUrlCache.get(url);
    if (cached) return cached;
    const videoId = this.extractYouTubeId(url);
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    const safe = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.embedUrlCache.set(url, safe);
    return safe;
  }

  private extractYouTubeId(url: string): string | null {
    let match = url.match(/[?&]v=([^&#]+)/);
    if (match) return match[1];
    match = url.match(/youtu\.be\/([^?&#]+)/);
    if (match) return match[1];
    match = url.match(/youtube\.com\/shorts\/([^?&#]+)/);
    if (match) return match[1];
    return null;
  }
}

import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../../core/services/api.service';
import { StudentRoutineDetailDto, SetLogDto, CommentDto, WorkoutSessionDto, NewPrDto } from '../../../shared/models';
import { CgSpinner } from '../../../shared/ui/spinner';
import { ToastService } from '../../../shared/ui/toast';
import { progressColor, groupTypeLabel, setTypeLabel, setTypeColor } from '../../../shared/utils/labels';

@Component({
  selector: 'app-workout',
  imports: [FormsModule, RouterLink, CgSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <cg-spinner />
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (routine()) {
        <a routerLink="/workout" class="text-text-muted text-sm hover:text-text transition">← Mis rutinas</a>
        <h1 class="font-display text-2xl font-bold mt-1 mb-1 truncate">{{ routine()!.name }}</h1>

        <!-- Total progress -->
        <div class="flex items-center gap-2 mb-4">
          <div class="flex-1 h-2 bg-bg-raised rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 progress-fill"
              [style.width.%]="routine()!.progress.percentage"></div>
          </div>
          <span class="text-sm font-bold tabular-nums"
            [style.color]="progressColor(routine()!.progress.percentage)">
            {{ routine()!.progress.percentage }}%
          </span>
        </div>

        <!-- Session controls -->
        @if (sessionId()) {
          <button (click)="completeSession()"
            class="w-full bg-success/10 border border-success/30 text-success text-sm font-medium rounded-xl px-4 py-3 mb-6 transition hover:bg-success/20 press">
            Terminar entrenamiento
          </button>
        } @else {
          <div class="mb-6 space-y-2">
            <p class="text-text-muted text-xs text-center">Selecciona un día para comenzar</p>
          </div>
        }

        <!-- Days -->
        <div class="space-y-5">
          @for (day of routine()!.days; track day.id; let di = $index) {
            <div class="bg-card border border-border rounded-xl overflow-hidden"
              [class.glow-complete]="day.progress.percentage === 100"
              [class.expanded]="expandedDays().has(di)">
              <!-- Day header (collapsible) -->
              <button (click)="toggleDay(di)"
                [attr.aria-expanded]="expandedDays().has(di)"
                [attr.aria-controls]="'day-content-' + di"
                class="w-full px-4 py-3 flex items-center justify-between bg-bg-raised border-b border-border-light">
                <div class="flex items-center gap-2">
                  <h2 class="font-semibold text-sm">{{ day.name }}</h2>
                  @if (day.progress.percentage === 100) {
                    <span class="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium animate-badge">LISTO</span>
                  }
                </div>
                <span class="text-xs font-bold tabular-nums"
                  [style.color]="progressColor(day.progress.percentage)">
                  {{ day.progress.percentage }}%
                </span>
              </button>

              <div class="collapse-content">
                <div [id]="'day-content-' + di" class="divide-y divide-border-light">
                  @for (group of day.groups; track group.id) {
                    <div class="px-4 py-4">
                      @if (group.groupType !== 'Single') {
                        <span class="text-overline text-primary mb-3 block">
                          {{ groupTypeLabel(group.groupType) }}
                        </span>
                      }

                      @for (exercise of group.exercises; track exercise.id) {
                        <div class="py-3 first:pt-0 last:pb-0">
                          <div class="flex items-center justify-between mb-1.5">
                            <div class="flex items-center gap-2 min-w-0">
                              <span class="font-medium text-sm truncate">{{ exercise.name }}</span>
                              @if (exercise.videoSource !== 'None' && exercise.videoUrl) {
                                <button (click)="toggleVideo(exercise.id)"
                                  class="text-xs text-primary hover:underline">
                                  {{ expandedVideos().has(exercise.id) ? 'Ocultar video' : 'Ver video' }}
                                </button>
                              }
                            </div>
                            @if (exercise.tempo) {
                              <span class="text-text-muted text-xs">{{ exercise.tempo }}</span>
                            }
                          </div>
                          @if (expandedVideos().has(exercise.id) && exercise.videoUrl) {
                            @if (exercise.videoSource === 'Upload') {
                              <video [src]="exercise.videoUrl" controls preload="metadata"
                                class="w-full rounded-lg mt-2"></video>
                            } @else {
                              <div class="mb-2 rounded-lg overflow-hidden aspect-video">
                                <iframe [src]="getEmbedUrl(exercise.videoUrl)"
                                  class="w-full h-full" frameborder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowfullscreen></iframe>
                              </div>
                            }
                          }

                          <!-- Sets -->
                          <div class="space-y-2">
                            @for (set of exercise.sets; track set.id; let si = $index) {
                              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                <!-- Row 1: checkbox + info -->
                                <button (click)="toggleSet(set.id, routine()!.id)"
                                  role="checkbox" [attr.aria-checked]="isSetCompleted(set.id)"
                                  [attr.aria-label]="'Completar serie ' + (si + 1)"
                                  class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition"
                                  [class.bg-primary]="isSetCompleted(set.id)"
                                  [class.border-primary]="isSetCompleted(set.id)"
                                  [class.border-border]="!isSetCompleted(set.id)"
                                  [class.animate-check]="isSetCompleted(set.id)">
                                  @if (isSetCompleted(set.id)) {
                                    <span class="text-white text-sm">✓</span>
                                  }
                                </button>
                                <span class="w-16 font-medium" [style.color]="setTypeColor(set.setType)">{{ setTypeLabel(set.setType) }}</span>
                                <span class="text-text-secondary">
                                  {{ set.targetReps ?? '-' }} × {{ set.targetWeight ?? '-' }}
                                  @if (set.targetRpe) { <span class="text-primary ml-1">RPE {{ set.targetRpe }}</span> }
                                </span>

                                <!-- Actual inputs — right-aligned -->
                                <div class="flex items-center gap-1.5 ml-auto">
                                  <input type="text" inputmode="decimal" [value]="getLogWeight(set.id)"
                                    (change)="updateSetData(set.id, routine()!.id, $event, 'weight')"
                                    class="w-16 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-center text-text"
                                    placeholder="kg" [attr.aria-label]="'Peso real serie ' + (si + 1)" />
                                  <input type="text" inputmode="numeric" [value]="getLogReps(set.id)"
                                    (change)="updateSetData(set.id, routine()!.id, $event, 'reps')"
                                    class="w-14 bg-bg-raised border border-border-light rounded-lg px-2 py-1.5 text-center text-text"
                                    placeholder="Reps" [attr.aria-label]="'Reps real serie ' + (si + 1)" />
                                </div>
                              </div>
                            }
                          </div>

                          @if (group.restSeconds > 0) {
                            <div class="mt-1.5 flex items-center gap-1.5">
                              <button (click)="startTimer(group.restSeconds)"
                                class="text-xs text-primary hover:underline">
                                ⏱ {{ group.restSeconds }}s
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Comments section -->
                <div class="px-4 py-4 border-t border-border bg-bg-raised/50">
                  <h3 class="text-overline text-text-secondary mb-2">Comentarios</h3>
                  @if (loadingComments().has(day.id)) {
                    <div class="flex justify-center py-2">
                      <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  } @else {
                    <div class="space-y-2 mb-3">
                      @for (comment of getComments(day.id); track comment.id) {
                        <div class="bg-bg-raised rounded-lg px-3 py-2"
                          [class.border-l-2]="comment.authorType === 'Trainer'"
                          [class.border-l-primary]="comment.authorType === 'Trainer'">
                          <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-xs font-medium"
                              [class.text-primary]="comment.authorType === 'Trainer'"
                              [class.text-text-secondary]="comment.authorType === 'Student'">
                              {{ comment.authorName }}
                            </span>
                            <span class="text-text-muted text-xs">{{ relativeTime(comment.createdAt) }}</span>
                          </div>
                          <p class="text-sm text-text">{{ comment.text }}</p>
                        </div>
                      } @empty {
                        <p class="text-text-muted text-xs text-center py-1">Aún no hay mensajes</p>
                      }
                    </div>
                    <div class="flex gap-2">
                      <input type="text" [value]="getCommentText(day.id)"
                        (input)="setCommentText(day.id, $event)"
                        (keydown.enter)="sendComment(day.id)"
                        maxlength="500"
                        class="flex-1 bg-bg-raised border border-border-light rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
                        placeholder="Mensaje para tu entrenador..." />
                      <button (click)="sendComment(day.id)"
                        class="bg-primary hover:bg-primary-hover text-white text-sm px-3 py-1.5 rounded-lg transition press">
                        Enviar
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Rest timer overlay -->
        @if (timerActive()) {
          <div class="fixed inset-0 bg-bg/95 flex items-center justify-center z-50"
            role="dialog" aria-label="Temporizador de descanso"
            (click)="stopTimer()" (keydown.escape)="stopTimer()">
            <div class="text-center animate-fade-up">
              <p class="text-overline text-text-muted mb-6 tracking-widest">Descanso</p>
              <!-- Pulsing ring around the number -->
              <div class="relative inline-flex items-center justify-center">
                <div class="absolute w-48 h-48 rounded-full border-2 animate-ring animate-complete"
                  [class.border-primary/30]="timerSeconds() > 0"
                  [class.border-success/30]="timerSeconds() === 0"></div>
                <p class="font-display font-bold tabular-nums leading-none"
                  [class.text-primary]="timerSeconds() > 0"
                  [class.text-success]="timerSeconds() === 0"
                  [style.font-size]="timerSeconds() > 0 ? '7rem' : '4rem'"
                  role="timer" [attr.aria-live]="'off'">
                  @if (timerSeconds() > 0) {
                    {{ timerSeconds() }}
                  } @else {
                    ¡YA!
                  }
                </p>
              </div>
              <p class="text-text-muted text-xs mt-8">Toca para cerrar</p>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class Workout implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private toast = inject(ToastService);

  progressColor = progressColor;
  groupTypeLabel = groupTypeLabel;
  setTypeLabel = setTypeLabel;
  setTypeColor = setTypeColor;

  routine = signal<StudentRoutineDetailDto | null>(null);
  loading = signal(true);
  error = signal('');
  sessionId = signal<string | null>(null);
  expandedDays = signal(new Set<number>([0]));
  setLogMap = signal(new Map<string, SetLogDto>());
  expandedVideos = signal(new Set<string>());
  private embedUrlCache = new Map<string, SafeResourceUrl>();

  // Comments state
  commentsMap = signal(new Map<string, CommentDto[]>());
  loadingComments = signal(new Set<string>());
  commentTexts = new Map<string, string>();

  timerActive = signal(false);
  timerSeconds = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private timerEndTime = 0;
  private routineId = '';

  ngOnDestroy() {
    this.stopTimer();
  }

  ngOnInit() {
    this.routineId = this.route.snapshot.paramMap.get('id')!;
    this.loadData();
  }

  reload() {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  private loadData() {
    this.api.get<StudentRoutineDetailDto>(`/public/my/routines/${this.routineId}`).subscribe({
      next: (data) => {
        this.routine.set(data);
        const map = new Map<string, SetLogDto>();
        data.days.forEach(d => d.setLogs.forEach(sl => map.set(sl.setId, sl)));
        this.setLogMap.set(map);
        this.loading.set(false);
        // Load comments for initially expanded days
        this.expandedDays().forEach(index => {
          const dayId = data.days[index]?.id;
          if (dayId) this.loadComments(dayId);
        });
      },
      error: (err) => {
        this.error.set(err.error?.error || 'No pudimos cargar la rutina. Intentá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  toggleDay(index: number) {
    this.expandedDays.update(s => {
      const next = new Set(s);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
    const dayId = this.routine()?.days[index]?.id;
    if (dayId && !this.commentsMap().has(dayId)) {
      this.loadComments(dayId);
    }
  }

  isSetCompleted(setId: string): boolean {
    return this.setLogMap().get(setId)?.completed ?? false;
  }

  getLogWeight(setId: string): string {
    return this.setLogMap().get(setId)?.actualWeight ?? '';
  }

  getLogReps(setId: string): string {
    return this.setLogMap().get(setId)?.actualReps ?? '';
  }

  startSession(dayId: string) {
    this.api.post<WorkoutSessionDto>('/public/my/sessions/start', {
      routineId: this.routineId,
      dayId,
    }).subscribe({
      next: (session) => this.sessionId.set(session.id),
      error: (err) => this.toast.show(err.error?.error || 'Error al iniciar sesión', 'error'),
    });
  }

  completeSession() {
    const sid = this.sessionId();
    if (!sid) return;
    this.api.post<WorkoutSessionDto>(`/public/my/sessions/${sid}/complete`, {}).subscribe({
      next: () => {
        // Detect PRs
        this.api.get<NewPrDto[]>(`/public/my/records/detect?sessionId=${sid}`).subscribe({
          next: (prs) => {
            if (prs.length > 0) {
              const names = prs.map(pr => pr.exerciseName).join(', ');
              this.toast.show(`🏆 Nuevo PR en ${names}!`);
            } else {
              this.toast.show('Entrenamiento completado');
            }
          },
          error: () => this.toast.show('Entrenamiento completado'),
        });
        this.sessionId.set(null);
      },
      error: (err) => this.toast.show(err.error?.error || 'Error al completar', 'error'),
    });
  }

  toggleSet(setId: string, routineId: string) {
    const sid = this.sessionId();
    if (!sid) {
      // Auto-start session with first day
      const firstDay = this.routine()?.days[0];
      if (firstDay) {
        this.api.post<WorkoutSessionDto>('/public/my/sessions/start', {
          routineId: this.routineId,
          dayId: firstDay.id,
        }).subscribe({
          next: (session) => {
            this.sessionId.set(session.id);
            this.doToggleSet(session.id, setId, routineId);
          },
        });
      }
      return;
    }
    this.doToggleSet(sid, setId, routineId);
  }

  private doToggleSet(sessionId: string, setId: string, routineId: string) {
    this.api.post<SetLogDto>('/public/my/sets/toggle', { sessionId, setId, routineId }).subscribe({
      next: (log) => {
        if (log.setId) {
          this.setLogMap.update(m => { const n = new Map(m); n.set(log.setId!, log); return n; });
        }
      },
    });
  }

  updateSetData(setId: string, routineId: string, event: Event, field: 'weight' | 'reps') {
    const sid = this.sessionId();
    if (!sid) return;
    const value = (event.target as HTMLInputElement).value;
    const current = this.setLogMap().get(setId);
    this.api.post<SetLogDto>('/public/my/sets/update', {
      sessionId: sid,
      setId,
      routineId,
      weight: field === 'weight' ? value : (current?.actualWeight ?? null),
      reps: field === 'reps' ? value : (current?.actualReps ?? null),
      rpe: current?.actualRpe ?? null,
    }).subscribe({
      next: (log) => {
        if (log.setId) {
          this.setLogMap.update(m => { const n = new Map(m); n.set(log.setId!, log); return n; });
        }
      },
    });
  }

  startTimer(seconds: number) {
    this.timerEndTime = Date.now() + seconds * 1000;
    this.timerSeconds.set(seconds);
    this.timerActive.set(true);
    this.timerInterval = setInterval(() => {
      const remaining = Math.ceil((this.timerEndTime - Date.now()) / 1000);
      if (remaining > 0) {
        this.timerSeconds.set(remaining);
      } else {
        this.timerSeconds.set(0);
        this.stopTimer();
        if ('vibrate' in navigator) navigator.vibrate([100, 80, 100, 80, 200]);
      }
    }, 250);
  }

  stopTimer() {
    this.timerActive.set(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Video methods
  toggleVideo(exerciseId: string) {
    this.expandedVideos.update(s => {
      const next = new Set(s);
      next.has(exerciseId) ? next.delete(exerciseId) : next.add(exerciseId);
      return next;
    });
  }

  getEmbedUrl(url: string): SafeResourceUrl {
    const cached = this.embedUrlCache.get(url);
    if (cached) return cached;
    const videoId = this.extractYouTubeId(url);
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : url;
    const safe = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.embedUrlCache.set(url, safe);
    return safe;
  }

  private extractYouTubeId(url: string): string | null {
    // youtube.com/watch?v=ID
    let match = url.match(/[?&]v=([^&#]+)/);
    if (match) return match[1];
    // youtu.be/ID
    match = url.match(/youtu\.be\/([^?&#]+)/);
    if (match) return match[1];
    // youtube.com/shorts/ID
    match = url.match(/youtube\.com\/shorts\/([^?&#]+)/);
    if (match) return match[1];
    return null;
  }

  // Comment methods
  loadComments(dayId: string) {
    this.loadingComments.update(s => { const n = new Set(s); n.add(dayId); return n; });
    this.api.get<CommentDto[]>(`/public/my/comments?routineId=${this.routineId}&dayId=${dayId}`).subscribe({
      next: (comments) => {
        this.commentsMap.update(m => { const n = new Map(m); n.set(dayId, comments); return n; });
        this.loadingComments.update(s => { const n = new Set(s); n.delete(dayId); return n; });
      },
      error: () => {
        this.loadingComments.update(s => { const n = new Set(s); n.delete(dayId); return n; });
      },
    });
  }

  getComments(dayId: string): CommentDto[] {
    return this.commentsMap().get(dayId) ?? [];
  }

  getCommentText(dayId: string): string {
    return this.commentTexts.get(dayId) ?? '';
  }

  setCommentText(dayId: string, event: Event) {
    this.commentTexts.set(dayId, (event.target as HTMLInputElement).value);
  }

  sendComment(dayId: string) {
    const text = this.commentTexts.get(dayId)?.trim();
    if (!text) return;
    this.api.post<CommentDto>('/public/my/comments', {
      routineId: this.routineId,
      dayId,
      text,
    }).subscribe({
      next: (comment) => {
        this.commentsMap.update(m => {
          const n = new Map(m);
          const existing = n.get(dayId) ?? [];
          n.set(dayId, [...existing, comment]);
          return n;
        });
        this.commentTexts.set(dayId, '');
      },
    });
  }

  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}

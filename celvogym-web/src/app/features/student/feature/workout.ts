import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../../core/services/api.service';
import { StudentRoutineDetailDto, SetLogDto, CommentDto } from '../../../shared/models';

@Component({
  selector: 'app-workout',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-danger">{{ error() }}</p>
          <button (click)="reload()" class="text-primary text-sm mt-2 hover:underline">Reintentar</button>
        </div>
      } @else if (routine()) {
        <a routerLink="/workout" class="text-text-muted text-sm hover:text-text transition">← Mis rutinas</a>
        <h2 class="font-[var(--font-display)] text-2xl font-bold mt-1 mb-1">{{ routine()!.name }}</h2>

        <!-- Total progress -->
        <div class="flex items-center gap-2 mb-6">
          <div class="flex-1 h-2 bg-bg-raised rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 progress-fill"
              [style.width.%]="routine()!.progress.percentage"></div>
          </div>
          <span class="text-sm font-bold"
            [class.text-primary]="routine()!.progress.percentage < 100"
            [class.text-success]="routine()!.progress.percentage === 100">
            {{ routine()!.progress.percentage }}%
          </span>
        </div>

        <!-- Days -->
        <div class="space-y-4">
          @for (day of routine()!.days; track day.id; let di = $index) {
            <div class="bg-card border border-border rounded-xl overflow-hidden"
              [class.glow-complete]="day.progress.percentage === 100">
              <!-- Day header (collapsible) -->
              <button (click)="toggleDay(di)"
                class="w-full px-4 py-3 flex items-center justify-between bg-bg-raised border-b border-border-light">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-sm">{{ day.name }}</h3>
                  @if (day.progress.percentage === 100) {
                    <span class="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">LISTO</span>
                  }
                </div>
                <span class="text-xs font-bold"
                  [class.text-primary]="day.progress.percentage < 100"
                  [class.text-success]="day.progress.percentage === 100">
                  {{ day.progress.percentage }}%
                </span>
              </button>

              @if (expandedDays().has(di)) {
                <div class="divide-y divide-border-light">
                  @for (group of day.groups; track group.id) {
                    <div class="px-4 py-3">
                      @if (group.groupType !== 'Single') {
                        <span class="text-xs text-primary font-medium uppercase mb-2 block">
                          {{ group.groupType }}
                        </span>
                      }

                      @for (exercise of group.exercises; track exercise.id) {
                        <div class="py-2">
                          <div class="flex items-center justify-between mb-1.5">
                            <div class="flex items-center gap-2">
                              <span class="font-medium text-sm">{{ exercise.name }}</span>
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
                            <div class="mb-2 rounded-lg overflow-hidden aspect-video">
                              <iframe [src]="getEmbedUrl(exercise.videoUrl)"
                                class="w-full h-full" frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen></iframe>
                            </div>
                          }

                          <!-- Sets -->
                          <div class="space-y-1.5">
                            @for (set of exercise.sets; track set.id; let si = $index) {
                              <div class="flex items-center gap-2 text-xs">
                                <!-- Checkbox -->
                                <button (click)="toggleSet(set.id, routine()!.id)"
                                  class="w-6 h-6 rounded border flex items-center justify-center shrink-0 transition"
                                  [class.bg-primary]="isSetCompleted(set.id)"
                                  [class.border-primary]="isSetCompleted(set.id)"
                                  [class.border-border]="!isSetCompleted(set.id)"
                                  [class.animate-check]="isSetCompleted(set.id)">
                                  @if (isSetCompleted(set.id)) {
                                    <span class="text-white text-xs">✓</span>
                                  }
                                </button>

                                <!-- Set info -->
                                <span class="w-16 text-text-muted">
                                  {{ set.setType === 'Warmup' ? 'Warmup' : (set.setType === 'AMRAP' ? 'AMRAP' : set.setType) }}
                                </span>
                                <span class="text-text-secondary">
                                  {{ set.targetReps ?? '-' }} × {{ set.targetWeight ?? '-' }}
                                </span>
                                @if (set.targetRpe) {
                                  <span class="text-primary">RPE {{ set.targetRpe }}</span>
                                }

                                <!-- Actual inputs -->
                                <input type="text" [value]="getLogWeight(set.id)"
                                  (change)="updateSetData(set.id, routine()!.id, $event, 'weight')"
                                  class="w-14 bg-bg-raised border border-border-light rounded px-1.5 py-0.5 text-center text-text"
                                  placeholder="Peso" />
                                <input type="text" [value]="getLogReps(set.id)"
                                  (change)="updateSetData(set.id, routine()!.id, $event, 'reps')"
                                  class="w-12 bg-bg-raised border border-border-light rounded px-1.5 py-0.5 text-center text-text"
                                  placeholder="Reps" />
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
                <div class="px-4 py-3 border-t border-border-light">
                  <h4 class="text-xs font-semibold text-text-secondary uppercase mb-2">Comentarios</h4>
                  @if (loadingComments().has(day.id)) {
                    <div class="flex justify-center py-2">
                      <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  } @else {
                    <div class="space-y-2 mb-3">
                      @for (comment of getComments(day.id); track comment.id) {
                        <div class="bg-bg-raised rounded-lg px-3 py-2">
                          <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-xs font-medium"
                              [class.text-primary]="comment.authorType === 'Trainer'"
                              [class.text-text]="comment.authorType === 'Student'">
                              {{ comment.authorName }}
                            </span>
                            <span class="text-text-muted text-xs">{{ relativeTime(comment.createdAt) }}</span>
                          </div>
                          <p class="text-sm text-text">{{ comment.text }}</p>
                        </div>
                      } @empty {
                        <p class="text-text-muted text-xs text-center py-1">Sin comentarios</p>
                      }
                    </div>
                    <div class="flex gap-2">
                      <input type="text" [value]="getCommentText(day.id)"
                        (input)="setCommentText(day.id, $event)"
                        (keydown.enter)="sendComment(day.id)"
                        class="flex-1 bg-bg-raised border border-border-light rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
                        placeholder="Escribe un comentario..." />
                      <button (click)="sendComment(day.id)"
                        class="bg-primary hover:bg-primary-dark text-white text-sm px-3 py-1.5 rounded-lg transition press">
                        Enviar
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Rest timer overlay -->
        @if (timerActive()) {
          <div class="fixed inset-0 bg-bg/90 flex items-center justify-center z-50" (click)="stopTimer()">
            <div class="text-center animate-fade-up">
              <p class="text-text-muted text-sm mb-2">Descanso</p>
              <p class="font-[var(--font-display)] text-7xl font-bold"
                [class.text-primary]="timerSeconds() > 0"
                [class.text-success]="timerSeconds() === 0">
                @if (timerSeconds() > 0) {
                  {{ timerSeconds() }}
                } @else {
                  GO!
                }
              </p>
              <p class="text-text-muted text-xs mt-4">Toca para cerrar</p>
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

  routine = signal<StudentRoutineDetailDto | null>(null);
  loading = signal(true);
  error = signal('');
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
        // Load comments for all days
        data.days.forEach(d => this.loadComments(d.id));
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar datos');
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

  toggleSet(setId: string, routineId: string) {
    this.api.post<SetLogDto>('/public/my/sets/toggle', { setId, routineId }).subscribe({
      next: (log) => {
        this.setLogMap.update(m => { const n = new Map(m); n.set(log.setId, log); return n; });
      },
    });
  }

  updateSetData(setId: string, routineId: string, event: Event, field: 'weight' | 'reps') {
    const value = (event.target as HTMLInputElement).value;
    const current = this.setLogMap().get(setId);
    this.api.post<SetLogDto>('/public/my/sets/update', {
      setId,
      routineId,
      weight: field === 'weight' ? value : (current?.actualWeight ?? null),
      reps: field === 'reps' ? value : (current?.actualReps ?? null),
      rpe: current?.actualRpe ?? null,
    }).subscribe({
      next: (log) => {
        this.setLogMap.update(m => { const n = new Map(m); n.set(log.setId, log); return n; });
      },
    });
  }

  startTimer(seconds: number) {
    this.timerSeconds.set(seconds);
    this.timerActive.set(true);
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds() > 0) {
        this.timerSeconds.update(s => s - 1);
      } else {
        this.stopTimer();
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
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

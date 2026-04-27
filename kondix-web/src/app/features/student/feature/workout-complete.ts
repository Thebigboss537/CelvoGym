import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/ui/toast';
import { WorkoutSessionDto, NewPrDto, StudentRoutineDetailDto } from '../../../shared/models';
import { KxStatCard } from '../../../shared/ui/stat-card';
import { KxBadge } from '../../../shared/ui/badge';
import { KxSpinner } from '../../../shared/ui/spinner';
import { KxMoodPicker, MoodValue } from '../../../shared/ui/mood-picker';

@Component({
  selector: 'app-workout-complete',
  imports: [FormsModule, KxStatCard, KxBadge, KxSpinner, KxMoodPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-bg min-h-screen flex flex-col items-center px-5 py-10">

      @if (loading()) {
        <div class="flex-1 flex items-center justify-center w-full">
          <kx-spinner />
        </div>
      } @else {
        <div class="w-full max-w-sm animate-fade-up flex flex-col items-center gap-8">

          <!-- Celebration header -->
          <div class="flex flex-col items-center gap-4 text-center">
            <!-- Glowing check circle -->
            <div
              class="bg-success w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.2)] animate-check"
            >
              <svg
                class="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div class="animate-fade-up">
              <h1 class="text-2xl font-extrabold text-text">¡Entreno Completado!</h1>
              <p class="text-text-secondary mt-1">Buen trabajo 💪</p>
            </div>
          </div>

          <!-- Summary cards -->
          <div class="flex gap-3 w-full">
            <div class="flex-1">
              <kx-stat-card
                label="Duración"
                [value]="durationLabel()"
              />
            </div>
            <div class="flex-1">
              <kx-stat-card
                label="Sets"
                [value]="completedSets() > 0 ? completedSets() + '/' + totalSets() : '—'"
              />
            </div>
            <div class="flex-1">
              <kx-stat-card
                label="Volumen"
                [value]="totalVolume() > 0 ? totalVolume() + ' kg' : '—'"
              />
            </div>
          </div>

          <!-- PRs section -->
          @if (prs().length > 0) {
            <div class="w-full">
              <h2 class="text-lg font-bold text-text mb-3">🏆 Nuevos Records Personales</h2>
              <div class="space-y-3 stagger">
                @for (pr of prs(); track pr.exerciseName) {
                  <div
                    class="bg-card border border-border rounded-2xl px-4 py-4 flex items-center justify-between animate-badge"
                  >
                    <div class="min-w-0">
                      <p class="font-semibold text-text text-sm truncate">{{ pr.exerciseName }}</p>
                      @if (pr.previousWeight) {
                        <p class="text-text-muted text-xs mt-0.5">Anterior: {{ pr.previousWeight }}kg</p>
                      }
                    </div>
                    <div class="flex flex-col items-end gap-1 shrink-0 ml-3">
                      <span class="text-base font-extrabold text-success">{{ pr.weight }}kg</span>
                      <kx-badge text="🏆 Nuevo PR" variant="success" />
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Mood + notes form -->
          <div class="space-y-5 max-w-md mx-auto px-4 mt-6 w-full">
            <div class="space-y-2">
              <p class="text-overline text-text-muted">¿Cómo te sentiste?</p>
              <kx-mood-picker
                [value]="mood()"
                (valueChange)="mood.set($event)"
              />
            </div>
            <div class="space-y-2">
              <p class="text-overline text-text-muted">Nota para tu coach (opcional)</p>
              <textarea
                class="w-full bg-bg-raised border border-border rounded-lg p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                rows="4"
                maxlength="2000"
                placeholder="Lo que quieras compartir…"
                [(ngModel)]="notes"
              ></textarea>
            </div>
            <button
              type="button"
              class="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition press disabled:opacity-50"
              [disabled]="saving()"
              (click)="onFinish()"
            >
              @if (saving()) { Guardando... } @else { Finalizar }
            </button>
          </div>

        </div>
      }

    </div>
  `,
})
export class WorkoutComplete implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  session = signal<WorkoutSessionDto | null>(null);
  prs = signal<NewPrDto[]>([]);
  durationSeconds = signal(0);
  durationLabel = signal('—');
  completedSets = signal(0);
  totalSets = signal(0);
  totalVolume = signal(0);

  mood = signal<MoodValue | null>(null);
  notes = '';
  saving = signal(false);

  private sessionId = '';

  ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('sessionId');
    if (!sessionId) {
      this.loading.set(false);
      return;
    }
    this.sessionId = sessionId;
    this.loading.set(false);
  }

  onFinish(): void {
    this.saving.set(true);
    this.api.post<WorkoutSessionDto>(`/public/my/sessions/${this.sessionId}/complete`, {
      notes: this.notes.trim() || null,
      mood: this.mood(),
    }).subscribe({
      next: (s) => {
        this.handleSession(s, this.sessionId);
        this.router.navigate(['/student/home']);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err.error?.error ?? 'No se pudo finalizar', 'error');
      },
    });
  }

  private handleSession(s: WorkoutSessionDto, sessionId: string): void {
    this.session.set(s);
    const start = new Date(s.startedAt).getTime();
    const end = s.completedAt ? new Date(s.completedAt).getTime() : Date.now();
    const totalSec = Math.round((end - start) / 1000);
    this.durationSeconds.set(totalSec);
    this.durationLabel.set(totalSec >= 60 ? Math.round(totalSec / 60) + ' min' : totalSec + ' seg');

    // Load routine data to compute sets + volume
    this.api.get<StudentRoutineDetailDto>(`/public/my/routines/${s.routineId}`).subscribe({
      next: (routine) => {
        const day = routine.days.find(d => d.id === s.dayId);
        if (day) {
          const allSets = day.blocks.flatMap(g => g.exercises.flatMap(e => e.sets));
          this.totalSets.set(allSets.length);

          const logs = day.setLogs ?? [];
          const completedLogs = logs.filter(l => l.completed);
          this.completedSets.set(completedLogs.length);

          let volume = 0;
          for (const log of completedLogs) {
            const w = parseFloat(log.actualWeight ?? '0');
            const r = parseInt(log.actualReps ?? '0', 10);
            if (w > 0 && r > 0) volume += w * r;
          }
          this.totalVolume.set(Math.round(volume));
        }
      },
    });

    this.loadPrsAndStats(sessionId);
  }

  private loadPrsAndStats(sessionId: string): void {
    this.api.get<NewPrDto[]>(`/public/my/records/detect?sessionId=${sessionId}`).subscribe({
      next: (newPrs) => this.prs.set(newPrs),
    });
  }
}

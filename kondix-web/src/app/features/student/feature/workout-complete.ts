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
import { WorkoutSessionDto } from '../../../shared/models';
import { KxMoodPicker, MoodValue } from '../../../shared/ui/mood-picker';

@Component({
  selector: 'app-workout-complete',
  imports: [FormsModule, KxMoodPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-bg min-h-screen flex flex-col items-center px-5 py-10">
      <div class="w-full max-w-sm animate-fade-up flex flex-col items-center gap-8">

        <!-- Celebration header -->
        <div class="flex flex-col items-center gap-4 text-center">
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
    </div>
  `,
})
export class WorkoutComplete implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  mood = signal<MoodValue | null>(null);
  notes = '';
  saving = signal(false);

  private sessionId = '';

  ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('sessionId');
    if (!sessionId) return;
    this.sessionId = sessionId;
  }

  onFinish(): void {
    this.saving.set(true);
    this.api.post<WorkoutSessionDto>(`/public/my/sessions/${this.sessionId}/complete`, {
      notes: this.notes.trim() || null,
      mood: this.mood(),
    }).subscribe({
      next: () => this.router.navigate(['/student/home']),
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err.error?.error ?? 'No se pudo finalizar', 'error');
      },
    });
  }
}

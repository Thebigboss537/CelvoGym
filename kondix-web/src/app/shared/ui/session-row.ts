import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { KxExerciseThumb } from './exercise-thumb';
import { KxSetChip } from './set-chip';
import { TrainerSessionDto } from '../models';

const MOOD_EMOJI: Record<string, string> = {
  Great: '🔥', Good: '✅', Ok: '😐', Tough: '😮‍💨',
};

@Component({
  selector: 'kx-session-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KxExerciseThumb, KxSetChip, NgClass],
  template: `
    <div class="border border-border rounded-xl overflow-hidden mb-2"
      [style.boxShadow]="expanded() ? '0 0 16px rgba(230,38,57,0.15)' : null">
      <button
        type="button"
        class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-card-hover transition press"
        (click)="onToggle()"
        [attr.aria-expanded]="expanded()"
      >
        <div class="flex flex-col items-center justify-center w-12 shrink-0">
          <span class="text-base font-bold tabular-nums text-text">{{ dayLabel() }}</span>
          <span class="text-[10px] uppercase text-text-muted">{{ monthLabel() }}</span>
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-sm font-semibold text-text truncate">{{ session().routineName }}</p>
          <p class="text-xs text-text-muted">{{ session().dayName }}</p>
        </div>
        @if (session().mood) {
          <span class="text-lg" [attr.aria-label]="session().mood">
            {{ moodEmoji() }}
          </span>
        }
        <span class="text-xs font-semibold px-2 py-1 rounded-md"
          [ngClass]="expanded()
            ? ['bg-primary/15', 'text-primary']
            : ['bg-card-hover', 'text-text-muted']">
          {{ expanded() ? 'Cerrar ▴' : 'Detalle ▾' }}
        </span>
      </button>
      <div class="collapse-content" [class.expanded]="expanded()">
        <div class="overflow-hidden">
          <div class="px-3 pb-3 pt-1 space-y-3 border-t border-border">
            @for (ex of session().exercises; track ex.exerciseId) {
              <div class="flex gap-3 items-start">
                <kx-exercise-thumb
                  [name]="ex.name"
                  [muscleGroup]="ex.muscleGroup"
                  [photoUrl]="ex.imageUrl"
                  size="sm" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between gap-2">
                    <p class="text-sm font-semibold text-text truncate">{{ ex.name }}</p>
                    @if (ex.actualRpe != null) {
                      <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-card-hover text-text-muted">
                        RPE {{ ex.actualRpe }}
                      </span>
                    }
                  </div>
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    @for (s of ex.sets; track $index) {
                      <kx-set-chip
                        [weight]="s.weight"
                        [reps]="s.reps"
                        [isPR]="s.isPR"
                        [note]="s.note"
                        [setType]="s.setType" />
                    }
                  </div>
                  @if (ex.notes) {
                    <p class="mt-2 px-3 py-2 text-xs text-text border-l-2 border-primary/40 bg-primary/5 rounded-r-md">
                      {{ ex.notes }}
                    </p>
                  }
                </div>
              </div>
            }
            @if (session().notes) {
              <div class="px-3 py-2 text-sm text-text border-l-2 border-primary/40 bg-primary/5 rounded-r-md">
                <p class="text-overline text-text-muted mb-1">Nota de sesión</p>
                {{ session().notes }}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class KxSessionRow {
  session = input.required<TrainerSessionDto>();
  toggle = output<void>();

  private expandedSig = signal(false);
  expanded = computed(() => this.expandedSig());

  dayLabel = computed(() => {
    const d = new Date(this.session().startedAt);
    return d.getDate().toString().padStart(2, '0');
  });

  monthLabel = computed(() => {
    const d = new Date(this.session().startedAt);
    return d.toLocaleDateString('es', { month: 'short' }).replace('.', '');
  });

  moodEmoji = computed(() => {
    const m = this.session().mood;
    return m ? MOOD_EMOJI[m] : '';
  });

  onToggle(): void {
    this.expandedSig.update(v => !v);
    this.toggle.emit();
  }
}

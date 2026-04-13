import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'cg-rest-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="border border-primary/15 rounded-2xl p-4 text-center"
      style="background: linear-gradient(135deg, #1a0a0d, #16161A)"
    >
      <!-- Label -->
      <p class="text-text-muted text-[11px] tracking-widest uppercase mb-2">DESCANSO</p>

      <!-- Timer display -->
      <p class="text-primary text-4xl font-extrabold tabular-nums mb-4">
        {{ timerDisplay() }}
      </p>

      <!-- Controls -->
      <div class="flex gap-2 justify-center">
        <button
          type="button"
          class="bg-border text-text-secondary rounded-lg px-3.5 py-1.5 text-xs transition hover:bg-card-hover press"
          (click)="adjustTime(-15)"
        >
          -15s
        </button>
        <button
          type="button"
          class="bg-border text-text-secondary rounded-lg px-3.5 py-1.5 text-xs transition hover:bg-card-hover press"
          (click)="adjustTime(15)"
        >
          +15s
        </button>
        <button
          type="button"
          class="bg-primary text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold transition hover:bg-primary-hover press"
          (click)="onSkip()"
        >
          Saltar →
        </button>
      </div>
    </div>
  `,
})
export class CgRestTimer implements OnDestroy {
  durationSeconds = input.required<number>();
  active = input<boolean>(false);

  skip = output<void>();
  finished = output<void>();

  private remaining = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const isActive = this.active();
      const duration = this.durationSeconds();

      if (isActive) {
        this.remaining.set(duration);
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });
  }

  timerDisplay(): string {
    const secs = this.remaining();
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  adjustTime(delta: number): void {
    const next = this.remaining() + delta;
    if (next <= 0) {
      this.remaining.set(0);
      this.onFinish();
    } else {
      this.remaining.set(next);
    }
  }

  onSkip(): void {
    this.stopTimer();
    this.skip.emit();
  }

  private startTimer(): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      const next = this.remaining() - 1;
      if (next <= 0) {
        this.remaining.set(0);
        this.onFinish();
      } else {
        this.remaining.set(next);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private onFinish(): void {
    this.stopTimer();
    navigator.vibrate?.(200);
    this.finished.emit();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}

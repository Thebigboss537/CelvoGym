import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'cg-hero-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="border border-border-active rounded-2xl p-6 space-y-4"
           style="background: linear-gradient(135deg, #1a0a0d 0%, #16161A 100%)">
        <div class="h-3 w-28 bg-border rounded animate-pulse"></div>
        <div class="h-5 w-48 bg-border rounded animate-pulse"></div>
        <div class="h-4 w-64 bg-border rounded animate-pulse"></div>
        <div class="flex gap-3">
          <div class="flex-1 h-16 bg-border rounded-xl animate-pulse"></div>
          <div class="flex-1 h-16 bg-border rounded-xl animate-pulse"></div>
          <div class="flex-1 h-16 bg-border rounded-xl animate-pulse"></div>
        </div>
        <div class="h-12 w-full bg-border rounded-xl animate-pulse"></div>
      </div>
    } @else {
      <div class="border border-border-active rounded-2xl p-6 space-y-4"
           style="background: linear-gradient(135deg, #1a0a0d 0%, #16161A 100%)">
        <!-- Overline label -->
        <p class="text-primary text-[11px] font-bold tracking-widest uppercase">TU ENTRENO DE HOY</p>

        <!-- Routine name -->
        <div class="space-y-0.5">
          <p class="text-text text-xl font-bold leading-tight">{{ routineName() }}</p>
          <p class="text-text-secondary text-sm">{{ dayName() }} · {{ programName() }}</p>
        </div>

        <!-- Mini stat boxes -->
        <div class="flex gap-3">
          <div class="bg-white/5 rounded-xl p-2 text-center flex-1">
            <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">SEMANA</p>
            <p class="text-text text-sm font-bold">{{ week() }}/{{ totalWeeks() }}</p>
          </div>
          <div class="bg-white/5 rounded-xl p-2 text-center flex-1">
            <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">DÍA</p>
            <p class="text-text text-sm font-bold truncate">{{ dayName() }}</p>
          </div>
          <div class="bg-white/5 rounded-xl p-2 text-center flex-1">
            <p class="text-text-muted text-[10px] font-semibold tracking-wide uppercase mb-1">RACHA</p>
            <p class="text-text text-sm font-bold">🔥 {{ streak() }}</p>
          </div>
        </div>

        <!-- CTA button -->
        <button
          (click)="start.emit()"
          class="w-full bg-primary text-white rounded-xl py-3.5 font-bold text-base">
          Empezar Entreno →
        </button>
      </div>
    }
  `,
})
export class CgHeroCard {
  routineName = input.required<string>();
  dayName = input.required<string>();
  programName = input.required<string>();
  week = input.required<number>();
  totalWeeks = input.required<number>();
  streak = input<number>(0);
  loading = input<boolean>(false);

  start = output<void>();
}

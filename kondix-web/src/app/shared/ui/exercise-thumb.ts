import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ThumbSize = 'xs' | 'sm' | 'md' | 'lg' | 'fill';

// Pixel sizes for fixed variants. 'fill' is omitted because it grows to its
// container via `w-full aspect-square` instead of a fixed dimension.
const SIZE_PX: Record<Exclude<ThumbSize, 'fill'>, number> = {
  xs: 32,
  sm: 40,
  md: 56,
  lg: 72,
};

const MUSCLE_TOKEN: Record<string, string> = {
  Pecho: 'var(--color-muscle-pecho)',
  Espalda: 'var(--color-muscle-espalda)',
  Hombro: 'var(--color-muscle-hombro)',
  Bíceps: 'var(--color-muscle-biceps)',
  Tríceps: 'var(--color-muscle-triceps)',
  Cuádriceps: 'var(--color-muscle-cuadriceps)',
  Glúteos: 'var(--color-muscle-gluteos)',
  Femoral: 'var(--color-muscle-femoral)',
  Pantorrilla: 'var(--color-muscle-pantorrilla)',
  Core: 'var(--color-muscle-core)',
  // Aliases used by the catalog seed
  Piernas: 'var(--color-muscle-cuadriceps)',
  Brazos: 'var(--color-muscle-biceps)',
  Cardio: 'var(--color-muscle-core)',
  Funcional: 'var(--color-muscle-hombro)',
  Movilidad: 'var(--color-muscle-femoral)',
};

@Component({
  selector: 'kx-exercise-thumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative rounded-lg overflow-hidden border border-border bg-card-hover flex items-center justify-center shrink-0"
      [class.w-full]="size() === 'fill'"
      [class.aspect-square]="size() === 'fill'"
      [style.width.px]="size() === 'fill' ? null : px()"
      [style.height.px]="size() === 'fill' ? null : px()"
    >
      @if (photoUrl()) {
        <img
          [src]="photoUrl()!"
          [alt]="name()"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      } @else {
        <div
          class="w-full h-full flex items-center justify-center text-text-muted text-[10px] font-bold uppercase tracking-wider"
          [style.background]="fallbackBg()"
        >
          {{ initials() }}
        </div>
      }
      @if (hasVideo()) {
        <span
          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center"
          aria-label="Tiene demo de vídeo"
          title="Tiene demo de vídeo"
        >
          <svg class="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
      }
    </div>
  `,
})
export class KxExerciseThumb {
  name = input.required<string>();
  muscleGroup = input<string | null>(null);
  photoUrl = input<string | null>(null);
  size = input<ThumbSize>('md');
  hasVideo = input<boolean>(false);

  px = computed(() => {
    const s = this.size();
    return s === 'fill' ? null : SIZE_PX[s];
  });

  initials = computed(() => {
    const words = this.name().trim().split(/\s+/).slice(0, 2);
    return words.map(w => w[0] ?? '').join('').toUpperCase();
  });

  fallbackBg = computed(() => {
    const tint = MUSCLE_TOKEN[this.muscleGroup() ?? ''] ?? 'var(--color-card-hover)';
    return `linear-gradient(135deg, color-mix(in srgb, ${tint} 12%, transparent), color-mix(in srgb, ${tint} 4%, transparent))`;
  });
}

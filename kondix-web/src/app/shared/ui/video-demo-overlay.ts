import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { youtubeEmbedUrl } from '../utils/youtube';

@Component({
  selector: 'kx-video-demo-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-up"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Demo de ' + exerciseName()"
        (click)="onBackdropClick($event)"
      >
        <div
          class="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-overline text-text-muted">Demo del coach</p>
                <p class="text-sm font-semibold text-text truncate">{{ exerciseName() }}</p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg bg-card-hover hover:bg-card border border-border flex items-center justify-center text-text-muted hover:text-text transition press"
              (click)="close.emit()"
              aria-label="Cerrar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          @if (embedUrl(); as src) {
            <div class="aspect-video bg-black">
              <iframe
                [src]="src"
                class="w-full h-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          } @else {
            <div class="p-6 text-center text-text-muted text-sm">
              No se pudo cargar el vídeo.
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class KxVideoDemoOverlay {
  private sanitizer = inject(DomSanitizer);

  url = input.required<string>();
  exerciseName = input.required<string>();
  open = input<boolean>(false);
  close = output<void>();

  embedUrl = computed<SafeResourceUrl | null>(() => {
    const normalized = youtubeEmbedUrl(this.url());
    return normalized ? this.sanitizer.bypassSecurityTrustResourceUrl(normalized) : null;
  });

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close.emit();
  }
}

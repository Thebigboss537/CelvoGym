import {
  ChangeDetectionStrategy, Component, DestroyRef,
  ElementRef, ViewChild, computed, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

export interface PickerSelection {
  name: string;
  catalogExerciseId: string | null;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

interface CatalogSuggestion {
  id: string;
  name: string;
  muscleGroup: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
}

@Component({
  selector: 'kx-exercise-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative w-full">
      <input
        #inp
        type="text"
        [(ngModel)]="query"
        (input)="onInput()"
        (focus)="open.set(true)"
        (blur)="onBlur()"
        (keydown)="onKeyDown($event)"
        autocomplete="off"
        placeholder="Busca o escribe el nombre del ejercicio…"
        class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition"
      />
      @if (open() && (matches().length > 0 || canCreate())) {
        <div class="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
          @for (m of matches(); track m.id; let i = $index) {
            <button type="button"
              (mousedown)="pickMatch(i, $event)"
              (mouseenter)="activeIdx.set(i)"
              class="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition border-l-2"
              [class.bg-card-hover]="activeIdx() === i"
              [class.border-primary]="activeIdx() === i"
              [class.border-transparent]="activeIdx() !== i">
              <span class="text-sm text-text font-medium truncate">{{ m.name }}</span>
              @if (m.muscleGroup) {
                <span class="text-overline text-text-muted">{{ m.muscleGroup }}</span>
              }
            </button>
          }
          @if (canCreate()) {
            <button type="button"
              (mousedown)="pickCreate($event)"
              (mouseenter)="activeIdx.set(matches().length)"
              class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition border-l-2"
              [class.bg-card-hover]="activeIdx() === matches().length"
              [class.border-primary]="activeIdx() === matches().length"
              [class.border-transparent]="activeIdx() !== matches().length"
              [class.border-t]="matches().length > 0">
              <span class="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">+</span>
              <span class="text-xs text-text">
                Crear <strong class="text-primary">"{{ query.trim() }}"</strong>
                <span class="text-text-muted ml-2">Nuevo ejercicio</span>
              </span>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class KxExercisePicker {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  value = input<string>('');
  catalogId = input<string | null>(null);
  autoFocus = input<boolean>(false);
  selected = output<PickerSelection>();

  @ViewChild('inp') inputRef?: ElementRef<HTMLInputElement>;

  query = '';
  open = signal(false);
  activeIdx = signal(0);
  matches = signal<CatalogSuggestion[]>([]);

  canCreate = computed(() => {
    const q = this.query.trim().toLowerCase();
    if (q.length < 2) return false;
    return !this.matches().some(m => m.name.toLowerCase() === q);
  });

  totalOptions = computed(() => this.matches().length + (this.canCreate() ? 1 : 0));

  private debounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.query = this.value() ?? '';
    if (this.autoFocus()) {
      queueMicrotask(() => this.inputRef?.nativeElement.focus());
    }
  }

  onInput() {
    this.activeIdx.set(0);
    this.open.set(true);
    if (this.debounce) clearTimeout(this.debounce);
    const q = this.query.trim();
    if (q.length < 2) {
      this.matches.set([]);
      return;
    }
    this.debounce = setTimeout(() => this.fetchCatalog(q), 200);
  }

  onBlur() {
    // Slight delay so mousedown on a suggestion can fire before close.
    setTimeout(() => {
      this.open.set(false);
      // Commit free-text if the trainer typed something but didn't pick / press Enter.
      // This mirrors the wizard's [(ngModel)] behavior — typing propagates without
      // requiring an explicit commit gesture. Idempotent vs Enter/click commits:
      // commitMatch sets this.query = m.name, so on a matched commit the trimmed
      // value equals what the parent already received; commitCreate emits the
      // exact trimmed query, so re-emitting with the same payload is a no-op
      // (parent's onPickerSelected just resets exercise.name to the same value).
      const trimmed = this.query.trim();
      const seeded = (this.value() ?? '').trim();
      if (trimmed && trimmed !== seeded) {
        this.selected.emit({
          name: trimmed,
          catalogExerciseId: null,
          muscleGroup: null,
          videoUrl: null,
          imageUrl: null,
          notes: null,
        });
      }
    }, 180);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.open.set(true);
      this.activeIdx.update(i => Math.min(this.totalOptions() - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIdx.update(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.commitActive();
    } else if (e.key === 'Escape') {
      this.open.set(false);
    }
  }

  pickMatch(i: number, e: MouseEvent) {
    e.preventDefault(); // keep focus
    const m = this.matches()[i];
    if (m) this.commitMatch(m);
  }

  pickCreate(e: MouseEvent) {
    e.preventDefault();
    this.commitCreate();
  }

  private commitActive() {
    const idx = this.activeIdx();
    if (idx < this.matches().length) {
      this.commitMatch(this.matches()[idx]);
    } else if (this.canCreate()) {
      this.commitCreate();
    } else if (this.query.trim()) {
      // No matches and < 2 chars: still emit free-text so the trainer's
      // partial input isn't lost when blurring.
      this.selected.emit({
        name: this.query.trim(),
        catalogExerciseId: null,
        muscleGroup: null,
        videoUrl: null,
        imageUrl: null,
        notes: null,
      });
    }
    this.open.set(false);
  }

  private commitMatch(m: CatalogSuggestion) {
    this.selected.emit({
      name: m.name,
      catalogExerciseId: m.id,
      muscleGroup: m.muscleGroup,
      videoUrl: m.videoUrl,
      imageUrl: m.imageUrl,
      notes: m.notes,
    });
    this.query = m.name;
    this.open.set(false);
  }

  private commitCreate() {
    this.selected.emit({
      name: this.query.trim(),
      catalogExerciseId: null,
      muscleGroup: null,
      videoUrl: null,
      imageUrl: null,
      notes: null,
    });
    this.open.set(false);
  }

  private fetchCatalog(q: string) {
    this.api
      .get<CatalogSuggestion[]>(`/catalog?q=${encodeURIComponent(q)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.matches.set(data.slice(0, 6));
          this.activeIdx.set(0);
        },
        error: () => this.matches.set([]),
      });
  }
}

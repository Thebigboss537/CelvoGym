import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { TrainerSessionDto } from '../../../../shared/models';
import { KxSessionRow } from '../../../../shared/ui/session-row';
import { KxSegmentedControl } from '../../../../shared/ui/segmented-control';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxEmptyState } from '../../../../shared/ui/empty-state';

// KxSegmentedControl takes string[] — not { value, label }[].
// We use label strings and a reverse-map to translate back to filter keys.
type Filter = 'all' | 'done' | 'skipped' | 'with-notes';

const FILTER_LABELS: string[] = ['Todas', 'Hechas', 'Saltadas', 'Con notas'];

const LABEL_TO_FILTER: Record<string, Filter> = {
  Todas: 'all',
  Hechas: 'done',
  Saltadas: 'skipped',
  'Con notas': 'with-notes',
};

const FILTER_TO_LABEL: Record<Filter, string> = {
  all: 'Todas',
  done: 'Hechas',
  skipped: 'Saltadas',
  'with-notes': 'Con notas',
};

@Component({
  selector: 'app-student-detail-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KxSessionRow, KxSegmentedControl, KxSpinner, KxEmptyState],
  template: `
    <div class="space-y-3">
      <kx-segmented-control
        [options]="filterLabels"
        [selected]="selectedLabel()"
        (selectedChange)="onFilterChange($event)" />
      @if (loading()) {
        <div class="flex justify-center py-8"><kx-spinner /></div>
      } @else if (filtered().length === 0) {
        <kx-empty-state title="Sin sesiones" subtitle="Aún no hay sesiones para mostrar." />
      } @else {
        @for (s of filtered(); track s.sessionId) {
          <kx-session-row [session]="s" />
        }
      }
    </div>
  `,
})
export class StudentDetailProgress implements OnInit {
  private api = inject(ApiService);
  studentId = input.required<string>();

  loading = signal(true);
  sessions = signal<TrainerSessionDto[]>([]);
  filter = signal<Filter>('all');

  readonly filterLabels = FILTER_LABELS;

  /** Derived label string for the segmented control's [selected] binding. */
  selectedLabel = computed(() => FILTER_TO_LABEL[this.filter()]);

  filtered = computed(() => {
    const all = this.sessions();
    switch (this.filter()) {
      case 'done':
        return all.filter((s) => s.status === 'completed');
      case 'skipped':
        return all.filter((s) => s.status === 'missed' || s.status === 'partial');
      case 'with-notes':
        return all.filter(
          (s) =>
            s.notes != null ||
            s.exercises.some(
              (e) => e.notes != null || e.sets.some((set) => set.note != null)
            )
        );
      default:
        return all;
    }
  });

  onFilterChange(label: string): void {
    const mapped = LABEL_TO_FILTER[label];
    if (mapped) this.filter.set(mapped);
  }

  ngOnInit(): void {
    this.api
      .get<TrainerSessionDto[]>(`/students/${this.studentId()}/sessions`)
      .subscribe({
        next: (data) => {
          this.sessions.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    // Mark feedback as read so the unread badge clears on the student card.
    this.api
      .post(`/students/${this.studentId()}/feedback/mark-read`, {})
      .subscribe({ next: () => {}, error: () => {} });
  }
}

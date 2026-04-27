import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CalendarMonthDto } from '../../../shared/models';
import { KxSpinner } from '../../../shared/ui/spinner';
import { KxEmptyState } from '../../../shared/ui/empty-state';
import { KxProgressBar } from '../../../shared/ui/progress-bar';
import { KxDayCell, type DayCellState } from '../../../shared/ui/day-cell';

interface DayGridCell {
  day: number;
  state: DayCellState;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [KxSpinner, KxEmptyState, KxProgressBar, KxDayCell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-up pt-4">
      @if (loading()) {
        <kx-spinner />
      } @else if (!calendarData()?.activeProgram) {
        <kx-empty-state title="Sin programa activo"
          subtitle="Tu entrenador te asignará un programa pronto" />
      } @else {
        <!-- Page header -->
        <div class="mb-4">
          <h1 class="text-h2 font-display font-bold text-text">Calendario</h1>
          @if (program(); as prog) {
            <p class="text-sm text-text-muted mt-0.5">{{ prog.name }}</p>
          }
        </div>

        <!-- Program progress -->
        @if (program(); as prog) {
          <div class="bg-card border border-border rounded-xl p-4 mb-5">
            <p class="text-overline text-text-muted mb-2">Progreso del programa</p>
            <kx-progress-bar [percentage]="programPercentage()" size="md"
              [label]="'Semana ' + prog.currentWeek + ' de ' + prog.totalWeeks"
              [showLabel]="true" />
          </div>
        }

        <!-- Month navigation -->
        <div class="flex items-center justify-between mb-4">
          <button
            type="button"
            (click)="prevMonth()"
            class="p-2 rounded-lg hover:bg-card transition"
            aria-label="Mes anterior"
          >
            <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 class="font-display text-lg font-bold capitalize">{{ monthLabel() }}</h2>
          <button
            type="button"
            (click)="nextMonth()"
            class="p-2 rounded-lg hover:bg-card transition"
            aria-label="Mes siguiente"
          >
            <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Weekday headers -->
        <div class="grid grid-cols-7 gap-1 mb-1">
          @for (d of weekdays; track d) {
            <div class="text-center text-[10px] text-text-muted font-semibold tracking-wider py-1">{{ d }}</div>
          }
        </div>

        <!-- Days grid -->
        <div class="grid grid-cols-7 gap-1 mb-5">
          @for (cell of daysGrid(); track $index) {
            <kx-day-cell
              [day]="cell.day"
              [state]="cell.state"
              (select)="selectDay(cell)"
            />
          }
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
            Completado
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-warning"></span>
            Recuperado
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Hoy
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-primary opacity-50"></span>
            Programado
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 rounded-md bg-card border border-border"></span>
            Descanso
          </span>
        </div>
      }
    </div>
  `,
})
export class Calendar {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly weekdays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  year = signal(new Date().getFullYear());
  month = signal(new Date().getMonth() + 1); // 1-based
  loading = signal(true);
  calendarData = signal<CalendarMonthDto | null>(null);

  monthLabel = computed(() => {
    const label = new Date(this.year(), this.month() - 1, 1)
      .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  program = computed(() => this.calendarData()?.activeProgram ?? null);

  programPercentage = computed(() => {
    const prog = this.program();
    if (!prog || prog.totalWeeks === 0) return 0;
    return Math.round((prog.currentWeek / prog.totalWeeks) * 100);
  });

  daysGrid = computed((): DayGridCell[] => {
    const year = this.year();
    const month = this.month();
    const data = this.calendarData();
    const today = new Date();

    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Monday=0 … Sunday=6
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    interface SessionInfo { status: 'completed' | 'in_progress'; isRecovery: boolean; }
    const sessionMap = new Map<string, SessionInfo>();
    (data?.sessions ?? []).forEach(s => sessionMap.set(s.date, { status: s.status, isRecovery: s.isRecovery }));

    const suggestedSet = new Set(data?.suggestedDays ?? []);

    const cells: DayGridCell[] = [];

    // Leading other-month days
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, state: 'other-month', isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const isToday = dateObj.toDateString() === today.toDateString();
      const sessionStatus = sessionMap.get(dateStr);
      const dow = dateObj.getDay(); // 0=Sun … 6=Sat
      const isSuggested = suggestedSet.has(dow);

      let state: DayCellState;
      if (sessionStatus?.status === 'completed' && sessionStatus.isRecovery) {
        state = 'recovered';
      } else if (sessionStatus?.status === 'completed') {
        state = 'completed';
      } else if (isToday) {
        state = 'today';
      } else if (isSuggested && dateObj > today) {
        state = 'scheduled';
      } else {
        state = 'rest';
      }

      cells.push({ day: d, state, isCurrentMonth: true });
    }

    // Trailing other-month days to fill final row
    const remaining = cells.length % 7;
    if (remaining !== 0) {
      const trailing = 7 - remaining;
      for (let i = 1; i <= trailing; i++) {
        cells.push({ day: i, state: 'other-month', isCurrentMonth: false });
      }
    }

    return cells;
  });

  constructor() {
    effect(() => {
      // Reactive: re-run whenever year or month change
      const year = this.year();
      const month = this.month();
      this.loadCalendar(year, month);
    });
  }

  prevMonth(): void {
    if (this.month() === 1) {
      this.month.set(12);
      this.year.update(y => y - 1);
    } else {
      this.month.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.month() === 12) {
      this.month.set(1);
      this.year.update(y => y + 1);
    } else {
      this.month.update(m => m + 1);
    }
  }

  selectDay(cell: DayGridCell): void {
    if (!cell.isCurrentMonth) return;
    const y = this.year();
    const m = this.month();
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    this.router.navigate(['/workout/calendar', dateStr]);
  }

  private loadCalendar(year: number, month: number): void {
    this.loading.set(true);
    this.api.get<CalendarMonthDto>(`/public/my/calendar?year=${year}&month=${month}`).subscribe({
      next: (data) => {
        this.calendarData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.calendarData.set(null);
        this.loading.set(false);
      },
    });
  }
}

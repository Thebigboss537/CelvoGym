import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CalendarMonthDto, CalendarDayDto, StudentRoutineListDto } from '../../../shared/models';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgEmptyState } from '../../../shared/ui/empty-state';
import { formatDate } from '../../../shared/utils/format-date';

interface CalendarCell {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSuggested: boolean;
  session: CalendarDayDto | null;
}

@Component({
  selector: 'app-calendar',
  imports: [CgSpinner, CgEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <cg-spinner />
      } @else if (!hasAssignment()) {
        <cg-empty-state
          title="Tu rutina te espera"
          subtitle="Tu entrenador te asignará una rutina pronto" />
      } @else {
        <!-- Next workout suggestion -->
        @if (nextWorkout()) {
          <button (click)="startNextWorkout()"
            class="w-full bg-card border border-primary/30 rounded-xl p-4 mb-4 flex items-center justify-between press transition hover:bg-card-hover group">
            <div>
              <span class="text-overline text-primary">Hoy te toca</span>
              <p class="font-semibold text-text mt-0.5">{{ nextWorkout() }}</p>
            </div>
            <svg class="w-5 h-5 text-primary transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        }

        <!-- Active session banner -->
        @if (activeSession()) {
          <button (click)="resumeSession()"
            class="w-full bg-primary/10 border border-primary/40 rounded-xl p-4 mb-4 flex items-center justify-between press transition hover:bg-primary/15">
            <div>
              <span class="text-overline text-primary animate-pulse">En progreso</span>
              <p class="font-semibold text-text mt-0.5">Continuar entrenamiento</p>
            </div>
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
        }

        <!-- Calendar header -->
        <div class="flex items-center justify-between mb-4">
          <button (click)="prevMonth()" class="p-2 rounded-lg hover:bg-card transition" aria-label="Mes anterior">
            <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 class="font-display text-lg font-bold capitalize">{{ monthLabel() }}</h2>
          <button (click)="nextMonth()" class="p-2 rounded-lg hover:bg-card transition" aria-label="Mes siguiente">
            <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Weekday headers -->
        <div class="grid grid-cols-7 gap-1 mb-1">
          @for (day of weekdays; track day) {
            <div class="text-center text-xs text-text-muted font-medium py-1">{{ day }}</div>
          }
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-1 mb-4">
          @for (cell of cells(); track cell.date) {
            <button
              (click)="selectDay(cell)"
              [disabled]="!cell.isCurrentMonth"
              class="aspect-square rounded-lg flex items-center justify-center text-sm relative transition"
              [class]="cellClasses(cell)">
              {{ cell.isCurrentMonth ? cell.day : '' }}
              @if (cell.session?.status === 'in_progress') {
                <span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-warning rounded-full"></span>
              }
            </button>
          }
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 text-xs text-text-muted mb-4">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded bg-primary"></span> Completado
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded border-2 border-primary/40 border-dashed"></span> Sugerido
          </span>
        </div>

        <!-- Selected day detail -->
        @if (selectedSession()) {
          <div class="bg-card border border-border rounded-xl p-4 animate-fade-up">
            <div class="flex items-center justify-between mb-2">
              <div>
                <span class="text-overline text-text-muted">{{ formatDate(selectedSession()!.date) }}</span>
                <h3 class="font-semibold text-text">{{ selectedSession()!.dayName }}</h3>
              </div>
              <span class="text-sm font-bold tabular-nums"
                [class]="selectedSession()!.status === 'completed' ? 'text-success' : 'text-warning'">
                {{ selectedSession()!.completedSets }}/{{ selectedSession()!.totalSets }}
              </span>
            </div>
            @if (selectedSession()!.durationMinutes) {
              <p class="text-xs text-text-muted">{{ selectedSession()!.durationMinutes }} min</p>
            }
          </div>
        }

        <!-- Program info -->
        @if (calendarData()?.activeProgram) {
          <div class="mt-4 text-center text-sm text-text-muted">
            <span class="font-medium text-text">{{ calendarData()!.activeProgram!.name }}</span>
            · Semana {{ calendarData()!.activeProgram!.currentWeek }} de {{ calendarData()!.activeProgram!.totalWeeks }}
          </div>
        }
      }
    </div>
  `,
})
export class Calendar implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  formatDate = formatDate;

  weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  loading = signal(true);
  routines = signal<StudentRoutineListDto[]>([]);
  hasAssignment = computed(() => this.routines().length > 0);
  calendarData = signal<CalendarMonthDto | null>(null);
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth() + 1);
  selectedSession = signal<CalendarDayDto | null>(null);
  activeSession = signal<{ routineId: string; dayId: string } | null>(null);

  monthLabel = computed(() => {
    const date = new Date(this.currentYear(), this.currentMonth() - 1, 1);
    return date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  });

  nextWorkout = computed(() => {
    const routines = this.routines();
    if (routines.length === 0 || this.activeSession()) return null;

    const data = this.calendarData();
    if (!data) return null;

    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Monday = 0
    const isSuggested = data.suggestedDays.includes(today);

    if (!isSuggested) return null;

    // Suggest first routine's name as a simple placeholder
    // Full "next day" logic requires session history (will improve in Phase 2 with programs)
    return routines[0]?.name ?? null;
  });

  cells = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const data = this.calendarData();
    const today = new Date();

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const sessionMap = new Map<string, CalendarDayDto>();
    data?.sessions.forEach(s => sessionMap.set(s.date, s));

    const suggestedDowSet = new Set(data?.suggestedDays ?? []);

    const cells: CalendarCell[] = [];

    // Fill leading empty days
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ day: 0, date: '', isCurrentMonth: false, isToday: false, isSuggested: false, session: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const dow = dateObj.getDay();
      const isToday = dateObj.toDateString() === today.toDateString();
      const isSuggested = suggestedDowSet.has(dow);
      const session = sessionMap.get(dateStr) ?? null;

      cells.push({ day: d, date: dateStr, isCurrentMonth: true, isToday, isSuggested, session });
    }

    // Fill trailing days to complete grid
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        cells.push({ day: 0, date: '', isCurrentMonth: false, isToday: false, isSuggested: false, session: null });
      }
    }

    return cells;
  });

  ngOnInit() {
    this.loadAll();
  }

  prevMonth() {
    if (this.currentMonth() === 1) {
      this.currentMonth.set(12);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.selectedSession.set(null);
    this.loadCalendar();
  }

  nextMonth() {
    if (this.currentMonth() === 12) {
      this.currentMonth.set(1);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.selectedSession.set(null);
    this.loadCalendar();
  }

  selectDay(cell: CalendarCell) {
    if (!cell.isCurrentMonth) return;
    if (cell.session) {
      this.selectedSession.set(cell.session);
    } else {
      this.selectedSession.set(null);
    }
  }

  cellClasses(cell: CalendarCell): string {
    if (!cell.isCurrentMonth) return 'text-transparent';

    const classes: string[] = [];

    if (cell.session?.status === 'completed') {
      classes.push('bg-primary text-white font-bold');
    } else if (cell.session?.status === 'in_progress') {
      classes.push('bg-primary/30 text-white');
    } else if (cell.isSuggested) {
      classes.push('border-2 border-dashed border-primary/40 text-text-secondary hover:bg-card');
    } else {
      classes.push('text-text-muted hover:bg-card');
    }

    if (cell.isToday && !cell.session) {
      classes.push('ring-1 ring-primary/50');
    }

    return classes.join(' ');
  }

  startNextWorkout() {
    const routines = this.routines();
    if (routines.length > 0) {
      this.router.navigate(['/workout', routines[0].id]);
    }
  }

  resumeSession() {
    const session = this.activeSession();
    if (session) {
      this.router.navigate(['/workout', session.routineId]);
    }
  }

  private loadAll() {
    this.loading.set(true);

    // Load routines to check if student has assignments
    this.api.get<StudentRoutineListDto[]>('/public/my/routines').subscribe({
      next: (data) => {
        this.routines.set(data);
        if (data.length === 0) {
          this.loading.set(false);
          return;
        }
        this.loadCalendar();
        this.checkActiveSession();
      },
      error: () => {
        this.routines.set([]);
        this.loading.set(false);
      },
    });
  }

  private loadCalendar() {
    this.api.get<CalendarMonthDto>(`/public/my/calendar?year=${this.currentYear()}&month=${this.currentMonth()}`).subscribe({
      next: (data) => {
        this.calendarData.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private checkActiveSession() {
    this.api.get<{ id: string; routineId: string; dayId: string }>('/public/my/sessions/active').subscribe({
      next: (data) => this.activeSession.set(data),
      error: () => {},
    });
  }
}

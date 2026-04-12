import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgStatCard } from '../../../shared/ui/stat-card';
import { CgStudentCard } from '../../../shared/ui/student-card';

interface DashboardData {
  totalStudents: number;
  activeThisWeek: number;
  recentActivity: { studentId: string; studentName: string; dayName: string; status: string; timeAgo: string }[];
  alerts: { type: string; message: string; studentId: string | null }[];
  pinnedNotes: { studentId: string; studentName: string; text: string }[];
}

const GRADIENT_PAIRS: [string, string][] = [
  ['#E62639', '#B31D2C'],
  ['#A78BFA', '#7C3AED'],
  ['#F59E0B', '#D97706'],
  ['#22D3EE', '#0891B2'],
  ['#F472B6', '#DB2777'],
  ['#3B82F6', '#1D4ED8'],
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatSpanishDate(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function alertStyle(type: string): { card: string; icon: string; titleColor: string } {
  switch (type) {
    case 'warning':
      return { card: 'bg-warning/[0.06] border border-warning/15', icon: '⚠️', titleColor: 'text-warning' };
    case 'pr':
    case 'record':
      return { card: 'bg-primary/[0.06] border border-primary/12', icon: '🏆', titleColor: 'text-primary' };
    case 'invite':
    case 'new_student':
      return { card: 'bg-success/[0.06] border border-success/12', icon: '🎉', titleColor: 'text-success' };
    default:
      return { card: 'bg-card border border-border', icon: '📌', titleColor: 'text-text' };
  }
}

function alertTitle(type: string): string {
  switch (type) {
    case 'warning': return 'Atención';
    case 'pr':
    case 'record': return 'Nuevo récord';
    case 'invite':
    case 'new_student': return 'Nuevo alumno';
    default: return 'Aviso';
  }
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CgSpinner, CgStatCard, CgStudentCard],
  template: `
    <div class="animate-fade-up">

      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <p class="text-xs text-text-muted mb-0.5">{{ today }}</p>
          <h1 class="font-display text-2xl font-bold text-text">{{ greeting }}, {{ firstName }}</h1>
        </div>
        <button
          type="button"
          class="mt-1 w-9 h-9 flex items-center justify-center rounded-xl bg-card border border-border text-text-secondary hover:bg-card-hover transition-colors"
          aria-label="Notificaciones"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
      </div>

      @if (loading()) {
        <cg-spinner />
      } @else if (data()) {

        <!-- Stats row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <cg-stat-card
            label="ALUMNOS ACTIVOS"
            [value]="data()!.totalStudents.toString()"
            valueColor="text-text"
          />
          <cg-stat-card
            label="ACTIVOS ESTA SEMANA"
            [value]="data()!.activeThisWeek.toString()"
            valueColor="text-text"
          />
          <cg-stat-card
            label="PROGRAMAS"
            value="—"
            valueColor="text-text-muted"
          />
          <cg-stat-card
            label="ADHERENCIA"
            value="—"
            valueColor="text-text-muted"
          />
        </div>

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

          <!-- Left: Activity feed -->
          <div class="lg:col-span-7">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-overline text-text-secondary">Actividad de alumnos</h2>
              <a routerLink="/trainer/students" class="text-xs text-primary hover:text-primary-hover transition-colors font-medium">
                Ver todos →
              </a>
            </div>

            @if (data()!.recentActivity.length > 0) {
              <div class="space-y-2">
                @for (activity of data()!.recentActivity; track activity.studentId; let i = $index) {
                  <cg-student-card
                    [name]="activity.studentName"
                    [initials]="getInitials(activity.studentName)"
                    [gradientFrom]="getGradient(i)[0]"
                    [gradientTo]="getGradient(i)[1]"
                    [subtitle]="activity.dayName + ' · ' + activity.timeAgo"
                    [status]="mapStatus(activity.status)"
                    [statusText]="mapStatusText(activity.status)"
                  />
                }
              </div>
            } @else {
              <div class="bg-card border border-border rounded-xl p-6 text-center">
                <p class="text-text-muted text-sm">Sin actividad reciente</p>
              </div>
            }
          </div>

          <!-- Right: Alerts + Quick actions -->
          <div class="lg:col-span-5 flex flex-col gap-5">

            <!-- Alerts -->
            <div>
              <h2 class="text-overline text-text-secondary mb-3">Alertas</h2>
              @if (data()!.alerts.length > 0) {
                <div class="space-y-2">
                  @for (alert of data()!.alerts; track $index) {
                    <div class="rounded-xl p-3.5 flex items-start gap-3" [class]="alertCardClass(alert.type)">
                      <span class="text-base leading-none mt-0.5 shrink-0">{{ alertIcon(alert.type) }}</span>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold" [class]="alertTitleColor(alert.type)">{{ alertTitle(alert.type) }}</p>
                        <p class="text-xs text-text-secondary mt-0.5">{{ alert.message }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="bg-card border border-border rounded-xl p-4 text-center">
                  <p class="text-text-muted text-xs">Sin alertas pendientes</p>
                </div>
              }
            </div>

            <!-- Quick Actions -->
            <div>
              <h2 class="text-overline text-text-secondary mb-3">Acciones rápidas</h2>
              <div class="space-y-2">
                <button
                  type="button"
                  (click)="router.navigate(['/trainer/routines/new'])"
                  class="w-full bg-card border border-border rounded-xl p-3 text-left flex items-center gap-3 hover:bg-card-hover transition-colors"
                >
                  <span class="bg-primary/10 p-1.5 rounded-lg text-base leading-none">📋</span>
                  <span class="text-sm text-text font-medium">Crear rutina</span>
                </button>
                <button
                  type="button"
                  (click)="router.navigate(['/trainer/programs/new'])"
                  class="w-full bg-card border border-border rounded-xl p-3 text-left flex items-center gap-3 hover:bg-card-hover transition-colors"
                >
                  <span class="bg-primary/10 p-1.5 rounded-lg text-base leading-none">📦</span>
                  <span class="text-sm text-text font-medium">Crear programa</span>
                </button>
                <button
                  type="button"
                  (click)="router.navigate(['/trainer/students'])"
                  class="w-full bg-card border border-border rounded-xl p-3 text-left flex items-center gap-3 hover:bg-card-hover transition-colors"
                >
                  <span class="bg-primary/10 p-1.5 rounded-lg text-base leading-none">✉️</span>
                  <span class="text-sm text-text font-medium">Invitar alumno</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      }
    </div>
  `,
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  protected router = inject(Router);
  private authStore = inject(AuthStore);

  data = signal<DashboardData | null>(null);
  loading = signal(true);

  today = formatSpanishDate(new Date());
  greeting = getGreeting();

  get firstName(): string {
    return this.authStore.user()?.firstName ?? 'Entrenador';
  }

  ngOnInit() {
    this.api.get<DashboardData>('/dashboard').subscribe({
      next: (data) => { this.data.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getInitials(name: string): string {
    return getInitials(name);
  }

  getGradient(index: number): [string, string] {
    return GRADIENT_PAIRS[index % GRADIENT_PAIRS.length];
  }

  mapStatus(status: string): string {
    if (status === 'completed') return 'completed';
    if (status === 'in_progress') return 'training';
    return 'resting';
  }

  mapStatusText(status: string): string {
    if (status === 'completed') return '✓ Hecho';
    if (status === 'in_progress') return 'Entrenando';
    return 'Descansando';
  }

  alertCardClass(type: string): string {
    return alertStyle(type).card;
  }

  alertIcon(type: string): string {
    return alertStyle(type).icon;
  }

  alertTitleColor(type: string): string {
    return alertStyle(type).titleColor;
  }

  alertTitle(type: string): string {
    return alertTitle(type);
  }
}

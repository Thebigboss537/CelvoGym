import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KxBottomNav, NavTab } from '../ui/bottom-nav';

@Component({
  selector: 'kx-student-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, KxBottomNav],
  template: `
    <main class="min-h-screen bg-bg px-4 sm:px-6 pt-safe-top pb-nav-safe max-w-lg mx-auto">
      <router-outlet />
    </main>
    <kx-bottom-nav [tabs]="tabs" />
  `,
})
export class StudentShell {
  tabs: NavTab[] = [
    { label: 'Hoy', route: 'home', icon: 'house' },
    { label: 'Calendario', route: 'calendar', icon: 'calendar' },
    { label: 'Progreso', route: 'progress', icon: 'trending-up' },
    { label: 'Perfil', route: 'profile', icon: 'user' },
  ];
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CgBottomNav, NavTab } from '../ui/bottom-nav';

@Component({
  selector: 'cg-student-shell',
  imports: [RouterOutlet, CgBottomNav],
  template: `
    <main class="min-h-screen bg-bg pb-20 max-w-lg mx-auto">
      <router-outlet />
    </main>
    <cg-bottom-nav [tabs]="tabs" />
  `,
})
export class StudentShell {
  tabs: NavTab[] = [
    { label: 'Hoy', route: 'home', icon: 'home' },
    { label: 'Calendario', route: 'calendar', icon: 'calendar' },
    { label: 'Progreso', route: 'progress', icon: 'trending-up' },
    { label: 'Perfil', route: 'profile', icon: 'user' },
  ];
}

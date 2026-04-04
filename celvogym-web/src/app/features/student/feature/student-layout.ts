import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { CgLogo } from '../../../shared/ui/logo';

@Component({
  selector: 'app-student-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CgLogo],
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <cg-logo [size]="24" />
          <div class="flex items-center gap-1">
            <nav class="flex gap-0.5">
              <a routerLink="/workout" [routerLinkActiveOptions]="{exact: true}"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-xs text-text-secondary hover:text-text transition font-medium">Calendario</a>
              <a routerLink="/workout/records"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-xs text-text-secondary hover:text-text transition font-medium">Records</a>
              <a routerLink="/workout/body"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-xs text-text-secondary hover:text-text transition font-medium">Cuerpo</a>
            </nav>
            <button (click)="authStore.logout()"
              class="px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger transition ml-1">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main class="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class StudentLayout {
  authStore = inject(AuthStore);
}

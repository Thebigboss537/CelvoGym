import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { CgLogo } from '../../../shared/ui/logo';

@Component({
  selector: 'app-trainer-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CgLogo],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <cg-logo [size]="24" />
          <div class="flex items-center gap-1">
            <nav class="flex gap-0.5">
              <a
                routerLink="dashboard"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-sm text-text-secondary hover:text-text transition font-medium"
              >Inicio</a>
              <a
                routerLink="routines"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-sm text-text-secondary hover:text-text transition font-medium"
              >Rutinas</a>
              <a
                routerLink="programs"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-sm text-text-secondary hover:text-text transition font-medium"
              >Programas</a>
              <a
                routerLink="catalog"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-sm text-text-secondary hover:text-text transition font-medium"
              >Ejercicios</a>
              <a
                routerLink="students"
                routerLinkActive="text-primary border-b-2 border-primary"
                class="px-2 py-1.5 text-sm text-text-secondary hover:text-text transition font-medium"
              >Alumnos</a>
            </nav>
            <button (click)="authStore.logout()"
              class="px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger transition ml-2">
              Salir
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class TrainerLayout {
  authStore = inject(AuthStore);
}

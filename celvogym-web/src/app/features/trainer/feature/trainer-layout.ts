import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-trainer-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 class="font-[var(--font-display)] text-xl font-bold text-primary">CelvoGym</h1>
          <div class="flex items-center gap-1">
            <nav class="flex gap-1">
              <a
                routerLink="routines"
                routerLinkActive="bg-primary-light text-primary"
                class="px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text transition"
              >Rutinas</a>
              <a
                routerLink="students"
                routerLinkActive="bg-primary-light text-primary"
                class="px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text transition"
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
      <main class="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class TrainerLayout {
  authStore = inject(AuthStore);
}

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-student-layout',
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 class="font-[var(--font-display)] text-xl font-bold text-primary">CelvoGym</h1>
          <button (click)="authStore.logout()"
            class="px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger transition">
            Salir
          </button>
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

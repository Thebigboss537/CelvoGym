import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm animate-fade-up">
        <div class="text-center mb-8">
          <h1 class="font-[var(--font-display)] text-3xl font-bold text-primary">CelvoGym</h1>
          <p class="text-text-secondary mt-2">Inicia sesión para continuar</p>
        </div>

        <form (ngSubmit)="login()" class="space-y-4">
          <div>
            <label class="block text-sm text-text-secondary mb-1">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label class="block text-sm text-text-secondary mb-1">Contraseña</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
              placeholder="••••••••"
              required
            />
          </div>

          @if (error()) {
            <p class="text-danger text-sm">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition press"
          >
            @if (loading()) {
              Iniciando sesión...
            } @else {
              Iniciar sesión
            }
          </button>
        </form>

        <p class="text-center text-text-muted text-sm mt-6">
          ¿Eres entrenador?
          <a routerLink="/auth/register" class="text-primary hover:underline">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `,
})
export class Login {
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async login() {
    this.loading.set(true);
    this.error.set('');

    try {
      const res = await fetch(`${environment.guardUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: this.email,
          password: this.password,
          appSlug: 'celvogym',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      const data = await res.json();

      if (data.userType === 'enduser') {
        this.router.navigate(['/workout']);
      } else {
        this.router.navigate(['/trainer']);
      }
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}

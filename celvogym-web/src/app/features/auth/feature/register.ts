import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm animate-fade-up">
        <div class="text-center mb-8">
          <h1 class="font-[var(--font-display)] text-3xl font-bold text-primary">CelvoGym</h1>
          <p class="text-text-secondary mt-2">Registro de entrenador</p>
        </div>

        @if (registered()) {
          <div class="bg-success-dark border border-success/30 rounded-lg p-4 text-center">
            <p class="text-success font-medium">Registro exitoso</p>
            <p class="text-text-secondary text-sm mt-1">
              Tu cuenta está pendiente de aprobación. Te notificaremos cuando esté activa.
            </p>
            <a routerLink="/auth/login" class="text-primary hover:underline text-sm mt-3 inline-block">
              Ir a iniciar sesión
            </a>
          </div>
        } @else {
          <form (ngSubmit)="register()" class="space-y-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1">Nombre</label>
              <input
                type="text"
                [(ngModel)]="displayName"
                name="displayName"
                class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                placeholder="Tu nombre"
                required
              />
            </div>

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
                placeholder="Mínimo 8 caracteres"
                required
                minlength="8"
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
                Registrando...
              } @else {
                Registrarse como entrenador
              }
            </button>
          </form>

          <p class="text-center text-text-muted text-sm mt-6">
            ¿Ya tienes cuenta?
            <a routerLink="/auth/login" class="text-primary hover:underline">Inicia sesión</a>
          </p>
        }
      </div>
    </div>
  `,
})
export class Register {
  private router = inject(Router);
  private api = inject(ApiService);

  displayName = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  registered = signal(false);

  async register() {
    this.loading.set(true);
    this.error.set('');

    try {
      // Register in CelvoGuard
      const res = await fetch(`${environment.guardUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Slug': 'celvogym' },
        credentials: 'include',
        body: JSON.stringify({
          email: this.email,
          password: this.password,
          firstName: this.displayName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrarse');
      }

      // Setup trainer profile in CelvoGym API (via ApiService → CSRF interceptor)
      await firstValueFrom(this.api.post('/onboarding/trainer/setup', {
        displayName: this.displayName,
      }));

      this.registered.set(true);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}

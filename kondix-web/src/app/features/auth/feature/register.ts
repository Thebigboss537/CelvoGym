import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { environment } from '../../../../environments/environment';
import { KxLogo } from '../../../shared/ui/logo';
import { parseGuardError } from '../../../shared/utils/guard-errors';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, KxLogo],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm animate-fade-up">
        <div class="text-center mb-8">
          <kx-logo [size]="36" class="flex justify-center" />
          <p class="text-text-secondary mt-2">Registro de entrenador</p>
        </div>

        @if (registered()) {
          <div data-testid="register-success" class="bg-success-dark border border-success/30 rounded-xl p-5 text-center space-y-3">
            <p class="text-success font-display font-bold text-lg">¡Registro exitoso!</p>
            <p class="text-text-secondary text-sm">
              Tu cuenta está pendiente de aprobación. Recibirás un aviso cuando esté activa.
            </p>
            <div class="text-text-muted text-xs space-y-1 pt-2 border-t border-border-light">
              <p class="font-medium text-text-secondary">Mientras tanto, podés ir pensando en:</p>
              <p>Las rutinas que vas a crear para tus alumnos</p>
              <p>Los ejercicios y series de cada día</p>
            </div>
            <a routerLink="/auth/login" class="text-primary hover:underline text-sm inline-block pt-1">
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
                data-testid="register-displayname"
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
                data-testid="register-email"
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
                data-testid="register-password"
                autocomplete="new-password"
                class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                placeholder="Mínimo 8 caracteres"
                required
                minlength="8"
              />
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-1">Confirmar contraseña</label>
              <input
                type="password"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                data-testid="register-confirm"
                autocomplete="new-password"
                class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                placeholder="Repetí tu contraseña"
                required
              />
              @if (confirmPassword && password !== confirmPassword) {
                <p class="text-danger text-xs mt-1">Las contraseñas no coinciden</p>
              }
            </div>

            @if (error()) {
              <p class="text-danger text-sm">{{ error() }}</p>
            }

            <button
              type="submit"
              data-testid="register-submit"
              [disabled]="loading() || (confirmPassword !== '' && password !== confirmPassword)"
              class="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition press disabled:opacity-50 disabled:cursor-not-allowed"
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
  private authStore = inject(AuthStore);

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');
  registered = signal(false);

  async register() {
    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      // 1. Register in CelvoGuard (also sets auth cookies)
      const res = await fetch(`${environment.guardUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Slug': 'kondix' },
        credentials: 'include',
        body: JSON.stringify({
          email: this.email,
          password: this.password,
          firstName: this.displayName,
        }),
      });

      if (!res.ok) {
        throw new Error(await parseGuardError(res, 'No pudimos completar el registro. Intentá de nuevo.'));
      }

      // 2. Load user into AuthStore (needed for guards and onboarding)
      const meRes = await fetch(`${environment.guardUrl}/api/v1/auth/me`, {
        headers: { 'X-App-Slug': 'kondix' },
        credentials: 'include',
      });
      if (meRes.ok) {
        const user = await meRes.json();
        this.authStore.setUser(user);
      }

      // 3. Redirect to onboarding setup (trainer fills profile: name, bio)
      this.router.navigate(['/onboarding/setup']);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}

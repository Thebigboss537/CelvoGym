import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../core/auth/auth.store';
import { environment } from '../../../../environments/environment';

const TENANT_ID_KEY = 'celvogym_tenant_id';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm animate-fade-up">
        <div class="text-center mb-8">
          <h1 class="font-[var(--font-display)] text-3xl font-bold text-primary">CelvoGym</h1>
          <p class="text-text-secondary mt-2">
            @if (isStudentLogin()) {
              Acceso alumno
            } @else {
              Inicia sesión para continuar
            }
          </p>
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

        @if (!isStudentLogin()) {
          <p class="text-center text-text-muted text-sm mt-6">
            ¿Eres entrenador?
            <a routerLink="/auth/register" class="text-primary hover:underline">Regístrate aquí</a>
          </p>
        }
      </div>
    </div>
  `,
})
export class Login implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  isStudentLogin = signal(false);

  private tenantId = '';

  ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('t');
    if (t) {
      this.tenantId = t;
      this.isStudentLogin.set(true);
      localStorage.setItem(TENANT_ID_KEY, t);
    }
  }

  async login() {
    this.loading.set(true);
    this.error.set('');

    try {
      if (this.isStudentLogin()) {
        await this.loginEndUser();
      } else {
        await this.loginOperator();
      }
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  private async loginOperator() {
    const res = await fetch(`${environment.guardUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Slug': 'celvogym' },
      credentials: 'include',
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    this.authStore.reset();
    this.router.navigate(['/trainer']);
  }

  private async loginEndUser() {
    const res = await fetch(`${environment.guardUrl}/api/v1/enduser/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Slug': 'celvogym' },
      credentials: 'include',
      body: JSON.stringify({
        email: this.email,
        password: this.password,
        tenantId: this.tenantId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    this.authStore.reset();
    this.router.navigate(['/workout']);
  }
}

export const TENANT_ID_STORAGE_KEY = TENANT_ID_KEY;

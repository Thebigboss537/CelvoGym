import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { KxLogo } from '../../../shared/ui/logo';
import { KxSpinner } from '../../../shared/ui/spinner';
import { environment } from '../../../../environments/environment';
import type { TrainerStatusDto } from '../../../shared/models';

@Component({
  selector: 'app-trainer-setup',
  imports: [FormsModule, KxLogo, KxSpinner],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm animate-fade-up">
        <div class="text-center mb-8">
          <kx-logo [size]="36" class="flex justify-center" />
          <h1 class="text-h2 mt-3 text-text">Completa tu perfil</h1>
          <p class="text-text-secondary text-sm mt-1">
            Configura cómo te verán tus alumnos en KONDIX.
          </p>
        </div>

        <form (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm text-text-secondary mb-1">Nombre público</label>
            <input
              type="text"
              [(ngModel)]="displayName"
              name="displayName"
              data-testid="onboarding-displayname"
              class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
              placeholder="Ej: Coach Juan, Juan Pérez Fitness"
              required
            />
            <p class="text-text-muted text-xs mt-1">Este es el nombre o alias que verán tus alumnos.</p>
          </div>

          <div>
            <label class="block text-sm text-text-secondary mb-1">
              Bio <span class="text-text-muted">(opcional)</span>
            </label>
            <textarea
              [(ngModel)]="bio"
              name="bio"
              data-testid="onboarding-bio"
              rows="3"
              class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition resize-none"
              placeholder="Cuéntale a tus alumnos un poco sobre vos..."
            ></textarea>
          </div>

          @if (error()) {
            <p class="text-danger text-sm" data-testid="onboarding-error">{{ error() }}</p>
          }

          <button
            type="submit"
            data-testid="onboarding-submit"
            [disabled]="loading()"
            class="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition press flex items-center justify-center gap-2"
          >
            @if (loading()) {
              <kx-spinner size="sm" />
              Guardando...
            } @else {
              Continuar
            }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class TrainerSetup {
  private router = inject(Router);
  private api = inject(ApiService);
  private authStore = inject(AuthStore);

  displayName = this.authStore.user()?.firstName ?? '';
  bio = '';
  loading = signal(false);
  error = signal('');

  async submit() {
    this.loading.set(true);
    this.error.set('');

    try {
      await firstValueFrom(
        this.api.post('/onboarding/trainer/setup', {
          displayName: this.displayName,
          bio: this.bio || null,
        })
      );
      this.router.navigate(['/onboarding/pending']);
    } catch (e: any) {
      const msg: string = e?.error?.error ?? e?.message ?? '';
      if (msg.includes('already exists')) {
        // Profile was created concurrently (e.g. via register flow) — check current status
        const res = await fetch(`${environment.apiUrl}/onboarding/trainer/status`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data: TrainerStatusDto = await res.json();
          if (data.status === 'active') {
            this.router.navigate(['/trainer']);
          } else {
            this.router.navigate(['/onboarding/pending']);
          }
        }
      } else {
        this.error.set(msg || 'No pudimos guardar tu perfil. Intentá de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}

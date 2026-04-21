import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { KxLogo } from '../../../shared/ui/logo';
import { KxSpinner } from '../../../shared/ui/spinner';
import { environment } from '../../../../environments/environment';
import type { TrainerStatusDto } from '../../../shared/models';

@Component({
  selector: 'app-pending-approval',
  imports: [KxLogo, KxSpinner],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm animate-fade-up">
        <div class="text-center mb-8">
          <kx-logo [size]="36" class="flex justify-center" />
        </div>

        <div class="bg-success-dark border border-success/30 rounded-xl p-5 text-center space-y-3" data-testid="pending-panel">
          <p class="text-success font-display font-bold text-lg">¡Perfil creado!</p>
          <p class="text-text-secondary text-sm">
            Tu cuenta está pendiente de aprobación. Te avisaremos cuando esté activa.
          </p>
          <div class="text-text-muted text-xs space-y-1 pt-2 border-t border-border-light">
            <p class="font-medium text-text-secondary">Mientras tanto, podés ir pensando en:</p>
            <p>Las rutinas que vas a crear para tus alumnos</p>
            <p>Los ejercicios y series de cada día</p>
          </div>
        </div>

        @if (checkError()) {
          <p class="text-danger text-sm text-center mt-3" data-testid="pending-check-error">{{ checkError() }}</p>
        }

        <div class="mt-4 space-y-2">
          <button
            (click)="checkStatus()"
            data-testid="pending-check-status"
            [disabled]="checking()"
            class="w-full bg-card border border-border hover:border-primary text-text font-semibold py-3 rounded-lg transition press flex items-center justify-center gap-2"
          >
            @if (checking()) {
              <kx-spinner size="sm" />
              Verificando...
            } @else {
              Verificar estado
            }
          </button>

          <button
            (click)="logout()"
            data-testid="onboarding-logout"
            class="w-full text-text-muted text-sm hover:text-text py-2 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PendingApproval {
  private router = inject(Router);
  private authStore = inject(AuthStore);

  checking = signal(false);
  checkError = signal('');

  async checkStatus() {
    this.checking.set(true);
    this.checkError.set('');

    try {
      const res = await fetch(`${environment.apiUrl}/onboarding/trainer/status`, {
        credentials: 'include',
      });

      if (!res.ok) {
        this.checkError.set('No se pudo verificar el estado. Intentá de nuevo.');
        return;
      }

      const data: TrainerStatusDto = await res.json();

      if (data.status === 'active') {
        this.router.navigate(['/trainer']);
      } else if (data.status === 'no_profile') {
        this.router.navigate(['/onboarding/setup']);
      }
      // still pending_approval — do nothing, stay on this page
    } catch {
      this.checkError.set('No se pudo verificar el estado. Intentá de nuevo.');
    } finally {
      this.checking.set(false);
    }
  }

  logout() {
    this.authStore.logout();
  }
}

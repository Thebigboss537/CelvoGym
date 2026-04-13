import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { InvitationInfoDto } from '../../../shared/models';
import { environment } from '../../../../environments/environment';
import { KxLogo } from '../../../shared/ui/logo';
import { parseGuardError } from '../../../shared/utils/guard-errors';

@Component({
  selector: 'app-accept-invite',
  imports: [FormsModule, KxLogo],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-sm animate-fade-up">
        @if (loading()) {
          <div class="text-center">
            <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-text-secondary mt-3">Verificando invitación...</p>
          </div>
        } @else if (error()) {
          <div class="text-center">
            <p class="text-danger text-lg font-medium">{{ error() }}</p>
            <a href="/auth/login" class="text-primary hover:underline text-sm mt-3 inline-block">Ir a iniciar sesión</a>
          </div>
        } @else if (invitation()) {
          <div class="text-center mb-8">
            <kx-logo [size]="32" class="flex justify-center" />
            <p class="text-text mt-3 font-medium">
              {{ invitation()!.trainerName }} te invita a entrenar
            </p>
            <p class="text-text-muted text-sm mt-1">
              Vas a poder seguir tus rutinas, registrar tu progreso y comunicarte con tu entrenador.
            </p>
          </div>

          @if (accepted()) {
            <div class="bg-success-dark border border-success/30 rounded-xl p-5 text-center space-y-3">
              <p class="text-success font-display font-bold text-lg">¡Listo, ya estás dentro!</p>
              <p class="text-text-secondary text-sm">
                Tu entrenador te asignará rutinas que podrás seguir desde tu celular.
              </p>
              <button (click)="goToWorkout()"
                class="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-lg transition press text-sm">
                Ver mis rutinas
              </button>
            </div>
          } @else {
            <form (ngSubmit)="accept()" class="space-y-4">
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
                  [value]="invitation()!.email"
                  disabled
                  class="w-full bg-bg-raised border border-border rounded-lg px-4 py-3 text-text-muted"
                />
              </div>

              <div>
                <label class="block text-sm text-text-secondary mb-1">Contraseña</label>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  autocomplete="new-password"
                  class="w-full bg-card border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary transition"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minlength="8"
                />
              </div>

              @if (acceptError()) {
                <p class="text-danger text-sm">{{ acceptError() }}</p>
              }

              <button
                type="submit"
                [disabled]="accepting()"
                class="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition press"
              >
                @if (accepting()) {
                  Aceptando...
                } @else {
                  Aceptar invitación
                }
              </button>
            </form>
          }
        }
      </div>
    </div>
  `,
})
export class AcceptInvite implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  loading = signal(true);
  error = signal('');
  invitation = signal<InvitationInfoDto | null>(null);
  accepted = signal(false);
  accepting = signal(false);
  acceptError = signal('');

  displayName = '';
  password = '';

  private token = '';

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.loadInvitation();
  }

  async loadInvitation() {
    try {
      const info = await firstValueFrom(this.api.get<InvitationInfoDto>(`/public/invite/${this.token}`));
      this.invitation.set(info ?? null);
    } catch {
      this.error.set('Esta invitación ya no es válida. Pedile a tu entrenador que te envíe una nueva.');
    } finally {
      this.loading.set(false);
    }
  }

  async accept() {
    this.accepting.set(true);
    this.acceptError.set('');

    try {
      // Register as end-user in CelvoGuard
      const res = await fetch(`${environment.guardUrl}/api/v1/enduser/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Slug': 'kondix' },
        credentials: 'include',
        body: JSON.stringify({
          email: this.invitation()!.email,
          password: this.password,
          firstName: this.displayName,
          tenantId: this.invitation()!.tenantId,
        }),
      });

      if (!res.ok) {
        throw new Error(await parseGuardError(res, 'No pudimos crear tu cuenta. Intentá de nuevo.'));
      }

      const userData = await res.json();

      // Accept invitation in KONDIX API
      await firstValueFrom(this.api.post(`/public/invite/${this.token}/accept`, {
        celvoGuardUserId: userData.user.id,
        displayName: this.displayName,
      }));

      this.accepted.set(true);
    } catch (e: any) {
      this.acceptError.set(e.message || 'No pudimos aceptar la invitación. Intentá de nuevo.');
    } finally {
      this.accepting.set(false);
    }
  }

  goToWorkout() {
    this.router.navigate(['/workout']);
  }
}

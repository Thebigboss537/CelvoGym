import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { InvitationInfoDto } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-accept-invite',
  imports: [FormsModule],
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
            <h1 class="font-[var(--font-display)] text-2xl font-bold text-primary">CelvoGym</h1>
            <p class="text-text-secondary mt-2">
              <span class="text-text font-medium">{{ invitation()!.trainerName }}</span>
              te invita a entrenar
            </p>
          </div>

          @if (accepted()) {
            <div class="bg-success-dark border border-success/30 rounded-lg p-4 text-center">
              <p class="text-success font-medium">Invitación aceptada</p>
              <p class="text-text-secondary text-sm mt-1">Ya puedes ver tus rutinas.</p>
              <button (click)="goToWorkout()" class="text-primary hover:underline text-sm mt-3">
                Ir a mis rutinas
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
                class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition press"
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
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.loadInvitation();
  }

  async loadInvitation() {
    try {
      const info = await this.api.get<InvitationInfoDto>(`/public/invite/${this.token}`).toPromise();
      this.invitation.set(info ?? null);
    } catch {
      this.error.set('Invitación inválida o expirada');
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: this.invitation()!.email,
          password: this.password,
          displayName: this.displayName,
          appSlug: 'celvogym',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrarse');
      }

      const userData = await res.json();

      // Accept invitation in CelvoGym API
      await this.api.post(`/public/invite/${this.token}/accept`, {
        celvoGuardUserId: userData.userId,
        displayName: this.displayName,
      }).toPromise();

      this.accepted.set(true);
    } catch (e: any) {
      this.acceptError.set(e.message || 'Error al aceptar invitación');
    } finally {
      this.accepting.set(false);
    }
  }

  goToWorkout() {
    this.router.navigate(['/workout']);
  }
}

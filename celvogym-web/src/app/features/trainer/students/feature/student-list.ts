import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { StudentDto, StudentInvitationDto } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-student-list',
  imports: [FormsModule],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-[var(--font-display)] text-2xl font-bold">Alumnos</h2>
        <button (click)="showInvite.set(!showInvite())"
          class="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition press">
          + Invitar
        </button>
      </div>

      <!-- Invite form -->
      @if (showInvite()) {
        <div class="bg-card border border-border rounded-xl p-4 mb-4 animate-fade-up">
          <h3 class="font-semibold text-sm mb-3">Invitar alumno</h3>
          <form (ngSubmit)="invite()" class="space-y-3">
            <input type="email" [(ngModel)]="inviteEmail" name="email"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
              placeholder="Email del alumno" required />
            <input type="text" [(ngModel)]="inviteFirstName" name="firstName"
              class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
              placeholder="Nombre (opcional)" />

            @if (inviteError()) { <p class="text-danger text-xs">{{ inviteError() }}</p> }

            @if (inviteToken()) {
              <div class="bg-success-dark border border-success/30 rounded-lg p-3 text-center">
                <p class="text-success text-sm font-medium">Invitación creada</p>
                <p class="text-text-secondary text-xs mt-1 break-all">
                  Comparte este link: <span class="text-text">{{ inviteLink() }}</span>
                </p>
                <button (click)="toggleQr(inviteLink())" class="text-primary text-xs hover:underline mt-2">
                  {{ showQr() ? 'Ocultar QR' : 'Ver QR' }}
                </button>
                @if (showQr() && qrUrl()) {
                  <img [src]="qrUrl()" alt="QR Code" class="w-48 h-48 mx-auto mt-2 rounded-lg" />
                }
              </div>
            }

            <button type="submit" [disabled]="inviting()"
              class="w-full bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg transition">
              {{ inviting() ? 'Enviando...' : 'Enviar invitación' }}
            </button>
          </form>
        </div>
      }

      <!-- Login link for students -->
      @if (loginLink()) {
        <div class="bg-card border border-border rounded-xl p-4 mb-4">
          <h3 class="font-semibold text-sm mb-2">Link de acceso para alumnos</h3>
          <p class="text-text-muted text-xs mb-2">Comparte este link para que tus alumnos inicien sesión:</p>
          <div class="flex items-center gap-2">
            <input type="text" [value]="loginLink()" readonly
              class="flex-1 bg-bg-raised border border-border rounded-lg px-3 py-2 text-xs text-text-secondary" />
            <button (click)="copyLoginLink()"
              class="bg-primary hover:bg-primary-dark text-white text-xs px-3 py-2 rounded-lg transition shrink-0">
              {{ copied() ? '¡Copiado!' : 'Copiar' }}
            </button>
          </div>
          <button (click)="toggleLoginQr(loginLink())" class="text-primary text-xs hover:underline mt-2">
            {{ showLoginQr() ? 'Ocultar QR' : 'Ver QR' }}
          </button>
          @if (showLoginQr() && loginQrUrl()) {
            <img [src]="loginQrUrl()" alt="QR Code" class="w-48 h-48 mx-auto mt-2 rounded-lg" />
          }
        </div>
      }

      <!-- Student list -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (students().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-muted text-lg">No tienes alumnos aún</p>
          <p class="text-text-muted text-sm mt-1">Invita a tu primer alumno para comenzar</p>
        </div>
      } @else {
        <div class="space-y-2 stagger">
          @for (student of students(); track student.id) {
            <div class="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                  {{ student.displayName.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium text-text text-sm">{{ student.displayName }}</p>
                  <p class="text-text-muted text-xs">Desde {{ formatDate(student.createdAt) }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StudentList implements OnInit {
  private api = inject(ApiService);

  students = signal<StudentDto[]>([]);
  loading = signal(true);
  showInvite = signal(false);
  loginLink = signal('');
  copied = signal(false);

  inviteEmail = '';
  inviteFirstName = '';
  inviting = signal(false);
  inviteError = signal('');
  inviteToken = signal('');

  showQr = signal(false);
  qrUrl = signal('');
  showLoginQr = signal(false);
  loginQrUrl = signal('');

  ngOnInit() {
    this.api.get<StudentDto[]>('/students').subscribe({
      next: (data) => { this.students.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.api.get<{ tenantId: string }>('/trainer/me').subscribe({
      next: (data) => {
        this.loginLink.set(`${window.location.origin}/auth/login?t=${data.tenantId}`);
      },
    });
  }

  copyLoginLink() {
    navigator.clipboard.writeText(this.loginLink());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  invite() {
    this.inviting.set(true);
    this.inviteError.set('');
    this.inviteToken.set('');

    this.api.post<StudentInvitationDto>('/students/invite', {
      email: this.inviteEmail,
      firstName: this.inviteFirstName || null,
    }).subscribe({
      next: (data) => {
        this.inviteToken.set(data.token);
        this.inviting.set(false);
      },
      error: (err) => {
        this.inviteError.set(err.error?.error || 'Error al invitar');
        this.inviting.set(false);
      },
    });
  }

  inviteLink(): string {
    return `${window.location.origin}/invite?token=${encodeURIComponent(this.inviteToken())}`;
  }

  async toggleQr(url: string) {
    if (this.showQr()) {
      this.showQr.set(false);
      return;
    }
    const res = await fetch(`${environment.apiUrl}/students/qr?url=${encodeURIComponent(url)}`, {
      credentials: 'include',
      headers: { 'X-CSRF-Token': document.cookie.match(/(^| )cg-csrf=([^;]+)/)?.[2] ?? '' },
    });
    if (res.ok) {
      const blob = await res.blob();
      this.qrUrl.set(URL.createObjectURL(blob));
      this.showQr.set(true);
    }
  }

  async toggleLoginQr(url: string) {
    if (this.showLoginQr()) {
      this.showLoginQr.set(false);
      return;
    }
    const res = await fetch(`${environment.apiUrl}/students/qr?url=${encodeURIComponent(url)}`, {
      credentials: 'include',
      headers: { 'X-CSRF-Token': document.cookie.match(/(^| )cg-csrf=([^;]+)/)?.[2] ?? '' },
    });
    if (res.ok) {
      const blob = await res.blob();
      this.loginQrUrl.set(URL.createObjectURL(blob));
      this.showLoginQr.set(true);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
}

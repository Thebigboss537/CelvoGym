import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { StudentDto, StudentInvitationDto } from '../../../../shared/models';

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
              </div>
            }

            <button type="submit" [disabled]="inviting()"
              class="w-full bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg transition">
              {{ inviting() ? 'Enviando...' : 'Enviar invitación' }}
            </button>
          </form>
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

  inviteEmail = '';
  inviteFirstName = '';
  inviting = signal(false);
  inviteError = signal('');
  inviteToken = signal('');

  ngOnInit() {
    this.api.get<StudentDto[]>('/students').subscribe({
      next: (data) => { this.students.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
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
    return `${window.location.origin}/invite/${this.inviteToken()}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
}

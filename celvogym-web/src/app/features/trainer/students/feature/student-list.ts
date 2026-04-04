import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { StudentDto, StudentInvitationDto, TrainerNoteDto } from '../../../../shared/models';
import { environment } from '../../../../../environments/environment';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgAvatar } from '../../../../shared/ui/avatar';
import { CgEmptyState } from '../../../../shared/ui/empty-state';
import { formatDate } from '../../../../shared/utils/format-date';

@Component({
  selector: 'app-student-list',
  imports: [FormsModule, RouterLink, CgSpinner, CgAvatar, CgEmptyState],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold">Alumnos</h1>
        <button (click)="showInvite.set(!showInvite())"
          class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition press">
          {{ showInvite() ? 'Cerrar' : '+ Invitar' }}
        </button>
      </div>

      <!-- Invite form (progressive disclosure) -->
      @if (showInvite()) {
        <div class="bg-card border border-border rounded-xl p-4 mb-6 animate-fade-up">
          <form (ngSubmit)="invite()" class="space-y-3">
            <div>
              <label for="invite-email" class="block text-xs text-text-secondary mb-1">Email del alumno</label>
              <input id="invite-email" type="email" [(ngModel)]="inviteEmail" name="email"
                class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition"
                placeholder="alumno@email.com" required />
            </div>
            <div>
              <label for="invite-name" class="block text-xs text-text-secondary mb-1">Nombre (opcional)</label>
              <input id="invite-name" type="text" [(ngModel)]="inviteFirstName" name="firstName"
                class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition"
                placeholder="Nombre" />
            </div>

            @if (inviteError()) { <p class="text-danger text-xs" role="alert">{{ inviteError() }}</p> }

            @if (inviteToken()) {
              <div class="bg-success-dark border border-success/30 rounded-lg p-3 text-center">
                <p class="text-success text-sm font-medium">Invitación creada</p>
                <p class="text-text-secondary text-xs mt-1 break-all">{{ inviteLink() }}</p>
                <div class="flex justify-center gap-3 mt-2">
                  <button type="button" (click)="copyText(inviteLink())" class="text-primary text-xs hover:underline">Copiar link</button>
                  <button type="button" (click)="toggleQr(inviteLink())" class="text-primary text-xs hover:underline">
                    {{ showQr() ? 'Ocultar QR' : 'Ver QR' }}
                  </button>
                </div>
                @if (showQr() && qrUrl()) {
                  <img [src]="qrUrl()" alt="Código QR de invitación" class="w-40 h-40 sm:w-48 sm:h-48 mx-auto mt-2 rounded-lg" />
                }
              </div>
            }

            <button type="submit" [disabled]="inviting()"
              class="w-full bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 rounded-lg transition press">
              {{ inviting() ? 'Enviando...' : 'Enviar invitación' }}
            </button>
          </form>
        </div>
      }

      <!-- Login link — compact inline -->
      @if (loginLink()) {
        <div class="flex items-center gap-2 mb-6 bg-card border border-border rounded-xl px-4 py-3">
          <div class="flex-1 min-w-0">
            <p class="text-text-muted text-xs mb-1">Link de acceso para alumnos</p>
            <p class="text-text-secondary text-xs truncate">{{ loginLink() }}</p>
          </div>
          <div class="flex gap-1.5 shrink-0">
            <button (click)="copyText(loginLink())"
              class="bg-primary hover:bg-primary-hover text-white text-xs px-3 py-1.5 rounded-lg transition">
              {{ copied() ? '¡Copiado!' : 'Copiar' }}
            </button>
            <button (click)="toggleLoginQr(loginLink())"
              class="bg-card-hover text-text-secondary text-xs px-2.5 py-1.5 rounded-lg transition hover:text-text border border-border">
              QR
            </button>
          </div>
        </div>
        @if (showLoginQr() && loginQrUrl()) {
          <div class="text-center mb-6 animate-fade-up">
            <img [src]="loginQrUrl()" alt="Código QR de acceso" class="w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-lg" />
          </div>
        }
      }

      <!-- Student list -->
      @if (loading()) {
        <cg-spinner />
      } @else if (students().length === 0) {
        <cg-empty-state
          title="Aún no hay alumnos"
          subtitle="Invitá a tu primer alumno para empezar">
          <button (click)="showInvite.set(true)"
            class="inline-block mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition press">
            + Invitar alumno
          </button>
        </cg-empty-state>
      } @else {
        <div class="space-y-2 stagger">
          @for (student of students(); track student.id) {
            <div class="bg-card border border-border rounded-xl overflow-hidden"
              [class.expanded]="expandedStudent() === student.id">
              <button (click)="toggleStudent(student.id)"
                class="w-full p-4 flex items-center gap-3 text-left hover:bg-card-hover transition">
                <cg-avatar [name]="student.displayName" size="md" />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-text text-sm">{{ student.displayName }}</p>
                  <p class="text-text-muted text-xs">Desde {{ formatDate(student.createdAt) }}</p>
                </div>
                <svg class="w-4 h-4 text-text-muted transition"
                  [class.rotate-180]="expandedStudent() === student.id"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <div class="collapse-content">
                <div class="px-4 pb-4 border-t border-border-light">
                  <a [routerLink]="['/trainer/students', student.id]"
                    [queryParams]="{name: student.displayName}"
                    class="inline-block mt-3 mb-3 text-xs text-primary hover:underline">Ver progreso y analíticas →</a>

                  <h4 class="text-overline text-text-secondary mb-2">Notas privadas</h4>

                  @if (notesLoading()) {
                    <div class="flex justify-center py-2">
                      <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  } @else {
                    <div class="space-y-2 mb-3">
                      @for (note of notes(); track note.id) {
                        <div class="bg-bg-raised rounded-lg px-3 py-2 group relative"
                          [class.border-l-2]="note.isPinned"
                          [class.border-l-warning]="note.isPinned">
                          <p class="text-sm text-text">{{ note.text }}</p>
                          <div class="flex items-center justify-between mt-1">
                            <span class="text-text-muted text-xs">{{ formatDate(note.updatedAt) }}</span>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                              <button (click)="togglePin(student.id, note)"
                                class="text-xs" [class.text-warning]="note.isPinned" [class.text-text-muted]="!note.isPinned">
                                {{ note.isPinned ? '★' : '☆' }}
                              </button>
                              <button (click)="deleteNote(student.id, note.id)" class="text-xs text-danger">✕</button>
                            </div>
                          </div>
                        </div>
                      } @empty {
                        <p class="text-text-muted text-xs text-center py-1">Sin notas</p>
                      }
                    </div>

                    <div class="flex gap-2">
                      <input type="text" [(ngModel)]="noteText" name="noteText" maxlength="2000"
                        (keydown.enter)="addNote(student.id)"
                        class="flex-1 bg-bg-raised border border-border-light rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
                        placeholder="Agregar nota..." />
                      <button (click)="addNote(student.id)"
                        class="bg-primary hover:bg-primary-hover text-white text-xs px-3 py-1.5 rounded-lg transition press">
                        Agregar
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StudentList implements OnInit, OnDestroy {
  private api = inject(ApiService);
  formatDate = formatDate;

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

  expandedStudent = signal<string | null>(null);
  notes = signal<TrainerNoteDto[]>([]);
  notesLoading = signal(false);
  noteText = '';

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

  ngOnDestroy() {
    if (this.qrUrl()) URL.revokeObjectURL(this.qrUrl());
    if (this.loginQrUrl()) URL.revokeObjectURL(this.loginQrUrl());
  }

  async copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback for HTTP or unsupported browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
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
        this.inviteError.set(err.error?.error || 'No pudimos enviar la invitación. Intentá de nuevo.');
        this.inviting.set(false);
      },
    });
  }

  inviteLink(): string {
    return `${window.location.origin}/invite?token=${encodeURIComponent(this.inviteToken())}`;
  }

  async toggleQr(url: string) {
    if (this.showQr()) { this.showQr.set(false); return; }
    const blobUrl = await this.fetchQrUrl(url);
    if (blobUrl) {
      if (this.qrUrl()) URL.revokeObjectURL(this.qrUrl());
      this.qrUrl.set(blobUrl);
      this.showQr.set(true);
    }
  }

  async toggleLoginQr(url: string) {
    if (this.showLoginQr()) { this.showLoginQr.set(false); return; }
    const blobUrl = await this.fetchQrUrl(url);
    if (blobUrl) {
      if (this.loginQrUrl()) URL.revokeObjectURL(this.loginQrUrl());
      this.loginQrUrl.set(blobUrl);
      this.showLoginQr.set(true);
    }
  }

  private async fetchQrUrl(url: string): Promise<string | null> {
    try {
      const res = await fetch(`${environment.apiUrl}/students/qr?url=${encodeURIComponent(url)}`, {
        credentials: 'include',
        headers: { 'X-CSRF-Token': document.cookie.match(/(^| )cg-csrf=([^;]+)/)?.[2] ?? '' },
      });
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch { /* QR generation failed silently */ }
    return null;
  }

  toggleStudent(studentId: string) {
    if (this.expandedStudent() === studentId) {
      this.expandedStudent.set(null);
      return;
    }
    this.expandedStudent.set(studentId);
    this.loadNotes(studentId);
  }

  loadNotes(studentId: string) {
    this.notesLoading.set(true);
    this.api.get<TrainerNoteDto[]>(`/students/${studentId}/notes`).subscribe({
      next: (data) => { this.notes.set(data); this.notesLoading.set(false); },
      error: () => this.notesLoading.set(false),
    });
  }

  addNote(studentId: string) {
    const text = this.noteText.trim();
    if (!text) return;
    this.api.post<TrainerNoteDto>(`/students/${studentId}/notes`, { text }).subscribe({
      next: (note) => {
        this.notes.update(n => [...n, note]);
        this.noteText = '';
      },
    });
  }

  togglePin(studentId: string, note: TrainerNoteDto) {
    this.api.put<TrainerNoteDto>(`/students/${studentId}/notes/${note.id}`, {
      text: note.text,
      isPinned: !note.isPinned,
    }).subscribe({
      next: (updated) => {
        this.notes.update(notes =>
          notes.map(n => n.id === updated.id ? updated : n)
            .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
        );
      },
    });
  }

  deleteNote(studentId: string, noteId: string) {
    this.api.delete(`/students/${studentId}/notes/${noteId}`).subscribe({
      next: () => this.notes.update(notes => notes.filter(n => n.id !== noteId)),
    });
  }

}

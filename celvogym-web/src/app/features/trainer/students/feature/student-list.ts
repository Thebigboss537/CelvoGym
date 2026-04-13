import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { StudentDto, StudentInvitationDto, ProgramAssignmentDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgEmptyState } from '../../../../shared/ui/empty-state';
import { CgStudentCard } from '../../../../shared/ui/student-card';
import { ToastService } from '../../../../shared/ui/toast';
import { GRADIENT_PAIRS, getInitials } from '../../../../shared/utils/display';
import { StudentDetail } from './student-detail';

@Component({
  selector: 'app-student-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CgSpinner, CgEmptyState, CgStudentCard, StudentDetail],
  template: `
    <div class="h-full flex">

      <!-- ── LEFT PANEL ── -->
      <div class="w-80 shrink-0 flex flex-col bg-[#0D0D0F] border-r border-border-light h-full overflow-hidden lg:flex"
        [class.hidden]="selectedStudentId() !== null"
        [class.flex]="selectedStudentId() === null"
        [class.lg:flex]="true"
        [class.w-full]="selectedStudentId() === null">

        <!-- Panel header -->
        <div class="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
          <h1 class="font-display text-xl font-bold text-text">Alumnos</h1>
          <button (click)="showInvite.set(!showInvite())"
            class="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition press">
            {{ showInvite() ? 'Cerrar' : '+ Invitar' }}
          </button>
        </div>

        <!-- Invite form -->
        @if (showInvite()) {
          <div class="mx-3 mb-3 bg-card border border-border rounded-xl p-3 animate-fade-up shrink-0">
            <form (ngSubmit)="invite()" class="space-y-2">
              <label class="block text-xs text-text-secondary mb-0.5">Email del alumno</label>
              <input
                type="email"
                [(ngModel)]="inviteEmail"
                name="email"
                class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition"
                placeholder="alumno@email.com"
                required />
              @if (inviteError()) {
                <p class="text-danger text-xs" role="alert">{{ inviteError() }}</p>
              }
              <button type="submit" [disabled]="inviting()"
                class="w-full bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2 rounded-lg transition press disabled:opacity-60">
                {{ inviting() ? 'Enviando...' : 'Enviar invitación' }}
              </button>
            </form>
          </div>
        }

        <!-- Search -->
        <div class="px-3 mb-2 shrink-0">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              type="search"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              name="search"
              class="w-full bg-bg-raised border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition"
              placeholder="Buscar alumno..." />
          </div>
        </div>

        <!-- Student list -->
        <div class="flex-1 overflow-y-auto px-3 pb-4">
          @if (loading()) {
            <div class="flex justify-center pt-8">
              <cg-spinner />
            </div>
          } @else if (students().length === 0) {
            <cg-empty-state
              title="Aún no hay alumnos"
              subtitle="Invitá a tu primer alumno para empezar">
              <button (click)="showInvite.set(true)"
                class="mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition press">
                + Invitar alumno
              </button>
            </cg-empty-state>
          } @else if (filteredStudents().length === 0) {
            <p class="text-center text-text-muted text-sm pt-8">Sin resultados para "{{ searchQuery() }}"</p>
          } @else {
            <div class="space-y-1.5">
              @for (item of filteredStudents(); track item.student.id; let i = $index) {
                <cg-student-card
                  [name]="item.student.displayName"
                  [initials]="item.initials"
                  [gradientFrom]="item.gradientFrom"
                  [gradientTo]="item.gradientTo"
                  [subtitle]="item.subtitle"
                  [status]="item.status"
                  [statusText]="item.statusText"
                  [selected]="selectedStudentId() === item.student.id"
                  (select)="selectStudent(item.student)" />
              }
            </div>
          }
        </div>
      </div>

      <!-- ── RIGHT PANEL (desktop inline detail) ── -->
      <div class="hidden lg:flex flex-1 flex-col overflow-hidden">
        @if (selectedStudentId()) {
          <div class="flex-1 overflow-y-auto p-6">
            <app-student-detail [studentId]="selectedStudentId()" />
          </div>
        } @else {
          <!-- Empty state when no student selected -->
          <div class="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <svg class="w-10 h-10 text-border mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
              <p class="text-text-muted text-sm">Seleccioná un alumno para ver su detalle</p>
            </div>
          </div>
        }
      </div>

    </div>
  `,
})
export class StudentList implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  students = signal<StudentDto[]>([]);
  assignments = signal<ProgramAssignmentDto[]>([]);
  loading = signal(true);

  selectedStudentId = signal<string | null>(null);

  showInvite = signal(false);
  inviteEmail = '';
  inviting = signal(false);
  inviteError = signal('');

  searchQuery = signal('');

  filteredStudents = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.enrichedStudents();
    if (!query) return all;
    return all.filter(s => s.student.displayName.toLowerCase().includes(query));
  });

  private enrichedStudents = computed(() => {
    const assignmentsByStudent = new Map<string, ProgramAssignmentDto[]>();
    for (const a of this.assignments()) {
      const list = assignmentsByStudent.get(a.studentId) ?? [];
      list.push(a);
      assignmentsByStudent.set(a.studentId, list);
    }

    return this.students().map((student, i) => {
      const [from, to] = GRADIENT_PAIRS[i % GRADIENT_PAIRS.length];
      const studentAssignments = assignmentsByStudent.get(student.id) ?? [];
      const active = studentAssignments.find(a => a.status === 'Active');
      const status = active ? 'resting' : 'no-program';
      const statusText = active
        ? `${active.programName} · S${active.currentWeek}`
        : 'Sin programa';
      return {
        student,
        initials: getInitials(student.displayName),
        gradientFrom: from,
        gradientTo: to,
        status,
        statusText,
        subtitle: statusText,
      };
    });
  });

  ngOnInit() {
    this.api.get<StudentDto[]>('/students').subscribe({
      next: (data) => {
        this.students.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.get<ProgramAssignmentDto[]>('/program-assignments').subscribe({
      next: (data) => this.assignments.set(data),
    });
  }

  selectStudent(student: StudentDto) {
    // On mobile, navigate to standalone detail page
    if (window.innerWidth < 1024) {
      this.router.navigate(['/trainer/students', student.id]);
      return;
    }
    // On desktop, show inline
    this.selectedStudentId.set(student.id);
  }

  invite() {
    const email = this.inviteEmail.trim();
    if (!email) return;
    this.inviting.set(true);
    this.inviteError.set('');

    this.api.post<StudentInvitationDto>('/students/invite', { email }).subscribe({
      next: () => {
        this.inviting.set(false);
        this.inviteEmail = '';
        this.showInvite.set(false);
        this.toast.show('Invitación enviada correctamente');
      },
      error: (err) => {
        this.inviteError.set(err.error?.error || 'No pudimos enviar la invitación. Intentá de nuevo.');
        this.inviting.set(false);
      },
    });
  }
}

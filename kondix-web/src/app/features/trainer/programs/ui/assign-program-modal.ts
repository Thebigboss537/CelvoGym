import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, X, Check } from 'lucide-angular';
import { environment } from '../../../../../environments/environment';

interface StudentLite { id: string; displayName: string; }

@Component({
  selector: 'kx-assign-program-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X, Check }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] bg-black/70" (click)="close.emit()"></div>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201]
                w-[min(480px,calc(100vw-32px))] bg-bg border border-border rounded-2xl shadow-lg flex flex-col">
      <header class="px-6 py-4 border-b border-border-light flex items-center justify-between">
        <div class="min-w-0">
          <div class="text-overline">Asignar</div>
          <h2 class="font-display text-xl font-bold tracking-tight truncate">{{ programName() }}</h2>
        </div>
        <button type="button" (click)="close.emit()"
                class="p-2 hover:bg-card-hover rounded-md transition shrink-0">
          <lucide-icon name="x" [size]="16"></lucide-icon>
        </button>
      </header>

      <div class="px-6 py-5 flex flex-col gap-4">
        <label class="flex flex-col gap-1">
          <span class="text-overline">Estudiante</span>
          <select class="select-styled w-full"
                  [ngModel]="studentId()"
                  (ngModelChange)="studentId.set($event)">
            <option [ngValue]="null">— elegí estudiante —</option>
            @for (s of students(); track s.id) {
              <option [value]="s.id">{{ s.displayName }}</option>
            }
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-overline">Fecha de inicio</span>
          <input type="date"
                 class="px-3 py-2 bg-bg-raised border border-border rounded-md text-sm text-text outline-none focus:border-primary"
                 [ngModel]="startDate()"
                 (ngModelChange)="startDate.set($event)" />
        </label>

        @if (error()) {
          <div class="text-xs text-danger">{{ error() }}</div>
        }
      </div>

      <footer class="px-6 py-3 border-t border-border-light flex justify-end gap-2">
        <button type="button" (click)="close.emit()"
                class="px-4 py-2 text-sm text-text-secondary hover:text-text transition">
          Cancelar
        </button>
        <button type="button"
                class="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition press flex items-center gap-2"
                [disabled]="!studentId() || !startDate() || saving()"
                (click)="submit()">
          <lucide-icon name="check" [size]="14"></lucide-icon>
          Asignar
        </button>
      </footer>
    </div>
  `,
})
export class AssignProgramModal implements OnInit {
  private http = inject(HttpClient);

  readonly programId = input.required<string>();
  readonly programName = input.required<string>();

  readonly close = output<void>();
  readonly assigned = output<void>();

  protected readonly students = signal<StudentLite[]>([]);
  protected readonly studentId = signal<string | null>(null);
  protected readonly startDate = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    firstValueFrom(this.http.get<StudentLite[]>(`${environment.apiUrl}/students`, { withCredentials: true }))
      .then(s => this.students.set(s ?? []))
      .catch(() => this.students.set([]));
  }

  async submit() {
    if (!this.studentId() || !this.startDate() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/program-assignments`, {
        studentId: this.studentId(),
        programId: this.programId(),
        startDate: this.startDate(),  // backend record accepts DateTimeOffset; ISO date string parses fine
      }, { withCredentials: true }));
      this.assigned.emit();
      this.close.emit();
    } catch (err: any) {
      this.error.set(err?.error?.error ?? 'No se pudo asignar.');
    } finally {
      this.saving.set(false);
    }
  }
}

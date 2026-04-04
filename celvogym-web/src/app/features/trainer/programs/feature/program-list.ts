import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ProgramListDto } from '../../../../shared/models';
import { CgSpinner } from '../../../../shared/ui/spinner';
import { CgEmptyState } from '../../../../shared/ui/empty-state';
import { formatDate } from '../../../../shared/utils/format-date';

@Component({
  selector: 'app-program-list',
  imports: [RouterLink, CgSpinner, CgEmptyState],
  template: `
    <div class="animate-fade-up">
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display text-2xl font-bold">Programas</h1>
        <a routerLink="new"
          class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition press">
          + Crear programa
        </a>
      </div>

      @if (loading()) {
        <cg-spinner />
      } @else if (programs().length === 0) {
        <cg-empty-state
          title="Sin programas"
          subtitle="Crea un programa para agrupar rutinas con duración">
          <a routerLink="new"
            class="inline-block mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-lg transition press">
            + Crear programa
          </a>
        </cg-empty-state>
      } @else {
        <div class="space-y-3 stagger">
          @for (program of programs(); track program.id) {
            <a [routerLink]="program.id"
              class="block bg-card hover:bg-card-hover border border-border rounded-xl p-4 transition press">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-text">{{ program.name }}</h3>
                  @if (program.description) {
                    <p class="text-text-secondary text-sm mt-0.5 line-clamp-1">{{ program.description }}</p>
                  }
                </div>
                <span class="text-xs bg-bg-raised text-text-muted px-2 py-1 rounded-lg shrink-0 ml-3">
                  {{ program.durationWeeks }} sem
                </span>
              </div>
              <div class="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span>{{ program.routineCount }} rutina{{ program.routineCount !== 1 ? 's' : '' }}</span>
                <span>Actualizado {{ formatDate(program.updatedAt) }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ProgramList implements OnInit {
  private api = inject(ApiService);
  formatDate = formatDate;

  programs = signal<ProgramListDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<ProgramListDto[]>('/programs').subscribe({
      next: (data) => { this.programs.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

}

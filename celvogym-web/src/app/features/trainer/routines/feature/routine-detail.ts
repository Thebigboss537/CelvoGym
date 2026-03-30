import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { RoutineDetailDto } from '../../../../shared/models';

@Component({
  selector: 'app-routine-detail',
  imports: [RouterLink],
  template: `
    <div class="animate-fade-up">
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (routine()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <a routerLink="/trainer/routines" class="text-text-muted text-sm hover:text-text transition">← Volver</a>
            <h2 class="font-[var(--font-display)] text-2xl font-bold mt-1">{{ routine()!.name }}</h2>
            @if (routine()!.description) {
              <p class="text-text-secondary text-sm mt-1">{{ routine()!.description }}</p>
            }
          </div>
          <a
            [routerLink]="'edit'"
            class="bg-card hover:bg-card-hover border border-border text-sm px-3 py-1.5 rounded-lg transition"
          >Editar</a>
        </div>

        <div class="space-y-4 stagger">
          @for (day of routine()!.days; track day.id) {
            <div class="bg-card border border-border rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-border-light bg-bg-raised">
                <h3 class="font-semibold">{{ day.name }}</h3>
              </div>
              <div class="divide-y divide-border-light">
                @for (group of day.groups; track group.id) {
                  <div class="px-4 py-3">
                    @if (group.groupType !== 'Single') {
                      <span class="text-xs text-primary font-medium uppercase mb-2 block">
                        {{ group.groupType }} · {{ group.restSeconds }}s descanso
                      </span>
                    }
                    @for (exercise of group.exercises; track exercise.id) {
                      <div class="py-1.5">
                        <div class="flex items-center justify-between">
                          <span class="text-text font-medium text-sm">{{ exercise.name }}</span>
                          @if (exercise.tempo) {
                            <span class="text-text-muted text-xs">Tempo: {{ exercise.tempo }}</span>
                          }
                        </div>
                        <div class="flex flex-wrap gap-1.5 mt-1">
                          @for (set of exercise.sets; track set.id; let i = $index) {
                            <span class="text-xs px-2 py-0.5 rounded bg-bg-raised text-text-secondary border border-border-light">
                              {{ set.setType === 'Warmup' ? 'W' : (i + 1) }}:
                              {{ set.targetReps ?? '-' }} × {{ set.targetWeight ?? '-' }}
                              @if (set.targetRpe) { <span class="text-primary">RPE {{ set.targetRpe }}</span> }
                            </span>
                          }
                        </div>
                      </div>
                    }
                    @if (group.groupType === 'Single' && group.restSeconds > 0) {
                      <span class="text-xs text-text-muted">{{ group.restSeconds }}s descanso</span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class RoutineDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  routine = signal<RoutineDetailDto | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<RoutineDetailDto>(`/routines/${id}`).subscribe({
      next: (data) => {
        this.routine.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

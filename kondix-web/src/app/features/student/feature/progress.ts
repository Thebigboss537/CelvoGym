import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  BodyMetricDto,
  PersonalRecordDto,
  ProgressPhotoDto,
} from '../../../shared/models';
import { CgBadge } from '../../../shared/ui/badge';
import { CgEmptyState } from '../../../shared/ui/empty-state';
import { CgSegmentedControl } from '../../../shared/ui/segmented-control';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgStatCard } from '../../../shared/ui/stat-card';
import { ToastService } from '../../../shared/ui/toast';
import { formatDate, formatDateWithYear, parseLocalDate } from '../../../shared/utils/format-date';

@Component({
  selector: 'app-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CgSegmentedControl, CgStatCard, CgSpinner, CgEmptyState, CgBadge],
  template: `
    <div class="animate-fade-up space-y-5 pb-8">

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-extrabold text-text">Progreso</h1>
        <p class="text-text-muted text-sm mt-0.5">Tu evolución en un solo lugar</p>
      </div>

      <!-- Segmented control -->
      <cg-segmented-control
        [options]="['Records', 'Medidas', 'Fotos']"
        [selected]="activeTab()"
        (selectedChange)="activeTab.set($event)" />

      <!-- Loading -->
      @if (loading()) {
        <cg-spinner />
      } @else {
        @switch (activeTab()) {

          <!-- ===== RECORDS TAB ===== -->
          @case ('Records') {
            <div class="space-y-5 animate-fade-up">

              <!-- Stats row -->
              <div class="flex gap-3">
                <div class="flex-1">
                  <cg-stat-card
                    label="PRs totales"
                    [value]="records().length.toString()"
                    valueColor="text-primary" />
                </div>
                <div class="flex-1">
                  <cg-stat-card
                    label="Este mes"
                    [value]="recordsThisMonth().toString()"
                    valueColor="text-text" />
                </div>
                <div class="flex-1">
                  <cg-stat-card
                    label="Tendencia"
                    [value]="trend()"
                    valueColor="text-text-muted" />
                </div>
              </div>

              <!-- PR list -->
              @if (records().length === 0) {
                <cg-empty-state
                  title="Sin records aún"
                  subtitle="Completa entrenamientos para registrar tus PRs" />
              } @else {
                <div class="space-y-2 stagger">
                  @for (pr of records(); track pr.id) {
                    <div class="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p class="font-bold text-text text-sm truncate">{{ pr.exerciseName }}</p>
                        <p class="text-text-muted text-xs mt-0.5">
                          Mejor: {{ pr.weight }}kg
                          @if (pr.reps) { × {{ pr.reps }} reps }
                        </p>
                        <p class="text-text-muted text-xs">{{ formatDateWithYear(pr.achievedAt) }}</p>
                      </div>
                      <div class="shrink-0">
                        <cg-badge [text]="pr.weight + ' kg'" variant="success" />
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- ===== MEDIDAS TAB ===== -->
          @case ('Medidas') {
            <div class="space-y-4 animate-fade-up">

              <!-- Latest stats if data exists -->
              @if (latestMetric()) {
                <div class="flex gap-3">
                  @if (latestMetric()!.weight) {
                    <div class="flex-1">
                      <cg-stat-card
                        label="Peso actual"
                        [value]="latestMetric()!.weight + ' kg'"
                        valueColor="text-text" />
                    </div>
                  }
                  @if (latestMetric()!.bodyFat) {
                    <div class="flex-1">
                      <cg-stat-card
                        label="Grasa corporal"
                        [value]="latestMetric()!.bodyFat + '%'"
                        valueColor="text-text" />
                    </div>
                  }
                </div>
              }

              <!-- Inline form toggle -->
              <button (click)="showForm.set(!showForm())"
                class="w-full bg-card border border-border rounded-xl px-4 py-3 text-left text-sm text-primary hover:bg-card-hover transition">
                {{ showForm() ? 'Cancelar' : '+ Registrar medida' }}
              </button>

              @if (showForm()) {
                <div class="bg-card border border-border rounded-xl p-4 animate-fade-up">
                  <form (ngSubmit)="saveMeasurement()" class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs text-text-muted mb-1">Peso (kg)</label>
                        <input type="number" step="0.1" [(ngModel)]="formWeight" name="weight"
                          class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label class="block text-xs text-text-muted mb-1">Grasa corporal (%)</label>
                        <input type="number" step="0.1" [(ngModel)]="formBodyFat" name="bodyFat"
                          class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs text-text-muted mb-1">Notas</label>
                      <input type="text" [(ngModel)]="formNotes" name="notes" maxlength="2000"
                        class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                        placeholder="Cómo me siento hoy..." />
                    </div>
                    <button type="submit" [disabled]="saving()"
                      class="bg-primary hover:bg-primary-hover text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-60">
                      {{ saving() ? 'Guardando...' : 'Guardar' }}
                    </button>
                  </form>
                </div>
              }

              <!-- Metrics history -->
              @if (bodyMetrics().length === 0 && !showForm()) {
                <cg-empty-state
                  title="Sin registros"
                  subtitle="Registra tu peso y medidas para ver tu progreso" />
              } @else if (bodyMetrics().length > 0) {
                <div class="space-y-3 stagger">
                  @for (metric of bodyMetrics(); track metric.id) {
                    <div class="bg-card border border-border rounded-2xl p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-text-muted">{{ formatDateWithYear(metric.recordedAt) }}</span>
                        <div class="flex gap-3">
                          @if (metric.weight) {
                            <span class="text-sm font-bold text-text">{{ metric.weight }} kg</span>
                          }
                          @if (metric.bodyFat) {
                            <span class="text-sm text-text-muted">{{ metric.bodyFat }}% grasa</span>
                          }
                        </div>
                      </div>
                      @if (metric.notes) {
                        <p class="text-xs text-text-muted">{{ metric.notes }}</p>
                      }
                      @if (metric.measurements.length > 0) {
                        <div class="flex flex-wrap gap-2 mt-2">
                          @for (m of metric.measurements; track m.type) {
                            <span class="text-xs bg-bg-raised px-2 py-0.5 rounded text-text-muted">
                              {{ m.type }}: {{ m.value }} cm
                            </span>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- ===== FOTOS TAB ===== -->
          @case ('Fotos') {
            <div class="space-y-4 animate-fade-up">

              <!-- Upload button -->
              <label class="w-full bg-card border border-dashed border-border rounded-xl px-4 py-3 text-center text-sm text-primary hover:border-primary/40 cursor-pointer transition block">
                {{ uploading() ? 'Subiendo...' : '+ Nueva foto' }}
                <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
                  (change)="uploadPhoto($event)" [disabled]="uploading()" />
              </label>

              @if (photos().length === 0) {
                <cg-empty-state
                  title="Sin fotos de progreso"
                  subtitle="Sube tu primera foto para empezar a trackear tu físico" />
              } @else {
                <div class="grid grid-cols-2 gap-3 stagger">
                  @for (photo of photos(); track photo.id) {
                    <div class="bg-card border border-border rounded-2xl overflow-hidden">
                      <div class="relative aspect-[3/4]">
                        <img [src]="photo.photoUrl" [alt]="photo.angle"
                          class="w-full h-full object-cover" />
                        <div class="absolute top-2 left-2">
                          <span class="bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                            {{ angleLabel(photo.angle) }}
                          </span>
                        </div>
                      </div>
                      <div class="px-3 py-2">
                        <p class="text-xs text-text-muted">{{ formatDate(photo.takenAt) }}</p>
                        @if (photo.notes) {
                          <p class="text-xs text-text mt-0.5 truncate">{{ photo.notes }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      }
    </div>
  `,
})
export class Progress implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  formatDate = formatDate;
  formatDateWithYear = formatDateWithYear;

  activeTab = signal('Records');
  loading = signal(true);

  records = signal<PersonalRecordDto[]>([]);
  bodyMetrics = signal<BodyMetricDto[]>([]);
  photos = signal<ProgressPhotoDto[]>([]);

  showForm = signal(false);
  saving = signal(false);
  uploading = signal(false);

  formWeight: number | null = null;
  formBodyFat: number | null = null;
  formNotes = '';

  recordsThisMonth = computed(() => {
    const now = new Date();
    return this.records().filter(r => {
      const d = parseLocalDate(r.achievedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  });

  trend = computed(() => {
    const recs = this.records();
    const now = new Date();
    const thisMonth = recs.filter(r => {
      const d = parseLocalDate(r.achievedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonth = recs.filter(r => {
      const d = parseLocalDate(r.achievedAt);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    }).length;
    if (thisMonth === 0 && lastMonth === 0) return '—';
    const diff = thisMonth - lastMonth;
    if (diff > 0) return '+' + diff;
    if (diff < 0) return String(diff);
    return '=';
  });

  latestMetric = computed(() =>
    this.bodyMetrics().length > 0 ? this.bodyMetrics()[0] : null
  );

  ngOnInit() {
    forkJoin({
      records: this.api.get<PersonalRecordDto[]>('/public/my/records'),
      metrics: this.api.get<BodyMetricDto[]>('/public/my/body-metrics'),
      photos: this.api.get<ProgressPhotoDto[]>('/public/my/progress-photos'),
    }).subscribe({
      next: ({ records, metrics, photos }) => {
        this.records.set(records);
        this.bodyMetrics.set(metrics);
        this.photos.set(photos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveMeasurement() {
    this.saving.set(true);
    this.api.post<BodyMetricDto>('/public/my/body-metrics', {
      recordedAt: new Date().toISOString().split('T')[0],
      weight: this.formWeight,
      bodyFat: this.formBodyFat,
      notes: this.formNotes.trim() || null,
      measurements: [],
    }).subscribe({
      next: (created) => {
        this.bodyMetrics.update(m => [created, ...m]);
        this.toast.show('Registro guardado');
        this.showForm.set(false);
        this.saving.set(false);
        this.formWeight = null;
        this.formBodyFat = null;
        this.formNotes = '';
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'Error al guardar', 'error');
        this.saving.set(false);
      },
    });
  }

  uploadPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('angle', 'Front');
    this.api.upload<ProgressPhotoDto>('/public/my/photos/upload', formData).subscribe({
      next: (photo) => {
        this.photos.update(p => [photo, ...p]);
        this.toast.show('Foto subida');
        this.uploading.set(false);
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'Error al subir foto', 'error');
        this.uploading.set(false);
      },
    });
  }

  angleLabel(angle: 'Front' | 'Side' | 'Back'): string {
    return { Front: 'Frente', Side: 'Lateral', Back: 'Espalda' }[angle];
  }
}

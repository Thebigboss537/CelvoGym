import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { BodyMetricDto, ProgressPhotoDto } from '../../../shared/models';
import { CgSpinner } from '../../../shared/ui/spinner';
import { CgEmptyState } from '../../../shared/ui/empty-state';
import { ToastService } from '../../../shared/ui/toast';

@Component({
  selector: 'app-body-tracking',
  imports: [FormsModule, RouterLink, CgSpinner, CgEmptyState],
  template: `
    <div class="animate-fade-up">
      <a routerLink="/workout" class="text-text-muted text-sm hover:text-text transition">← Volver</a>
      <h1 class="font-display text-2xl font-bold mt-1 mb-6">Mi Cuerpo</h1>

      <!-- Add new -->
      <button (click)="showForm.set(!showForm())"
        class="w-full bg-card border border-border rounded-xl px-4 py-3 text-left text-sm text-primary hover:bg-card-hover transition mb-4">
        {{ showForm() ? 'Cancelar' : '+ Registrar medidas' }}
      </button>

      @if (showForm()) {
        <div class="bg-card border border-border rounded-xl p-4 mb-6 animate-fade-up">
          <form (ngSubmit)="save()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-text-secondary mb-1">Peso (kg)</label>
                <input type="number" step="0.1" [(ngModel)]="formWeight" name="weight"
                  class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label class="block text-xs text-text-secondary mb-1">Grasa corporal (%)</label>
                <input type="number" step="0.1" [(ngModel)]="formBodyFat" name="bodyFat"
                  class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">Notas</label>
              <input type="text" [(ngModel)]="formNotes" name="notes" maxlength="2000"
                class="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                placeholder="Cómo me siento..." />
            </div>
            <button type="submit" [disabled]="saving()"
              class="bg-primary hover:bg-primary-hover text-white text-sm px-4 py-2 rounded-lg transition">
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
          </form>
        </div>
      }

      @if (loading()) {
        <cg-spinner />
      } @else if (metrics().length === 0) {
        <cg-empty-state
          title="Sin registros"
          subtitle="Registra tu peso y medidas para ver tu progreso" />
      } @else {
        <div class="space-y-3 stagger">
          @for (metric of metrics(); track metric.id) {
            <div class="bg-card border border-border rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-muted">{{ metric.recordedAt }}</span>
                <div class="flex gap-3">
                  @if (metric.weight) {
                    <span class="text-sm font-bold text-text">{{ metric.weight }} kg</span>
                  }
                  @if (metric.bodyFat) {
                    <span class="text-sm text-text-secondary">{{ metric.bodyFat }}% grasa</span>
                  }
                </div>
              </div>
              @if (metric.notes) {
                <p class="text-xs text-text-muted">{{ metric.notes }}</p>
              }
              @if (metric.measurements.length > 0) {
                <div class="flex flex-wrap gap-2 mt-2">
                  @for (m of metric.measurements; track m.type) {
                    <span class="text-xs bg-bg-raised px-2 py-0.5 rounded text-text-secondary">
                      {{ m.type }}: {{ m.value }} cm
                    </span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Progress Photos -->
      <h2 class="font-display text-lg font-bold mt-8 mb-4">Fotos de progreso</h2>

      <label class="w-full bg-card border border-dashed border-border rounded-xl px-4 py-3 text-center text-sm text-primary hover:border-primary/40 cursor-pointer transition block mb-4">
        {{ uploading() ? 'Subiendo...' : '+ Subir foto' }}
        <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
          (change)="uploadPhoto($event)" [disabled]="uploading()" />
      </label>

      @if (photos().length > 0) {
        <div class="grid grid-cols-3 gap-2">
          @for (photo of photos(); track photo.id) {
            <div class="relative aspect-[3/4] rounded-lg overflow-hidden bg-card border border-border">
              <img [src]="photo.photoUrl" [alt]="photo.angle" class="w-full h-full object-cover" />
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <span class="text-white text-xs font-medium">{{ photo.angle }}</span>
                <span class="text-white/70 text-xs block">{{ photo.takenAt }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BodyTracking implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  metrics = signal<BodyMetricDto[]>([]);
  photos = signal<ProgressPhotoDto[]>([]);
  loading = signal(true);
  uploading = signal(false);
  saving = signal(false);
  showForm = signal(false);

  formWeight: number | null = null;
  formBodyFat: number | null = null;
  formNotes = '';

  ngOnInit() {
    this.loadData();
    this.loadPhotos();
  }

  save() {
    this.saving.set(true);
    this.api.post<BodyMetricDto>('/public/my/body-metrics', {
      recordedAt: new Date().toISOString().split('T')[0],
      weight: this.formWeight,
      bodyFat: this.formBodyFat,
      notes: this.formNotes.trim() || null,
      measurements: [],
    }).subscribe({
      next: () => {
        this.toast.show('Registro guardado');
        this.showForm.set(false);
        this.saving.set(false);
        this.formWeight = null;
        this.formBodyFat = null;
        this.formNotes = '';
        this.loadData();
      },
      error: () => this.saving.set(false),
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
      next: () => {
        this.toast.show('Foto subida');
        this.uploading.set(false);
        this.loadPhotos();
      },
      error: (err) => {
        this.toast.show(err.error?.error || 'Error al subir foto', 'error');
        this.uploading.set(false);
      },
    });
  }

  private loadData() {
    this.api.get<BodyMetricDto[]>('/public/my/body-metrics').subscribe({
      next: (data) => { this.metrics.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadPhotos() {
    this.api.get<ProgressPhotoDto[]>('/public/my/progress-photos').subscribe({
      next: (data) => this.photos.set(data),
    });
  }
}

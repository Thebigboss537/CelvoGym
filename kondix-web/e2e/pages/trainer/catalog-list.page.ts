import type { Page, Locator } from '@playwright/test';

export class CatalogListPage {
  readonly newBtn: Locator;
  readonly search: Locator;
  readonly form: Locator;
  readonly formName: Locator;
  readonly formMuscle: Locator;
  readonly formVideo: Locator;
  readonly formNotes: Locator;
  readonly formSubmit: Locator;
  readonly formCancel: Locator;
  readonly empty: Locator;
  readonly deleteDialog: Locator;

  constructor(private readonly page: Page) {
    this.newBtn = page.getByTestId('catalog-new');
    this.search = page.getByTestId('catalog-search');
    this.form = page.getByTestId('catalog-form');
    this.formName = page.getByTestId('catalog-form-name');
    this.formMuscle = page.getByTestId('catalog-form-muscle');
    this.formVideo = page.getByTestId('catalog-form-video');
    this.formNotes = page.getByTestId('catalog-form-notes');
    this.formSubmit = page.getByTestId('catalog-form-submit');
    this.formCancel = page.getByTestId('catalog-form-cancel');
    this.empty = page.getByTestId('catalog-empty');
    this.deleteDialog = page.getByTestId('catalog-delete-dialog');
  }

  async goto(): Promise<void> {
    await this.page.goto('/trainer/catalog');
    await this.newBtn.waitFor();
  }

  async openCreateForm(): Promise<void> {
    await this.newBtn.click();
    await this.form.waitFor();
  }

  async fillAndSubmit(name: string, muscleGroup?: string, videoUrl?: string, notes?: string): Promise<void> {
    await this.formName.fill(name);
    if (muscleGroup) await this.formMuscle.fill(muscleGroup);
    if (videoUrl) await this.formVideo.fill(videoUrl);
    if (notes) await this.formNotes.fill(notes);
    await this.formSubmit.click();
    // Form collapses on success (editingExercise → undefined)
    await this.form.waitFor({ state: 'detached' });
  }

  card(exerciseId: string): Locator {
    return this.page.getByTestId(`catalog-card-${exerciseId}`);
  }

  deleteButton(exerciseId: string): Locator {
    return this.page.getByTestId(`catalog-delete-${exerciseId}`);
  }

  cardByName(name: string): Locator {
    // Testids include the exercise UUID which is unknown beforehand. Match by
    // the visible name inside any catalog-card-* element.
    return this.page.locator('[data-testid^="catalog-card-"]', { hasText: name });
  }

  async selectChip(label: string): Promise<void> {
    await this.page.getByTestId(`catalog-chip-${label.toLowerCase()}`).click();
  }

  async openEdit(exerciseName: string): Promise<void> {
    const card = this.cardByName(exerciseName);
    await card.click();
    await this.form.waitFor();
  }

  async confirmDeleteDialog(): Promise<void> {
    // The <kx-confirm-dialog> host element has no layout box of its own — the
    // inner overlay (role="dialog") is what becomes visible when [open]=true.
    // Waiting on the host with the default 'visible' state hangs even when the
    // dialog is on screen. Wait on the inner role instead.
    const dialog = this.deleteDialog.getByRole('dialog');
    await dialog.waitFor();
    // Scope the "Eliminar" button click inside the dialog so the per-card
    // hover-Eliminar button does not get matched.
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
}

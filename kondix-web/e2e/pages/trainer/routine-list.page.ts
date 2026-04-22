import type { Page, Locator } from '@playwright/test';

export class RoutineListPage {
  readonly title: Locator;
  readonly newBtn: Locator;
  readonly empty: Locator;
  readonly emptyNew: Locator;
  readonly chipAll: Locator;
  readonly deleteDialog: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('routine-list-title');
    this.newBtn = page.getByTestId('routine-list-new');
    this.empty = page.getByTestId('routine-list-empty');
    this.emptyNew = page.getByTestId('routine-list-empty-new');
    this.chipAll = page.getByTestId('routine-chip-all');
    this.deleteDialog = page.getByTestId('routine-delete-dialog');
  }

  async goto(): Promise<void> {
    await this.page.goto('/trainer/routines');
    // Either the title (non-empty state) or the empty CTA — wait for title,
    // which is always rendered once data has loaded.
    await this.title.waitFor();
  }

  chip(category: string): Locator {
    return this.page.getByTestId(`routine-chip-${category}`);
  }

  card(routineId: string): Locator {
    return this.page.getByTestId(`routine-card-${routineId}`);
  }

  cardByName(name: string): Locator {
    return this.page.locator('[data-testid^="routine-card-"]', { hasText: name });
  }

  async openMenu(routineId: string): Promise<void> {
    await this.page.getByTestId(`routine-card-${routineId}-menu`).click();
  }

  async clickEdit(routineId: string): Promise<void> {
    await this.openMenu(routineId);
    await this.page.getByTestId(`routine-card-${routineId}-edit`).click();
  }

  async clickDelete(routineId: string): Promise<void> {
    await this.openMenu(routineId);
    await this.page.getByTestId(`routine-card-${routineId}-delete`).click();
  }

  async confirmDeleteDialog(): Promise<void> {
    const dialog = this.deleteDialog.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
}

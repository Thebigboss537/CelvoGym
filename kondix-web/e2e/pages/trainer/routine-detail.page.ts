import type { Page, Locator } from '@playwright/test';

export class RoutineDetailPage {
  readonly name: Locator;
  readonly edit: Locator;
  readonly duplicate: Locator;
  readonly delete: Locator;
  readonly deleteDialog: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('routine-detail-name');
    this.edit = page.getByTestId('routine-detail-edit');
    this.duplicate = page.getByTestId('routine-detail-duplicate');
    this.delete = page.getByTestId('routine-detail-delete');
    this.deleteDialog = page.getByTestId('routine-detail-delete-dialog');
  }

  async goto(routineId: string): Promise<void> {
    await this.page.goto(`/trainer/routines/${routineId}`);
    await this.name.waitFor();
  }

  dayToggle(i: number): Locator {
    return this.page.getByTestId(`routine-day-toggle-${i}`);
  }

  dayContent(i: number): Locator {
    return this.page.getByTestId(`routine-day-content-${i}`);
  }

  async confirmDeleteDialog(): Promise<void> {
    const dialog = this.deleteDialog.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
}

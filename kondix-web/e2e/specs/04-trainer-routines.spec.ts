// Flow: see ../../../docs/flows/04-trainer-routines.md
//
// NOTE: the 4-step wizard was deleted in commit 5316c5a4 in favor of the new
// single-page Routine Editor. The wizard-specific tests (RT10-RT22 create,
// RT40-RT48 edit) were removed along with the page object. The remaining
// tests cover routine-list / detail / delete flows which are independent of
// the editor surface and still valid against the new UI.
import { test, expect } from '@playwright/test';
import { cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { setupActiveTrainer, createRoutineViaApi } from '../fixtures/auth';
import { RoutineListPage } from '../pages/trainer/routine-list.page';
import { RoutineDetailPage } from '../pages/trainer/routine-detail.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: trainer routines', () => {
  let tenantId: string | undefined;

  test.afterEach(async () => {
    if (tenantId) {
      await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
      tenantId = undefined;
    }
  });

  test('RT4: empty library shows empty state with CTA', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'rt-empty'));

    const list = new RoutineListPage(page);
    await list.goto();

    await expect(list.empty).toBeVisible();
    await expect(list.emptyNew).toBeVisible();
  });

  test('RT5-RT7: chip filter narrows cards to the selected category', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'rt-filter'));

    // Arrange: one Hipertrofia, one Fuerza
    await createRoutineViaApi(page, {
      name: 'Rutina A E2E',
      category: 'Hipertrofia',
      days: [{ name: 'Día 1', exercises: [{ name: 'Press' }] }],
    });
    await createRoutineViaApi(page, {
      name: 'Rutina B E2E',
      category: 'Fuerza',
      days: [{ name: 'Día 1', exercises: [{ name: 'Sentadilla' }] }],
    });

    const list = new RoutineListPage(page);
    await list.goto();

    // Both visible initially
    await expect(list.cardByName('Rutina A E2E')).toBeVisible();
    await expect(list.cardByName('Rutina B E2E')).toBeVisible();

    // Filter Hipertrofia
    await list.chip('Hipertrofia').click();
    await expect(list.cardByName('Rutina A E2E')).toBeVisible();
    await expect(list.cardByName('Rutina B E2E')).toHaveCount(0);

    // Back to all
    await list.chipAll.click();
    await expect(list.cardByName('Rutina B E2E')).toBeVisible();
  });

  test('RT30-RT34: detail view expands day accordion', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'rt-detail'));

    const routineId = await createRoutineViaApi(page, {
      name: 'Detail E2E',
      days: [{ name: 'Día 1', exercises: [{ name: 'Press banca' }] }],
    });

    const detail = new RoutineDetailPage(page);
    await detail.goto(routineId);

    await expect(detail.name).toContainText('Detail E2E');

    // Day is collapsed by default — toggle to expand
    await expect(detail.dayContent(0)).toHaveCount(0);
    await detail.dayToggle(0).click();
    await expect(detail.dayContent(0)).toContainText('Press banca');
  });

  test('RT50-RT56: delete with confirm removes the card', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'rt-del-yes'));

    const routineId = await createRoutineViaApi(page, {
      name: 'ToDelete E2E',
      days: [{ name: 'Día 1', exercises: [{ name: 'Press banca' }] }],
    });

    const list = new RoutineListPage(page);
    await list.goto();
    await expect(list.card(routineId)).toBeVisible();

    await list.clickDelete(routineId);
    await list.confirmDeleteDialog();

    await expect(list.card(routineId)).toHaveCount(0);
    await expect(list.cardByName('ToDelete E2E')).toHaveCount(0);
  });

  test('RT57: cancel on delete dialog leaves card intact', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'rt-del-no'));

    const routineId = await createRoutineViaApi(page, {
      name: 'KeepMe E2E',
      days: [{ name: 'Día 1', exercises: [{ name: 'Press banca' }] }],
    });

    const list = new RoutineListPage(page);
    await list.goto();
    await list.clickDelete(routineId);

    // Cancel via the dialog's backdrop/Cancelar button
    const dialog = list.deleteDialog.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await dialog.waitFor({ state: 'hidden' });

    // Card still there
    await expect(list.card(routineId)).toBeVisible();
  });
});

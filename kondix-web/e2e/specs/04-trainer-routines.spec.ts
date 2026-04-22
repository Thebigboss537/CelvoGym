// Flow: see ../../../docs/flows/04-trainer-routines.md
import { test, expect } from '@playwright/test';
import { cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { setupActiveTrainer, createRoutineViaApi } from '../fixtures/auth';
import { RoutineListPage } from '../pages/trainer/routine-list.page';
import { RoutineWizardPage } from '../pages/trainer/routine-wizard.page';
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

  test('RT10-RT22: wizard create happy path adds routine to the list', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'rt-create'));

    const list = new RoutineListPage(page);
    await list.goto();
    await list.emptyNew.click();
    await expect(page).toHaveURL(/\/trainer\/routines\/new/);

    const wizard = new RoutineWizardPage(page);
    await wizard.name.waitFor();

    // Step 1: name + category
    await wizard.name.fill('Push Pull E2E');
    await wizard.selectCategory('Hipertrofia');
    await wizard.next.click();

    // Step 2: day name
    await wizard.dayName(0).fill('Día 1');
    await wizard.next.click();

    // Step 3: fresh wizard starts with exercise 0-0 collapsed; expand it.
    // Wait for either the toggle (collapsed) or name input (expanded) to confirm
    // step 3 is fully rendered before interacting.
    await wizard.exerciseToggle(0, 0).or(wizard.exerciseName(0, 0)).first().waitFor();
    if (await wizard.exerciseToggle(0, 0).isVisible()) {
      await wizard.exerciseToggle(0, 0).click();
    }
    await wizard.exerciseName(0, 0).fill('Press banca');
    await wizard.setReps(0, 0, 0).fill('10');
    await wizard.setWeight(0, 0, 0).fill('60');
    await wizard.next.click();

    // Step 4: save
    await wizard.save.click();

    // Assert: landed on list, card visible
    await expect(page).toHaveURL(/\/trainer\/routines$/);
    await expect(list.cardByName('Push Pull E2E')).toBeVisible();
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

  test('RT40-RT48: edit renames routine via wizard full-replace', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'rt-edit'));

    const routineId = await createRoutineViaApi(page, {
      name: 'Before E2E',
      days: [{ name: 'Día 1', exercises: [{ name: 'Press banca' }] }],
    });

    // Open the wizard in edit mode directly
    const wizard = new RoutineWizardPage(page);
    await wizard.gotoEdit(routineId);

    // Step 1: rename
    await wizard.name.fill('After E2E');
    await wizard.next.click();

    // Step 2: pass through
    await wizard.next.click();

    // Step 3: pass through
    await wizard.next.click();

    // Step 4: save
    await wizard.save.click();

    // Assert: back on list with renamed card
    await expect(page).toHaveURL(/\/trainer\/routines$/);
    const list = new RoutineListPage(page);
    await expect(list.cardByName('After E2E')).toBeVisible();
    await expect(list.cardByName('Before E2E')).toHaveCount(0);
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

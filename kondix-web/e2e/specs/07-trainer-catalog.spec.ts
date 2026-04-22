// Flow: see ../../../docs/flows/07-trainer-catalog.md
import { test, expect } from '@playwright/test';
import { cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { setupActiveTrainer } from '../fixtures/auth';
import { CatalogListPage } from '../pages/trainer/catalog-list.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: trainer catalog', () => {
  let tenantId: string | undefined;

  test.afterEach(async () => {
    if (tenantId) {
      await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
      tenantId = undefined;
    }
  });

  test('CA1-CA4: empty library shows empty state', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'cat-empty'));

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    await expect(catalog.empty).toBeVisible();
    await expect(catalog.empty).toContainText('Tu biblioteca está vacía');
  });

  test('CA10-CA16: create exercise renders new card', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'cat-create'));

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Press banca E2E', 'Pecho');

    // Empty state disappears; a card with the name is visible
    await expect(catalog.empty).toBeHidden();
    const newCard = catalog.cardByName('Press banca E2E');
    await expect(newCard).toBeVisible();
    await expect(newCard).toContainText('Pecho');
  });

  test('CA20-CA25: edit exercise updates card', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'cat-edit'));

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    // Arrange
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Sentadilla E2E', 'Piernas');
    await expect(catalog.cardByName('Sentadilla E2E')).toBeVisible();

    // Act
    await catalog.openEdit('Sentadilla E2E');
    await catalog.formName.fill('Sentadilla libre E2E');
    await catalog.formSubmit.click();
    await catalog.form.waitFor({ state: 'detached' });

    // Assert
    await expect(catalog.cardByName('Sentadilla libre E2E')).toBeVisible();
    await expect(catalog.cardByName('Sentadilla E2E')).toHaveCount(0);
  });

  test('CA6-CA7: muscle-group chip filters list', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'cat-filter'));

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    // Arrange: one Pecho, one Piernas
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Bench E2E', 'Pecho');
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Squat E2E', 'Piernas');

    // Act: filter Pecho
    await catalog.selectChip('Pecho');

    // Assert: only Pecho card visible
    await expect(catalog.cardByName('Bench E2E')).toBeVisible();
    await expect(catalog.cardByName('Squat E2E')).toHaveCount(0);

    // Switch back to Todos
    await catalog.selectChip('Todos');
    await expect(catalog.cardByName('Squat E2E')).toBeVisible();
  });

  test('CA30-CA35: delete with confirmation removes card', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'cat-delete'));

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    // Arrange
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Remo E2E', 'Espalda');
    const card = catalog.cardByName('Remo E2E');
    await expect(card).toBeVisible();

    // Act
    await card.hover();
    const cardTestid = await card.getAttribute('data-testid');
    const exerciseId = cardTestid!.replace('catalog-card-', '');
    await catalog.deleteButton(exerciseId).click();

    await catalog.confirmDeleteDialog();

    // Assert
    await expect(catalog.cardByName('Remo E2E')).toHaveCount(0);
  });
});

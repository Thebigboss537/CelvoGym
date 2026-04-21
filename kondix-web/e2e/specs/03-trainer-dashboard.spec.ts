// Flow: see ../../../docs/flows/03-trainer-dashboard.md
import { test, expect } from '@playwright/test';
import { cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { setupActiveTrainer } from '../fixtures/auth';
import { DashboardPage } from '../pages/trainer/dashboard.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: trainer dashboard', () => {
  let tenantId: string | undefined;

  test.afterEach(async () => {
    if (tenantId) {
      await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
      tenantId = undefined;
    }
  });

  test('DA1-DA5: empty dashboard renders with zero stats for a fresh trainer', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'dash-empty'));

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.greeting).toBeVisible();
    await expect(dashboard.statActiveStudents).toContainText('0');
    await expect(dashboard.statActiveWeek).toContainText('0');
    await expect(dashboard.statActivePrograms).toContainText('0');
    await expect(dashboard.statAdherence).toContainText('—');
    await expect(dashboard.activityEmpty).toBeVisible();
    await expect(dashboard.alertsEmpty).toBeVisible();
  });

  test('DA10-DA11: quick action "Crear rutina" navigates to wizard', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'dash-qa-rt'));

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickCreateRoutine();

    await expect(page).toHaveURL(/\/trainer\/routines\/new/);
  });

  test('DA12-DA13: quick action "Crear programa" navigates to form', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'dash-qa-pg'));

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickCreateProgram();

    await expect(page).toHaveURL(/\/trainer\/programs\/new/);
  });

  test('DA14-DA15: quick action "Invitar alumno" navigates to students', async ({ page }) => {
    ({ tenantId } = await setupActiveTrainer(page, 'dash-qa-st'));

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickInviteStudent();

    await expect(page).toHaveURL(/\/trainer\/students/);
  });
});

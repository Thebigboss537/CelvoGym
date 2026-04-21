// kondix-web/e2e/specs/02-onboarding-trainer.spec.ts
// Flow: see ../../../docs/flows/02-onboarding-trainer.md
import { test, expect } from '@playwright/test';
import { makeTrainer } from '../fixtures/test-users';
import { approveTrainer, cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { readTenantIdFromCookies } from '../fixtures/auth';
import { RegisterPage } from '../pages/shared/register.page';
import { TrainerSetupPage } from '../pages/onboarding/trainer-setup.page';
import { PendingApprovalPage } from '../pages/onboarding/pending-approval.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: trainer onboarding setup', () => {
  test('ON1-ON9: fill form → pending screen', async ({ page }) => {
    const trainer = makeTrainer('onb-setup');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);

    const setup = new TrainerSetupPage(page);
    await setup.waitForLoaded();
    await setup.submit(trainer.displayName, 'Coach bio for E2E');

    await expect(page).toHaveURL(/\/onboarding\/pending/);

    if (tenantId) await cleanupTenant(tenantId);
  });
});

test.describe('Flow: pending approval loop', () => {
  test('ON22-ON27 stays on pending when not approved', async ({ page }) => {
    const trainer = makeTrainer('onb-stay');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);

    const setup = new TrainerSetupPage(page);
    await setup.waitForLoaded();
    await setup.submit(trainer.displayName);

    const pending = new PendingApprovalPage(page);
    await pending.waitForLoaded();
    await pending.clickCheckStatus();

    // Still pending → remain on same URL
    await expect(page).toHaveURL(/\/onboarding\/pending/);

    if (tenantId) await cleanupTenant(tenantId);
  });

  test('ON22-ON25 navigates to /trainer after admin approves', async ({ page }) => {
    const trainer = makeTrainer('onb-approve');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);

    const setup = new TrainerSetupPage(page);
    await setup.waitForLoaded();
    await setup.submit(trainer.displayName);

    const pending = new PendingApprovalPage(page);
    await pending.waitForLoaded();

    // Admin approves out-of-band
    if (tenantId) await approveTrainer(tenantId);

    await pending.clickCheckStatus();
    await expect(page).toHaveURL(/\/trainer(\/|$)/);

    if (tenantId) await cleanupTenant(tenantId);
  });

  test('ON28-ON30 logout from pending returns to /auth/login', async ({ page }) => {
    const trainer = makeTrainer('onb-logout');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);

    const setup = new TrainerSetupPage(page);
    await setup.waitForLoaded();
    await setup.submit(trainer.displayName);

    const pending = new PendingApprovalPage(page);
    await pending.waitForLoaded();
    await pending.clickLogout();

    await expect(page).toHaveURL(/\/auth\/login/);

    // Post-logout, cookies are cleared; cleanup still possible via internal API
    if (tenantId) await cleanupTenant(tenantId);
  });
});

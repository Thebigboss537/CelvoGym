// kondix-web/e2e/specs/01-auth.spec.ts
// Flow: see ../../../docs/flows/01-auth.md
// Scope note: this spec covers register (AU1-AU10, AU3/AU4),
// login no_profile branch (AU20-AU28), login pending_approval branch
// (AU29), login active branch (AU30), and protected route redirect
// (AU80-AU82). Logout (AU60-AU64) and student login (AU40-AU47) are
// deferred to the Phase-2 plan that also covers onboarding UI.
import { test, expect } from '@playwright/test';
import { makeTrainer, makeStudent } from '../fixtures/test-users';
import { approveTrainer, cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { completeTrainerSetup, readTenantIdFromCookies, inviteStudent, registerStudentViaInvite } from '../fixtures/auth';
import { RegisterPage } from '../pages/shared/register.page';
import { LoginPage } from '../pages/shared/login.page';
import { ShellPage } from '../pages/shared/shell.page';

// Clear CelvoGuard rate-limit keys before every test so that multiple
// register calls in the same session don't trip the 3/hour per-IP cap.
test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: trainer registration', () => {
  test('AU1-AU10 happy path: register → onboarding setup', async ({ page }) => {
    const trainer = makeTrainer('auth-reg');
    const register = new RegisterPage(page);
    let tenantId: string | undefined;

    await test.step('AU1: visit /auth/register', async () => {
      await register.goto();
    });

    await test.step('AU2-AU5: fill form + submit', async () => {
      await register.submit(trainer);
    });

    await test.step('AU10: landed on /onboarding/setup', async () => {
      await expect(page).toHaveURL(/\/onboarding\/setup/);
      tenantId = await readTenantIdFromCookies(page);
    });

    await test.step('cleanup', async () => {
      if (tenantId) await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
    });
  });

  test('AU3/AU4: mismatched passwords disable submit', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();
    await register.displayName.fill('Mismatch User');
    await register.email.fill(`trainer-mismatch-${Date.now()}@e2e.test`);
    await register.password.fill('Test1234!');
    await register.confirm.fill('Different!');
    await expect(register.submitBtn).toBeDisabled();
  });
});

test.describe('Flow: trainer login branches', () => {
  test('AU28 no_profile: newly-registered login → /onboarding/setup', async ({ page }) => {
    const trainer = makeTrainer('auth-noprofile');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await expect(page).toHaveURL(/\/onboarding\/setup/);

    if (tenantId) await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
  });

  test('AU29 pending_approval: after setup, login → /onboarding/pending', async ({ page }) => {
    const trainer = makeTrainer('auth-pending');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);

    // Trainer row now exists (via helper) but IsApproved is still false.
    await completeTrainerSetup(page, trainer.displayName);
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await expect(page).toHaveURL(/\/onboarding\/pending/);

    if (tenantId) await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
  });

  test('AU30 active: after setup + approval, login → /trainer', async ({ page }) => {
    const trainer = makeTrainer('auth-active');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);
    await completeTrainerSetup(page, trainer.displayName);
    if (tenantId) await approveTrainer(tenantId);
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await expect(page).toHaveURL(/\/trainer(\/|$)/);

    if (tenantId) await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
  });
});

test.describe('Flow: protected route redirect', () => {
  test('AU80-AU82: unauthenticated /trainer → /auth/login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/trainer');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Flow: student login (tenant-scoped)', () => {
  test('AU40-AU47: student with tenantId in URL logs into /workout', async ({ page, context }) => {
    const trainer = makeTrainer('auth-studlogin');
    const student = makeStudent('auth-studlogin');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);
    await completeTrainerSetup(page, trainer.displayName);
    if (tenantId) await approveTrainer(tenantId);

    const token = await inviteStudent(page, student.email, student.firstName);
    await page.context().clearCookies();

    await registerStudentViaInvite(
      context,
      token,
      student.email,
      student.password,
      student.firstName,
    );
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.gotoAsStudent(tenantId!);
    await login.submitCredentials(student.email, student.password);

    await expect(page).toHaveURL(/\/workout/);

    if (tenantId) await cleanupTenant(tenantId);
  });
});

test.describe('Flow: trainer logout', () => {
  test('AU60-AU64: active trainer logs out via sidebar', async ({ page }) => {
    const trainer = makeTrainer('auth-logout');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);
    await completeTrainerSetup(page, trainer.displayName);
    if (tenantId) await approveTrainer(tenantId);
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await expect(page).toHaveURL(/\/trainer(\/|$)/);

    const shell = new ShellPage(page);
    await shell.logoutAsTrainer();

    await expect(page).toHaveURL(/\/auth\/login/);

    if (tenantId) await cleanupTenant(tenantId);
  });
});

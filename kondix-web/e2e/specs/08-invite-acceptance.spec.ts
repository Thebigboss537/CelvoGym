// kondix-web/e2e/specs/08-invite-acceptance.spec.ts
// Flow: see ../../../docs/flows/08-invite-acceptance.md
import { test, expect } from '@playwright/test';
import { makeTrainer, makeStudent } from '../fixtures/test-users';
import { approveTrainer, cleanupTenant, clearRateLimits } from '../fixtures/seed';
import {
  completeTrainerSetup,
  readTenantIdFromCookies,
  inviteStudent,
} from '../fixtures/auth';
import { RegisterPage } from '../pages/shared/register.page';
import { LoginPage } from '../pages/shared/login.page';
import { AcceptInvitePage } from '../pages/shared/accept-invite.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: invite acceptance', () => {
  test('IN1-IN4: invalid token shows error', async ({ page }) => {
    const invite = new AcceptInvitePage(page);
    await invite.gotoWithToken('not-a-real-token-xyz');
    await expect(invite.error).toBeVisible();
  });

  test('IN1-IN19 happy path: open link → accept → lands on /workout', async ({ page }) => {
    // Arrange: approved trainer
    const trainer = makeTrainer('inv-happy');
    const student = makeStudent('inv-happy');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);
    await completeTrainerSetup(page, trainer.displayName);
    if (tenantId) await approveTrainer(tenantId);

    // Re-login so the session carries gym:manage (issued post-approval).
    // The JWT from registration lacks the permission until CelvoGuard issues
    // a fresh token after the trainer is approved (same pattern as AU30).
    await page.context().clearCookies();
    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await page.waitForURL(/\/trainer(\/|$)/);

    // Act: trainer creates an invite
    const token = await inviteStudent(page, student.email, student.firstName);

    // Switch to a fresh browser context for the student
    await page.context().clearCookies();

    const invite = new AcceptInvitePage(page);
    await invite.gotoWithToken(token);
    await invite.displayName.waitFor();

    await invite.submit(student.firstName, student.password);
    await invite.success.waitFor();
    await invite.goToWorkout();

    await expect(page).toHaveURL(/\/workout/);

    // Cleanup
    if (tenantId) await cleanupTenant(tenantId);
  });
});

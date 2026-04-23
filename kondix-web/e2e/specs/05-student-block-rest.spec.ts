// Phase 4 of exercise-catalog-and-block-refactor plan.
// Regression test for the block-level rest bug: when a Superset/Triset/Circuit
// group has >1 exercise, completing the last set in a round must fire the
// group.restSeconds timer, not the just-completed set's restSeconds.
//
// Note on naming: this phase ships before Phase 2 (block/blockType rename), so
// the data model still uses `groups` / `groupType` at the API boundary.
import { test, expect } from '@playwright/test';
import { cleanupTenant, clearRateLimits } from '../fixtures/seed';
import {
  setupActiveTrainer,
  createRoutineWithBlocksViaApi,
  createProgramViaApi,
  assignProgramViaApi,
  inviteStudent,
  registerStudentViaInvite,
} from '../fixtures/auth';
import { makeStudent } from '../fixtures/test-users';
import { LoginPage } from '../pages/shared/login.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: student block-level rest', () => {
  let tenantId: string | undefined;

  test.afterEach(async () => {
    if (tenantId) {
      await cleanupTenant(tenantId).catch(() => { /* best-effort */ });
      tenantId = undefined;
    }
  });

  test('block rest fires after completing a superset round', async ({ page, browser }) => {
    // Arrange: approved trainer, routine with a Superset block, program, and
    // student with that program assigned. Routines are shaped as a single-day
    // routine with one Superset group of 2 exercises × 2 sets each, and a
    // block-level rest of 90 seconds so the assertion looks for "1:30".
    const { trainer, tenantId: tid } = await setupActiveTrainer(page, 'br');
    tenantId = tid;

    // Set-level restSeconds is explicitly 30s on both exercises; the GROUP
    // restSeconds is 90s. Without the Phase 4 fix, the student screen would
    // always use the set's 30s rest (falling back to group only when the
    // set's value is null). With the fix, finishing the last exercise in a
    // round of a multi-exercise group must use the group's 90s rest — which
    // renders as "1:30" in the timer.
    const routineId = await createRoutineWithBlocksViaApi(page, {
      name: 'Superset Rest E2E',
      days: [
        {
          name: 'Día A',
          groups: [
            {
              groupType: 'Superset',
              restSeconds: 90,
              exercises: [
                {
                  name: 'Press banca',
                  sets: [
                    { targetReps: '10', targetWeight: '60', restSeconds: 30 },
                    { targetReps: '10', targetWeight: '60', restSeconds: 30 },
                  ],
                },
                {
                  name: 'Remo barra',
                  sets: [
                    { targetReps: '10', targetWeight: '50', restSeconds: 30 },
                    { targetReps: '10', targetWeight: '50', restSeconds: 30 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const programId = await createProgramViaApi(page, {
      name: 'Programa Superset E2E',
      durationWeeks: 4,
      routines: [{ routineId, label: 'A' }],
    });

    // Trainer invites a student, who registers via the invite. Switch to a
    // fresh browser context so the trainer session is preserved on the
    // original page for the subsequent assignProgram call.
    const studentCreds = makeStudent('br');
    const token = await inviteStudent(page, studentCreds.email, studentCreds.firstName);

    const studentContext = await browser.newContext();
    const { studentId } = await registerStudentViaInvite(
      studentContext,
      token,
      studentCreds.email,
      studentCreds.password,
      studentCreds.firstName,
    );

    // Assign the program (on the trainer's page) so next-workout resolves.
    await assignProgramViaApi(page, { programId, studentId });

    // Act: log the student in in a fresh page and drive the workout flow.
    const studentPage = await studentContext.newPage();
    const login = new LoginPage(studentPage);
    await login.gotoAsStudent(tenantId);
    await login.submitCredentials(studentCreds.email, studentCreds.password);
    await studentPage.waitForURL(/\/workout(\/|$)/);

    // Jump straight to the workout overview — the home "Empezar" CTA just
    // navigates here, and the overview auto-starts a session on load.
    await studentPage.goto('/workout/session/overview');
    await studentPage.waitForURL(/\/workout\/session\/overview/);
    await studentPage.getByRole('button', { name: /Continuar ejercicio/ }).click();
    await studentPage.waitForURL(/\/workout\/session\/exercise\/0/);

    // Round 1 — exercise A set 1
    await completeFirstActiveSet(studentPage, 60, 10);

    // Navigate to exercise B (index 1) to finish the round. The overview
    // picks currentExerciseIndex automatically, but by URL we bypass UI state.
    await studentPage.goto(studentPage.url().replace('/exercise/0', '/exercise/1'));
    await studentPage.waitForURL(/\/workout\/session\/exercise\/1/);

    // Round 1 — exercise B set 1. This is the last exercise of a multi-
    // exercise Superset block, so completing it must fire the *group*
    // restSeconds (90s → "1:30"), not the set-level restSeconds.
    await completeFirstActiveSet(studentPage, 50, 10);

    await expect(studentPage.locator('kx-rest-timer')).toContainText('1:30');

    // Cleanup extras
    await studentContext.close();
    // Trainer credentials are kept in `trainer` for symmetry with future
    // specs that may add more assertions; no usage here.
    void trainer;
  });
});

/**
 * Completes the first active set-row on the current exercise-logging page:
 * fills KG + REPS, then clicks the complete button. The set-row emits
 * `complete` only when both kg and reps are numeric; the UI hides the
 * button on any non-active row, so we always target the first visible
 * "Completar serie" button.
 *
 * The row's `(input)` handler POSTs to /public/my/sets/update and the UI
 * only reflects the typed value after the response echoes back. If we press
 * Complete before that round-trip finishes, `onComplete()` bails out because
 * kg()/reps() are still null. We therefore wait for each response before
 * moving on — simpler than polling the input value.
 */
async function completeFirstActiveSet(page: import('@playwright/test').Page, kg: number, reps: number): Promise<void> {
  const activeRow = page.locator('kx-set-row').filter({ has: page.getByRole('button', { name: /Completar serie/ }) }).first();
  await activeRow.waitFor();

  const inputs = activeRow.locator('input[type="number"]');

  const kgResponse = page.waitForResponse(r => r.url().endsWith('/public/my/sets/update') && r.request().method() === 'POST');
  await inputs.nth(0).fill(String(kg));
  await kgResponse;

  const repsResponse = page.waitForResponse(r => r.url().endsWith('/public/my/sets/update') && r.request().method() === 'POST');
  await inputs.nth(1).fill(String(reps));
  await repsResponse;

  await activeRow.getByRole('button', { name: /Completar serie/ }).click();
}

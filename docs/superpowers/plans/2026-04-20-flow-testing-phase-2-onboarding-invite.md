# Flow Testing — Phase 2 (Onboarding + Invite + Logout) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the flow-testing harness with three more flow files: trainer onboarding, student invite acceptance, and the logout + student-login branches that were deferred from Phase 1.

**Architecture:** Builds on the Phase-1 harness in `feat/flow-testing-phase-1`. Adds one missing UI piece (a logout action in the trainer shell), new `data-testid`s on existing screens, four new page objects, three new/extended Mermaid diagrams, and three new/extended Playwright specs.

**Tech Stack:** Same as Phase 1 — Angular 21, `@playwright/test` 1.59, Mermaid, .NET 10 Kondix API + CelvoGuard.

---

## File Structure

**Created:**
- `docs/flows/02-onboarding-trainer.md` — diagrams for setup form + pending-approval loop + logout-from-pending
- `docs/flows/08-invite-acceptance.md` — diagrams for invite link validation + accept flow + landing
- `kondix-web/e2e/pages/onboarding/trainer-setup.page.ts`
- `kondix-web/e2e/pages/onboarding/pending-approval.page.ts`
- `kondix-web/e2e/pages/shared/accept-invite.page.ts`
- `kondix-web/e2e/pages/shared/shell.page.ts` (deferred from Phase 1)
- `kondix-web/e2e/pages/student/profile.page.ts`
- `kondix-web/e2e/specs/02-onboarding-trainer.spec.ts`
- `kondix-web/e2e/specs/08-invite-acceptance.spec.ts`

**Modified:**
- `kondix-web/src/app/shared/layouts/trainer-shell.ts` — add logout action + `data-testid`
- `kondix-web/src/app/features/onboarding/feature/trainer-setup.ts` — add `data-testid`s
- `kondix-web/src/app/features/onboarding/feature/pending-approval.ts` — add `data-testid`s
- `kondix-web/src/app/features/student/feature/profile.ts` — add `data-testid="student-logout"` on the logout button
- `kondix-web/src/app/features/invite/feature/accept-invite.ts` — add `data-testid`s
- `kondix-web/e2e/fixtures/auth.ts` — add `inviteStudent(page, email, firstName?)` and `registerStudentViaInvite(page, token, student)` helpers
- `kondix-web/e2e/fixtures/seed.ts` — add `cleanupInvitationsByEmail(email)` (no internal endpoint needed, uses psql-free path) — actually skip: Phase-1 cleanupTenant already cascades via FK, see Task 10
- `kondix-web/e2e/specs/01-auth.spec.ts` — add AU40-AU47 (student login) and AU60-AU64 (logout) tests
- `docs/flows/00-inventory.md` — update status of covered flows from Pending → Planned (for this plan's flows) or Planned → Done once green

---

## Task 1: Add logout action to the trainer shell

**Goal:** The trainer shell (left sidebar desktop / bottom nav mobile) currently has no logout UI. We need one to test AU60-AU64 for an authenticated trainer. Add a small logout control to the sidebar footer (desktop) and as a last item in the bottom nav (mobile), both wired to `authStore.logout()`.

**Files:**
- Modify: `kondix-web/src/app/shared/layouts/trainer-shell.ts`

- [ ] **Step 1: Inspect current shell structure**

```bash
cat kondix-web/src/app/shared/layouts/trainer-shell.ts
```

The shell uses `<kx-sidebar>` (desktop) and `<kx-bottom-nav>` (mobile). It has a `userName` computed signal.

- [ ] **Step 2: Add a logout button in the sidebar footer area**

Locate the desktop sidebar section in the template. The `<kx-sidebar>` component should either expose a footer slot or be wrapped with a sibling element. The simplest, least-invasive change: add a small button BELOW the `<kx-sidebar>` inside its container:

```html
<!-- In the desktop sidebar container (hidden md:flex) -->
<button
  (click)="logout()"
  data-testid="trainer-logout"
  class="mx-3 mb-3 mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-border/40 transition">
  <span class="text-base">🚪</span>
  Cerrar sesión
</button>
```

For the mobile bottom-nav side: bottom-nav typically shows 4 tabs (home/routines/programs/students). Don't add logout there — a mobile user logs out via a profile/menu screen, which for trainers doesn't exist in the MVP. The sidebar button above is sufficient for this test, and we document in a diagram note that mobile logout is unavailable in the current UI.

Add a `logout()` method to the component class:

```ts
logout() {
  this.authStore.logout();
}
```

Read the existing `trainer-shell.ts` to confirm the exact injection of `AuthStore` — it should already be injected for `userName`. If not, add it.

- [ ] **Step 3: Verify the app still builds**

```bash
cd kondix-web && npm run build 2>&1 | tail -10 && cd ..
```

Expected: `Application bundle generation complete.`

- [ ] **Step 4: Manual smoke — open the app and confirm the button renders**

Optional: start `ng serve` and visit `/trainer` (as an active trainer) to eyeball the button. Not mandatory since Playwright covers it in Task 11.

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/shared/layouts/trainer-shell.ts
git commit -m "feat(ui): add logout action to trainer sidebar"
```

---

## Task 2: Add `data-testid`s to onboarding + profile + accept-invite screens

**Files:**
- Modify: `kondix-web/src/app/features/onboarding/feature/trainer-setup.ts`
- Modify: `kondix-web/src/app/features/onboarding/feature/pending-approval.ts`
- Modify: `kondix-web/src/app/features/student/feature/profile.ts`
- Modify: `kondix-web/src/app/features/invite/feature/accept-invite.ts`

- [ ] **Step 1: Onboarding setup testids**

In `trainer-setup.ts`, add attributes (only the `data-testid` — keep styling/bindings intact):

- `<input [(ngModel)]="displayName">` → `data-testid="onboarding-displayname"`
- `<textarea [(ngModel)]="bio">` → `data-testid="onboarding-bio"`
- Submit `<button type="submit">` → `data-testid="onboarding-submit"`
- The `@if (error())` `<p>` → `data-testid="onboarding-error"`

- [ ] **Step 2: Pending approval testids**

In `pending-approval.ts`:

- The success panel root `<div class="bg-success-dark ...">` (around line 19) → `data-testid="pending-panel"`
- The "Verificar estado" `<button (click)="checkStatus()">` → `data-testid="pending-check-status"`
- The "Cerrar sesión" `<button (click)="logout()">` → `data-testid="onboarding-logout"`
- The `<p>` inside `@if (checkError())` → `data-testid="pending-check-error"`

- [ ] **Step 3: Student profile logout testid**

In `profile.ts`, on the existing `<button (click)="authStore.logout()">` (around line 112), add `data-testid="student-logout"`.

- [ ] **Step 4: Accept-invite testids**

In `accept-invite.ts`:

- Loading block (the `@if (loading())` wrapping `<div>`) → `data-testid="invite-loading"`
- Error block (`@else if (error())` `<p>`) → `data-testid="invite-error"`
- The name `<input [(ngModel)]="displayName">` → `data-testid="invite-displayname"`
- The password `<input [(ngModel)]="password">` → `data-testid="invite-password"`
- Submit `<button type="submit">` → `data-testid="invite-submit"`
- `@if (acceptError())` `<p>` → `data-testid="invite-accept-error"`
- Success panel wrapping `<div class="bg-success-dark ...">` inside `@if (accepted())` → `data-testid="invite-success"`
- Success "Ver mis rutinas" `<button (click)="goToWorkout()">` → `data-testid="invite-goto-workout"`

- [ ] **Step 5: Verify build**

```bash
cd kondix-web && npm run build 2>&1 | tail -5 && cd ..
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add kondix-web/src/app/features/onboarding/feature/trainer-setup.ts \
        kondix-web/src/app/features/onboarding/feature/pending-approval.ts \
        kondix-web/src/app/features/student/feature/profile.ts \
        kondix-web/src/app/features/invite/feature/accept-invite.ts
git commit -m "chore(ui): add data-testids to onboarding, profile, and invite screens"
```

---

## Task 3: Fixture helpers for invite + student-login

**Goal:** Add two helpers: `inviteStudent(page, email, firstName?)` (called from a logged-in trainer context) returning the raw invite token, and `registerStudentViaInvite(page, token, email, password)` (uses CelvoGuard enduser/register + the public accept endpoint) to cover the student invite-acceptance path when a spec needs a pre-logged-in student.

**Files:**
- Modify: `kondix-web/e2e/fixtures/auth.ts`

- [ ] **Step 1: Add `inviteStudent` helper**

In `kondix-web/e2e/fixtures/auth.ts`, append the following:

```ts
/**
 * Invites a student via the real POST /api/v1/students/invite endpoint,
 * authenticated by the current page's trainer cookies. Returns the raw
 * invite token (not the URL). The trainer must be approved and active
 * before calling this — otherwise the endpoint returns 403.
 *
 * CSRF: Kondix's csrf middleware requires the cg-csrf-kondix cookie
 * echoed back as X-CSRF-Token header.
 */
export async function inviteStudent(
  page: Page,
  email: string,
  firstName?: string,
): Promise<string> {
  const cookies = await page.context().cookies();
  const csrfRaw = cookies.find(c => c.name === 'cg-csrf-kondix')?.value;
  if (!csrfRaw) {
    throw new Error(
      'cg-csrf-kondix cookie missing — trainer must be logged in first',
    );
  }
  const csrf = decodeURIComponent(csrfRaw);

  const cookieHeader = cookies
    .filter(c => c.name.startsWith('cg-'))
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // Use native fetch (page.request drops Cookie header as forbidden)
  const res = await fetch(`${API}/api/v1/students/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ email, firstName: firstName ?? null }),
  });
  if (!res.ok) {
    throw new Error(`inviteStudent failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}
```

- [ ] **Step 2: Add `registerStudentViaInvite` helper**

Append to the same file:

```ts
import type { BrowserContext } from '@playwright/test';

/**
 * Completes the student invite-acceptance flow programmatically:
 * 1) CelvoGuard endUser register with the invited email + tenantId
 * 2) Kondix public/invite/{token}/accept to bind the student to the trainer
 *
 * Leaves the browser context with the student's cookies set, so the
 * student is effectively logged in. Use this when a spec needs an
 * authenticated student without going through the UI flow.
 */
export async function registerStudentViaInvite(
  context: BrowserContext,
  token: string,
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  const GUARD = process.env.E2E_GUARD_URL ?? 'http://localhost:5050';

  // Load invitation info to discover tenantId
  const infoRes = await fetch(
    `${API}/api/v1/public/invite/${encodeURIComponent(token)}`,
  );
  if (!infoRes.ok) {
    throw new Error(`invite info load failed: ${infoRes.status}`);
  }
  const info = (await infoRes.json()) as { tenantId: string };

  // Register in CelvoGuard (receives Set-Cookie with cg-* cookies)
  const regRes = await fetch(`${GUARD}/api/v1/enduser/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-App-Slug': 'kondix' },
    body: JSON.stringify({
      email,
      password,
      firstName: displayName,
      tenantId: info.tenantId,
    }),
  });
  if (!regRes.ok) {
    throw new Error(`enduser register failed: ${regRes.status} ${await regRes.text()}`);
  }
  const userData = (await regRes.json()) as { user: { id: string } };

  // Copy the Set-Cookie headers into the Playwright context
  const setCookieList = regRes.headers.getSetCookie?.() ??
    (regRes.headers.get('set-cookie')?.split(',') ?? []);
  for (const raw of setCookieList) {
    const pair = raw.split(';')[0];
    const [name, value] = pair.split('=');
    if (!name || !value) continue;
    await context.addCookies([
      {
        name: name.trim(),
        value: value.trim(),
        domain: 'localhost',
        path: '/',
        httpOnly: name.includes('access') || name.includes('refresh'),
        secure: false,
      },
    ]);
  }

  // Accept invitation server-side (binds student to trainer in gym schema)
  const acceptRes = await fetch(
    `${API}/api/v1/public/invite/${encodeURIComponent(token)}/accept`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        celvoGuardUserId: userData.user.id,
        displayName,
      }),
    },
  );
  if (!acceptRes.ok) {
    throw new Error(`invite accept failed: ${acceptRes.status} ${await acceptRes.text()}`);
  }
}
```

- [ ] **Step 3: Verify the file compiles as part of running other existing specs**

```bash
cd kondix-web && npx playwright test specs/01-auth.spec.ts --project=chromium 2>&1 | tail -10
```

Expected: still 6 passed. (Adding exports doesn't affect existing tests.)

- [ ] **Step 4: Commit**

```bash
git add kondix-web/e2e/fixtures/auth.ts
git commit -m "chore(e2e): add inviteStudent + registerStudentViaInvite fixtures"
```

---

## Task 4: Page objects (onboarding, accept-invite, shell, profile)

**Files:**
- Create: `kondix-web/e2e/pages/onboarding/trainer-setup.page.ts`
- Create: `kondix-web/e2e/pages/onboarding/pending-approval.page.ts`
- Create: `kondix-web/e2e/pages/shared/accept-invite.page.ts`
- Create: `kondix-web/e2e/pages/shared/shell.page.ts`
- Create: `kondix-web/e2e/pages/student/profile.page.ts`

- [ ] **Step 1: TrainerSetupPage**

`kondix-web/e2e/pages/onboarding/trainer-setup.page.ts`:

```ts
import type { Page, Locator } from '@playwright/test';

export class TrainerSetupPage {
  readonly displayName: Locator;
  readonly bio: Locator;
  readonly submitBtn: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.displayName = page.getByTestId('onboarding-displayname');
    this.bio = page.getByTestId('onboarding-bio');
    this.submitBtn = page.getByTestId('onboarding-submit');
    this.error = page.getByTestId('onboarding-error');
  }

  async waitForLoaded(): Promise<void> {
    await this.displayName.waitFor();
  }

  async submit(displayName: string, bio = ''): Promise<void> {
    await this.displayName.fill(displayName);
    if (bio) await this.bio.fill(bio);
    await this.submitBtn.click();
  }
}
```

- [ ] **Step 2: PendingApprovalPage**

`kondix-web/e2e/pages/onboarding/pending-approval.page.ts`:

```ts
import type { Page, Locator } from '@playwright/test';

export class PendingApprovalPage {
  readonly panel: Locator;
  readonly checkStatusBtn: Locator;
  readonly logoutBtn: Locator;
  readonly checkError: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.getByTestId('pending-panel');
    this.checkStatusBtn = page.getByTestId('pending-check-status');
    this.logoutBtn = page.getByTestId('onboarding-logout');
    this.checkError = page.getByTestId('pending-check-error');
  }

  async waitForLoaded(): Promise<void> {
    await this.panel.waitFor();
  }

  async clickCheckStatus(): Promise<void> {
    await this.checkStatusBtn.click();
  }

  async clickLogout(): Promise<void> {
    await this.logoutBtn.click();
    await this.page.waitForURL(/\/auth\/login/);
  }
}
```

- [ ] **Step 3: AcceptInvitePage**

`kondix-web/e2e/pages/shared/accept-invite.page.ts`:

```ts
import type { Page, Locator } from '@playwright/test';

export class AcceptInvitePage {
  readonly loading: Locator;
  readonly error: Locator;
  readonly displayName: Locator;
  readonly password: Locator;
  readonly submitBtn: Locator;
  readonly acceptError: Locator;
  readonly success: Locator;
  readonly gotoWorkoutBtn: Locator;

  constructor(private readonly page: Page) {
    this.loading = page.getByTestId('invite-loading');
    this.error = page.getByTestId('invite-error');
    this.displayName = page.getByTestId('invite-displayname');
    this.password = page.getByTestId('invite-password');
    this.submitBtn = page.getByTestId('invite-submit');
    this.acceptError = page.getByTestId('invite-accept-error');
    this.success = page.getByTestId('invite-success');
    this.gotoWorkoutBtn = page.getByTestId('invite-goto-workout');
  }

  async gotoWithToken(token: string): Promise<void> {
    await this.page.goto(`/invite?token=${encodeURIComponent(token)}`);
    // Wait for either the form, the error, or the loading state to settle
    await this.page.waitForLoadState('networkidle');
  }

  async submit(displayName: string, password: string): Promise<void> {
    await this.displayName.fill(displayName);
    await this.password.fill(password);
    await this.submitBtn.click();
  }

  async goToWorkout(): Promise<void> {
    await this.gotoWorkoutBtn.click();
    await this.page.waitForURL(/\/workout/);
  }
}
```

- [ ] **Step 4: ShellPage (with logout methods)**

`kondix-web/e2e/pages/shared/shell.page.ts`:

```ts
import type { Page, Locator } from '@playwright/test';

export class ShellPage {
  readonly trainerLogout: Locator;
  readonly studentLogout: Locator;
  readonly onboardingLogout: Locator;

  constructor(private readonly page: Page) {
    this.trainerLogout = page.getByTestId('trainer-logout');
    this.studentLogout = page.getByTestId('student-logout');
    this.onboardingLogout = page.getByTestId('onboarding-logout');
  }

  async logoutAsTrainer(): Promise<void> {
    await this.trainerLogout.click();
    await this.page.waitForURL(/\/auth\/login/);
  }

  async logoutAsStudent(): Promise<void> {
    // Student logout lives on the profile screen
    await this.page.goto('/workout/profile');
    await this.studentLogout.waitFor();
    await this.studentLogout.click();
    await this.page.waitForURL(/\/auth\/login/);
  }

  async logoutFromOnboardingPending(): Promise<void> {
    await this.onboardingLogout.click();
    await this.page.waitForURL(/\/auth\/login/);
  }
}
```

- [ ] **Step 5: StudentProfilePage** (minimal — only what specs need)

`kondix-web/e2e/pages/student/profile.page.ts`:

```ts
import type { Page, Locator } from '@playwright/test';

export class StudentProfilePage {
  readonly logoutBtn: Locator;

  constructor(private readonly page: Page) {
    this.logoutBtn = page.getByTestId('student-logout');
  }

  async goto(): Promise<void> {
    await this.page.goto('/workout/profile');
    await this.logoutBtn.waitFor();
  }

  async logout(): Promise<void> {
    await this.logoutBtn.click();
    await this.page.waitForURL(/\/auth\/login/);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add kondix-web/e2e/pages
git commit -m "chore(e2e): add page objects for onboarding, invite, shell, student profile"
```

---

## Task 5: Diagram `docs/flows/02-onboarding-trainer.md`

**Files:**
- Create: `docs/flows/02-onboarding-trainer.md`

- [ ] **Step 1: Write the diagram file**

Create `docs/flows/02-onboarding-trainer.md`:

```markdown
# 02 — Onboarding Trainer

**Role:** onboarding
**Preconditions:** User registered in CelvoGuard but no active Trainer row in Kondix yet.
**Test:** [`specs/02-onboarding-trainer.spec.ts`](../../kondix-web/e2e/specs/02-onboarding-trainer.spec.ts)

## Flow: setup → pending

` ``mermaid
flowchart TD
  ON1[Visit /onboarding/setup] --> ON2[Fill displayName + optional bio]
  ON2 --> ON3[Click Continuar]
  ON3 --> ON4[[POST /api/v1/onboarding/trainer/setup]]
  ON4 --> ON5{Success?}
  ON5 -- No: "already exists" --> ON6[[GET /api/v1/onboarding/trainer/status]]
  ON6 --> ON7{status}
  ON7 -- active --> ON8[Navigate /trainer]
  ON7 -- pending --> ON9[Navigate /onboarding/pending]
  ON5 -- No: other error --> ON10[Show error message]
  ON5 -- Yes --> ON9
` ``

## Flow: pending-approval loop

` ``mermaid
flowchart TD
  ON20[Land on /onboarding/pending] --> ON21[See pending panel]
  ON21 --> ON22[Click Verificar estado]
  ON22 --> ON23[[GET /api/v1/onboarding/trainer/status]]
  ON23 --> ON24{status}
  ON24 -- active --> ON25[Navigate /trainer]
  ON24 -- no_profile --> ON26[Navigate /onboarding/setup]
  ON24 -- pending_approval --> ON27[Stay on /onboarding/pending]
  ON20 --> ON28[Click Cerrar sesión]
  ON28 --> ON29[[POST guard/auth/logout]]
  ON29 --> ON30[Redirect /auth/login]
` ``

## Nodes

| ID   | Type     | Description                                        |
|------|----------|----------------------------------------------------|
| ON1  | Action   | Navigate to `/onboarding/setup`                    |
| ON2  | Action   | Fill displayName + bio                             |
| ON3  | Action   | Click "Continuar"                                  |
| ON4  | API      | `POST /api/v1/onboarding/trainer/setup`            |
| ON5  | Decision | HTTP success                                       |
| ON6  | API      | `GET /api/v1/onboarding/trainer/status`            |
| ON7  | Decision | status branch (active/pending)                     |
| ON8  | Action   | Navigate `/trainer`                                |
| ON9  | Action   | Navigate `/onboarding/pending`                     |
| ON10 | State    | Error message shown                                |
| ON20 | State    | Pending panel rendered                             |
| ON21 | State    | User sees "Perfil creado" panel                    |
| ON22 | Action   | Click "Verificar estado"                           |
| ON23 | API      | `GET /api/v1/onboarding/trainer/status`            |
| ON24 | Decision | status branch                                      |
| ON25 | Action   | Navigate `/trainer` (now active)                   |
| ON26 | Action   | Navigate `/onboarding/setup` (profile disappeared) |
| ON27 | State    | Remain on `/onboarding/pending`                    |
| ON28 | Action   | Click "Cerrar sesión"                              |
| ON29 | API      | `POST guard/auth/logout`                           |
| ON30 | Action   | Redirect `/auth/login`                             |
```

Note: in the actual file, use real triple-backticks around mermaid blocks (the ` `` above is only to show them through this prompt's rendering).

- [ ] **Step 2: Commit**

```bash
git add docs/flows/02-onboarding-trainer.md
git commit -m "docs(flows): add 02-onboarding-trainer.md flow diagram"
```

---

## Task 6: Diagram `docs/flows/08-invite-acceptance.md`

**Files:**
- Create: `docs/flows/08-invite-acceptance.md`

- [ ] **Step 1: Write the diagram file**

Create `docs/flows/08-invite-acceptance.md`:

```markdown
# 08 — Invite Acceptance

**Role:** public → student
**Preconditions:** Approved/active trainer exists; they POSTed to `/api/v1/students/invite` which produced an invite token delivered via email.
**Test:** [`specs/08-invite-acceptance.spec.ts`](../../kondix-web/e2e/specs/08-invite-acceptance.spec.ts)

## Flow: open invite link

` ``mermaid
flowchart TD
  IN1[Visit /invite?token=...] --> IN2[[GET /api/v1/public/invite/:token]]
  IN2 --> IN3{Token valid?}
  IN3 -- No --> IN4[Show "invitación no válida" + link to login]
  IN3 -- Yes --> IN5[Render form with trainerName + readonly email]
` ``

## Flow: accept invite

` ``mermaid
flowchart TD
  IN10[Fill displayName + password] --> IN11[Click Aceptar invitación]
  IN11 --> IN12[[POST guard/enduser/register]]
  IN12 --> IN13{Success?}
  IN13 -- No --> IN14[Show guard error]
  IN13 -- Yes --> IN15[[POST /api/v1/public/invite/:token/accept]]
  IN15 --> IN16{Success?}
  IN16 -- No --> IN14
  IN16 -- Yes --> IN17[Show success panel]
  IN17 --> IN18[Click "Ver mis rutinas"]
  IN18 --> IN19[Navigate /workout]
` ``

## Nodes

| ID   | Type     | Description                                       |
|------|----------|---------------------------------------------------|
| IN1  | Action   | Navigate to `/invite?token=...`                   |
| IN2  | API      | `GET /api/v1/public/invite/:token`                |
| IN3  | Decision | Token valid (not expired, not used)               |
| IN4  | State    | Error panel with "invitación no válida"           |
| IN5  | State    | Form rendered with trainer name + readonly email  |
| IN10 | Action   | Fill displayName + password                       |
| IN11 | Action   | Click "Aceptar invitación"                        |
| IN12 | API      | `POST {guardUrl}/api/v1/enduser/register`         |
| IN13 | Decision | HTTP success                                      |
| IN14 | State    | Error shown                                       |
| IN15 | API     | `POST /api/v1/public/invite/:token/accept`        |
| IN16 | Decision | HTTP success                                      |
| IN17 | State    | Success panel: "ya estás dentro"                  |
| IN18 | Action   | Click "Ver mis rutinas"                           |
| IN19 | Action   | Navigate `/workout`                               |
```

- [ ] **Step 2: Commit**

```bash
git add docs/flows/08-invite-acceptance.md
git commit -m "docs(flows): add 08-invite-acceptance.md flow diagram"
```

---

## Task 7: Spec `02-onboarding-trainer.spec.ts`

**Files:**
- Create: `kondix-web/e2e/specs/02-onboarding-trainer.spec.ts`

- [ ] **Step 1: Preflight**

Same as Phase 1 smoke: CelvoGuard must be up on :5050, shared Postgres up, Kondix API in Development env (via launchSettings.json).

```bash
curl -sS -o /dev/null -w "guard: %{http_code}\n" --max-time 5 http://localhost:5050/api/v1/health
```

Expected: 200. If not, follow `docs/e2e-setup.md`.

- [ ] **Step 2: Write the spec**

```ts
// kondix-web/e2e/specs/02-onboarding-trainer.spec.ts
// Flow: see ../../../docs/flows/02-onboarding-trainer.md
import { test, expect } from '@playwright/test';
import { makeTrainer } from '../fixtures/test-users';
import { approveTrainer, cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { readTenantIdFromCookies } from '../fixtures/auth';
import { RegisterPage } from '../pages/shared/register.page';
import { LoginPage } from '../pages/shared/login.page';
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
```

- [ ] **Step 3: Run until green**

```bash
cd kondix-web && npx playwright test specs/02-onboarding-trainer.spec.ts --project=chromium 2>&1 | tail -40
```

Expected: **4 passed**. If any fails:
1. Read trace in `playwright-report/`.
2. Root-cause. Likely: testid mismatch, or `/onboarding/pending` URL pattern variations.
3. Fix the root cause (never weaken assertions).
4. Iterate, max 3 attempts. If still stuck, BLOCKED with trace output.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/e2e/specs/02-onboarding-trainer.spec.ts
git commit -m "test(e2e): add 02-onboarding-trainer spec (setup, pending loop, logout)"
```

---

## Task 8: Spec `08-invite-acceptance.spec.ts`

**Files:**
- Create: `kondix-web/e2e/specs/08-invite-acceptance.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
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
```

- [ ] **Step 2: Run until green**

```bash
cd kondix-web && npx playwright test specs/08-invite-acceptance.spec.ts --project=chromium 2>&1 | tail -40
```

Expected: **2 passed**.

Likely issues to root-cause:
- `inviteStudent` 403 → trainer not yet active (forgot `approveTrainer`)
- `inviteStudent` 404 → path wrong; confirm it's `/api/v1/students/invite` (POST) via StudentsController
- Invitation 404 on info endpoint → token URL-encoding issue; ensure `encodeURIComponent(token)` in `gotoWithToken`
- `/workout` redirect happens but page is empty → cookies not set; check Set-Cookie from `/enduser/register` is captured into context

Fix root causes. Iterate max 3. If stuck → BLOCKED with full trace.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/e2e/specs/08-invite-acceptance.spec.ts
git commit -m "test(e2e): add 08-invite-acceptance spec (invalid token, happy path)"
```

---

## Task 9: Extend `01-auth.spec.ts` with logout + student-login tests

**Files:**
- Modify: `kondix-web/e2e/specs/01-auth.spec.ts`

- [ ] **Step 1: Update imports at the top of `01-auth.spec.ts`**

Merge these imports into the existing import block (add any missing ones; do NOT remove existing imports):

```ts
import { test, expect } from '@playwright/test';
import { makeTrainer, makeStudent } from '../fixtures/test-users';
import { approveTrainer, cleanupTenant, clearRateLimits } from '../fixtures/seed';
import {
  completeTrainerSetup,
  readTenantIdFromCookies,
  inviteStudent,
  registerStudentViaInvite,
} from '../fixtures/auth';
import { RegisterPage } from '../pages/shared/register.page';
import { LoginPage } from '../pages/shared/login.page';
import { ShellPage } from '../pages/shared/shell.page';
```

If `clearRateLimits` is not already called in a `test.beforeEach` at the top of the file, add:

```ts
test.beforeEach(() => {
  clearRateLimits();
});
```

- [ ] **Step 2: Add student-login test (AU40-AU47) and trainer-logout test (AU60-AU64)**

At the bottom of `01-auth.spec.ts` (after the existing `describe` for protected route redirect), append:

```ts
test.describe('Flow: student login (tenant-scoped)', () => {
  test('AU40-AU47: student with tenantId in URL logs into /workout', async ({ page, context }) => {
    // Set up an approved trainer + invited student
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

    // Student accepts invite programmatically (out-of-band)
    await registerStudentViaInvite(
      context,
      token,
      student.email,
      student.password,
      student.firstName,
    );
    await page.context().clearCookies();

    // Act: student navigates to /auth/login?t=tenantId
    const login = new LoginPage(page);
    await login.gotoAsStudent(tenantId!);
    await login.submitCredentials(student.email, student.password);

    // Assert: landed on /workout
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
```

- [ ] **Step 2: Run the spec**

```bash
cd kondix-web && npx playwright test specs/01-auth.spec.ts --project=chromium 2>&1 | tail -40
```

Expected: **8 passed** (original 6 + 2 new).

Iterate root causes on any failure. Max 3 attempts.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/e2e/specs/01-auth.spec.ts
git commit -m "test(e2e): extend 01-auth spec with student login + trainer logout"
```

---

## Task 10: Update `docs/flows/00-inventory.md` statuses

**Files:**
- Modify: `docs/flows/00-inventory.md`

- [ ] **Step 1: Update the inventory**

Change the Status column for flows now covered:

- All `01-auth.md` rows: `Planned` → `Done`
- All `02-onboarding-trainer.md` rows: `Pending` → `Done`
- All `08-invite-acceptance.md` rows: `Pending` → `Done`

Example diff for the Public & Auth table — change all 6 rows' status from `Planned` to `Done`. For Onboarding and Invite Acceptance tables, flip `Pending` to `Done`.

Leave everything else untouched.

- [ ] **Step 2: Commit**

```bash
git add docs/flows/00-inventory.md
git commit -m "docs(flows): mark auth, onboarding, and invite flows Done in inventory"
```

---

## Task 11: Cold-start verification

**Files:** None

- [ ] **Step 1: Stop any stale dotnet/ng processes**

```powershell
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Kondix*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*ng*" -or $_.CommandLine -like "*4200*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
```

Confirm CelvoGuard (:5050) still up — don't kill it. Postgres + Redis + Minio should still be in docker.

- [ ] **Step 2: Full backend test suite**

```bash
cd C:/Users/eudes/Proyectos/Celvo/Kondix && dotnet test Kondix.slnx 2>&1 | tail -20
```

Expected: UnitTests 13/13, ArchTests 8/8, IntegrationTests 4/4 — all green.

- [ ] **Step 3: Full Playwright suite**

```bash
cd kondix-web && npx playwright test --project=chromium 2>&1 | tail -40
```

Expected:
- `01-auth.spec.ts`: 8 passed (6 from Phase 1 + 2 new)
- `02-onboarding-trainer.spec.ts`: 4 passed
- `08-invite-acceptance.spec.ts`: 2 passed
- Total: **14 passed**

- [ ] **Step 4: Summary**

```bash
git log --oneline feat/flow-testing-phase-1..feat/flow-testing-phase-2
git status
```

Working tree should be clean. Branch should show ~10 commits.

## Done criteria

- 3 new/extended diagram files (`01-auth.md` unchanged, `02-onboarding-trainer.md` new, `08-invite-acceptance.md` new).
- 14 Playwright tests green (01-auth × 8, 02-onboarding × 4, 08-invite × 2).
- Backend test suites still 25/25 green.
- Trainer sidebar has a working logout button.
- Inventory shows auth/onboarding/invite flows as "Done".

## Out of scope (for next plans)

- **Plan 3:** Trainer area flows (03–07) — dashboard, routines, programs, students, catalog.
- **Plan 4:** Student area flows (09–14) — home, calendar, progress, profile stats, workout mode, comments.
- **Plan 5:** Cross-app admin approval (99) — requires CelvoAdmin running.

import type { BrowserContext, Page } from '@playwright/test';
import type { TestTrainer } from './test-users';
import { makeTrainer } from './test-users';
import { approveTrainer } from './seed';
import { RegisterPage } from '../pages/shared/register.page';

const API = process.env.E2E_API_URL ?? 'http://localhost:5070';
const GUARD = process.env.E2E_GUARD_URL ?? 'http://localhost:5050';

/**
 * Calls the Kondix onboarding/setup endpoint using cookies already set in the
 * browser context (cg-access-kondix + cg-csrf-kondix). The CSRF middleware
 * requires the cookie value echoed back as X-CSRF-Token header.
 *
 * Reads cookies from the browser context and sets them explicitly as the
 * Cookie request header. This is needed because Playwright's APIRequestContext
 * may not forward Secure cookies over HTTP even on localhost (unlike Chrome
 * which applies a localhost exemption). The CSRF token is also echoed back
 * in the X-CSRF-Token header as required by Kondix's double-submit CSRF check.
 *
 * Use this when a spec needs a Trainer row to exist (e.g., to exercise
 * login branches that depend on TrainerStatus). The actual onboarding UI is
 * covered in Phase 2 (separate plan) — this helper is a shortcut.
 */
export async function completeTrainerSetup(
  page: Page,
  displayName: string,
  bio = 'E2E trainer bio',
): Promise<void> {
  const cookies = await page.context().cookies();
  const csrfRaw = cookies.find(c => c.name === 'cg-csrf-kondix')?.value;
  if (!csrfRaw) {
    throw new Error(
      'cg-csrf-kondix cookie missing — trainer must be registered/logged in first',
    );
  }
  // Playwright stores cookie values URL-encoded (e.g., '+' → '%2B', '/' → '%2F').
  // ASP.NET's cookie parser URL-decodes them when reading request.Cookies[...],
  // but the X-CSRF-Token header is used verbatim. We must decode the raw value
  // from Playwright so that the double-submit CSRF check (cookie == header) passes.
  const csrf = decodeURIComponent(csrfRaw);
  // Build Cookie header from all browser cookies so both cg-access-kondix
  // (HttpOnly, needed by CelvoGuardMiddleware) and cg-csrf-kondix (needed by
  // CsrfValidationMiddleware) are present in the server request. We use
  // Node.js native fetch() rather than page.request because Playwright may
  // drop manually-set Cookie headers (treating them as forbidden headers per
  // the fetch spec, even in the Node.js context).
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${API}/api/v1/onboarding/trainer/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Cookie': cookieHeader,
      'Origin': 'http://localhost:4201',
    },
    body: JSON.stringify({ displayName, bio }),
  });
  if (!res.ok) {
    throw new Error(`onboarding setup failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Read tenantId by calling CelvoGuard's /api/v1/auth/me endpoint. The JWT
 * access token only carries userId in `sub`; the tenantId lives in the Redis
 * session that CelvoGuard resolves server-side. We therefore call /me with
 * the browser cookies (using page.request so it sends the access cookie) to
 * get the full UserDto which includes TenantId.
 *
 * Falls back to the JWT `sub` claim if /me fails (e.g., in isolated unit
 * tests), so cleanup never silently no-ops.
 */
export async function readTenantIdFromCookies(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const access = cookies.find(c => c.name === 'cg-access-kondix');
  if (!access) throw new Error('cg-access-kondix cookie not set');

  // Use native Node.js fetch() (not page.request) so we can set the Cookie
  // header explicitly. Playwright's page.request treats Cookie as a managed
  // header and may not forward Secure cookies over http://localhost.
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${GUARD}/api/v1/auth/me`, {
    headers: {
      'X-App-Slug': 'kondix',
      'Cookie': cookieHeader,
    },
  });

  if (res.ok) {
    const data = await res.json();
    if (data.tenantId) return data.tenantId;
  }

  // Fallback: decode JWT payload and use sub (userId), which is only useful
  // for tests that register but don't complete onboarding (no trainer row).
  const payload = JSON.parse(
    Buffer.from(access.value.split('.')[1], 'base64url').toString('utf8'),
  );
  return payload.tenantId ?? payload.tid ?? payload.sub;
}

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
    throw new Error('cg-csrf-kondix cookie missing — trainer must be logged in first');
  }
  const csrf = decodeURIComponent(csrfRaw);

  const cookieHeader = cookies
    .filter(c => c.name.startsWith('cg-'))
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const res = await fetch(`${API}/api/v1/students/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Cookie': cookieHeader,
      'Origin': 'http://localhost:4201',
    },
    body: JSON.stringify({ email, firstName: firstName ?? null }),
  });
  if (!res.ok) {
    throw new Error(`inviteStudent failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

/**
 * Completes the student invite-acceptance flow programmatically:
 * 1) CelvoGuard endUser register with the invited email + tenantId
 * 2) Kondix public/invite/{token}/accept to bind the student to the trainer
 *
 * Copies the Set-Cookie headers returned by CelvoGuard register into the
 * Playwright BrowserContext so the browser is effectively logged in as the
 * student. Use this when a spec needs an authenticated student without
 * running the UI acceptance flow (e.g., student login specs that precondition
 * on a logged-in student account).
 */
export async function registerStudentViaInvite(
  context: BrowserContext,
  token: string,
  email: string,
  password: string,
  displayName: string,
): Promise<{ studentId: string; tenantId: string }> {
  // Load invitation info to discover tenantId
  const infoRes = await fetch(`${API}/api/v1/public/invite/${encodeURIComponent(token)}`);
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
  const setCookies: string[] = (regRes.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie?.() ?? [];
  const fallback = setCookies.length === 0
    ? (regRes.headers.get('set-cookie')?.split(/,(?=\s*cg-)/g) ?? [])
    : [];
  const all = setCookies.length > 0 ? setCookies : fallback;
  for (const raw of all) {
    const pair = raw.split(';')[0].trim();
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    if (!name.startsWith('cg-')) continue;
    await context.addCookies([
      {
        name,
        value,
        domain: 'localhost',
        path: '/',
        httpOnly: name.startsWith('cg-access') || name.startsWith('cg-refresh'),
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
  const studentDto = (await acceptRes.json()) as { id: string };
  return { studentId: studentDto.id, tenantId: info.tenantId };
}

/**
 * Composes register + onboarding setup + admin approval for a fresh trainer.
 * Leaves `page` logged in as an active trainer on whatever URL the register
 * flow redirects to (usually /onboarding/setup after the redirect, or /trainer
 * after subsequent navigation — callers should navigate explicitly after).
 *
 * Returns the generated trainer credentials and the resolved tenantId so the
 * spec can call `cleanupTenant(tenantId)` in afterAll. Callers must still
 * `clearRateLimits()` in beforeEach.
 */
export async function setupActiveTrainer(
  page: Page,
  tag = 'spec',
): Promise<{ trainer: TestTrainer; tenantId: string }> {
  const trainer = makeTrainer(tag);
  const register = new RegisterPage(page);
  await register.goto();
  await register.submit(trainer);
  const tenantId = await readTenantIdFromCookies(page);
  await completeTrainerSetup(page, trainer.displayName);
  await approveTrainer(tenantId);
  return { trainer, tenantId };
}

/**
 * Creates a routine via the real POST /api/v1/routines endpoint using the
 * current page's trainer cookies + CSRF. Returns the created routine's id.
 * Use this to arrange state for edit/view/delete specs without driving the
 * 4-step wizard UI. The input shape mirrors the CreateRoutineCommand DTO.
 */
export async function createRoutineViaApi(
  page: Page,
  input: {
    name: string;
    category?: string;
    description?: string;
    days: {
      name: string;
      exercises: { name: string; reps?: string; weight?: string }[];
    }[];
  },
): Promise<string> {
  const cookies = await page.context().cookies();
  const csrfRaw = cookies.find(c => c.name === 'cg-csrf-kondix')?.value;
  if (!csrfRaw) {
    throw new Error('cg-csrf-kondix cookie missing — trainer must be logged in first');
  }
  const csrf = decodeURIComponent(csrfRaw);
  const cookieHeader = cookies
    .filter(c => c.name.startsWith('cg-'))
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const body = {
    name: input.name,
    description: input.description ?? null,
    category: input.category ?? null,
    tags: [],
    days: input.days.map(d => ({
      name: d.name,
      groups: [
        {
          groupType: 'Single',
          restSeconds: 90,
          exercises: d.exercises.map(e => ({
            name: e.name,
            notes: null,
            videoSource: 'None',
            videoUrl: null,
            tempo: null,
            sets: [
              {
                setType: 'Effective',
                targetReps: e.reps ?? '8-12',
                targetWeight: e.weight ?? null,
                targetRpe: null,
                restSeconds: null,
              },
            ],
          })),
        },
      ],
    })),
  };

  const res = await fetch(`${API}/api/v1/routines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Cookie': cookieHeader,
      'Origin': 'http://localhost:4201',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`createRoutineViaApi failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Builds `cg-*` cookie header + decoded CSRF token from the current browser
 * context. Shared by helpers that need to make authenticated, CSRF-protected
 * API calls on behalf of a logged-in trainer. Decodes CSRF because Playwright
 * stores cookie values URL-encoded but the server compares header verbatim.
 */
async function getTrainerAuthHeaders(page: Page): Promise<{
  csrf: string;
  cookieHeader: string;
}> {
  const cookies = await page.context().cookies();
  const csrfRaw = cookies.find(c => c.name === 'cg-csrf-kondix')?.value;
  if (!csrfRaw) {
    throw new Error('cg-csrf-kondix cookie missing — trainer must be logged in first');
  }
  const csrf = decodeURIComponent(csrfRaw);
  const cookieHeader = cookies
    .filter(c => c.name.startsWith('cg-'))
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
  return { csrf, cookieHeader };
}

/**
 * Richer sibling of `createRoutineViaApi` that lets callers express multiple
 * exercise groups per day (e.g. a Superset block) and per-set rest overrides.
 * Use this when a spec needs to exercise block-level behaviour (e.g. round-
 * level rest timer for Phase 4). For the simple one-exercise-per-day shape,
 * prefer `createRoutineViaApi` to keep call sites terse.
 */
export async function createRoutineWithBlocksViaApi(
  page: Page,
  input: {
    name: string;
    category?: string;
    description?: string;
    days: {
      name: string;
      groups: {
        groupType: 'Single' | 'Superset' | 'Triset' | 'Circuit';
        restSeconds: number;
        exercises: {
          name: string;
          sets: {
            setType?: 'Warmup' | 'Effective' | 'DropSet' | 'RestPause' | 'AMRAP';
            targetReps?: string | null;
            targetWeight?: string | null;
            targetRpe?: number | null;
            restSeconds?: number | null;
          }[];
        }[];
      }[];
    }[];
  },
): Promise<string> {
  const { csrf, cookieHeader } = await getTrainerAuthHeaders(page);

  const body = {
    name: input.name,
    description: input.description ?? null,
    category: input.category ?? null,
    tags: [],
    days: input.days.map(d => ({
      name: d.name,
      groups: d.groups.map(g => ({
        groupType: g.groupType,
        restSeconds: g.restSeconds,
        exercises: g.exercises.map(e => ({
          name: e.name,
          notes: null,
          videoSource: 'None',
          videoUrl: null,
          tempo: null,
          sets: e.sets.map(s => ({
            setType: s.setType ?? 'Effective',
            targetReps: s.targetReps ?? '8-12',
            targetWeight: s.targetWeight ?? null,
            targetRpe: s.targetRpe ?? null,
            restSeconds: s.restSeconds ?? null,
          })),
        })),
      })),
    })),
  };

  const res = await fetch(`${API}/api/v1/routines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Cookie': cookieHeader,
      'Origin': 'http://localhost:4201',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`createRoutineWithBlocksViaApi failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Creates a Program wrapping one or more routines via the real trainer
 * endpoint. Programs are the assignment unit; a student receives one Program
 * (not individual routines). Returns the created program id.
 */
export async function createProgramViaApi(
  page: Page,
  input: {
    name: string;
    description?: string | null;
    durationWeeks: number;
    routines: { routineId: string; label?: string | null }[];
  },
): Promise<string> {
  const { csrf, cookieHeader } = await getTrainerAuthHeaders(page);

  const body = {
    name: input.name,
    description: input.description ?? null,
    durationWeeks: input.durationWeeks,
    routines: input.routines.map(r => ({ routineId: r.routineId, label: r.label ?? null })),
  };

  const res = await fetch(`${API}/api/v1/programs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Cookie': cookieHeader,
      'Origin': 'http://localhost:4201',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`createProgramViaApi failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Assigns a program to a student in Rotation mode. Rotation is the simplest
 * mode for workflow specs: next-workout advances through each day in order
 * regardless of calendar day, which means the student always has *some*
 * workout queued. Returns the assignment id.
 */
export async function assignProgramViaApi(
  page: Page,
  input: {
    programId: string;
    studentId: string;
    trainingDays?: number[];
  },
): Promise<string> {
  const { csrf, cookieHeader } = await getTrainerAuthHeaders(page);

  const body = {
    programId: input.programId,
    studentId: input.studentId,
    mode: 'Rotation',
    trainingDays: input.trainingDays ?? [1, 2, 3, 4, 5],
  };

  const res = await fetch(`${API}/api/v1/program-assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Cookie': cookieHeader,
      'Origin': 'http://localhost:4201',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`assignProgramViaApi failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

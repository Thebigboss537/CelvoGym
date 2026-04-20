import type { Page } from '@playwright/test';

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
      'Origin': 'http://localhost:4200',
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

import type { Page } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://localhost:5070';

/**
 * Calls the Kondix onboarding/setup endpoint using cookies already set in the
 * browser context (cg-access-kondix + cg-csrf-kondix). The CSRF middleware
 * requires the cookie value echoed back as X-CSRF-Token header.
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
  const csrf = cookies.find(c => c.name === 'cg-csrf-kondix')?.value;
  if (!csrf) {
    throw new Error(
      'cg-csrf-kondix cookie missing — trainer must be registered/logged in first',
    );
  }
  const res = await page.request.post(`${API}/api/v1/onboarding/trainer/setup`, {
    data: { displayName, bio },
    headers: { 'X-CSRF-Token': csrf },
  });
  if (!res.ok()) {
    throw new Error(`onboarding setup failed: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Read tenantId from the cg-access-kondix JWT after auth. Used by cleanup.
 * The JWT claim layout follows CelvoGuard's session token — tenant id is in
 * claim `tenantId` or `tid` depending on version; falls back to `sub` so
 * cleanup never silently no-ops.
 */
export async function readTenantIdFromCookies(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const access = cookies.find(c => c.name === 'cg-access-kondix');
  if (!access) throw new Error('cg-access-kondix cookie not set');
  const payload = JSON.parse(
    Buffer.from(access.value.split('.')[1], 'base64url').toString('utf8'),
  );
  return payload.tenantId ?? payload.tid ?? payload.sub;
}

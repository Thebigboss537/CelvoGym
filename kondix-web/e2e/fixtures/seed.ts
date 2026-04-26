import { execSync } from 'child_process';

const API = process.env.E2E_API_URL ?? 'http://localhost:5070';
const KEY = process.env.E2E_INTERNAL_KEY ?? 'dev-internal-key-change-me';

/**
 * Clears CelvoGuard auth rate-limit keys from Redis so that E2E tests that
 * perform multiple registrations/logins don't hit the per-IP cap (3/hour
 * for register, 5/15 min for login). Only call this in beforeEach hooks
 * inside test files that need several register calls per run.
 *
 * Uses docker exec against kondix-redis-1 (the dev Redis container that
 * CelvoGuard also uses when running locally). Silently no-ops if docker
 * is unavailable.
 */
export function clearRateLimits(): void {
  const container = process.env.E2E_REDIS_CONTAINER ?? 'kondix-redis-1';
  const redisPass = process.env.E2E_REDIS_PASSWORD ?? 'dev';
  // Clear both operator (trainer) and end-user (student) auth rate-limit keys.
  // Specs that seed a student via invite-accept hit `/api/v1/enduser/register`
  // (5/hour cap), so without this a second run quickly trips the limit.
  const paths = [
    '/api/v1/auth/register',
    '/api/v1/auth/login',
    '/api/v1/enduser/register',
    '/api/v1/enduser/login',
  ];
  const ips = [':::1', ':::ffff:127.0.0.1'];
  const keys = paths.flatMap(p => ips.map(ip => `rate:${p}:${ip}`)).join(' ');
  try {
    execSync(
      `docker exec ${container} redis-cli -a ${redisPass} --no-auth-warning DEL ${keys}`,
      { stdio: 'pipe' },
    );
  } catch {
    // Not fatal — if Docker isn't available the test may still pass if the
    // rate limit hasn't been hit yet.
  }
}

export async function approveTrainer(tenantId: string): Promise<void> {
  const res = await fetch(`${API}/api/v1/internal/test/approve-trainer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': KEY,
    },
    body: JSON.stringify({ tenantId }),
  });
  if (!res.ok) {
    throw new Error(
      `approveTrainer failed: ${res.status} ${await res.text()} — ` +
        `is the Kondix API running in Development environment? Check launchSettings.json.`,
    );
  }
}

export async function cleanupTenant(tenantId: string): Promise<void> {
  const res = await fetch(
    `${API}/api/v1/internal/test/cleanup?tenantId=${encodeURIComponent(tenantId)}`,
    {
      method: 'DELETE',
      headers: { 'X-Internal-Key': KEY },
    },
  );
  if (!res.ok) {
    throw new Error(
      `cleanupTenant failed: ${res.status} ${await res.text()} — ` +
        `is the Kondix API running in Development environment? Check launchSettings.json.`,
    );
  }
}

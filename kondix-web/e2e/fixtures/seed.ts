import { execSync } from 'child_process';

const API = process.env.E2E_API_URL ?? 'http://localhost:5070';
const KEY = process.env.E2E_INTERNAL_KEY ?? 'dev-internal-key-change-me';
const PG_CONTAINER = process.env.E2E_PG_CONTAINER ?? 'kondix-postgres-1';
const PG_USER = process.env.E2E_PG_USER ?? 'celvo_user';
const PG_DB = process.env.E2E_PG_DB ?? 'celvo';

/**
 * Clears CelvoGuard auth rate-limit keys from Redis so that E2E tests that
 * perform multiple registrations/logins don't hit the per-IP cap (3/hour for
 * register, 5/15 min for login). Only call this in beforeEach hooks inside
 * test files that need several register calls per run.
 *
 * Uses docker exec against kondix-redis-1 (the dev Redis container that
 * CelvoGuard also uses when running locally). Silently no-ops if docker is
 * unavailable so the call doesn't break CI pipelines that handle this
 * differently.
 */
export function clearRateLimits(): void {
  const container = process.env.E2E_REDIS_CONTAINER ?? 'kondix-redis-1';
  const redisPass = process.env.E2E_REDIS_PASSWORD ?? 'dev';
  try {
    execSync(
      `docker exec ${container} redis-cli -a ${redisPass} --no-auth-warning DEL rate:/api/v1/auth/register:::1 rate:/api/v1/auth/register:::ffff:127.0.0.1 rate:/api/v1/auth/login:::1 rate:/api/v1/auth/login:::ffff:127.0.0.1`,
      { stdio: 'pipe' },
    );
  } catch {
    // Not fatal — if Docker isn't available the test may still pass if the
    // rate limit hasn't been hit yet.
  }
}

/**
 * Tries the internal REST endpoint first. Falls back to a direct psql command
 * via docker exec when the API is not in Development mode (e.g., the
 * pre-existing process was started without ASPNETCORE_ENVIRONMENT=Development,
 * so /api/v1/internal/test/* returns 404). The fallback is safe because
 * the trainer row was just created by the test and is a local dev DB.
 */
export async function approveTrainer(tenantId: string): Promise<void> {
  const res = await fetch(`${API}/api/v1/internal/test/approve-trainer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': KEY,
    },
    body: JSON.stringify({ tenantId }),
  });
  if (res.ok) return;
  if (res.status !== 404) {
    throw new Error(`approveTrainer failed: ${res.status} ${await res.text()}`);
  }
  // API not in Development — fall back to direct DB update via docker exec.
  execSync(
    `docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -c "UPDATE kondix.trainers SET is_approved = true, approved_at = NOW() WHERE tenant_id = '${tenantId}'"`,
    { stdio: 'pipe' },
  );
}

/**
 * Tries the internal REST endpoint first. Falls back to direct psql via
 * docker exec when the API is not in Development mode.
 */
export async function cleanupTenant(tenantId: string): Promise<void> {
  const res = await fetch(
    `${API}/api/v1/internal/test/cleanup?tenantId=${encodeURIComponent(tenantId)}`,
    {
      method: 'DELETE',
      headers: { 'X-Internal-Key': KEY },
    },
  );
  if (res.ok) return;
  if (res.status !== 404) {
    throw new Error(`cleanupTenant failed: ${res.status} ${await res.text()}`);
  }
  // API not in Development — fall back to direct DB cleanup via docker exec.
  // Order matters: delete junction rows and students before trainers.
  execSync(
    `docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -c "DELETE FROM kondix.trainer_students WHERE trainer_id IN (SELECT id FROM kondix.trainers WHERE tenant_id = '${tenantId}'); DELETE FROM kondix.trainers WHERE tenant_id = '${tenantId}';"`,
    { stdio: 'pipe' },
  );
}

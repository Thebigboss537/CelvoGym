const API = process.env.E2E_API_URL ?? 'http://localhost:5070';
const KEY = process.env.E2E_INTERNAL_KEY ?? 'dev-internal-key-change-me';

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
    throw new Error(`approveTrainer failed: ${res.status} ${await res.text()}`);
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
    throw new Error(`cleanupTenant failed: ${res.status} ${await res.text()}`);
  }
}

-- One-off seed for Kondix E2E testing.
-- Adds a CelvoGuard admin that the 99-admin-approval.spec.ts will use
-- when cross-app approval needs to be verified against the real CelvoAdmin.
--
-- Run once against the local CelvoGuard database:
--   psql "postgres://celvoguard:dev@localhost:5432/celvoguard" -f setup/seed-e2e.sql
--
-- Safe to re-run (ON CONFLICT DO NOTHING on stable email).

INSERT INTO celvoguard.users (id, email, password_hash, first_name, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'admin-e2e@kondix.test',
  -- bcrypt hash of 'Test1234!' — regenerate with your project's hasher if different
  '$2a$11$5tP8yVf8B9l1lZ0mR5k7peRvhN/VMoX6iYw9F8k3w3k3w3k3w3k3w',
  'E2E Admin',
  true,
  now()
)
ON CONFLICT (email) DO NOTHING;

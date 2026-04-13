-- Run against celvoguard database as celvoguard user
-- Register KONDIX app in CelvoGuard

BEGIN;

INSERT INTO apps (id, name, slug, audience, allowed_origins, default_permissions, auth_methods, default_end_user_permissions, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'KONDIX',
    'kondix',
    'kondix.celvo.dev',
    ARRAY['https://kondix.celvo.dev', 'http://localhost:4200'],
    ARRAY['kondix:manage'],
    ARRAY['email_password'],
    ARRAY['kondix:workout'],
    true,
    NOW()
);

DO $$
DECLARE
    v_app_id UUID;
BEGIN
    SELECT id INTO v_app_id FROM apps WHERE slug = 'kondix';

    -- Operator permissions (trainer)
    INSERT INTO permissions (id, app_id, code, description, created_at) VALUES
        (gen_random_uuid(), v_app_id, 'kondix:manage', 'Manage routines, students, and assignments', NOW());

    -- End-user permissions (student)
    INSERT INTO permissions (id, app_id, code, description, created_at) VALUES
        (gen_random_uuid(), v_app_id, 'kondix:workout', 'View assigned routines and log progress', NOW());
END $$;

COMMIT;

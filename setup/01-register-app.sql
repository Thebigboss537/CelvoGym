-- Run against celvoguard database as celvoguard user
-- Register CelvoGym app in CelvoGuard

BEGIN;

INSERT INTO apps (id, name, slug, audience, allowed_origins, default_permissions, auth_methods, default_end_user_permissions, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'CelvoGym',
    'celvogym',
    'gym.celvo.dev',
    ARRAY['https://gym.celvo.dev', 'http://localhost:4200'],
    ARRAY['gym:manage'],
    ARRAY['email_password'],
    ARRAY['gym:workout'],
    true,
    NOW()
);

DO $$
DECLARE
    v_app_id UUID;
BEGIN
    SELECT id INTO v_app_id FROM apps WHERE slug = 'celvogym';

    -- Operator permissions (trainer)
    INSERT INTO permissions (id, app_id, code, description, created_at) VALUES
        (gen_random_uuid(), v_app_id, 'gym:manage', 'Manage routines, students, and assignments', NOW());

    -- End-user permissions (student)
    INSERT INTO permissions (id, app_id, code, description, created_at) VALUES
        (gen_random_uuid(), v_app_id, 'gym:workout', 'View assigned routines and log progress', NOW());
END $$;

COMMIT;

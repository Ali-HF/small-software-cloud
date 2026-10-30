-- ==============================================================================
-- Small Software Cloud - Supabase Database Schema & Row Level Security (RLS)
-- YE Digital Hackathon 2026
-- ==============================================================================

-- 0. Clean Reset of Legacy & Core Tables/Types (idempotent)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.parties CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TABLE IF EXISTS public.app_kv CASCADE;
DROP TABLE IF EXISTS public.app_members CASCADE;
ALTER TABLE IF EXISTS public.apps DROP CONSTRAINT IF EXISTS fk_apps_current_version;
DROP TABLE IF EXISTS public.app_versions CASCADE;
DROP TABLE IF EXISTS public.apps CASCADE;
DROP FUNCTION IF EXISTS public.can_view_app(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_app(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_app(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_app(UUID) CASCADE;
DROP TYPE IF EXISTS public.link_access_type CASCADE;
DROP TYPE IF EXISTS public.member_role_type CASCADE;

-- 1. Create Enums
CREATE TYPE public.link_access_type AS ENUM ('none', 'view');
CREATE TYPE public.member_role_type AS ENUM ('viewer', 'editor');

-- 2. Apps Table
CREATE TABLE public.apps (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    current_version_id TEXT,
    link_access public.link_access_type NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. App Versions Table
CREATE TABLE public.app_versions (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    app_id TEXT NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    html TEXT NOT NULL,
    prompt TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint for current_version_id in apps
ALTER TABLE public.apps
    ADD CONSTRAINT fk_apps_current_version
    FOREIGN KEY (current_version_id)
    REFERENCES public.app_versions(id)
    ON DELETE SET NULL;

-- 4. App Members Table
CREATE TABLE public.app_members (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    app_id TEXT NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.member_role_type NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (app_id, email)
);

-- 5. App Key-Value Store Table (Shared Storage for Injected SDK)
CREATE TABLE public.app_kv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id TEXT NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_app_kv_app_key UNIQUE (app_id, key)
);

-- Enable Supabase Realtime for app_kv (with full replica identity for live broadcasts)
ALTER TABLE public.app_kv REPLICA IDENTITY FULL;
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_kv;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_apps_owner_id ON public.apps(owner_id);
CREATE INDEX IF NOT EXISTS idx_apps_current_version_id ON public.apps(current_version_id);
CREATE INDEX IF NOT EXISTS idx_app_versions_app_id ON public.app_versions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_members_app_id ON public.app_members(app_id);
CREATE INDEX IF NOT EXISTS idx_app_members_email ON public.app_members(lower(email));
CREATE INDEX IF NOT EXISTS idx_app_members_user_id ON public.app_members(user_id);
CREATE INDEX IF NOT EXISTS idx_app_kv_app_id ON public.app_kv(app_id);
CREATE INDEX IF NOT EXISTS idx_app_kv_app_key ON public.app_kv(app_id, key);
CREATE INDEX IF NOT EXISTS idx_app_kv_updated_by ON public.app_kv(updated_by);

-- ==============================================================================
-- 6. Helper Functions for Access Control (with explicit search_path)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.can_view_app(check_app_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    curr_uid UUID := (SELECT auth.uid());
    curr_email TEXT := lower(coalesce((SELECT auth.jwt())->>'email', ''));
BEGIN
    -- 1. Owner has access
    IF curr_uid IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.apps WHERE id = check_app_id AND owner_id = curr_uid
    ) THEN
        RETURN true;
    END IF;

    -- 2. Anyone with link access if link_access = 'view'
    IF EXISTS (
        SELECT 1 FROM public.apps WHERE id = check_app_id AND link_access = 'view'
    ) THEN
        RETURN true;
    END IF;

    -- 3. Explicit member (matched by user_id or user's email)
    IF (curr_uid IS NOT NULL OR curr_email <> '') AND EXISTS (
        SELECT 1 FROM public.app_members m
        WHERE m.app_id = check_app_id
        AND (
            (curr_uid IS NOT NULL AND m.user_id = curr_uid)
            OR (curr_email <> '' AND lower(m.email) = curr_email)
        )
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_edit_app(check_app_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    curr_uid UUID := (SELECT auth.uid());
    curr_email TEXT := lower(coalesce((SELECT auth.jwt())->>'email', ''));
BEGIN
    -- 1. Owner has edit access
    IF curr_uid IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.apps WHERE id = check_app_id AND owner_id = curr_uid
    ) THEN
        RETURN true;
    END IF;

    -- 2. Member with editor role
    IF (curr_uid IS NOT NULL OR curr_email <> '') AND EXISTS (
        SELECT 1 FROM public.app_members m
        WHERE m.app_id = check_app_id
        AND m.role = 'editor'
        AND (
            (curr_uid IS NOT NULL AND m.user_id = curr_uid)
            OR (curr_email <> '' AND lower(m.email) = curr_email)
        )
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- ==============================================================================
-- 7. Row Level Security (RLS) Policies & Grants
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_app(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_edit_app(TEXT) TO anon, authenticated, service_role;

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_kv ENABLE ROW LEVEL SECURITY;

-- --- APPS POLICIES ---
CREATE POLICY "Users can create their own apps"
    ON public.apps FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Users can view apps they own, are member of, or have link access to"
    ON public.apps FOR SELECT
    TO anon, authenticated
    USING (public.can_view_app(id));

CREATE POLICY "Owners can update their own apps"
    ON public.apps FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id)
    WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Owners can delete their own apps"
    ON public.apps FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id);

-- --- APP VERSIONS POLICIES ---
CREATE POLICY "Users can view versions of apps they can view"
    ON public.app_versions FOR SELECT
    TO anon, authenticated
    USING (public.can_view_app(app_id));

CREATE POLICY "Owners and editors can insert new versions"
    ON public.app_versions FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit_app(app_id));

-- --- APP MEMBERS POLICIES ---
CREATE POLICY "Owners and members can view memberships"
    ON public.app_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND owner_id = (SELECT auth.uid()))
        OR user_id = (SELECT auth.uid())
        OR lower(email) = lower(coalesce((SELECT auth.jwt())->>'email', ''))
    );

CREATE POLICY "Owners can manage memberships"
    ON public.app_members FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND owner_id = (SELECT auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND owner_id = (SELECT auth.uid())));

-- --- APP KV POLICIES (Shared Realtime SDK Storage) ---
CREATE POLICY "Users with view access can read kv store"
    ON public.app_kv FOR SELECT
    TO anon, authenticated
    USING (public.can_view_app(app_id));

CREATE POLICY "Owners and editors can insert or update kv store"
    ON public.app_kv FOR ALL
    TO authenticated
    USING (public.can_edit_app(app_id))
    WITH CHECK (public.can_edit_app(app_id));

-- ==============================================================================
-- 8. Seed Demo Users into auth.users (for instant multi-role verification)
-- ==============================================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alice@example.com', '', now(), '{"provider":"google","providers":["google"]}', '{"full_name":"Alice (Owner)"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob@example.com', '', now(), '{"provider":"google","providers":["google"]}', '{"full_name":"Bob (Editor)"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'charlie@example.com', '', now(), '{"provider":"github","providers":["github"]}', '{"full_name":"Charlie (Viewer)"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stranger@external.org', '', now(), '{"provider":"github","providers":["github"]}', '{"full_name":"Stranger (No Access)"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Small Software Cloud - Supabase Database Schema & Row Level Security (RLS)
-- YE Digital Hackathon 2026
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE link_access_type AS ENUM ('none', 'view');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_role_type AS ENUM ('viewer', 'editor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Apps Table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    current_version_id UUID,
    link_access link_access_type NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. App Versions Table
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    html TEXT NOT NULL,
    prompt TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint for current_version_id in apps
DO $$ BEGIN
    ALTER TABLE public.apps 
    ADD CONSTRAINT fk_apps_current_version 
    FOREIGN KEY (current_version_id) 
    REFERENCES public.app_versions(id) 
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. App Members Table
CREATE TABLE IF NOT EXISTS public.app_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role member_role_type NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (app_id, email)
);

-- 5. App Key-Value Store Table (Shared Storage for Injected SDK)
CREATE TABLE IF NOT EXISTS public.app_kv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_app_kv_app_key UNIQUE (app_id, key)
);

-- Enable Supabase Realtime for app_kv
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_kv;

-- Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_apps_owner_id ON public.apps(owner_id);
CREATE INDEX IF NOT EXISTS idx_app_versions_app_id ON public.app_versions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_members_app_id ON public.app_members(app_id);
CREATE INDEX IF NOT EXISTS idx_app_members_email ON public.app_members(email);
CREATE INDEX IF NOT EXISTS idx_app_members_user_id ON public.app_members(user_id);
CREATE INDEX IF NOT EXISTS idx_app_kv_app_id ON public.app_kv(app_id);
CREATE INDEX IF NOT EXISTS idx_app_kv_app_key ON public.app_kv(app_id, key);

-- ==============================================================================
-- 6. Helper Functions for Access Control
-- ==============================================================================

-- Helper function to check if current user has view access to an app
CREATE OR REPLACE FUNCTION public.can_view_app(check_app_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Owner has access
    IF EXISTS (SELECT 1 FROM public.apps WHERE id = check_app_id AND owner_id = auth.uid()) THEN
        RETURN true;
    END IF;

    -- 2. Anyone with link access if link_access = 'view'
    IF EXISTS (SELECT 1 FROM public.apps WHERE id = check_app_id AND link_access = 'view') THEN
        RETURN true;
    END IF;

    -- 3. Explicit member (matched by user_id or user's email)
    IF EXISTS (
        SELECT 1 FROM public.app_members m
        WHERE m.app_id = check_app_id 
        AND (
            m.user_id = auth.uid() 
            OR lower(m.email) = lower(auth.jwt()->>'email')
        )
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user has edit access to an app
CREATE OR REPLACE FUNCTION public.can_edit_app(check_app_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Owner has edit access
    IF EXISTS (SELECT 1 FROM public.apps WHERE id = check_app_id AND owner_id = auth.uid()) THEN
        RETURN true;
    END IF;

    -- 2. Member with editor role
    IF EXISTS (
        SELECT 1 FROM public.app_members m
        WHERE m.app_id = check_app_id 
        AND m.role = 'editor'
        AND (
            m.user_id = auth.uid() 
            OR lower(m.email) = lower(auth.jwt()->>'email')
        )
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 7. Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_kv ENABLE ROW LEVEL SECURITY;

-- --- APPS POLICIES ---
CREATE POLICY "Users can create their own apps"
    ON public.apps FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view apps they own, are member of, or have link access to"
    ON public.apps FOR SELECT
    USING (public.can_view_app(id));

CREATE POLICY "Owners can update their own apps"
    ON public.apps FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own apps"
    ON public.apps FOR DELETE
    USING (auth.uid() = owner_id);

-- --- APP VERSIONS POLICIES ---
CREATE POLICY "Users can view versions of apps they can view"
    ON public.app_versions FOR SELECT
    USING (public.can_view_app(app_id));

CREATE POLICY "Owners and editors can insert new versions"
    ON public.app_versions FOR INSERT
    WITH CHECK (public.can_edit_app(app_id));

-- --- APP MEMBERS POLICIES ---
CREATE POLICY "Owners and members can view memberships"
    ON public.app_members FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND owner_id = auth.uid())
        OR user_id = auth.uid()
        OR lower(email) = lower(auth.jwt()->>'email')
    );

CREATE POLICY "Owners can manage memberships"
    ON public.app_members FOR ALL
    USING (EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND owner_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND owner_id = auth.uid()));

-- --- APP KV POLICIES (Shared Realtime SDK Storage) ---
CREATE POLICY "Users with view access can read kv store"
    ON public.app_kv FOR SELECT
    USING (public.can_view_app(app_id));

CREATE POLICY "Owners and editors can insert or update kv store"
    ON public.app_kv FOR ALL
    USING (public.can_edit_app(app_id))
    WITH CHECK (public.can_edit_app(app_id));

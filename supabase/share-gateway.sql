-- ==============================================================================
-- Small Software Cloud - Share Gateway storage (projects, bundles, links, events)
-- Accessed ONLY by the server (service role). RLS is enabled with no policies,
-- so anon/authenticated clients can never read bundles, token hashes or secrets.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.share_projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_key_hash TEXT NOT NULL,
    framework TEXT,
    active_deploy_id TEXT,
    files_count INTEGER NOT NULL DEFAULT 0,
    total_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.share_files (
    project_id TEXT NOT NULL REFERENCES public.share_projects(id) ON DELETE CASCADE,
    deploy_id TEXT NOT NULL,
    path TEXT NOT NULL,
    content_base64 TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (project_id, deploy_id, path)
);

CREATE TABLE IF NOT EXISTS public.share_links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.share_projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    token_preview TEXT NOT NULL,
    access_type TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'pin', 'password', 'email')),
    pin_hash TEXT,
    password_hash TEXT,
    allowed_emails TEXT[],
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.share_events (
    id TEXT PRIMARY KEY,
    link_id TEXT,
    project_id TEXT NOT NULL REFERENCES public.share_projects(id) ON DELETE CASCADE,
    link_label TEXT,
    status TEXT NOT NULL,
    reason TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_files_project_deploy ON public.share_files(project_id, deploy_id);
CREATE INDEX IF NOT EXISTS idx_share_links_project ON public.share_links(project_id);
CREATE INDEX IF NOT EXISTS idx_share_events_project_created ON public.share_events(project_id, created_at DESC);

-- Atomic use counter
CREATE OR REPLACE FUNCTION public.share_increment_link_use(p_link_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
    UPDATE public.share_links SET use_count = use_count + 1 WHERE id = p_link_id;
$$;

REVOKE ALL ON FUNCTION public.share_increment_link_use(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.share_increment_link_use(TEXT) TO service_role;

ALTER TABLE public.share_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.share_projects, public.share_files, public.share_links, public.share_events FROM anon, authenticated;
GRANT ALL ON public.share_projects, public.share_files, public.share_links, public.share_events TO service_role;

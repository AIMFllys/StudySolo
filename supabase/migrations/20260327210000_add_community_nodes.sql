-- ============================================================
-- Community shared nodes system
-- Encoding: UTF-8 (no BOM) + LF
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ss_community_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'Bot',
    category TEXT NOT NULL DEFAULT 'other',
    version TEXT NOT NULL DEFAULT '1.0.0',
    prompt TEXT NOT NULL,
    input_hint TEXT NOT NULL DEFAULT '',
    output_format TEXT NOT NULL DEFAULT 'markdown',
    output_schema JSONB DEFAULT NULL,
    model_preference TEXT NOT NULL DEFAULT 'auto',
    status TEXT NOT NULL DEFAULT 'approved',
    reject_reason TEXT DEFAULT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    knowledge_file_path TEXT DEFAULT NULL,
    knowledge_file_name TEXT DEFAULT NULL,
    knowledge_file_size INTEGER NOT NULL DEFAULT 0,
    knowledge_text TEXT DEFAULT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    install_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ss_community_nodes_output_format_check CHECK (output_format IN ('markdown', 'json'))
);

CREATE INDEX IF NOT EXISTS ss_community_nodes_author_idx
    ON public.ss_community_nodes(author_id);

CREATE INDEX IF NOT EXISTS ss_community_nodes_status_idx
    ON public.ss_community_nodes(status);

CREATE INDEX IF NOT EXISTS ss_community_nodes_public_idx
    ON public.ss_community_nodes(is_public, likes_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS ss_community_nodes_category_idx
    ON public.ss_community_nodes(category);

DROP TRIGGER IF EXISTS trg_ss_community_nodes_updated_at ON public.ss_community_nodes;
CREATE TRIGGER trg_ss_community_nodes_updated_at
BEFORE UPDATE ON public.ss_community_nodes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ss_community_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community nodes public read" ON public.ss_community_nodes;
CREATE POLICY "community nodes public read"
    ON public.ss_community_nodes FOR SELECT
    USING (is_public = true);

DROP POLICY IF EXISTS "community nodes author read" ON public.ss_community_nodes;
CREATE POLICY "community nodes author read"
    ON public.ss_community_nodes FOR SELECT
    USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "community nodes author insert" ON public.ss_community_nodes;
CREATE POLICY "community nodes author insert"
    ON public.ss_community_nodes FOR INSERT
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "community nodes author update" ON public.ss_community_nodes;
CREATE POLICY "community nodes author update"
    ON public.ss_community_nodes FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "community nodes author delete" ON public.ss_community_nodes;
CREATE POLICY "community nodes author delete"
    ON public.ss_community_nodes FOR DELETE
    USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.ss_community_node_likes (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES public.ss_community_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, node_id)
);

ALTER TABLE public.ss_community_node_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community node likes read" ON public.ss_community_node_likes;
CREATE POLICY "community node likes read"
    ON public.ss_community_node_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "community node likes insert" ON public.ss_community_node_likes;
CREATE POLICY "community node likes insert"
    ON public.ss_community_node_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community node likes delete" ON public.ss_community_node_likes;
CREATE POLICY "community node likes delete"
    ON public.ss_community_node_likes FOR DELETE
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_community_node_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.ss_community_nodes
        SET likes_count = likes_count + 1
        WHERE id = NEW.node_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.ss_community_nodes
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.node_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_node_likes ON public.ss_community_node_likes;
CREATE TRIGGER trg_community_node_likes
AFTER INSERT OR DELETE ON public.ss_community_node_likes
FOR EACH ROW EXECUTE FUNCTION public.update_community_node_likes_count();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'community-node-files',
    'community-node-files',
    false,
    10485760,
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown',
        'text/plain'
    ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "community node files insert" ON storage.objects;
CREATE POLICY "community node files insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'community-node-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "community node files select" ON storage.objects;
CREATE POLICY "community node files select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'community-node-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

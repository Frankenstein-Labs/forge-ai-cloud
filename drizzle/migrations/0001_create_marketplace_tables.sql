CREATE TABLE IF NOT EXISTS public.marketplace_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  author text NOT NULL DEFAULT '@dev',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'LLM',
  source text NOT NULL DEFAULT 'huggingface',
  source_url text,
  storage_path text,
  size_bytes bigint,
  price_eur numeric NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT true,
  downloads integer NOT NULL DEFAULT 0,
  stars integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_models TO authenticated;
GRANT SELECT ON public.marketplace_models TO anon;
GRANT ALL ON public.marketplace_models TO service_role;

ALTER TABLE public.marketplace_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public models are readable" ON public.marketplace_models
  FOR SELECT USING (is_public OR auth.uid() = user_id);
CREATE POLICY "Users insert own models" ON public.marketplace_models
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own models" ON public.marketplace_models
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own models" ON public.marketplace_models
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.marketplace_models(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.marketplace_downloads TO authenticated;
GRANT ALL ON public.marketplace_downloads TO service_role;

ALTER TABLE public.marketplace_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own downloads" ON public.marketplace_downloads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own downloads" ON public.marketplace_downloads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS marketplace_models_public_idx ON public.marketplace_models (is_public, created_at DESC);
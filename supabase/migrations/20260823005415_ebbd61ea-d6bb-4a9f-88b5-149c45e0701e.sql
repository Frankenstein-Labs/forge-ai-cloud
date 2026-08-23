CREATE TABLE public.marketplace_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  author text NOT NULL DEFAULT 'anonyme',
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
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_models TO authenticated;
GRANT SELECT ON public.marketplace_models TO anon;
GRANT ALL ON public.marketplace_models TO service_role;
ALTER TABLE public.marketplace_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public models are viewable by everyone"
  ON public.marketplace_models FOR SELECT USING (is_public = true);
CREATE POLICY "Owners can view their own models"
  ON public.marketplace_models FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can publish models"
  ON public.marketplace_models FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their models"
  ON public.marketplace_models FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete their models"
  ON public.marketplace_models FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.marketplace_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.marketplace_models(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.marketplace_downloads TO authenticated;
GRANT ALL ON public.marketplace_downloads TO service_role;
ALTER TABLE public.marketplace_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own downloads"
  ON public.marketplace_downloads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users log their own downloads"
  ON public.marketplace_downloads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.engines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  image text NOT NULL DEFAULT 'ghcr.io/aetheris/dev:latest',
  region text NOT NULL DEFAULT 'EU · Paris',
  cpu_cores integer NOT NULL DEFAULT 4,
  ram_gb integer NOT NULL DEFAULT 8,
  disk_gb integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'stopped',
  price_per_hour numeric NOT NULL DEFAULT 0.08,
  vscode_url text,
  last_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engines TO authenticated;
GRANT ALL ON public.engines TO service_role;
ALTER TABLE public.engines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own engines"
  ON public.engines FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.engine_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id uuid REFERENCES public.engines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'ok',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.engine_events TO authenticated;
GRANT ALL ON public.engine_events TO service_role;
ALTER TABLE public.engine_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their engine events"
  ON public.engine_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users log their engine events"
  ON public.engine_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_marketplace_models_updated_at BEFORE UPDATE ON public.marketplace_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_engines_updated_at BEFORE UPDATE ON public.engines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_marketplace_models_public ON public.marketplace_models (is_public, created_at DESC);
CREATE INDEX idx_engines_user ON public.engines (user_id, created_at DESC);
CREATE INDEX idx_engine_events_user ON public.engine_events (user_id, created_at DESC);

INSERT INTO public.marketplace_models (user_id, name, author, description, category, source, source_url, size_bytes, price_eur, tags, downloads, stars)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'mistralai/Mistral-7B-Instruct-v0.3', '@mistralai', 'LLM instruct 7B, contexte 32k, excellent rapport qualité/vitesse.', 'LLM', 'huggingface', 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3', 14500000000, 0, ARRAY['chat','instruct'], 1280, 942),
  ('00000000-0000-0000-0000-000000000000', 'meta-llama/Llama-3.1-8B-Instruct', '@meta', 'Modèle instruct léger et rapide, multilingue.', 'LLM', 'huggingface', 'https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct', 16000000000, 0, ARRAY['chat','llama'], 2310, 1580),
  ('00000000-0000-0000-0000-000000000000', 'openai/whisper-large-v3', '@openai', 'Transcription audio multilingue haute précision.', 'Audio', 'huggingface', 'https://huggingface.co/openai/whisper-large-v3', 3100000000, 0, ARRAY['asr','audio'], 890, 640),
  ('00000000-0000-0000-0000-000000000000', 'stabilityai/sdxl-turbo', '@stability', 'Génération d''images temps réel.', 'Vision', 'huggingface', 'https://huggingface.co/stabilityai/sdxl-turbo', 6900000000, 19, ARRAY['image','diffusion'], 305, 210),
  ('00000000-0000-0000-0000-000000000000', 'Qwen/Qwen2.5-7B-Instruct', '@qwen', 'LLM multilingue performant, 128k contexte.', 'LLM', 'huggingface', 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct', 15200000000, 0, ARRAY['chat','multilingue'], 760, 512),
  ('00000000-0000-0000-0000-000000000000', 'BAAI/bge-m3', '@baai', 'Embeddings multilingues 1024d pour RAG.', 'Outil', 'huggingface', 'https://huggingface.co/BAAI/bge-m3', 1200000000, 0, ARRAY['embeddings','rag'], 233, 180);
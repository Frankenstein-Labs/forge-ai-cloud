CREATE TABLE public.user_hf_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_hf_config TO authenticated;
GRANT ALL ON public.user_hf_config TO service_role;

ALTER TABLE public.user_hf_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own HF config"
ON public.user_hf_config
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
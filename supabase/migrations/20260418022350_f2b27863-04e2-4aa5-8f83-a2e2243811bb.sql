-- 1. Storage buckets (privés)
INSERT INTO storage.buckets (id, name, public)
VALUES ('configs-agents', 'configs-agents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('data-ingestion', 'data-ingestion', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS storage : chaque user dans son dossier {user_id}/...
CREATE POLICY "Users read own configs-agents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'configs-agents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users insert own configs-agents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'configs-agents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own configs-agents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'configs-agents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own configs-agents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'configs-agents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own data-ingestion"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'data-ingestion' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users insert own data-ingestion"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'data-ingestion' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own data-ingestion"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'data-ingestion' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own data-ingestion"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'data-ingestion' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Fonction de validation de clé API (security definer)
CREATE OR REPLACE FUNCTION public.validate_api_key(_hashed_key text)
RETURNS TABLE (
  user_id uuid,
  api_key_id uuid,
  permissions api_key_permission,
  budget_limit_tokens bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row record;
BEGIN
  SELECT id, k.user_id, k.permissions, k.budget_limit_tokens, k.status, k.expires_at
  INTO _row
  FROM public.api_keys k
  WHERE k.hashed_key = _hashed_key
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF _row.status <> 'active' THEN
    RETURN;
  END IF;

  IF _row.expires_at IS NOT NULL AND _row.expires_at < now() THEN
    UPDATE public.api_keys SET status = 'expired' WHERE id = _row.id;
    RETURN;
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = _row.id;

  RETURN QUERY SELECT _row.user_id, _row.id, _row.permissions, _row.budget_limit_tokens;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_api_key(text) FROM public, anon, authenticated;
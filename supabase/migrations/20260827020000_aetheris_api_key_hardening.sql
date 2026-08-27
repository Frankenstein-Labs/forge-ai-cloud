CREATE TYPE public.api_key_environment AS ENUM ('test', 'live');

ALTER TABLE public.api_keys
  ADD COLUMN environment public.api_key_environment NOT NULL DEFAULT 'live',
  ADD COLUMN scopes text[] NOT NULL DEFAULT ARRAY['inference:chat']::text[],
  ADD COLUMN budget_limit_eur numeric(12, 4),
  ADD COLUMN rate_limit_per_minute integer NOT NULL DEFAULT 60
    CHECK (rate_limit_per_minute BETWEEN 1 AND 10000);

ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_scopes_nonempty CHECK (cardinality(scopes) > 0),
  ADD CONSTRAINT api_keys_budget_limit_eur_nonnegative
    CHECK (budget_limit_eur IS NULL OR budget_limit_eur >= 0);

CREATE INDEX idx_api_keys_organization_environment
  ON public.api_keys(organization_id, environment, status);

DROP FUNCTION public.validate_api_key(text);

CREATE FUNCTION public.validate_api_key(_hashed_key text)
RETURNS TABLE (
  user_id uuid,
  api_key_id uuid,
  organization_id uuid,
  permissions public.api_key_permission,
  scopes text[],
  environment public.api_key_environment,
  budget_limit_tokens bigint,
  budget_limit_eur numeric,
  rate_limit_per_minute integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row record;
BEGIN
  SELECT
    k.id, k.user_id, k.organization_id, k.permissions, k.scopes, k.environment,
    k.budget_limit_tokens, k.budget_limit_eur, k.rate_limit_per_minute, k.status, k.expires_at
  INTO _row
  FROM public.api_keys k
  WHERE k.hashed_key = _hashed_key
  LIMIT 1;

  IF NOT FOUND OR _row.status <> 'active' THEN
    RETURN;
  END IF;

  IF _row.expires_at IS NOT NULL AND _row.expires_at <= now() THEN
    UPDATE public.api_keys SET status = 'expired' WHERE id = _row.id;
    RETURN;
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = _row.id;

  RETURN QUERY SELECT
    _row.user_id,
    _row.id,
    _row.organization_id,
    _row.permissions,
    _row.scopes,
    _row.environment,
    _row.budget_limit_tokens,
    _row.budget_limit_eur,
    _row.rate_limit_per_minute;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_api_key(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text) TO anon, authenticated;

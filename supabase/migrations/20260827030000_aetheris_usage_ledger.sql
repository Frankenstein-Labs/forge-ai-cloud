CREATE TYPE public.usage_reservation_status AS ENUM ('reserved', 'settled', 'released');
CREATE TYPE public.credit_ledger_entry_type AS ENUM ('reservation', 'settlement', 'release', 'adjustment');

CREATE TABLE public.organization_credit_balances (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  available_tokens bigint NOT NULL DEFAULT 0 CHECK (available_tokens >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.usage_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  request_id text NOT NULL CHECK (char_length(request_id) BETWEEN 1 AND 128),
  reserved_tokens bigint NOT NULL CHECK (reserved_tokens > 0),
  status public.usage_reservation_status NOT NULL DEFAULT 'reserved',
  expires_at timestamptz NOT NULL,
  settled_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, request_id)
);

CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.usage_reservations(id) ON DELETE SET NULL,
  entry_type public.credit_ledger_entry_type NOT NULL,
  token_delta bigint NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 120),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_reservations_expiry ON public.usage_reservations(status, expires_at);
CREATE INDEX idx_usage_reservations_organization_created ON public.usage_reservations(organization_id, created_at DESC);
CREATE INDEX idx_credit_ledger_organization_created ON public.credit_ledger(organization_id, created_at DESC);

-- A balance row is established for every future organization; customer credits are issued later
-- through append-only adjustment entries and Stripe webhook processing.
CREATE OR REPLACE FUNCTION public.initialize_organization_credit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_credit_balances (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_initialize_credit_balance
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.initialize_organization_credit_balance();

-- Preserve the existing free token balance for every backfilled personal organization.
INSERT INTO public.organization_credit_balances (organization_id, available_tokens)
SELECT o.id, p.credits_balance
FROM public.profiles p
JOIN public.organizations o ON o.slug = 'personal-' || replace(p.id::text, '-', '')
ON CONFLICT (organization_id) DO UPDATE
  SET available_tokens = EXCLUDED.available_tokens;

CREATE OR REPLACE FUNCTION public.reserve_usage_tokens(
  _organization_id uuid,
  _user_id uuid,
  _api_key_id uuid,
  _request_id text,
  _reserved_tokens bigint,
  _expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reservation_id uuid;
  _available bigint;
BEGIN
  IF _reserved_tokens <= 0 OR _expires_at <= now() THEN
    RAISE EXCEPTION 'INVALID_RESERVATION' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO _reservation_id
  FROM public.usage_reservations
  WHERE organization_id = _organization_id AND request_id = _request_id;
  IF FOUND THEN
    RETURN _reservation_id;
  END IF;

  INSERT INTO public.organization_credit_balances (organization_id)
  VALUES (_organization_id)
  ON CONFLICT (organization_id) DO NOTHING;

  SELECT available_tokens INTO _available
  FROM public.organization_credit_balances
  WHERE organization_id = _organization_id
  FOR UPDATE;

  IF _available < _reserved_tokens THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.organization_credit_balances
  SET available_tokens = available_tokens - _reserved_tokens, updated_at = now()
  WHERE organization_id = _organization_id;

  INSERT INTO public.usage_reservations (
    organization_id, user_id, api_key_id, request_id, reserved_tokens, expires_at
  ) VALUES (
    _organization_id, _user_id, _api_key_id, _request_id, _reserved_tokens, _expires_at
  ) RETURNING id INTO _reservation_id;

  INSERT INTO public.credit_ledger (
    organization_id, user_id, api_key_id, reservation_id, entry_type, token_delta, reason
  ) VALUES (
    _organization_id, _user_id, _api_key_id, _reservation_id, 'reservation', -_reserved_tokens, 'inference reservation'
  );

  RETURN _reservation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_usage_reservation(
  _reservation_id uuid,
  _actual_tokens bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reservation public.usage_reservations%ROWTYPE;
  _refund bigint;
BEGIN
  IF _actual_tokens < 0 THEN
    RAISE EXCEPTION 'INVALID_USAGE' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO _reservation FROM public.usage_reservations WHERE id = _reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RESERVATION_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
  IF _reservation.status <> 'reserved' THEN RETURN; END IF;
  IF _actual_tokens > _reservation.reserved_tokens THEN
    RAISE EXCEPTION 'RESERVATION_EXCEEDED' USING ERRCODE = 'P0001';
  END IF;

  _refund := _reservation.reserved_tokens - _actual_tokens;
  UPDATE public.usage_reservations SET status = 'settled', settled_at = now() WHERE id = _reservation.id;
  INSERT INTO public.credit_ledger (
    organization_id, user_id, api_key_id, reservation_id, entry_type, token_delta, reason, metadata
  ) VALUES (
    _reservation.organization_id, _reservation.user_id, _reservation.api_key_id, _reservation.id,
    'settlement', 0, 'inference settled', jsonb_build_object('actual_tokens', _actual_tokens)
  );
  IF _refund > 0 THEN
    UPDATE public.organization_credit_balances
    SET available_tokens = available_tokens + _refund, updated_at = now()
    WHERE organization_id = _reservation.organization_id;
    INSERT INTO public.credit_ledger (
      organization_id, user_id, api_key_id, reservation_id, entry_type, token_delta, reason
    ) VALUES (
      _reservation.organization_id, _reservation.user_id, _reservation.api_key_id, _reservation.id,
      'release', _refund, 'unused inference reservation released'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_usage_reservation(_reservation_id uuid, _reason text DEFAULT 'provider failure')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reservation public.usage_reservations%ROWTYPE;
BEGIN
  SELECT * INTO _reservation FROM public.usage_reservations WHERE id = _reservation_id FOR UPDATE;
  IF NOT FOUND OR _reservation.status <> 'reserved' THEN RETURN; END IF;
  UPDATE public.usage_reservations SET status = 'released', released_at = now() WHERE id = _reservation.id;
  UPDATE public.organization_credit_balances
  SET available_tokens = available_tokens + _reservation.reserved_tokens, updated_at = now()
  WHERE organization_id = _reservation.organization_id;
  INSERT INTO public.credit_ledger (
    organization_id, user_id, api_key_id, reservation_id, entry_type, token_delta, reason
  ) VALUES (
    _reservation.organization_id, _reservation.user_id, _reservation.api_key_id, _reservation.id,
    'release', _reservation.reserved_tokens, left(_reason, 120)
  );
END;
$$;

ALTER TABLE public.organization_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view organization balances" ON public.organization_credit_balances FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Members view organization reservations" ON public.usage_reservations FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Members view organization credit ledger" ON public.credit_ledger FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));

REVOKE ALL ON FUNCTION public.reserve_usage_tokens(uuid, uuid, uuid, text, bigint, timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_usage_reservation(uuid, bigint) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_usage_reservation(uuid, text) FROM public, anon, authenticated;

-- Aetheris Cloud multi-tenant control plane. This migration preserves existing user-owned data
-- and adds organizations progressively; organization_id remains nullable until each feature is migrated.

CREATE TYPE public.organization_member_role AS ENUM (
  'owner', 'admin', 'developer', 'analyst', 'billing', 'member'
);

CREATE TYPE public.organization_invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  is_personal boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_memberships (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.organization_member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE public.organization_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_region text,
  require_mfa boolean NOT NULL DEFAULT false,
  data_retention_days integer CHECK (data_retention_days IS NULL OR data_retention_days BETWEEN 1 AND 3650),
  allow_provider_fallback boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(email) <= 320),
  role public.organization_member_role NOT NULL DEFAULT 'member',
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status public.organization_invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email, status)
);

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  locale text NOT NULL DEFAULT 'fr' CHECK (char_length(locale) BETWEEN 2 AND 10),
  timezone text NOT NULL DEFAULT 'Etc/UTC' CHECK (char_length(timezone) BETWEEN 1 AND 64),
  marketing_emails boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 100),
  request_id text,
  ip_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organization_memberships_user ON public.organization_memberships(user_id, organization_id);
CREATE INDEX idx_organization_invitations_org_status ON public.organization_invitations(organization_id, status);
CREATE INDEX idx_security_events_user_created ON public.security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_org_created ON public.security_events(organization_id, created_at DESC);

-- Compatibility bridge: legacy data stays user-owned, while new server paths can attach it to an
-- organization. These columns deliberately remain nullable until all writers set them.
ALTER TABLE public.api_keys ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.user_models ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.deployments ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.usage_events ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.credit_transactions ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.engines ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.engine_events ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.marketplace_models ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.marketplace_downloads ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;

CREATE INDEX idx_api_keys_organization ON public.api_keys(organization_id);
CREATE INDEX idx_user_models_organization ON public.user_models(organization_id);
CREATE INDEX idx_deployments_organization ON public.deployments(organization_id);
CREATE INDEX idx_usage_events_organization ON public.usage_events(organization_id, created_at DESC);
CREATE INDEX idx_engines_organization ON public.engines(organization_id);
CREATE INDEX idx_marketplace_models_organization ON public.marketplace_models(organization_id);

CREATE OR REPLACE FUNCTION public.is_organization_member(_organization_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = _organization_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_organization_role(
  _organization_id uuid,
  _user_id uuid,
  _roles public.organization_member_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = _organization_id
      AND user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.create_personal_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  organization_id uuid;
BEGIN
  INSERT INTO public.organizations (name, slug, is_personal, created_by)
  VALUES (
    COALESCE(NULLIF(NEW.full_name, ''), split_part(NEW.email, '@', 1)) || '''s organization',
    'personal-' || replace(NEW.id::text, '-', ''),
    true,
    NEW.id
  )
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO organization_id;

  INSERT INTO public.organization_memberships (organization_id, user_id, role)
  VALUES (organization_id, NEW.id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  INSERT INTO public.organization_settings (organization_id)
  VALUES (organization_id)
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id, active_organization_id)
  VALUES (NEW.id, organization_id)
  ON CONFLICT (user_id) DO UPDATE
    SET active_organization_id = COALESCE(user_preferences.active_organization_id, EXCLUDED.active_organization_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_create_personal_organization
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_personal_organization();

-- Backfill every existing profile without changing ownership of the legacy user_id columns.
INSERT INTO public.organizations (name, slug, is_personal, created_by)
SELECT
  COALESCE(NULLIF(p.full_name, ''), split_part(p.email, '@', 1)) || '''s organization',
  'personal-' || replace(p.id::text, '-', ''),
  true,
  p.id
FROM public.profiles p
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.organization_memberships (organization_id, user_id, role)
SELECT o.id, p.id, 'owner'
FROM public.profiles p
JOIN public.organizations o ON o.slug = 'personal-' || replace(p.id::text, '-', '')
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO public.organization_settings (organization_id)
SELECT id FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO public.user_preferences (user_id, active_organization_id)
SELECT p.id, o.id
FROM public.profiles p
JOIN public.organizations o ON o.slug = 'personal-' || replace(p.id::text, '-', '')
ON CONFLICT (user_id) DO UPDATE
  SET active_organization_id = COALESCE(user_preferences.active_organization_id, EXCLUDED.active_organization_id);

UPDATE public.api_keys k SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(k.user_id::text, '-', '') AND k.organization_id IS NULL;
UPDATE public.user_models m SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(m.user_id::text, '-', '') AND m.organization_id IS NULL;
UPDATE public.deployments d SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(d.user_id::text, '-', '') AND d.organization_id IS NULL;
UPDATE public.usage_events e SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(e.user_id::text, '-', '') AND e.organization_id IS NULL;
UPDATE public.credit_transactions c SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(c.user_id::text, '-', '') AND c.organization_id IS NULL;
UPDATE public.engines e SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(e.user_id::text, '-', '') AND e.organization_id IS NULL;
UPDATE public.engine_events e SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(e.user_id::text, '-', '') AND e.organization_id IS NULL;
UPDATE public.marketplace_models m SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(m.user_id::text, '-', '') AND m.organization_id IS NULL;
UPDATE public.marketplace_downloads d SET organization_id = o.id FROM public.organizations o
WHERE o.slug = 'personal-' || replace(d.user_id::text, '-', '') AND d.organization_id IS NULL;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view organizations" ON public.organizations FOR SELECT TO authenticated
  USING (public.is_organization_member(id, auth.uid()));
CREATE POLICY "Authenticated users create organizations" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_personal = false);
CREATE POLICY "Owners update organizations" ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_organization_role(id, auth.uid(), ARRAY['owner']::public.organization_member_role[]))
  WITH CHECK (public.has_organization_role(id, auth.uid(), ARRAY['owner']::public.organization_member_role[]));
CREATE POLICY "Owners delete organizations" ON public.organizations FOR DELETE TO authenticated
  USING (public.has_organization_role(id, auth.uid(), ARRAY['owner']::public.organization_member_role[]));

CREATE POLICY "Members view memberships" ON public.organization_memberships FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Owners and admins manage memberships" ON public.organization_memberships FOR ALL TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]));

CREATE POLICY "Members view organization settings" ON public.organization_settings FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));
CREATE POLICY "Owners and admins update settings" ON public.organization_settings FOR UPDATE TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]));

CREATE POLICY "Managers view invitations" ON public.organization_invitations FOR SELECT TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]));
CREATE POLICY "Managers create invitations" ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]));
CREATE POLICY "Managers update invitations" ON public.organization_invitations FOR UPDATE TO authenticated
  USING (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]))
  WITH CHECK (public.has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'admin']::public.organization_member_role[]));

CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own security events" ON public.security_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER organization_memberships_updated_at BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER organization_settings_updated_at BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

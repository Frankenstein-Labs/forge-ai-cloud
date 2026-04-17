-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'developer', 'member');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'business');
CREATE TYPE public.api_key_permission AS ENUM ('read_only', 'read_write', 'admin');
CREATE TYPE public.api_key_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE public.model_source AS ENUM ('huggingface', 'upload', 'url', 'finetuned', 'catalog');
CREATE TYPE public.deployment_status AS ENUM ('pending', 'deploying', 'active', 'stopped', 'failed');

-- =========================================
-- HELPER: updated_at trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  subscription_tier public.subscription_tier NOT NULL DEFAULT 'free',
  credits_balance BIGINT NOT NULL DEFAULT 100000, -- in tokens
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- USER_ROLES (separate table — security best practice)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- =========================================
-- AUTO-CREATE PROFILE + DEFAULT ROLE on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'developer');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- API_KEYS
-- =========================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- e.g. "ae_live_abc123"
  hashed_key TEXT NOT NULL UNIQUE, -- sha256
  permissions public.api_key_permission NOT NULL DEFAULT 'read_write',
  budget_limit_tokens BIGINT, -- NULL = unlimited
  status public.api_key_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hashed ON public.api_keys(hashed_key);

CREATE POLICY "Users can view own keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- USER_MODELS (imported by user)
-- =========================================
CREATE TABLE public.user_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source public.model_source NOT NULL,
  source_url TEXT, -- HF URL or public URL
  storage_path TEXT, -- path in Supabase Storage
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_models ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_models_user_id ON public.user_models(user_id);

CREATE POLICY "Users can view own models"
  ON public.user_models FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own models"
  ON public.user_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own models"
  ON public.user_models FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own models"
  ON public.user_models FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER user_models_updated_at
  BEFORE UPDATE ON public.user_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- DEPLOYMENTS
-- =========================================
CREATE TABLE public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_model_id UUID REFERENCES public.user_models(id) ON DELETE CASCADE,
  catalog_model_id TEXT, -- e.g. 'llama-3.1-70b' for Aetheris catalog
  deployment_name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'eu-west-1',
  replicas INTEGER NOT NULL DEFAULT 1,
  status public.deployment_status NOT NULL DEFAULT 'pending',
  endpoint_url TEXT,
  tokens_consumed BIGINT NOT NULL DEFAULT 0,
  deployed_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deployments_user_id ON public.deployments(user_id);

CREATE POLICY "Users can view own deployments"
  ON public.deployments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deployments"
  ON public.deployments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deployments"
  ON public.deployments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deployments"
  ON public.deployments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER deployments_updated_at
  BEFORE UPDATE ON public.deployments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- USAGE_EVENTS (token consumption log)
-- =========================================
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  deployment_id UUID REFERENCES public.deployments(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  cost_eur NUMERIC(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_usage_events_user_id ON public.usage_events(user_id);
CREATE INDEX idx_usage_events_created_at ON public.usage_events(created_at DESC);

CREATE POLICY "Users can view own usage"
  ON public.usage_events FOR SELECT USING (auth.uid() = user_id);

-- =========================================
-- CREDIT_TRANSACTIONS (Stripe events log)
-- =========================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_eur NUMERIC(10, 2) NOT NULL,
  tokens_added BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  stripe_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_credit_tx_user_id ON public.credit_transactions(user_id);

CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

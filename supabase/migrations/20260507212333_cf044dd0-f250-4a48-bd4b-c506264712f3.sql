
CREATE TABLE public.user_mongo_config (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_mongo_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own mongo config select"
  ON public.user_mongo_config FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users manage own mongo config insert"
  ON public.user_mongo_config FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users manage own mongo config update"
  ON public.user_mongo_config FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users manage own mongo config delete"
  ON public.user_mongo_config FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS studio_records (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('project', 'contact', 'invoice', 'expense')),
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_records_kind_updated ON studio_records (kind, updated_at DESC);
CREATE TABLE IF NOT EXISTS studio_login_guard (
  id integer PRIMARY KEY CHECK (id = 1),
  failures integer NOT NULL DEFAULT 0,
  locked_until timestamptz
);
INSERT INTO studio_login_guard (id) VALUES (1) ON CONFLICT DO NOTHING;
-- Since 20 November 2026 the sign-in guard counts failures per client address (hashed) and globally.
-- studio_login_guard above is no longer read by the application.
CREATE TABLE IF NOT EXISTS studio_login_attempts (
  key text PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  window_started timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

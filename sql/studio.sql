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

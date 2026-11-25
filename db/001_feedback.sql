BEGIN;

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('formacao', 'problema', 'sugestao', 'outro')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000 AND btrim(message) <> ''),
  contact text CHECK (char_length(contact) BETWEEN 1 AND 254),
  status text NOT NULL DEFAULT 'nova' CHECK (status IN ('nova', 'em_analise', 'concluida')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_recent_idx ON feedback (created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS feedback_rate_limits (
  window_start timestamptz NOT NULL,
  client_key text NOT NULL,
  submissions integer NOT NULL CHECK (submissions > 0),
  PRIMARY KEY (window_start, client_key)
);

COMMIT;

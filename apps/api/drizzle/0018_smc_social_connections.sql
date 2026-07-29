-- SMC social connections multi-platform (Instagram / Facebook / Messenger / WhatsApp)
CREATE TABLE IF NOT EXISTS smc_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  user_id uuid,
  platform text NOT NULL,
  state_nonce text NOT NULL UNIQUE,
  code_verifier text NOT NULL,
  redirect_uri text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS smc_oauth_states_company_idx ON smc_oauth_states (company_id, platform);
CREATE INDEX IF NOT EXISTS smc_oauth_states_expires_idx ON smc_oauth_states (expires_at);

CREATE TABLE IF NOT EXISTS smc_social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  platform text NOT NULL,
  external_id text NOT NULL,
  parent_external_id text,
  display_name text,
  username text,
  phone_number text,
  token_ciphertext text NOT NULL,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'connected',
  last_sync_at timestamptz,
  last_error text,
  connected_by uuid,
  connected_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS smc_social_connections_uidx
  ON smc_social_connections (company_id, platform, external_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS smc_social_connections_company_idx
  ON smc_social_connections (company_id, platform, status);

CREATE TABLE IF NOT EXISTS smc_connection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  connection_id uuid,
  user_id uuid,
  platform text NOT NULL,
  action text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  ip text,
  user_agent text,
  device text,
  os text,
  browser text,
  message text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS smc_connection_logs_company_idx
  ON smc_connection_logs (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS smc_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  platform text NOT NULL,
  object_type text,
  entry_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature_ok boolean,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS smc_webhook_events_platform_idx
  ON smc_webhook_events (platform, created_at DESC);
CREATE INDEX IF NOT EXISTS smc_webhook_events_company_idx
  ON smc_webhook_events (company_id, created_at DESC);

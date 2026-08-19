-- Bachmain platform-level Nilvera connection (çözüm ortağı). Tenants do not store API keys.

CREATE TABLE IF NOT EXISTS e_document_platform (
  id text PRIMARY KEY,
  encrypted_api_key_test text,
  encrypted_api_key_live text,
  fingerprint_test text,
  fingerprint_live text,
  status text NOT NULL DEFAULT 'disconnected',
  last_test_at timestamptz,
  last_error text,
  company_title text,
  tax_number text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

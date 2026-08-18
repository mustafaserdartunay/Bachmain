-- E-Dönüşüm / e-belge (Nilvera first, provider-based)

CREATE TABLE IF NOT EXISTS e_document_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  branch_id text,
  provider text NOT NULL DEFAULT 'nilvera',
  environment text NOT NULL DEFAULT 'TEST',
  encrypted_api_key text,
  api_key_fingerprint text,
  status text NOT NULL DEFAULT 'disconnected',
  last_test_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  company_title text,
  tax_number text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS e_doc_conn_company_provider_env_uidx
  ON e_document_connections (company_id, provider, environment, COALESCE(branch_id, ''));
CREATE INDEX IF NOT EXISTS e_doc_conn_company_idx
  ON e_document_connections (company_id, status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS e_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  branch_id text,
  invoice_id text,
  provider text NOT NULL DEFAULT 'nilvera',
  document_type text NOT NULL,
  direction text NOT NULL DEFAULT 'outgoing',
  external_id text,
  uuid text,
  invoice_number text,
  status text NOT NULL DEFAULT 'DRAFT',
  provider_status text,
  answer_code text,
  currency text NOT NULL DEFAULT 'TRY',
  amount numeric(18, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(18, 2) NOT NULL DEFAULT 0,
  issue_date timestamptz,
  sent_at timestamptz,
  received_at timestamptz,
  party_name text,
  party_tax_number text,
  pdf_url text,
  xml_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS e_docs_company_uuid_uidx
  ON e_documents (company_id, provider, uuid) WHERE uuid IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS e_docs_company_invoice_uidx
  ON e_documents (company_id, invoice_id, direction)
  WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS e_docs_company_status_idx
  ON e_documents (company_id, status, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS e_docs_company_dir_idx
  ON e_documents (company_id, direction, document_type) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS e_document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  e_document_id uuid NOT NULL REFERENCES e_documents(id),
  company_id text NOT NULL,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS e_doc_events_doc_idx
  ON e_document_events (e_document_id, created_at);

CREATE TABLE IF NOT EXISTS e_document_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  provider text NOT NULL DEFAULT 'nilvera',
  sync_type text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  records_processed integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS e_doc_sync_company_idx
  ON e_document_sync_logs (company_id, started_at);

CREATE TABLE IF NOT EXISTS e_document_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  provider text NOT NULL DEFAULT 'nilvera',
  request_type text NOT NULL,
  endpoint text NOT NULL,
  duration_ms integer,
  success boolean NOT NULL DEFAULT false,
  http_status integer,
  external_uuid text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS e_doc_api_logs_company_idx
  ON e_document_api_logs (company_id, created_at);

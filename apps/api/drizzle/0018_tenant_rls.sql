-- Enterprise SaaS: enable Row Level Security on tenant-scoped tables.
-- App still MUST filter by company_id; RLS is defense-in-depth.
-- Apply via: psql "$DATABASE_URL" -f apps/api/drizzle/0018_tenant_rls.sql
-- Or include in migrate pipeline after review.

-- Session GUC used by policies (set by API on each request when ready):
--   SELECT set_config('app.company_id', '<uuid>', true);

CREATE OR REPLACE FUNCTION app_current_company_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.company_id', true), '')::uuid
$$;

-- Helper: enable RLS + force + tenant isolation policy for a table with company_id
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'customers',
    'categories',
    'products',
    'orders',
    'order_items',
    'quotes',
    'quote_items',
    'invoices',
    'invoice_items',
    'company_memberships',
    'api_keys',
    'activity_logs',
    'subscriptions',
    'support_tickets'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'company_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %I
           USING (company_id IS NOT DISTINCT FROM app_current_company_id())
           WITH CHECK (company_id IS NOT DISTINCT FROM app_current_company_id())',
        t
      );
    END IF;
  END LOOP;
END $$;

-- NOTE: Until the API sets app.company_id per transaction, queries as table owner
-- may still bypass RLS unless FORCE is on (FORCE is set above).
-- Use a non-owner DB role for the app connection in production.

-- Financial Suite foundation (additive) — docs/83
-- Does not replace treasury / invoice local SoT

CREATE TABLE IF NOT EXISTS "finance_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "currency" text DEFAULT 'TRY',
  "parent_code" text,
  "active" boolean DEFAULT true NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "finance_accounts_code_uidx" ON "finance_accounts" ("company_id","code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_accounts_company_idx" ON "finance_accounts" ("company_id","type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "finance_journals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "branch_id" uuid,
  "journal_no" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "source" text DEFAULT 'manual' NOT NULL,
  "currency" text DEFAULT 'TRY',
  "memo" text,
  "treasury_movement_id" text,
  "invoice_id" text,
  "order_id" text,
  "production_job_id" text,
  "customer_id" text,
  "posted_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "finance_journals_no_uidx" ON "finance_journals" ("company_id","journal_no");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_journals_company_idx" ON "finance_journals" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "finance_journal_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "journal_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "account_code" text NOT NULL,
  "debit" numeric(18, 4) DEFAULT '0',
  "credit" numeric(18, 4) DEFAULT '0',
  "currency" text DEFAULT 'TRY',
  "memo" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_journal_lines_journal_idx" ON "finance_journal_lines" ("journal_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "finance_budgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "year" integer NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "currency" text DEFAULT 'TRY',
  "lines" jsonb DEFAULT '[]'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_budgets_company_idx" ON "finance_budgets" ("company_id","year");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "finance_cost_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "dimension" text NOT NULL,
  "dimension_id" text NOT NULL,
  "amount" numeric(18, 4) NOT NULL,
  "currency" text DEFAULT 'TRY',
  "production_job_id" text,
  "memo" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_cost_entries_company_idx" ON "finance_cost_entries" ("company_id","dimension");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "finance_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "acquisition_cost" numeric(18, 4),
  "currency" text DEFAULT 'TRY',
  "acquired_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "finance_assets_code_uidx" ON "finance_assets" ("company_id","code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "finance_reconciliations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "bank_account_ref" text NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "statement_date" timestamp with time zone,
  "matched_count" integer DEFAULT 0,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_reconciliations_company_idx" ON "finance_reconciliations" ("company_id","status");

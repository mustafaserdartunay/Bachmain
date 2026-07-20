-- Enterprise Analytics Platform foundation (additive) — docs/89
-- Does not replace ModernDashboard or module report SoT

CREATE TABLE IF NOT EXISTS "analytics_dashboards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "kind" text DEFAULT 'custom' NOT NULL,
  "layout" jsonb DEFAULT '[]'::jsonb,
  "is_default" boolean DEFAULT false NOT NULL,
  "role_scope" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_dashboards_slug_uidx" ON "analytics_dashboards" ("company_id","slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_dashboards_company_idx" ON "analytics_dashboards" ("company_id","kind");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "analytics_kpis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "source" text DEFAULT 'custom' NOT NULL,
  "formula" text,
  "unit" text DEFAULT 'number',
  "target" numeric(18, 4),
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_kpis_code_uidx" ON "analytics_kpis" ("company_id","code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "analytics_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "kpi_code" text,
  "operator" text DEFAULT 'gt' NOT NULL,
  "threshold" numeric(18, 4),
  "channels" jsonb DEFAULT '[]'::jsonb,
  "active" boolean DEFAULT true NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_alerts_company_idx" ON "analytics_alerts" ("company_id","active");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "analytics_goals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "title" text NOT NULL,
  "scope" text DEFAULT 'company' NOT NULL,
  "owner_ref" text,
  "target_value" numeric(18, 4),
  "actual_value" numeric(18, 4),
  "period" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_goals_company_idx" ON "analytics_goals" ("company_id","scope");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "analytics_okrs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "objective" text NOT NULL,
  "scope" text DEFAULT 'company' NOT NULL,
  "owner_ref" text,
  "key_results" jsonb DEFAULT '[]'::jsonb,
  "progress_pct" integer DEFAULT 0,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_okrs_company_idx" ON "analytics_okrs" ("company_id","scope");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "analytics_insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "severity" text NOT NULL,
  "severity" text DEFAULT 'info' NOT NULL,
  "domain" text,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_insights_company_idx" ON "analytics_insights" ("company_id","severity");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "analytics_forecasts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "horizon" text DEFAULT '30d',
  "value" numeric(18, 4),
  "unit" text DEFAULT 'TRY',
  "payload" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_forecasts_company_idx" ON "analytics_forecasts" ("company_id","kind");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "analytics_exports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "format" text DEFAULT 'csv' NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "source" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_exports_company_idx" ON "analytics_exports" ("company_id","status");

-- MES foundation (additive) — docs/81_MES_ARCHITECTURE_ROADMAP.md
-- Does not alter CRM production job storage

CREATE TABLE IF NOT EXISTS "mes_work_centers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "kind" text DEFAULT 'machine' NOT NULL,
  "status" text DEFAULT 'idle' NOT NULL,
  "capacity_per_hour" numeric(12, 2),
  "oee" numeric(5, 2),
  "energy_kw" numeric(12, 2),
  "operator_id" uuid,
  "photo_url" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mes_work_centers_code_uidx" ON "mes_work_centers" ("company_id","code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_work_centers_company_idx" ON "mes_work_centers" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_operators" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'available' NOT NULL,
  "user_id" uuid,
  "skills" jsonb DEFAULT '[]'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mes_operators_code_uidx" ON "mes_operators" ("company_id","code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_operators_company_idx" ON "mes_operators" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_shifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_shifts_company_idx" ON "mes_shifts" ("company_id","active");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_boms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "product_id" text NOT NULL,
  "name" text NOT NULL,
  "version" text DEFAULT '1' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "lines" jsonb DEFAULT '[]'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_boms_company_idx" ON "mes_boms" ("company_id","product_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_routings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "product_id" text NOT NULL,
  "name" text NOT NULL,
  "operations" jsonb DEFAULT '[]'::jsonb,
  "status" text DEFAULT 'active' NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_routings_company_idx" ON "mes_routings" ("company_id","product_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "production_job_id" text,
  "work_center_id" uuid,
  "operator_id" uuid,
  "action" text NOT NULL,
  "qty_good" integer DEFAULT 0,
  "qty_scrap" integer DEFAULT 0,
  "note" text,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_events_company_idx" ON "mes_events" ("company_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_events_job_idx" ON "mes_events" ("company_id","production_job_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_scrap" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "production_job_id" text,
  "work_center_id" uuid,
  "operator_id" uuid,
  "product_id" text,
  "qty" integer DEFAULT 1 NOT NULL,
  "reason" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_scrap_company_idx" ON "mes_scrap" ("company_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_maintenance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "work_center_id" uuid,
  "kind" text DEFAULT 'preventive' NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "title" text NOT NULL,
  "due_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_maintenance_company_idx" ON "mes_maintenance" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mes_oee_samples" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "work_center_id" uuid,
  "availability" numeric(5, 2),
  "performance" numeric(5, 2),
  "quality" numeric(5, 2),
  "oee" numeric(5, 2),
  "sampled_at" timestamp with time zone DEFAULT now() NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mes_oee_samples_company_idx" ON "mes_oee_samples" ("company_id","sampled_at");

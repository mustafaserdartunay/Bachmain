-- Workflow Engine foundation (additive, backward compatible)
-- WF-0 per docs/67_WORKFLOW_ENGINE_ARCHITECTURE_ROADMAP.md

CREATE TABLE IF NOT EXISTS "workflows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "published_version" integer,
  "branch_id" uuid,
  "warehouse_id" uuid,
  "role_codes" jsonb DEFAULT '[]'::jsonb,
  "package_codes" jsonb DEFAULT '[]'::jsonb,
  "trigger_types" jsonb DEFAULT '[]'::jsonb,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflows_company_idx" ON "workflows" ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflows_company_name_idx" ON "workflows" ("company_id","name");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workflow_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workflow_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "graph" jsonb DEFAULT '{"nodes":[],"edges":[]}'::jsonb NOT NULL,
  "changelog" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workflow_versions_uidx" ON "workflow_versions" ("workflow_id","version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_versions_company_idx" ON "workflow_versions" ("company_id","workflow_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workflow_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workflow_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "mode" text DEFAULT 'live' NOT NULL,
  "status" text DEFAULT 'running' NOT NULL,
  "trigger_type" text,
  "trigger_payload" jsonb DEFAULT '{}'::jsonb,
  "error" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "duration_ms" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_runs_workflow_idx" ON "workflow_runs" ("workflow_id","started_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_runs_company_idx" ON "workflow_runs" ("company_id","started_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workflow_run_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "node_id" text NOT NULL,
  "catalog_id" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "started_at" timestamp with time zone,
  "finished_at" timestamp with time zone,
  "duration_ms" integer,
  "output" jsonb DEFAULT '{}'::jsonb,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_run_steps_run_idx" ON "workflow_run_steps" ("run_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workflow_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "status" text DEFAULT 'pending' NOT NULL,
  "processed_at" timestamp with time zone,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_events_company_idx" ON "workflow_events" ("company_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_events_status_idx" ON "workflow_events" ("company_id","status","event_type");

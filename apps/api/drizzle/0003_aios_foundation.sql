-- AI Operating System foundation (additive)
-- AIOS-0 per docs/69_AIOS_ARCHITECTURE_ROADMAP.md

CREATE TABLE IF NOT EXISTS "aios_agent_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "agent_id" text NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "model_provider" text,
  "model_id" text,
  "cost_limit_usd" numeric(12, 4),
  "modules" jsonb DEFAULT '[]'::jsonb,
  "permissions" jsonb DEFAULT '[]'::jsonb,
  "work_hours" jsonb DEFAULT '{}'::jsonb,
  "memory_enabled" boolean DEFAULT true NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "aios_agent_configs_uidx" ON "aios_agent_configs" ("company_id","agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "aios_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "agent_id" text NOT NULL,
  "user_id" uuid,
  "provider" text,
  "model" text,
  "status" text DEFAULT 'running' NOT NULL,
  "prompt_tokens" integer DEFAULT 0,
  "completion_tokens" integer DEFAULT 0,
  "estimated_cost_usd" numeric(12, 6),
  "duration_ms" integer,
  "requires_approval" boolean DEFAULT false NOT NULL,
  "error" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aios_runs_company_idx" ON "aios_runs" ("company_id","started_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aios_runs_agent_idx" ON "aios_runs" ("company_id","agent_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "aios_run_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "name" text,
  "status" text DEFAULT 'success' NOT NULL,
  "duration_ms" integer,
  "input" jsonb DEFAULT '{}'::jsonb,
  "output" jsonb DEFAULT '{}'::jsonb,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aios_run_steps_run_idx" ON "aios_run_steps" ("run_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "aios_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "run_id" uuid,
  "tool_id" text NOT NULL,
  "agent_id" text,
  "requested_by" uuid,
  "status" text DEFAULT 'pending' NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "decided_by" uuid,
  "decided_at" timestamp with time zone,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aios_approvals_company_idx" ON "aios_approvals" ("company_id","status","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "aios_memory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "scope" text DEFAULT 'company' NOT NULL,
  "scope_id" text,
  "key" text NOT NULL,
  "value" jsonb DEFAULT '{}'::jsonb,
  "sensitivity" text DEFAULT 'internal' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aios_memory_company_idx" ON "aios_memory" ("company_id","scope","key");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "aios_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "agent_id" text NOT NULL,
  "cadence" text NOT NULL,
  "cron_expr" text,
  "event_type" text,
  "enabled" boolean DEFAULT true NOT NULL,
  "next_run_at" timestamp with time zone,
  "last_run_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aios_schedules_company_idx" ON "aios_schedules" ("company_id","enabled");

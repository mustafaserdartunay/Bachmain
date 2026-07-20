-- Platform Core foundation (additive) — docs/91
-- Registry / jobs / health only — does not move domain tables

CREATE TABLE IF NOT EXISTS "platform_modules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "route" text,
  "api_prefix" text,
  "entitlement_code" text,
  "domain" text DEFAULT 'platform' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "version" text DEFAULT '2026',
  "dependencies" jsonb DEFAULT '[]'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "platform_modules_code_uidx" ON "platform_modules" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_modules_status_idx" ON "platform_modules" ("status","domain");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "platform_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid,
  "name" text NOT NULL,
  "queue" text DEFAULT 'default' NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "priority" integer DEFAULT 50 NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "run_at" timestamp with time zone,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_jobs_status_idx" ON "platform_jobs" ("status","queue","priority");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "platform_health_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service" text NOT NULL,
  "status" text DEFAULT 'unknown' NOT NULL,
  "latency_ms" integer,
  "detail" jsonb DEFAULT '{}'::jsonb,
  "checked_at" timestamp with time zone DEFAULT now() NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_health_service_idx" ON "platform_health_snapshots" ("service","checked_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "platform_integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "kind" text DEFAULT 'api' NOT NULL,
  "status" text DEFAULT 'configured' NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "platform_integrations_code_uidx" ON "platform_integrations" ("code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "platform_plugins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "kind" text DEFAULT 'widget' NOT NULL,
  "status" text DEFAULT 'available' NOT NULL,
  "version" text DEFAULT '0.1.0',
  "payload" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "platform_plugins_slug_uidx" ON "platform_plugins" ("slug");

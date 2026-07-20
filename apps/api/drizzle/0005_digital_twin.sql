-- Digital Twin foundation (additive visualization layer)
-- DT-0 per docs/73_DIGITAL_TWIN_ARCHITECTURE_ROADMAP.md

CREATE TABLE IF NOT EXISTS "twin_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "enable_3d" boolean DEFAULT false NOT NULL,
  "default_view" text DEFAULT 'factory' NOT NULL,
  "layout" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "twin_preferences_company_uidx" ON "twin_preferences" ("company_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "twin_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "kind" text DEFAULT 'overview' NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "sampled_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "twin_snapshots_company_idx" ON "twin_snapshots" ("company_id","sampled_at");

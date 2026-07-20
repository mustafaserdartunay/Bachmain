-- AI Growth Center foundation (additive)
-- AG-0 per docs/79_AI_GROWTH_CENTER_ARCHITECTURE_ROADMAP.md

CREATE TABLE IF NOT EXISTS "growth_leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "source" text NOT NULL,
  "name" text,
  "email" text,
  "phone" text,
  "company_name" text,
  "message" text,
  "status" text DEFAULT 'new' NOT NULL,
  "score" integer DEFAULT 0,
  "temperature" text DEFAULT 'cold',
  "purchase_probability" numeric(5, 2),
  "estimated_revenue" numeric(18, 2),
  "customer_id" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_leads_company_idx" ON "growth_leads" ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_leads_source_idx" ON "growth_leads" ("company_id","source");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "growth_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "channel" text DEFAULT 'multi' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "budget" numeric(18, 2),
  "currency" text DEFAULT 'TRY',
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_campaigns_company_idx" ON "growth_campaigns" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "growth_content_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "locale" text DEFAULT 'tr' NOT NULL,
  "title" text,
  "body" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "channel_targets" jsonb DEFAULT '[]'::jsonb,
  "parent_id" uuid,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_content_company_idx" ON "growth_content_assets" ("company_id","kind","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_content_locale_idx" ON "growth_content_assets" ("company_id","locale");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "growth_seo_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "url" text,
  "score" integer DEFAULT 0,
  "findings" jsonb DEFAULT '[]'::jsonb,
  "recommendations" jsonb DEFAULT '[]'::jsonb,
  "status" text DEFAULT 'done' NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_seo_audits_company_idx" ON "growth_seo_audits" ("company_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "growth_competitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "website" text,
  "notes" text,
  "last_analysis" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_competitors_company_idx" ON "growth_competitors" ("company_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "growth_funnels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "stages" jsonb DEFAULT '[]'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_funnels_company_idx" ON "growth_funnels" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "growth_channel_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "channel_key" text NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'disconnected' NOT NULL,
  "credentials_ref" text,
  "config" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "growth_channel_accounts_uidx" ON "growth_channel_accounts" ("company_id","channel_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_channel_accounts_company_idx" ON "growth_channel_accounts" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "growth_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "action" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "actor_user_id" uuid,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_audit_log_company_idx" ON "growth_audit_log" ("company_id","created_at");

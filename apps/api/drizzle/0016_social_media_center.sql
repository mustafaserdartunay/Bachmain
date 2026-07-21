-- Social Media Center SC-0 (Instagram AI Content Studio)

CREATE TABLE IF NOT EXISTS "smc_instagram_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "ig_user_id" text NOT NULL,
  "page_id" text,
  "username" text NOT NULL,
  "display_name" text,
  "token_ciphertext" text NOT NULL,
  "token_expires_at" timestamp with time zone,
  "scopes" jsonb DEFAULT '[]'::jsonb,
  "status" text DEFAULT 'connected' NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "smc_ig_accounts_uidx" ON "smc_instagram_accounts" ("company_id","ig_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_ig_accounts_company_idx" ON "smc_instagram_accounts" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_brand_kits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text DEFAULT 'Default' NOT NULL,
  "logo_url" text,
  "colors" jsonb DEFAULT '[]'::jsonb,
  "fonts" jsonb DEFAULT '[]'::jsonb,
  "watermark_url" text,
  "voice" text,
  "rules" text,
  "is_default" boolean DEFAULT false NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_brand_kits_company_idx" ON "smc_brand_kits" ("company_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_media_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "folder" text DEFAULT '/' NOT NULL,
  "name" text NOT NULL,
  "mime" text,
  "url" text NOT NULL,
  "storage_key" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "product_id" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_media_company_idx" ON "smc_media_assets" ("company_id","folder");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_content_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "account_id" uuid,
  "type" text NOT NULL,
  "title" text,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "status" text DEFAULT 'draft' NOT NULL,
  "brand_kit_id" uuid,
  "product_id" text,
  "campaign_id" uuid,
  "created_by" uuid,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_content_company_idx" ON "smc_content_items" ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_content_type_idx" ON "smc_content_items" ("company_id","type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_content_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "content_id" uuid NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "source" text DEFAULT 'ai' NOT NULL,
  "actor_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_content_versions_idx" ON "smc_content_versions" ("content_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "is_system" boolean DEFAULT false NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "smc_templates_slug_uidx" ON "smc_templates" ("slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "content_ids" jsonb DEFAULT '[]'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_campaigns_company_idx" ON "smc_campaigns" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "content_id" uuid NOT NULL,
  "recurrence" text DEFAULT 'once' NOT NULL,
  "recurrence_config" jsonb DEFAULT '{}'::jsonb,
  "run_at" timestamp with time zone,
  "next_run_at" timestamp with time zone,
  "timezone" text DEFAULT 'Europe/Istanbul',
  "status" text DEFAULT 'active' NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_schedules_next_idx" ON "smc_schedules" ("company_id","next_run_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_publish_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "content_id" uuid NOT NULL,
  "account_id" uuid,
  "scheduled_at" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "external_media_id" text,
  "external_publish_id" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_queue_due_idx" ON "smc_publish_queue" ("status","scheduled_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_queue_company_idx" ON "smc_publish_queue" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "content_id" uuid NOT NULL,
  "decision" text DEFAULT 'pending' NOT NULL,
  "reviewer_user_id" uuid,
  "note" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_approvals_company_idx" ON "smc_approvals" ("company_id","decision");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "read_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_notifications_company_idx" ON "smc_notifications" ("company_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_analytics_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "content_id" uuid,
  "account_id" uuid,
  "reach" integer DEFAULT 0,
  "impressions" integer DEFAULT 0,
  "engagement" integer DEFAULT 0,
  "saves" integer DEFAULT 0,
  "profile_visits" integer DEFAULT 0,
  "follower_delta" integer DEFAULT 0,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "captured_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smc_analytics_company_idx" ON "smc_analytics_snapshots" ("company_id","captured_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "smc_audit_log" (
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
CREATE INDEX IF NOT EXISTS "smc_audit_company_idx" ON "smc_audit_log" ("company_id","created_at");

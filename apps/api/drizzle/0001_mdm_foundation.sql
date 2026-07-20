-- MDM foundation (additive, backward compatible)
-- Run via drizzle migrate after 0000

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "external_id" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "branch_id" uuid;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_company_deleted_idx" ON "customers" ("company_id","deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_tax_idx" ON "customers" ("company_id","tax_no");
--> statement-breakpoint

ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "external_id" text;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
--> statement-breakpoint

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "external_id" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products" ("company_id","sku");
--> statement-breakpoint

ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "branch_id" uuid;
ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "external_id" text;
ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"city" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"external_id" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_company_idx" ON "branches" ("company_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "branches_company_code_uidx" ON "branches" ("company_id","code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mdm_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_tags_company_code_uidx" ON "mdm_tags" ("company_id","code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mdm_entity_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_entity_tags_uidx" ON "mdm_entity_tags" ("company_id","entity_type","entity_id","tag_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_entity_tags_entity_idx" ON "mdm_entity_tags" ("company_id","entity_type","entity_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mdm_external_ids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mdm_external_provider_uidx" ON "mdm_external_ids" ("company_id","provider","external_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_external_entity_idx" ON "mdm_external_ids" ("company_id","entity_type","entity_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mdm_record_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"changed_by" uuid,
	"field" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"snapshot" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_history_entity_idx" ON "mdm_record_history" ("company_id","entity_type","entity_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mdm_merge_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"survivor_id" uuid NOT NULL,
	"merged_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"performed_by" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mdm_merge_company_idx" ON "mdm_merge_jobs" ("company_id","entity_type");

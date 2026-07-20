-- Enterprise Document Platform foundation (additive) — docs/87
-- Does not replace client docTemplatesStore / BachDocumentDesigner SoT

CREATE TABLE IF NOT EXISTS "doc_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "doc_type" text DEFAULT 'generic' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "page_size" text DEFAULT 'A4',
  "orientation" text DEFAULT 'portrait',
  "locale" text DEFAULT 'tr',
  "version" integer DEFAULT 1 NOT NULL,
  "design" jsonb DEFAULT '{}'::jsonb,
  "source_module" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_templates_company_idx" ON "doc_templates" ("company_id","doc_type","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doc_labels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "width_mm" numeric(10, 2) NOT NULL,
  "height_mm" numeric(10, 2) NOT NULL,
  "label_kind" text DEFAULT 'product' NOT NULL,
  "design" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_labels_company_idx" ON "doc_labels" ("company_id","label_kind");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doc_print_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "brand" text,
  "device_class" text DEFAULT 'laser' NOT NULL,
  "target" text DEFAULT 'browser' NOT NULL,
  "paper" text DEFAULT 'A4',
  "settings" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_print_profiles_company_idx" ON "doc_print_profiles" ("company_id","device_class");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doc_print_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "template_id" text,
  "doc_type" text,
  "source_ref" text,
  "status" text DEFAULT 'queued' NOT NULL,
  "output" text DEFAULT 'pdf',
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_print_jobs_company_idx" ON "doc_print_jobs" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doc_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "kind" text DEFAULT 'image' NOT NULL,
  "url" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_assets_company_idx" ON "doc_assets" ("company_id","kind");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doc_fonts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "family" text NOT NULL,
  "source" text DEFAULT 'system' NOT NULL,
  "weights" jsonb DEFAULT '[]'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "doc_fonts_family_uidx" ON "doc_fonts" ("company_id","family");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doc_ai_designs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "prompt" text NOT NULL,
  "doc_type" text DEFAULT 'generic',
  "status" text DEFAULT 'draft' NOT NULL,
  "result" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doc_ai_designs_company_idx" ON "doc_ai_designs" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doc_marketplace_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "sector" text,
  "locale" text DEFAULT 'tr',
  "premium" boolean DEFAULT false NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "doc_marketplace_items_slug_uidx" ON "doc_marketplace_items" ("slug");

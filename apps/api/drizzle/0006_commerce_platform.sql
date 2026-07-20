-- Commerce Platform foundation (additive)
-- GC-0 per docs/77_COMMERCE_PLATFORM_ARCHITECTURE_ROADMAP.md

CREATE TABLE IF NOT EXISTS "commerce_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "channel_key" text NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'disconnected' NOT NULL,
  "credentials_ref" text,
  "config" jsonb DEFAULT '{}'::jsonb,
  "last_sync_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commerce_channels_company_key_uidx" ON "commerce_channels" ("company_id","channel_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_channels_company_idx" ON "commerce_channels" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_listings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "channel_id" uuid NOT NULL,
  "product_id" text NOT NULL,
  "sku" text,
  "external_id" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "title" text,
  "price" numeric(18, 4),
  "currency" text DEFAULT 'TRY',
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_listings_company_idx" ON "commerce_listings" ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_listings_product_idx" ON "commerce_listings" ("company_id","product_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commerce_listings_channel_product_uidx" ON "commerce_listings" ("channel_id","product_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_price_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "priority" integer DEFAULT 100 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "scope" text DEFAULT 'global' NOT NULL,
  "customer_id" text,
  "dealer_id" text,
  "country_code" text,
  "currency" text,
  "product_id" text,
  "min_qty" integer,
  "adjustment_type" text DEFAULT 'percent' NOT NULL,
  "adjustment_value" numeric(18, 4) NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_price_rules_company_idx" ON "commerce_price_rules" ("company_id","active","priority");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_orders_inbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "channel_id" uuid,
  "channel_key" text NOT NULL,
  "external_order_id" text NOT NULL,
  "status" text DEFAULT 'received' NOT NULL,
  "currency" text DEFAULT 'TRY',
  "total_amount" numeric(18, 4),
  "customer_name" text,
  "customer_email" text,
  "lines" jsonb DEFAULT '[]'::jsonb,
  "raw_payload" jsonb DEFAULT '{}'::jsonb,
  "risk_score" integer DEFAULT 0,
  "erp_order_id" text,
  "promoted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_inbox_ext_uidx" ON "commerce_orders_inbox" ("company_id","channel_key","external_order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_orders_inbox_company_idx" ON "commerce_orders_inbox" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_stock_sync_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "channel_key" text,
  "status" text DEFAULT 'queued' NOT NULL,
  "products_touched" integer DEFAULT 0,
  "error_message" text,
  "started_at" timestamp with time zone,
  "finished_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_stock_sync_jobs_company_idx" ON "commerce_stock_sync_jobs" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_product_i18n" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "product_id" text NOT NULL,
  "locale" text NOT NULL,
  "title" text,
  "description" text,
  "seo_title" text,
  "seo_description" text,
  "keywords" jsonb DEFAULT '[]'::jsonb,
  "alt_text" text,
  "tech_specs" text,
  "marketing_copy" text,
  "social_copy" text,
  "merchant_feed" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commerce_product_i18n_uidx" ON "commerce_product_i18n" ("company_id","product_id","locale");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_product_i18n_product_idx" ON "commerce_product_i18n" ("company_id","product_id");

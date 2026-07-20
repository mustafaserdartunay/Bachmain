-- Commerce GC-1 additive tables
-- Product AI / i18n uses commerce_product_i18n (GC-0)

CREATE TABLE IF NOT EXISTS "commerce_returns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "order_ref" text NOT NULL,
  "kind" text DEFAULT 'return' NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "reason" text,
  "channel_key" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_returns_company_idx" ON "commerce_returns" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_ref" text NOT NULL,
  "product_id" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "interval" text DEFAULT 'month' NOT NULL,
  "amount" numeric(18, 4),
  "currency" text DEFAULT 'TRY',
  "next_renewal_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_subscriptions_company_idx" ON "commerce_subscriptions" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_shipments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "order_ref" text NOT NULL,
  "carrier" text NOT NULL,
  "tracking_no" text,
  "status" text DEFAULT 'created' NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_shipments_company_idx" ON "commerce_shipments" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_payment_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "order_ref" text,
  "provider" text NOT NULL,
  "amount" numeric(18, 4) NOT NULL,
  "currency" text DEFAULT 'TRY' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "external_id" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_payments_company_idx" ON "commerce_payment_intents" ("company_id","status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_order_analyses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "inbox_id" uuid,
  "order_ref" text,
  "risk_score" integer DEFAULT 0,
  "fraud_score" integer DEFAULT 0,
  "stock_risk" integer DEFAULT 0,
  "delivery_risk" integer DEFAULT 0,
  "repeat_order" boolean DEFAULT false,
  "flags" jsonb DEFAULT '[]'::jsonb,
  "summary" text,
  "recommendation" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_order_analyses_company_idx" ON "commerce_order_analyses" ("company_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_coupons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "code" text NOT NULL,
  "discount_type" text DEFAULT 'percent' NOT NULL,
  "discount_value" numeric(18, 4) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commerce_coupons_code_uidx" ON "commerce_coupons" ("company_id","code");

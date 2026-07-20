-- Customer Experience Cloud foundation (additive) — docs/85
-- Does not replace master customer / CRM agenda SoT

CREATE TABLE IF NOT EXISTS "cxc_pipeline_stages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "color" text,
  "is_won" boolean DEFAULT false NOT NULL,
  "is_lost" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cxc_pipeline_stages_code_uidx" ON "cxc_pipeline_stages" ("company_id","code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_pipeline_stages_company_idx" ON "cxc_pipeline_stages" ("company_id","sort_order");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cxc_opportunities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" text NOT NULL,
  "title" text NOT NULL,
  "stage_code" text NOT NULL,
  "amount" numeric(18, 4) DEFAULT '0',
  "currency" text DEFAULT 'TRY',
  "owner_id" text,
  "source" text,
  "probability" integer DEFAULT 0,
  "expected_close_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_opportunities_company_idx" ON "cxc_opportunities" ("company_id","stage_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_opportunities_customer_idx" ON "cxc_opportunities" ("company_id","customer_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cxc_timeline_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" text NOT NULL,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "summary" text,
  "source_ref" text,
  "source_module" text,
  "occurred_at" timestamp with time zone NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_timeline_events_customer_idx" ON "cxc_timeline_events" ("company_id","customer_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_timeline_events_kind_idx" ON "cxc_timeline_events" ("company_id","kind");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cxc_health_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" text NOT NULL,
  "score" integer DEFAULT 50 NOT NULL,
  "factors" jsonb DEFAULT '{}'::jsonb,
  "churn_risk" text DEFAULT 'medium',
  "computed_at" timestamp with time zone,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cxc_health_scores_customer_uidx" ON "cxc_health_scores" ("company_id","customer_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cxc_loyalty" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" text NOT NULL,
  "tier" text DEFAULT 'bronze' NOT NULL,
  "points" integer DEFAULT 0 NOT NULL,
  "discount_pct" numeric(8, 2) DEFAULT '0',
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cxc_loyalty_customer_uidx" ON "cxc_loyalty" ("company_id","customer_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cxc_support_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" text NOT NULL,
  "subject" text NOT NULL,
  "channel" text DEFAULT 'portal' NOT NULL,
  "priority" text DEFAULT 'normal' NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "sla_due_at" timestamp with time zone,
  "ai_summary" text,
  "portal_ticket_ref" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_support_tickets_company_idx" ON "cxc_support_tickets" ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_support_tickets_customer_idx" ON "cxc_support_tickets" ("company_id","customer_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cxc_ai_insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" text,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_ai_insights_company_idx" ON "cxc_ai_insights" ("company_id","kind");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cxc_next_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "customer_id" text NOT NULL,
  "action" text NOT NULL,
  "reason" text,
  "priority" integer DEFAULT 50 NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cxc_next_actions_company_idx" ON "cxc_next_actions" ("company_id","status");

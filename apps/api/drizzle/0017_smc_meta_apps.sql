CREATE TABLE IF NOT EXISTS "smc_meta_apps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "app_id" text NOT NULL,
  "app_secret_ciphertext" text NOT NULL,
  "redirect_uri" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "smc_meta_apps_company_uidx" ON "smc_meta_apps" ("company_id");

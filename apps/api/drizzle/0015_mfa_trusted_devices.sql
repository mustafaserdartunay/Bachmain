CREATE TABLE IF NOT EXISTS "trusted_devices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "device_hash" text NOT NULL,
  "label" text,
  "user_agent" text,
  "ip" text,
  "last_seen_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "trusted_devices_user_hash_uidx" ON "trusted_devices" ("user_id","device_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trusted_devices_user_idx" ON "trusted_devices" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mfa_challenges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "challenge_hash" text NOT NULL,
  "purpose" text DEFAULT 'login' NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mfa_challenges_user_idx" ON "mfa_challenges" ("user_id");

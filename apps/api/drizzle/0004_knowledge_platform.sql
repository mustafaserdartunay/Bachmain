-- Knowledge Platform foundation (additive)
-- KP-0 per docs/71_KNOWLEDGE_PLATFORM_ARCHITECTURE_ROADMAP.md

CREATE TABLE IF NOT EXISTS "knowledge_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "title" text NOT NULL,
  "doc_type" text DEFAULT 'txt' NOT NULL,
  "category" text DEFAULT 'general' NOT NULL,
  "language" text DEFAULT 'tr',
  "status" text DEFAULT 'indexed' NOT NULL,
  "summary" text,
  "keywords" jsonb DEFAULT '[]'::jsonb,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "current_version" integer DEFAULT 1 NOT NULL,
  "branch_id" uuid,
  "warehouse_id" uuid,
  "department_id" text,
  "role_codes" jsonb DEFAULT '[]'::jsonb,
  "source_module" text,
  "mime_type" text,
  "byte_size" integer,
  "ocr_status" text DEFAULT 'none',
  "index_status" text DEFAULT 'pending',
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_docs_company_idx" ON "knowledge_documents" ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_docs_category_idx" ON "knowledge_documents" ("company_id","category");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "knowledge_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "content_text" text DEFAULT '' NOT NULL,
  "changelog" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_versions_uidx" ON "knowledge_versions" ("document_id","version");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "chunk_index" integer NOT NULL,
  "content" text NOT NULL,
  "tokens" jsonb DEFAULT '[]'::jsonb,
  "embedding" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_doc_idx" ON "knowledge_chunks" ("document_id","version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_company_idx" ON "knowledge_chunks" ("company_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "knowledge_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "label" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_links_doc_idx" ON "knowledge_links" ("document_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_links_entity_idx" ON "knowledge_links" ("company_id","entity_type","entity_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "knowledge_faq" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "document_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_faq_company_idx" ON "knowledge_faq" ("company_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "knowledge_search_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "user_id" uuid,
  "query" text NOT NULL,
  "hit_count" integer DEFAULT 0,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_search_log_company_idx" ON "knowledge_search_log" ("company_id","created_at");

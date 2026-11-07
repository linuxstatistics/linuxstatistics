ALTER TYPE "public"."ingestion_source" ADD VALUE IF NOT EXISTS 'wikidata';
--> statement-breakpoint
ALTER TABLE "distros" ADD COLUMN IF NOT EXISTS "discovered_via" text;

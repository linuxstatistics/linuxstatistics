ALTER TYPE "public"."ingestion_source" ADD VALUE IF NOT EXISTS 'wikipedia';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pageview_months" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"distro_id" integer NOT NULL,
	"month" text NOT NULL,
	"views" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pageview_months" ADD CONSTRAINT "pageview_months_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pageview_months_uniq" ON "pageview_months" USING btree ("source","distro_id","month");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_view_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"distro_id" integer NOT NULL,
	"day" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_view_days" ADD CONSTRAINT "page_view_days_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "page_view_days_uniq" ON "page_view_days" USING btree ("distro_id","day");

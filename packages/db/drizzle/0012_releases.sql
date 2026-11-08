ALTER TYPE "public"."ingestion_source" ADD VALUE IF NOT EXISTS 'endoflife';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "distro_releases" (
	"id" serial PRIMARY KEY NOT NULL,
	"distro_id" integer NOT NULL,
	"source" text NOT NULL,
	"cycle" text NOT NULL,
	"codename" text,
	"released_on" text,
	"latest" text,
	"latest_on" text,
	"support_ends" text,
	"eol" text,
	"lts" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "distro_releases" ADD CONSTRAINT "distro_releases_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "distro_releases_uniq" ON "distro_releases" USING btree ("distro_id","source","cycle");

CREATE TABLE IF NOT EXISTS "distro_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"alias" text NOT NULL,
	"distro_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "distro_aliases" ADD CONSTRAINT "distro_aliases_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "distro_aliases_source_alias_uniq" ON "distro_aliases" USING btree ("source","alias");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dw_period_captured_idx" ON "distrowatch_snapshots" USING btree ("period","captured_at");

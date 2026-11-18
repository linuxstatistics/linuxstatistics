CREATE TABLE "distro_facts" (
	"distro_id" integer PRIMARY KEY NOT NULL,
	"default_desktop" text,
	"other_desktops" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"editions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"package_manager" text,
	"init" text,
	"source_url" text,
	"field_sources" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "distro_facts" ADD CONSTRAINT "distro_facts_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
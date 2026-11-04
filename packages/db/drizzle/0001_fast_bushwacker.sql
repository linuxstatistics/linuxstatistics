CREATE TYPE "public"."contribution_source" AS ENUM('user');--> statement-breakpoint
CREATE TYPE "public"."contribution_status" AS ENUM('visible', 'hidden', 'removed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "distro_contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"distro_id" integer NOT NULL,
	"rating" smallint,
	"uses_it" boolean DEFAULT false NOT NULL,
	"review_body" text,
	"source" "contribution_source" DEFAULT 'user' NOT NULL,
	"status" "contribution_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contrib_rating_range" CHECK ("distro_contributions"."rating" is null or ("distro_contributions"."rating" >= 1 and "distro_contributions"."rating" <= 5))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"github_login" text NOT NULL,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"github_created_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "distro_contributions" ADD CONSTRAINT "distro_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "distro_contributions" ADD CONSTRAINT "distro_contributions_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contrib_user_distro_uniq" ON "distro_contributions" USING btree ("user_id","distro_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contrib_distro_status_idx" ON "distro_contributions" USING btree ("distro_id","status");
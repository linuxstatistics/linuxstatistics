CREATE TYPE "public"."distro_status" AS ENUM('active', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."family" AS ENUM('debian', 'arch', 'rpm', 'independent', 'gentoo', 'slackware', 'other');--> statement-breakpoint
CREATE TYPE "public"."ingestion_source" AS ENUM('distrowatch', 'statcounter', 'github');--> statement-breakpoint
CREATE TYPE "public"."ingestion_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('linux', 'windows', 'macos', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "distros" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"family" "family" NOT NULL,
	"based_on_slug" text,
	"homepage" text,
	"logo_url" text,
	"first_release_year" integer,
	"status" "distro_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distros_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "distrowatch_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"distro_id" integer NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"rank" integer NOT NULL,
	"hits_per_day" integer NOT NULL,
	"period" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_repos" (
	"id" serial PRIMARY KEY NOT NULL,
	"distro_id" integer NOT NULL,
	"repo_full_name" text NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"forks" integer DEFAULT 0 NOT NULL,
	"open_issues" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "github_repos_repo_full_name_unique" UNIQUE("repo_full_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"repo_id" integer NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"stars" integer NOT NULL,
	"commits_last_30d" integer NOT NULL,
	"contributors" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingestion_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" "ingestion_source" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "ingestion_status" DEFAULT 'running' NOT NULL,
	"error" text,
	"rows_written" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_share" (
	"id" serial PRIMARY KEY NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"region" text NOT NULL,
	"platform" "platform" NOT NULL,
	"share_pct" numeric(6, 3) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "distrowatch_snapshots" ADD CONSTRAINT "distrowatch_snapshots_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_repos" ADD CONSTRAINT "github_repos_distro_id_distros_id_fk" FOREIGN KEY ("distro_id") REFERENCES "public"."distros"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_snapshots" ADD CONSTRAINT "github_snapshots_repo_id_github_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."github_repos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "distros_family_idx" ON "distros" USING btree ("family");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dw_distro_captured_idx" ON "distrowatch_snapshots" USING btree ("distro_id","captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gh_repo_captured_idx" ON "github_snapshots" USING btree ("repo_id","captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_share_idx" ON "market_share" USING btree ("region","platform","captured_at");
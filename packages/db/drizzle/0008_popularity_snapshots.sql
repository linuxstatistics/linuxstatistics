ALTER TABLE "distrowatch_snapshots" RENAME TO "popularity_snapshots";
--> statement-breakpoint
ALTER TABLE "popularity_snapshots" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'distrowatch' NOT NULL;
--> statement-breakpoint
ALTER TABLE "popularity_snapshots" ALTER COLUMN "source" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "popularity_snapshots" RENAME CONSTRAINT "distrowatch_snapshots_pkey" TO "popularity_snapshots_pkey";
--> statement-breakpoint
ALTER TABLE "popularity_snapshots" RENAME CONSTRAINT "distrowatch_snapshots_distro_id_distros_id_fk" TO "popularity_snapshots_distro_id_distros_id_fk";
--> statement-breakpoint
ALTER SEQUENCE IF EXISTS "distrowatch_snapshots_id_seq" RENAME TO "popularity_snapshots_id_seq";
--> statement-breakpoint
DROP INDEX IF EXISTS "dw_distro_captured_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "dw_period_captured_idx";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pop_distro_captured_idx" ON "popularity_snapshots" USING btree ("source","distro_id","captured_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pop_period_captured_idx" ON "popularity_snapshots" USING btree ("source","period","captured_at");

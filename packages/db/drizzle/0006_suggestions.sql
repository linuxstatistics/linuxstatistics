DO $$ BEGIN
 CREATE TYPE "public"."suggestion_status" AS ENUM('new', 'done', 'dismissed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"email" text,
	"user_id" integer,
	"status" "suggestion_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "suggestions_status_created_idx" ON "suggestions" USING btree ("status","created_at");

CREATE TABLE IF NOT EXISTS "picker_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_key" text NOT NULL,
	"code" text NOT NULL,
	"fit" boolean NOT NULL,
	"day" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "picker_feedback_top_idx" ON "picker_feedback" USING btree ("top_key");

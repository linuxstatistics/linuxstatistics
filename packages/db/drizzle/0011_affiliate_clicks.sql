CREATE TABLE IF NOT EXISTS "affiliate_click_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner" text NOT NULL,
	"day" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_click_days_uniq" ON "affiliate_click_days" USING btree ("partner","day");

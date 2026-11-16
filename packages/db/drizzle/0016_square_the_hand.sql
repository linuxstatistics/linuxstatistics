CREATE TABLE "quiz_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz" text NOT NULL,
	"code" text NOT NULL,
	"top_key" text NOT NULL,
	"day" text NOT NULL,
	"token" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "switch_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"came_from" text NOT NULL,
	"now_using" text,
	"page" text NOT NULL,
	"day" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "quiz_completions_day_idx" ON "quiz_completions" USING btree ("day");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_completions_token_uniq" ON "quiz_completions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "switch_reports_day_idx" ON "switch_reports" USING btree ("day");
CREATE TABLE "gap_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"report" jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "email_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_signups_email_unique" UNIQUE("email")
);

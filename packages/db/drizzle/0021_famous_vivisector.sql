CREATE TYPE "public"."email_signup_status" AS ENUM('pending', 'confirmed', 'unsubscribed', 'legacy');--> statement-breakpoint
ALTER TABLE "email_signups" ADD COLUMN "status" "email_signup_status" DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_signups" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
DELETE FROM "email_signups" a USING "email_signups" b WHERE lower(trim(a."email")) = lower(trim(b."email")) AND a."id" > b."id";--> statement-breakpoint
UPDATE "email_signups" SET "email" = lower(trim("email")) WHERE "email" <> lower(trim("email"));--> statement-breakpoint
ALTER TABLE "email_signups" ADD COLUMN "confirm_token_hash" text;--> statement-breakpoint
ALTER TABLE "email_signups" ADD COLUMN "confirm_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_signups" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_signups" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_signups" ADD COLUMN "unsubscribed_at" timestamp with time zone;
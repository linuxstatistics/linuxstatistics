CREATE TABLE "moderation_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"contribution_id" integer NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"admin_id" integer,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "distro_contributions" ADD COLUMN "hidden_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "distro_contributions" ADD COLUMN "hidden_reason" text;--> statement-breakpoint
ALTER TABLE "distro_contributions" ADD COLUMN "hidden_by" integer;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_contribution_id_distro_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."distro_contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distro_contributions" ADD CONSTRAINT "distro_contributions_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
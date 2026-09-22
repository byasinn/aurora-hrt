ALTER TABLE "profile" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "username_change_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "username_change_window_start" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_username_idx" ON "profile" USING btree ("username");
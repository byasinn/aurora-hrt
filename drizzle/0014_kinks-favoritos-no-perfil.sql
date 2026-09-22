ALTER TABLE "profile" ADD COLUMN "show_kinks_on_profile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "favorite_kinks" jsonb DEFAULT '[]'::jsonb NOT NULL;

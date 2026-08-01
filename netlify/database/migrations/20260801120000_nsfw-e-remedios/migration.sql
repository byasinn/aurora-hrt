ALTER TABLE "profile" ADD COLUMN "nsfw_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "genital_term" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "show_genital_measurements" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "kinks" jsonb DEFAULT '[]'::jsonb NOT NULL;
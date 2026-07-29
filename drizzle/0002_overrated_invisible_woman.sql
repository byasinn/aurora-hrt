ALTER TABLE "profile" ADD COLUMN "text_style" text DEFAULT 'feminine' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "avatar_icon" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "is_on_hrt" boolean;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "not_on_meds_yet" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "app_goals" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "enabled_modules" jsonb DEFAULT '["medications","mood","calendar","measurements"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;
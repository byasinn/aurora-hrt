ALTER TABLE "community_posts" ADD COLUMN "font_style" text;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "card_style" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "card_color" text;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "card_color2" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "font_style" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "card_style" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "card_color" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "card_color2" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "repost_of_kind" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "repost_of_id" integer;
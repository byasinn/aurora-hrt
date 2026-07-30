CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"icon" text DEFAULT '💜' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "show_stats_on_profile" boolean DEFAULT false NOT NULL;
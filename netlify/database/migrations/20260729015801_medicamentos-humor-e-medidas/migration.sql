CREATE TABLE "measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medications" ADD COLUMN "reminders_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD COLUMN "libido_level" integer;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "theme_accent_2" text DEFAULT '#7fd4e8' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "content_preference" text DEFAULT 'feminine' NOT NULL;
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "show_tips_on_home" boolean DEFAULT true NOT NULL;
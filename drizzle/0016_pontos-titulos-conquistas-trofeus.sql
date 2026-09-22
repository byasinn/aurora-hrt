ALTER TABLE "messages" ALTER COLUMN "icon" SET DEFAULT 'heart';--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "nsfw" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "equipped_title_sfw" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "equipped_title_nsfw" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "show_titles_sfw" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "show_titles_nsfw" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "show_achievements_on_profile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "show_trophies_on_profile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE "unlocked_titles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title_key" text NOT NULL,
	"track" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unlocked_trophies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"trophy_key" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "unlocked_titles" ADD CONSTRAINT "unlocked_titles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unlocked_trophies" ADD CONSTRAINT "unlocked_trophies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unlocked_titles_user_key" ON "unlocked_titles" USING btree ("user_id","title_key");--> statement-breakpoint
CREATE UNIQUE INDEX "unlocked_trophies_user_key" ON "unlocked_trophies" USING btree ("user_id","trophy_key");

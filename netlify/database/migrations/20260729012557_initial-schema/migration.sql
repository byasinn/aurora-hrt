CREATE TABLE "dose_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"medication_id" integer NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"taken_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dose_amount" text NOT NULL,
	"dose_unit" text NOT NULL,
	"route" text NOT NULL,
	"frequency_type" text NOT NULL,
	"frequency_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"preferred_time" text NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"mood_tag_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"symptom_tag_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"energy_level" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"pronouns" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"transition_start_date" date,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"theme_accent" text DEFAULT '#7fd4e8' NOT NULL,
	"theme_mode" text DEFAULT 'dark' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"emoji" text,
	"color" text,
	"is_custom" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unlocked_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"achievement_key" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unlocked_achievements_achievement_key_unique" UNIQUE("achievement_key")
);
--> statement-breakpoint
ALTER TABLE "dose_logs" ADD CONSTRAINT "dose_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;

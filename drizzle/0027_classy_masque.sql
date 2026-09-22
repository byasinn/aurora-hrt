CREATE TABLE "cycle_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"flow" text,
	"symptoms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "app_icon_variant" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "cycle_tracking_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "average_cycle_length" integer DEFAULT 28 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "average_period_length" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "cycle_logs" ADD CONSTRAINT "cycle_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cycle_logs_user_date" ON "cycle_logs" USING btree ("user_id","date");
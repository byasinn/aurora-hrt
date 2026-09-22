ALTER TABLE "activities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_completions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "partnerships" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "permission_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "activities" CASCADE;--> statement-breakpoint
DROP TABLE "activity_completions" CASCADE;--> statement-breakpoint
DROP TABLE "partnerships" CASCADE;--> statement-breakpoint
DROP TABLE "permission_requests" CASCADE;--> statement-breakpoint
ALTER TABLE "routines" DROP CONSTRAINT "routines_assigned_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "nsfw_mode";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "genital_term";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "show_genital_measurements";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "kinks";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "show_kinks_on_profile";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "favorite_kinks";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "equipped_title_nsfw";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "show_titles_nsfw";--> statement-breakpoint
ALTER TABLE "routines" DROP COLUMN "nsfw";--> statement-breakpoint
ALTER TABLE "routines" DROP COLUMN "assigned_by_user_id";
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"assigned_by_user_id" integer,
	"category" text NOT NULL,
	"template_key" text NOT NULL,
	"title" text NOT NULL,
	"icon" text DEFAULT 'check' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"days_of_week" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"timer_duration_seconds" integer,
	"timer_ends_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"duration_seconds" integer,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Backfill: copia cada linha de "tasks" pra "activities" antes de derrubar a tabela antiga, preservando histórico.
-- Título bate com um dos 5 templates de punição antigos -> categoria 'punishment' com a chave nova correspondente
-- ('De castigo' virou 'denial'/Negação nesta rodada). Qualquer outro título (task de masturbação, envio de parceria
-- etc.) -> categoria 'task' genérica. Pendentes com prazo (due_at) migram como "running" com o timer já contando,
-- pra não perder o prazo que já existia; as que já estavam com prazo vencido marcam notified_at pra não disparar
-- uma enxurrada de push assim que a function agendada rodar de novo. Concluídas geram uma linha em
-- activity_completions pra manter Néctar/streaks intactos.
WITH migrated AS (
	INSERT INTO activities (
		user_id, assigned_by_user_id, category, template_key, title, icon, config,
		days_of_week, active, status, started_at, timer_duration_seconds, timer_ends_at, notified_at, completed_at, created_at
	)
	SELECT
		t.user_id,
		t.assigned_by_user_id,
		CASE WHEN t.title IN ('Castidade', 'Treino oral', 'Treino anal', 'De castigo', 'Linhas escritas')
			THEN 'punishment' ELSE 'task' END,
		CASE t.title
			WHEN 'Castidade' THEN 'chastity'
			WHEN 'Treino oral' THEN 'oral_training'
			WHEN 'Treino anal' THEN 'anal_training'
			WHEN 'De castigo' THEN 'denial'
			WHEN 'Linhas escritas' THEN 'lines'
			ELSE 'custom'
		END,
		t.title,
		t.icon,
		CASE WHEN t.duration_hours IS NOT NULL
			THEN jsonb_build_object('duration', t.duration_hours * 3600) ELSE '{}'::jsonb END,
		NULL,
		true,
		CASE
			WHEN t.done THEN 'done'
			WHEN t.due_at IS NOT NULL THEN 'running'
			ELSE 'pending'
		END,
		CASE WHEN NOT t.done AND t.due_at IS NOT NULL THEN t.created_at ELSE NULL END,
		CASE WHEN NOT t.done AND t.duration_hours IS NOT NULL THEN t.duration_hours * 3600 ELSE NULL END,
		CASE WHEN NOT t.done THEN t.due_at ELSE NULL END,
		CASE WHEN NOT t.done AND t.due_at IS NOT NULL AND t.due_at < now() THEN t.due_at ELSE NULL END,
		CASE WHEN t.done THEN t.created_at ELSE NULL END,
		t.created_at
	FROM tasks t
	WHERE t.user_id IS NOT NULL
	RETURNING id AS activity_id, user_id, status, config, created_at
)
INSERT INTO activity_completions (activity_id, user_id, duration_seconds, completed_at)
SELECT
	activity_id,
	user_id,
	(config->>'duration')::integer,
	created_at
FROM migrated
WHERE status = 'done';
--> statement-breakpoint
DROP TABLE "tasks";

CREATE TABLE "lab_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"label" text,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

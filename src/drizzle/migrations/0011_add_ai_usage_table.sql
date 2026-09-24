CREATE TYPE "public"."ai_usage_type" AS ENUM('llm', 'embedding');--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "ai_usage_type" NOT NULL,
	"input_tokens" bigint NOT NULL,
	"output_tokens" bigint,
	"total_tokens" bigint NOT NULL,
	"cost" numeric(12, 8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

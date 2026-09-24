CREATE TYPE "public"."document_status" AS ENUM('processing', 'success', 'failed');--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "status" "document_status" DEFAULT 'processing' NOT NULL;
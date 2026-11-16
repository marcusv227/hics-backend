-- CreateEnum
CREATE TYPE "ProfessionalCouncil" AS ENUM ('CRM', 'COREN', 'CREFITO', 'CRF');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('EMERGENCY', 'TRACK', 'VIDEO');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ContentOrigin" AS ENUM ('SEED', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CREDENTIAL_APPROVED', 'CREDENTIAL_REJECTED', 'SUBMISSION_PUBLISHED', 'SUBMISSION_CHANGES_REQUESTED');

-- NOTE: the emergency_procedures_{title,summary}_trgm_idx GIN indexes are
-- intentionally NOT dropped here, even though `prisma migrate diff` flags
-- them as drift (they were created by a raw-SQL migration with no matching
-- schema.prisma declaration, since Prisma's postgresqlExtensions support is
-- still a preview feature). Keep them.

-- AlterTable
ALTER TABLE "educational_videos" ADD COLUMN     "author_id" TEXT,
ADD COLUMN     "origin" "ContentOrigin" NOT NULL DEFAULT 'SEED',
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_id" TEXT,
ADD COLUMN     "submission_id" TEXT;

-- AlterTable
ALTER TABLE "emergency_procedures" ADD COLUMN     "author_id" TEXT,
ADD COLUMN     "dont_do_items" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "origin" "ContentOrigin" NOT NULL DEFAULT 'SEED',
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "related_video_id" TEXT,
ADD COLUMN     "reviewed_by_id" TEXT,
ADD COLUMN     "submission_id" TEXT;

-- AlterTable
ALTER TABLE "training_tracks" ADD COLUMN     "author_id" TEXT,
ADD COLUMN     "origin" "ContentOrigin" NOT NULL DEFAULT 'SEED',
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_id" TEXT,
ADD COLUMN     "submission_id" TEXT;

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "council" "ProfessionalCouncil",
    "registration_number" TEXT,
    "uf" CHAR(2),
    "specialty" TEXT,
    "institution" TEXT,
    "document_key" TEXT,
    "document_mime" TEXT,
    "document_size_bytes" INTEGER,
    "status" "CredentialStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_submissions" (
    "id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "author_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "checklist" JSONB,
    "preview_tested_at" TIMESTAMP(3),
    "change_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "review_note" TEXT,
    "published_entity_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_user_id_key" ON "professional_profiles"("user_id");

-- CreateIndex
CREATE INDEX "professional_profiles_status_idx" ON "professional_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_council_registration_number_uf_key" ON "professional_profiles"("council", "registration_number", "uf");

-- CreateIndex
CREATE INDEX "content_submissions_status_type_idx" ON "content_submissions"("status", "type");

-- CreateIndex
CREATE INDEX "content_submissions_author_id_status_idx" ON "content_submissions"("author_id", "status");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "educational_videos_submission_id_key" ON "educational_videos"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_procedures_related_video_id_key" ON "emergency_procedures"("related_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_procedures_submission_id_key" ON "emergency_procedures"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_tracks_submission_id_key" ON "training_tracks"("submission_id");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_submissions" ADD CONSTRAINT "content_submissions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_submissions" ADD CONSTRAINT "content_submissions_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_procedures" ADD CONSTRAINT "emergency_procedures_related_video_id_fkey" FOREIGN KEY ("related_video_id") REFERENCES "educational_videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_procedures" ADD CONSTRAINT "emergency_procedures_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_procedures" ADD CONSTRAINT "emergency_procedures_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_tracks" ADD CONSTRAINT "training_tracks_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_tracks" ADD CONSTRAINT "training_tracks_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educational_videos" ADD CONSTRAINT "educational_videos_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educational_videos" ADD CONSTRAINT "educational_videos_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing content was always public, so treat it as already published.
UPDATE "emergency_procedures" SET "published_at" = "created_at" WHERE "published_at" IS NULL;
UPDATE "training_tracks" SET "published_at" = "created_at" WHERE "published_at" IS NULL;
UPDATE "educational_videos" SET "published_at" = "created_at" WHERE "published_at" IS NULL;

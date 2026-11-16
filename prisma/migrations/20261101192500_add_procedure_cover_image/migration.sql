-- AlterTable
-- Note: the pg_trgm GIN indexes on emergency_procedures (title/summary) are
-- hand-written and outside Prisma's schema tracking; the generated diff for
-- this change also wanted to DROP them, so that part was stripped here.
ALTER TABLE "emergency_procedures" ADD COLUMN     "cover_image_url" TEXT;

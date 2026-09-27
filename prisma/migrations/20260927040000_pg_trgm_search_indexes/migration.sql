-- Enable trigram search support
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_procedures_title_trgm_idx" ON "emergency_procedures" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_procedures_summary_trgm_idx" ON "emergency_procedures" USING GIN ("summary" gin_trgm_ops);

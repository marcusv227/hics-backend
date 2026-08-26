-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'HEALTH_PROFESSIONAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_procedures" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity_level" TEXT NOT NULL DEFAULT 'HIGH',
    "source_reference" TEXT NOT NULL,
    "is_offline_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_steps" (
    "id" TEXT NOT NULL,
    "procedure_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "image_url" TEXT,
    "warning_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procedure_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_tracks" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimated_time_minutes" INTEGER NOT NULL DEFAULT 10,
    "cover_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_cards" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content_text" TEXT NOT NULL,
    "media_url" TEXT,

    CONSTRAINT "training_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_training_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_training_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educational_videos" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "youtube_video_id" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "source_reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "educational_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Atendimento de Orientação',
    "disclaimer_accepted" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources_cited" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "procedure_steps_procedure_id_step_number_key" ON "procedure_steps"("procedure_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "training_cards_track_id_order_index_key" ON "training_cards"("track_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "user_training_progress_user_id_track_id_key" ON "user_training_progress"("user_id", "track_id");

-- AddForeignKey
ALTER TABLE "emergency_procedures" ADD CONSTRAINT "emergency_procedures_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_steps" ADD CONSTRAINT "procedure_steps_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "emergency_procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_tracks" ADD CONSTRAINT "training_tracks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_cards" ADD CONSTRAINT "training_cards_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "training_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "training_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_training_progress" ADD CONSTRAINT "user_training_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_training_progress" ADD CONSTRAINT "user_training_progress_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "training_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educational_videos" ADD CONSTRAINT "educational_videos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

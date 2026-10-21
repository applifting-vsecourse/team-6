-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "meeting_frequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "tag_kind" AS ENUM ('TEACH', 'LEARN', 'INTEREST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "city" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tag_slug_key" ON "tag"("slug");

-- CreateTable
CREATE TABLE IF NOT EXISTS "profile" (
    "user_id" TEXT NOT NULL,
    "position" TEXT,
    "expectations" TEXT,
    "meeting_frequency" "meeting_frequency",
    "weekdays" BOOLEAN NOT NULL DEFAULT false,
    "weekends" BOOLEAN NOT NULL DEFAULT false,
    "mornings" BOOLEAN NOT NULL DEFAULT false,
    "afternoons" BOOLEAN NOT NULL DEFAULT false,
    "evenings" BOOLEAN NOT NULL DEFAULT false,
    "city_id" TEXT,
    "radius_km" INTEGER,
    "note" TEXT,
    "onboarding_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "mornings" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "afternoons" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "evenings" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "profile_tag" (
    "user_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "kind" "tag_kind" NOT NULL,

    CONSTRAINT "profile_tag_pkey" PRIMARY KEY ("user_id", "tag_id", "kind")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "profile" ADD CONSTRAINT "profile_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "profile_tag" ADD CONSTRAINT "profile_tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "profile_tag" ADD CONSTRAINT "profile_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Reference data: Cities
INSERT INTO "city" ("id", "name", "lat", "lng") VALUES
    ('city_praha', 'Praha', 50.0755, 14.4378),
    ('city_brno', 'Brno', 49.1951, 16.6068),
    ('city_ostrava', 'Ostrava', 49.8209, 18.2625),
    ('city_plzen', 'Plzeň', 49.7384, 13.3736),
    ('city_liberec', 'Liberec', 50.7663, 15.0543),
    ('city_olomouc', 'Olomouc', 49.5955, 17.2518),
    ('city_ceske_budejovice', 'České Budějovice', 48.9745, 14.4743),
    ('city_hradec_kralove', 'Hradec Králové', 50.2104, 15.8252),
    ('city_pardubice', 'Pardubice', 50.0343, 15.7812),
    ('city_usti_nad_labem', 'Ústí nad Labem', 50.6607, 14.0323)
ON CONFLICT ("id") DO NOTHING;

-- Reference data: Tags
INSERT INTO "tag" ("id", "slug") VALUES
    ('tag_excel', 'excel'),
    ('tag_spanish', 'spanish'),
    ('tag_social_media', 'social-media'),
    ('tag_data_analysis', 'data-analysis'),
    ('tag_public_speaking', 'public-speaking'),
    ('tag_copywriting', 'copywriting'),
    ('tag_photography', 'photography'),
    ('tag_project_management', 'project-management'),
    ('tag_python', 'python'),
    ('tag_sql', 'sql'),
    ('tag_ux_design', 'ux-design'),
    ('tag_negotiation', 'negotiation'),
    ('tag_statistics', 'statistics'),
    ('tag_machine_learning', 'machine-learning'),
    ('tag_video_editing', 'video-editing'),
    ('tag_hiking', 'hiking'),
    ('tag_board_games', 'board-games'),
    ('tag_running', 'running'),
    ('tag_cooking', 'cooking'),
    ('tag_travel', 'travel'),
    ('tag_startups', 'startups'),
    ('tag_music', 'music'),
    ('tag_web_development', 'web-development'),
    ('tag_accounting', 'accounting'),
    ('tag_marketing', 'marketing'),
    ('tag_english', 'english'),
    ('tag_german', 'german'),
    ('tag_cycling', 'cycling'),
    ('tag_reading', 'reading'),
    ('tag_yoga', 'yoga'),
    ('tag_graphic_design', 'graphic-design')
ON CONFLICT ("slug") DO NOTHING;

-- CreateTable
CREATE TABLE IF NOT EXISTS "city" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "roles" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "expectations" TEXT;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "weekdays" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "weekends" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "mornings" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "afternoons" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "evenings" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "cityId" TEXT;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "radiusKm" INTEGER;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
    ALTER TABLE "profile" ADD CONSTRAINT "profile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Populate roles from existing position if any
UPDATE "profile"
SET "roles" = ARRAY["position"]
WHERE "position" IS NOT NULL AND cardinality("roles") = 0;

-- Reference data: Cities
INSERT INTO "city" ("id", "name", "lat", "lng") VALUES
    ('city_praha', 'Praha', 50.0755, 14.4378),
    ('city_brno', 'Brno', 49.1951, 16.6068),
    ('city_ostrava', 'Ostrava', 49.8209, 18.2625),
    ('city_plzen', 'Plzeň', 49.7384, 13.3736),
    ('city_liberec', 'Liberec', 50.7663, 15.0543),
    ('city_olomouc', 'Olomouc', 49.5938, 17.2509),
    ('city_ceske_budejovice', 'České Budějovice', 48.9745, 14.4743),
    ('city_hradec_kralove', 'Hradec Králové', 50.2104, 15.8252),
    ('city_usti_nad_labem', 'Ústí nad Labem', 50.6607, 14.0323),
    ('city_pardubice', 'Pardubice', 50.0343, 15.7812)
ON CONFLICT ("id") DO NOTHING;

-- Reference data: Additional Tags (technologies, programming languages, modern tools & interests)
INSERT INTO "tag" ("slug") VALUES
    ('javascript'),
    ('typescript'),
    ('go'),
    ('rust'),
    ('java'),
    ('kotlin'),
    ('csharp'),
    ('cpp'),
    ('c'),
    ('swift'),
    ('php'),
    ('ruby'),
    ('html-css'),
    ('react'),
    ('vue'),
    ('angular'),
    ('nextjs'),
    ('nodejs'),
    ('nestjs'),
    ('tailwind-css'),
    ('docker'),
    ('kubernetes'),
    ('aws'),
    ('azure'),
    ('gcp'),
    ('linux'),
    ('terraform'),
    ('git'),
    ('ci-cd'),
    ('microservices'),
    ('postgresql'),
    ('mongodb'),
    ('redis'),
    ('graphql'),
    ('rest-api'),
    ('deep-learning'),
    ('nlp'),
    ('computer-vision'),
    ('ai-llm'),
    ('cybersecurity'),
    ('figma'),
    ('ui-design'),
    ('design-systems'),
    ('product-strategy'),
    ('user-research'),
    ('fitness'),
    ('gaming'),
    ('bouldering'),
    ('cycling'),
    ('swimming'),
    ('yoga'),
    ('reading'),
    ('podcasts'),
    ('photography'),
    ('video-editing'),
    ('coffee'),
    ('investing'),
    ('marketing'),
    ('sales'),
    ('finance'),
    ('accounting'),
    ('leadership'),
    ('mentoring'),
    ('agile'),
    ('scrum'),
    ('english'),
    ('german'),
    ('french'),
    ('web-development'),
    ('3d-printing')
ON CONFLICT ("slug") DO NOTHING;

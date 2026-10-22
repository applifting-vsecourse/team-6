-- CreateTable
CREATE TABLE "tag_category" (
    "tagId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "tag_category_pkey" PRIMARY KEY ("tagId","categoryId")
);

-- CreateIndex
CREATE INDEX "tag_category_categoryId_idx" ON "tag_category"("categoryId");

-- AddForeignKey
ALTER TABLE "tag_category" ADD CONSTRAINT "tag_category_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_category" ADD CONSTRAINT "tag_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reference data. A tag may count towards several categories.
INSERT INTO "tag_category" ("tagId", "categoryId")
SELECT t."id", c."id"
FROM (VALUES
    ('technology', 'python'), ('technology', 'sql'), ('technology', 'excel'),
    ('technology', 'ux-design'), ('technology', 'statistics'), ('technology', 'data-analysis'),
    ('technology', 'javascript'), ('technology', 'typescript'), ('technology', 'go'),
    ('technology', 'rust'), ('technology', 'java'), ('technology', 'kotlin'),
    ('technology', 'csharp'), ('technology', 'cpp'), ('technology', 'c'),
    ('technology', 'swift'), ('technology', 'php'), ('technology', 'ruby'),
    ('technology', 'html-css'), ('technology', 'react'), ('technology', 'vue'),
    ('technology', 'angular'), ('technology', 'nextjs'), ('technology', 'nodejs'),
    ('technology', 'nestjs'), ('technology', 'tailwind-css'), ('technology', 'docker'),
    ('technology', 'kubernetes'), ('technology', 'aws'), ('technology', 'azure'),
    ('technology', 'gcp'), ('technology', 'linux'), ('technology', 'terraform'),
    ('technology', 'git'), ('technology', 'ci-cd'), ('technology', 'microservices'),
    ('technology', 'postgresql'), ('technology', 'mongodb'), ('technology', 'redis'),
    ('technology', 'graphql'), ('technology', 'rest-api'), ('technology', 'deep-learning'),
    ('technology', 'nlp'), ('technology', 'computer-vision'), ('technology', 'ai-llm'),
    ('technology', 'cybersecurity'), ('technology', 'figma'), ('technology', 'ui-design'),
    ('technology', 'design-systems'), ('technology', 'user-research'),
    ('technology', 'web-development'), ('technology', 'agile'), ('technology', 'scrum'),
    ('technology', '3d-printing'),

    ('business', 'excel'), ('business', 'data-analysis'), ('business', 'statistics'),
    ('business', 'roadmapping'), ('business', 'product-strategy'), ('business', 'user-research'),
    ('business', 'startups'), ('business', 'investing'), ('business', 'marketing'),
    ('business', 'sales'), ('business', 'finance'), ('business', 'accounting'),
    ('business', 'leadership'), ('business', 'negotiation'), ('business', 'copywriting'),
    ('business', 'social-media'), ('business', 'agile'), ('business', 'scrum'),
    ('business', 'mentoring'), ('business', 'interviewing'),

    ('languages', 'spanish'), ('languages', 'english'), ('languages', 'german'),
    ('languages', 'french'),

    ('personal-development', 'public-speaking'), ('personal-development', 'negotiation'),
    ('personal-development', 'interviewing'), ('personal-development', 'leadership'),
    ('personal-development', 'mentoring'), ('personal-development', 'reading'),
    ('personal-development', 'yoga'),

    ('leisure', 'running'), ('leisure', 'board-games'), ('leisure', 'hiking'),
    ('leisure', 'travel'), ('leisure', 'music'), ('leisure', 'cooking'),
    ('leisure', 'fitness'), ('leisure', 'gaming'), ('leisure', 'bouldering'),
    ('leisure', 'cycling'), ('leisure', 'swimming'), ('leisure', 'yoga'),
    ('leisure', 'reading'), ('leisure', 'podcasts'), ('leisure', 'photography'),
    ('leisure', 'video-editing'), ('leisure', 'coffee'), ('leisure', '3d-printing')
) AS m ("category", "tag")
JOIN "category" c ON c."slug" = m."category"
JOIN "tag" t ON t."slug" = m."tag"
ON CONFLICT DO NOTHING;

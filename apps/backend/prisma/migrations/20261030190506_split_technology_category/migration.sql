-- Split the broad "technology" category (54 of 90 tags) into four narrower ones,
-- so topic fit and the feed filter can tell tech topics apart. Data only.

INSERT INTO "category" ("slug", "sortOrder") VALUES
    ('software-development', 1),
    ('data-ai', 2),
    ('cloud-security', 3),
    ('design-product', 4)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "category" SET "sortOrder" = CASE "slug"
    WHEN 'business' THEN 5
    WHEN 'languages' THEN 6
    WHEN 'personal-development' THEN 7
    WHEN 'leisure' THEN 8
    ELSE "sortOrder"
END;

INSERT INTO "tag_category" ("tagId", "categoryId")
SELECT t."id", c."id"
FROM (VALUES
    ('software-development', 'angular'), ('software-development', 'c'),
    ('software-development', 'cpp'), ('software-development', 'csharp'),
    ('software-development', 'go'), ('software-development', 'graphql'),
    ('software-development', 'html-css'), ('software-development', 'java'),
    ('software-development', 'javascript'), ('software-development', 'kotlin'),
    ('software-development', 'nestjs'), ('software-development', 'nextjs'),
    ('software-development', 'nodejs'), ('software-development', 'php'),
    ('software-development', 'python'), ('software-development', 'react'),
    ('software-development', 'rest-api'), ('software-development', 'ruby'),
    ('software-development', 'rust'), ('software-development', 'swift'),
    ('software-development', 'tailwind-css'), ('software-development', 'typescript'),
    ('software-development', 'vue'), ('software-development', 'web-development'),
    ('software-development', 'git'), ('software-development', 'microservices'),
    ('software-development', 'mongodb'), ('software-development', 'postgresql'),
    ('software-development', 'redis'), ('software-development', 'sql'),
    ('cloud-security', 'aws'), ('cloud-security', 'azure'),
    ('cloud-security', 'gcp'), ('cloud-security', 'docker'),
    ('cloud-security', 'kubernetes'), ('cloud-security', 'terraform'),
    ('cloud-security', 'ci-cd'), ('cloud-security', 'linux'),
    ('cloud-security', 'cybersecurity'),
    ('data-ai', 'ai-llm'), ('data-ai', 'nlp'),
    ('data-ai', 'computer-vision'), ('data-ai', 'deep-learning'),
    ('data-ai', 'data-analysis'), ('data-ai', 'statistics'),
    ('data-ai', 'excel'), ('data-ai', 'python'), ('data-ai', 'sql'),
    ('design-product', 'ux-design'), ('design-product', 'ui-design'),
    ('design-product', 'user-research'), ('design-product', 'figma'),
    ('design-product', 'design-systems'), ('design-product', 'agile'),
    ('design-product', 'scrum')
) AS m("category", "tag")
JOIN "category" c ON c."slug" = m."category"
JOIN "tag" t ON t."slug" = m."tag"
ON CONFLICT DO NOTHING;

-- Existing technology kvintets move to software-development (one row replaces one,
-- so a kvintet keeps at most three categories).
INSERT INTO "kvintet_category" ("kvintetId", "categoryId")
SELECT kc."kvintetId", sd."id"
FROM "kvintet_category" kc
JOIN "category" tech ON tech."id" = kc."categoryId" AND tech."slug" = 'technology'
CROSS JOIN "category" sd
WHERE sd."slug" = 'software-development'
ON CONFLICT DO NOTHING;

DELETE FROM "kvintet_category"
WHERE "categoryId" = (SELECT "id" FROM "category" WHERE "slug" = 'technology');

-- Deprecated column, still a foreign key: point it away before the delete.
UPDATE "kvintet"
SET "categoryId" = (SELECT "id" FROM "category" WHERE "slug" = 'software-development')
WHERE "categoryId" = (SELECT "id" FROM "category" WHERE "slug" = 'technology');

-- Its tag_category rows go with it (ON DELETE CASCADE). 3d-printing stays in leisure.
DELETE FROM "category" WHERE "slug" = 'technology';

-- Guard: fail (and roll back) rather than leave a tag that no category can match.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "tag" t
        WHERE NOT EXISTS (SELECT 1 FROM "tag_category" tc WHERE tc."tagId" = t."id")
    ) THEN
        RAISE EXCEPTION 'split_technology_category: a tag was left without a category';
    END IF;
END $$;

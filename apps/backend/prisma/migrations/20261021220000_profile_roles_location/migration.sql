-- AlterTable
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "roles" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Populate roles from existing position if any
UPDATE "profile"
SET "roles" = ARRAY["position"]
WHERE "position" IS NOT NULL AND cardinality("roles") = 0;

-- Reference data: Additional Tags (technologies, programming languages, modern tools & interests)
INSERT INTO "tag" ("id", "slug") VALUES
    ('tag_javascript', 'javascript'),
    ('tag_typescript', 'typescript'),
    ('tag_go', 'go'),
    ('tag_rust', 'rust'),
    ('tag_java', 'java'),
    ('tag_kotlin', 'kotlin'),
    ('tag_csharp', 'csharp'),
    ('tag_cpp', 'cpp'),
    ('tag_c', 'c'),
    ('tag_swift', 'swift'),
    ('tag_php', 'php'),
    ('tag_ruby', 'ruby'),
    ('tag_html_css', 'html-css'),
    ('tag_react', 'react'),
    ('tag_vue', 'vue'),
    ('tag_angular', 'angular'),
    ('tag_nextjs', 'nextjs'),
    ('tag_nodejs', 'nodejs'),
    ('tag_nestjs', 'nestjs'),
    ('tag_tailwind_css', 'tailwind-css'),
    ('tag_docker', 'docker'),
    ('tag_kubernetes', 'kubernetes'),
    ('tag_aws', 'aws'),
    ('tag_azure', 'azure'),
    ('tag_gcp', 'gcp'),
    ('tag_linux', 'linux'),
    ('tag_terraform', 'terraform'),
    ('tag_git', 'git'),
    ('tag_ci_cd', 'ci-cd'),
    ('tag_microservices', 'microservices'),
    ('tag_postgresql', 'postgresql'),
    ('tag_mongodb', 'mongodb'),
    ('tag_redis', 'redis'),
    ('tag_graphql', 'graphql'),
    ('tag_rest_api', 'rest-api'),
    ('tag_deep_learning', 'deep-learning'),
    ('tag_nlp', 'nlp'),
    ('tag_computer_vision', 'computer-vision'),
    ('tag_ai_llm', 'ai-llm'),
    ('tag_cybersecurity', 'cybersecurity'),
    ('tag_figma', 'figma'),
    ('tag_ui_design_tag', 'ui-design'),
    ('tag_design_systems', 'design-systems'),
    ('tag_product_strategy', 'product-strategy'),
    ('tag_user_research', 'user-research'),
    ('tag_fitness', 'fitness'),
    ('tag_gaming', 'gaming'),
    ('tag_bouldering', 'bouldering'),
    ('tag_swimming', 'swimming'),
    ('tag_coffee', 'coffee'),
    ('tag_investing', 'investing'),
    ('tag_chess', 'chess'),
    ('tag_3d_printing', '3d-printing'),
    ('tag_podcasts', 'podcasts')
ON CONFLICT ("slug") DO NOTHING;

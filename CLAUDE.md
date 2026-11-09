# Kvintet

Pilot app that forms groups of up to five students. pnpm monorepo with two apps.

- `apps/backend` — NestJS + Prisma + Postgres. Auth: BetterAuth (mounted at `/api/auth/*`, treat as a black box). API docs: Swagger at `/api/docs`.
- `apps/frontend` — React + Vite + TanStack Router/Query, Tailwind + shadcn/ui, `ky` + `zod` API client. Feature folders under `src/features/`.

Backend modules and frontend features follow the layering in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (principle 5). Until the first real module (`profile`) lands, there is no worked example in the repo.

**Before writing or changing any UI, read [`DESIGN.md`](DESIGN.md).** It is a contract, not a suggestion — it exists to stop generated screens drifting into generic nested cards.

**Before starting a story or changing the backend, data model or API, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).** It records the modules, data model, critical flows and the constraints of our infrastructure (stateless backend, no cron, polling, no staging). When a decision there changes, update it in the same PR.

## Commands

- `pnpm dev` — everything: env files, Postgres (Docker), migrate, seed, both dev servers
- `pnpm check-all` — lint + type-check + tests (including the integration tests, so Postgres must be up) + build (same as CI)
- `pnpm backend test` / `pnpm frontend test:ci` — unit tests
- `pnpm backend test:integration` — `*.e2e-spec.ts` in `apps/backend/test/` against a real Postgres (`TEST_DATABASE_URL`, default `localhost:5433/quacker_test`; the name must end in `_test`; the database is created on the first run, Postgres must be up)
- `pnpm backend prisma:migrations:run` — create/apply migrations after schema changes

## Conventions

Deliberately sparse — this file grows as the team learns what it expects from generated code. Add rules here when you find yourself repeating the same review feedback.

### UI controls come from the kit

Need a control that isn't in `src/components/ui/`? Add it with `pnpm dlx shadcn@latest add <name>` — don't hand-roll one in a feature folder, even where a native input would do the job. One accessibility implementation to reason about beats a per-control judgement call.

The CLI puts `shadow-xs`/`shadow-sm` on inputs, textareas and cards. [`DESIGN.md`](DESIGN.md) keeps shadows for things that genuinely float — dialogs, dropdowns, toasts. Strip them.

### UI text uses translation keys

Never hardcode user-facing text (labels, placeholders, `aria-label`s, page titles, validation and error messages). Use `t("group.key")` from `react-i18next` and add the key to **every** file in `apps/frontend/src/i18n/locales/` — a test fails if the files differ. Zod messages go through a schema factory that takes `t`. Format dates and numbers with `formatDate`/`formatNumber` from `src/lib/date.ts`, never `date-fns` or hand-built strings. Server errors are shown with `getErrorMessage` (`src/lib/errorMessage.ts`), never `error.message`; the backend returns stable codes, not display text. The brand name "Kvintet" stays literal.

### The app is already running

Assume the dev servers are up. If something is listening on the app's ports, that is this application: use it. Don't start a second instance, don't restart it, don't run `pnpm dev`.

Don't reach for the browser to check your own work. Tests and type-checks are the evidence; open the running app when asked to, not on your own initiative.

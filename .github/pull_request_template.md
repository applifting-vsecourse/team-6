## What and why

<!-- One or two sentences. What changes for the user, and why. -->

Closes #

## How to verify

<!-- Steps for the reviewer, or "covered by tests". -->

## Checklist

<!-- Delete the lines that don't apply. Add the `claude-review` label when the PR is ready for review. -->

- [ ] `pnpm check-all` passes
- [ ] Tests added or updated (a new critical flow has an integration test against Postgres)
- [ ] UI follows `DESIGN.md`; controls come from `src/components/ui/`; all texts use `t()` keys present in every locale file
- [ ] Migration is additive; no new env vars or secrets; no names, e-mails or message bodies in logs
- [ ] `docs/ARCHITECTURE.md` updated if a decision changed

## Screenshots

<!-- UI changes only: light and dark theme, mobile and desktop. -->

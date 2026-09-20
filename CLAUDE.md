@AGENTS.md
@frontend-standard.md
@Backend Rules.md

This is a single Next.js App Router monolith (no separate backend service): API/business
logic lives in Route Handlers / Server Actions on the same Node.js runtime, so the
"Node.js Backend Rules" in `Backend Rules.md` apply there. Data layer: Prisma + Supabase
Postgres. Auth/storage: Supabase Auth + Storage. For day-to-day scope, read
`docs/mvp-scope.md` (cheap, extracted summary) instead of the full
`employee_management_system_feature_checklist.md` — only open the full checklist
when scoping a feature that isn't in the MVP list. Before adding any caching
(unstable_cache, React cache(), revalidateTag), read `docs/caching.md` first —
it documents what's cached, what's deliberately not, and why, given this app's
per-user sensitive data.

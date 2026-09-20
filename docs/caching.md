# Caching strategy

Written for: ~30 concurrent users, Next.js 16 App Router, Supabase Postgres
in `ap-northeast-1` (Tokyo — see the latency note at the bottom).

## The constraint that shapes everything here

This is an internal HR/ERP system. Almost every page shows **per-user or
role-scoped data**: an employee's own attendance, their own payslips, admin
payroll figures, live check-in status. Next.js caching mechanisms
(`unstable_cache`, the client Router Cache, `fetch` caching) are not
automatically aware of *who's asking* — a cache key that doesn't include the
user's identity, when the data is user-specific, is a data leak waiting to
happen (Employee A's dashboard served from a cache entry populated by
Employee B's request).

So the rule followed throughout this app: **cache only what is genuinely
shared across users, not sensitive, and safe to serve slightly stale.**
Everything else stays a live, per-request database read. That's most of the
app, and that's intentional — see "What is deliberately NOT cached" below.

## Which Next.js caching model this app uses

Next.js 16 ships a new opt-in model called **Cache Components**
(`cacheComponents: true` in `next.config.ts`, the `"use cache"` directive,
`cacheLife`/`cacheTag`). It's a real architectural shift — components
prerender into a static shell by default, and anything reading `cookies()`,
`headers()`, or doing an uncached fetch must be explicitly wrapped in
`<Suspense>` or it fails the build. Migrating to it is a genuine project
(Next's own docs have a dedicated migration guide), and doing it half-right
on an app this dependent on per-request auth (`cookies()` on effectively
every page) is exactly how you'd accidentally serve one employee's page to
another. **This app does not enable Cache Components.** It uses the
"previous model": `unstable_cache`, `revalidateTag`, `revalidatePath`, and
React's `cache()` — all still fully supported, none of them require touching
the rendering model. If Cache Components ever gets adopted here, it should
be its own deliberate project with its own review, not a side effect of a
caching pass.

**One version-specific gotcha**: in this Next.js release, `revalidateTag(tag)`
with a single argument is deprecated — TypeScript now requires a second
"profile" argument, even for plain `unstable_cache` usage that has nothing
to do with Cache Components. The profile Next recommends (`"max"`) is
calibrated for the new `cacheLife` system; it is **not** what you want here.
Use `revalidateTag(tag, { expire: 0 })` — that's the literal replacement for
the old deprecated single-arg behavior (invalidate immediately), which is
what actually pairs correctly with a plain `unstable_cache({ tags, revalidate })`
call. See `lib/actions/departments.ts` for the working example.

## What is cached

### 1. Per-request auth dedup (`lib/auth.ts`)

`requireEmployee()` is called once in `app/(app)/layout.tsx` (to build the
sidebar) and again independently in every single page/action on top of it
(for its own authorization check — the layout call is UX, not a substitute
for each page verifying itself). That was two identical
`prisma.employee.findUnique()` calls, i.e. two Tokyo round-trips, on every
single navigation, for every one of the ~30 users.

```ts
const getEmployeeById = cache((id: string) =>
  prisma.employee.findUnique({ where: { id } }),
);
```

This uses React's `cache()`, **not** `unstable_cache`. It's request-scoped
memoization — the cache is created fresh per request and thrown away when
the request finishes. It never persists between requests and is never
shared between users, so there's no invalidation to think about and no way
for it to leak data across sessions. This is the safest possible form of
caching and should be the first thing reached for whenever the same
same-arguments lookup happens more than once within one page render.

**Impact:** removes one DB round-trip from every page load, for every user.

### 2. Department list (`lib/cache/departments.ts`)

```ts
export const getCachedDepartments = unstable_cache(
  async () => prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ["departments-list"],
  { tags: ["departments"], revalidate: 300 },
);
```

Used by: the "Add employee" department dropdown, the Reports page's
headcount-by-department breakdown.

Why this is safe to share across users: it's just department names and
ids — not sensitive, identical for every viewer (there's no per-user
filtering of the department list).

**Write path**: `/departments` (admin-only) now has a real "add department"
form (`lib/actions/departments.ts`). Its `createDepartment` action calls
`revalidateTag("departments")` immediately after the write, so the dropdown
and reports pick up a new department right away rather than waiting out the
5-minute TTL. The management page itself (`/departments`) deliberately does
**not** use `getCachedDepartments()` — it queries Postgres directly, so an
admin managing the list always sees the true current state, not a
potentially-5-minutes-stale cached copy of their own list.

## What is deliberately NOT cached, and why

| Data | Why it stays live |
|---|---|
| Employee's own dashboard (attendance, check-in state, assigned projects) | Per-user. Caching it risks serving one employee's data to another if a key is ever built wrong. |
| "Present today" / active check-ins list (admin dashboard) | The entire point of this feature is that it reflects check-ins/check-outs *immediately*. A TTL here directly undermines what it's for. |
| Payroll / payslips | Sensitive financial data. Must always reflect the current, authoritative database state — never a copy that could be stale during a dispute about what someone was paid. |
| Leave requests (employee or admin view) | Approve/reject is a live workflow; a stale "pending" list showing an already-approved request as still-pending is a real bug, not a minor UX nit. |
| Employee roster / employee detail | PII, plus admins need to see current employment status immediately (e.g. right after marking someone terminated). |
| Attendance history | Personal, and correctness matters more than the marginal latency savings for a table that's read far less often than the live dashboard. |

The general test applied: **if staleness would confuse someone or leak
data, it doesn't get cached — full stop, no TTL is "safe enough" for that
class of data.**

## Adding more caching later — decision checklist

Before wrapping anything in `unstable_cache`, answer these:

1. **Is it the same for every viewer, or does it depend on who's asking?**
   If it depends on the user, this is not a candidate for `unstable_cache`
   — reach for React's `cache()` (per-request only) instead, or leave it
   uncached.
2. **Does staleness break the feature?** If seeing 30-second-old data
   would confuse or mislead someone (attendance, approvals, money), don't
   cache it regardless of how "shared" the data looks.
3. **Every write path that changes this data — will `revalidateTag`
   actually get called there, every time?** If you can't confidently name
   every mutation site right now, the cache will silently drift stale.
   The department cache above has exactly one theoretical write path
   (which doesn't exist yet), which is why it's the only thing cached
   this way.
4. **Is the data even expensive enough to matter?** This app's total
   dataset (a few dozen employees, a handful of departments/projects) is
   tiny. The Prisma query itself is fast — the cost is almost entirely
   network round-trip latency to Tokyo (see below), not database work.
   Caching mainly pays off here for data hit on *every* page load
   (like the auth lookup), not for one admin's occasional report view.

## The bigger lever this doesn't fix

The dominant source of latency in this app is not repeated computation —
it's the ~190ms+ round-trip to the Supabase database in `ap-northeast-1`
(Tokyo), paid on every query that isn't cached. Caching the few things
above helps, but the real fix for "every page feels slow" is deploying
somewhere closer to the database region (or vice versa), not caching more
aggressively. Caching sensitive per-user HR data just to shave off that
latency would trade a performance problem for a data-integrity/security
one — not a good trade for this app's size (~30 users, small dataset).

## Testing note

Next.js dev mode (`npm run dev`) renders pages on-demand and does not
reproduce production caching behavior faithfully. If you're verifying that
`getCachedDepartments()` is actually reusing results instead of re-querying,
test against a production build (`npm run build && npm run start`) or a
deployed preview, not the dev server.

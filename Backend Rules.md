# CLAUDE.md — Production-Ready Next.js + Node.js Rules

> **Purpose:** Project-level rules for AI-assisted frontend and backend development.
>
> These rules are intentionally focused on the mistakes AI-generated code commonly makes in real applications—not generic advice such as "name variables well."
>
> **Core principle:** AI must not silently make important architectural, security, data-integrity, authorization, caching, retry, performance, or infrastructure decisions.

---

# Part I — AI Development Rules

## 1. Inspect before changing

Before implementing a feature:

- Inspect the relevant files.
- Inspect `package.json`.
- Identify framework/library versions.
- Search for existing implementations of the same pattern.
- Reuse existing utilities, components, middleware, hooks, services, validation, database helpers, and integrations.
- Follow existing project conventions unless there is a concrete reason to change them.

Do not redesign the project just because another architecture looks cleaner.

## 2. Do not silently make consequential decisions

Important decisions include:

- authentication;
- authorization;
- data ownership;
- database transactions;
- retries;
- idempotency;
- caching;
- queues;
- external integrations;
- security configuration;
- API contracts;
- state management;
- Server/Client Component boundaries;
- infrastructure.

If an important decision is not already established, surface it briefly rather than silently inventing it.

## 3. Do not silently "improve" unrelated code

If asked to implement feature X, do not also:

- migrate frameworks;
- replace libraries;
- rewrite authentication;
- introduce Redis;
- introduce Kafka;
- introduce queues;
- rewrite the entire error system;
- reorganize unrelated folders;
- refactor unrelated components.

Mention serious unrelated problems if they materially affect the requested work.

## 4. Token-efficient workflow

Prefer:

1. Inspect only relevant files.
2. Search for existing patterns.
3. Make focused changes.
4. Run targeted checks.
5. Report what changed and what remains to verify.

Avoid:

- reading the entire repository for a small task;
- rewriting entire files unnecessarily;
- installing packages without checking existing dependencies;
- running expensive full-repository checks unnecessarily;
- generating unnecessary documentation;
- repeatedly inspecting unchanged files.

## 5. Delegate cheap/manual verification to the user

When appropriate, give the user exact commands or manual checks such as:

> Run `npm run build` and paste the first error if it fails.

> Start the application and test the affected screen/endpoint, then paste the error if one occurs.

> If this uses a real sandbox payment provider, perform one sandbox transaction and provide the provider response.

Do not delegate work that Claude can cheaply and reliably do itself.

## 6. Testing policy

**Only create or run tests when the user explicitly asks for testing/testing work, or when the existing project/CI requirements clearly require tests for the requested change.**

When testing is requested:

- inspect the existing test framework;
- follow existing conventions;
- test behavior rather than implementation details;
- cover meaningful failure cases;
- cover authorization boundaries for sensitive backend functionality;
- test concurrency/idempotency for critical mutations where appropriate.

Do not automatically create tests after every feature.

## 7. Heavy checks policy

Only perform these when explicitly requested or when there is a concrete investigation requiring them:

- full load/stress testing;
- Lighthouse audits;
- bundle analysis;
- full security audits;
- full dependency audits;
- database query profiling;
- distributed tracing investigations;
- container scanning;
- benchmark suites.

Otherwise, suggest them to the user when appropriate rather than running expensive checks automatically.

## 8. Prefer boring, explicit code

Production code should generally be:

- explicit;
- predictable;
- understandable;
- testable;
- observable;
- appropriately abstracted.

Avoid cleverness, magic, unnecessary abstraction, and compressed code that hides behavior.

## 9. Do not over-engineer

Production-ready does **not** automatically mean:

- microservices;
- Redis;
- Kafka;
- queues;
- event buses;
- repository patterns;
- dependency injection frameworks;
- dozens of abstractions.

Use complexity only when the actual requirements justify it.

## 10. Explain consequential decisions briefly

When choosing something that materially affects:

- security;
- performance;
- cost;
- scalability;
- authorization;
- caching;
- retries;
- transactions;
- external APIs;

briefly explain why.

---

# Part II — Next.js Frontend Production Rules

## 11. Use Server Components by default

In the Next.js App Router, prefer Server Components unless a component genuinely needs client-side capabilities.

Use `"use client"` only when the component requires things such as:

- state;
- event handlers;
- browser APIs;
- effects;
- client-only libraries;
- interactive behavior.

Do not mark an entire page/layout as `"use client"` just because one small child is interactive.

## 12. Keep the Client Component boundary small

Prefer:

```text
Server Component
 ├── static/content UI
 └── Client Component
       └── interactive part
```

rather than making the entire page a Client Component.

## 13. Do not use `useEffect` for everything

Do not use an Effect when you are merely:

- deriving values;
- transforming props;
- responding to an event;
- initializing ordinary state;
- synchronizing state that can be derived during render.

Effects are for synchronizing with external systems.

## 14. Avoid derived state in `useEffect`

Bad:

```tsx
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Prefer:

```tsx
const fullName = `${firstName} ${lastName}`;
```

when no external synchronization is required.

## 15. Do not use `useEffect` to fetch initial data by default

In Next.js App Router, prefer server-side data fetching when appropriate.

Do not turn a Server Component into a Client Component merely to fetch initial page data.

## 16. Do not create unnecessary client state

Before adding `useState`, ask whether the data can remain:

- server-fetched;
- derived;
- URL state;
- form state;
- framework-cached;
- in an existing state system.

## 17. Avoid global state unless truly global

Do not put everything into Redux/Zustand/Context.

## 18. Avoid Context for high-frequency changing state

Context can cause broad re-renders when its value changes.

## 19. Do not put server-only secrets in client code

Never expose:

- database credentials;
- private API keys;
- signing secrets;
- service credentials;
- private tokens.

## 20. Never trust client-side authorization

Hiding a button is UX, not authorization.

The backend must enforce authentication, ownership, and permissions.

## 21. Do not duplicate backend business rules unnecessarily

Frontend validation improves UX. The backend remains authoritative.

## 22. Use `next/image`

For normal application images, prefer Next.js image optimization where appropriate.

Consider dimensions, responsive sizing, priority, lazy loading, and remote-image configuration.

## 23. Do not blindly prioritize every image

Only prioritize images that genuinely need early loading.

## 24. Avoid layout shifts

Reserve image dimensions/aspect ratios and avoid inserting content above already-rendered content unexpectedly.

## 25. Use `next/font`

Prefer Next.js font handling rather than manually loading fonts in ways that create avoidable requests or layout instability.

## 26. Use `next/link`

For internal navigation, prefer Next.js routing/link mechanisms.

## 27. Do not disable framework optimizations casually

Do not disable image optimization, prefetching, caching, streaming, or static rendering without a specific reason.

## 28. Be deliberate with prefetching

Do not create aggressive custom prefetching that loads large amounts of data users may never need.

## 29. Use loading UI intentionally

Use route/component loading states where they improve perceived performance.

Do not add spinners everywhere.

## 30. Avoid waterfall data fetching

If requests are independent, fetch them concurrently where appropriate.

## 31. Do not blindly use `Promise.all`

Large numbers of concurrent operations can overload the backend.

Bound or batch large workloads.

## 32. Keep server-side data fetching close to the Server Component that needs it

Avoid unnecessary client-side fetch waterfalls.

## 33. Avoid unnecessary browser API calls

If Next.js/server-side code can safely obtain data, don't create a browser round-trip merely because `fetch()` is familiar.

## 34. Do not duplicate data fetching across components

Use an appropriate shared data strategy.

## 35. Understand caching before adding manual caches

Before caching, understand:

- freshness;
- invalidation;
- user-specific data;
- authorization;
- revalidation.

## 36. Never cache private data across users incorrectly

A cache bug can become a data leak.

## 37. Use revalidation deliberately

Do not choose arbitrary revalidation intervals.

## 38. Don't force everything dynamic

Keep static/cacheable portions static where possible.

## 39. Don't force everything static

User-specific/frequently changing data may need dynamic rendering or client updates.

## 40. Keep shareable UI state in the URL when appropriate

Filters, search, sorting, and pagination often belong in URL search parameters.

## 41. Don't store everything in localStorage

Do not use localStorage as a universal database or as a default place for sensitive authentication state.

## 42. Be deliberate with browser storage

Understand persistence, XSS exposure, synchronization, and staleness.

## 43. Don't put sensitive tokens in URLs

URLs can appear in history, logs, analytics, and referrers.

## 44. Use semantic forms

Prefer semantic HTML forms where appropriate.

## 45. Don't build custom form infrastructure unnecessarily

Check whether native HTML, React, Next.js, or existing project utilities already solve the requirement.

## 46. Validate forms at both boundaries

Frontend validation improves UX; backend validation enforces correctness/security.

## 47. Avoid giant component files

Split meaningful responsibilities when complexity warrants it.

## 48. Avoid component fragmentation

Do not create many tiny components merely to make files shorter.

## 49. Keep business logic out of presentational components where appropriate

Separate responsibilities without introducing unnecessary architecture.

## 50. Don't duplicate components

Search for existing components before creating new ones.

## 51. Don't modify shared components casually

Inspect usages before changing shared Buttons, Inputs, Modals, etc.

## 52. Do not use array indexes as keys for dynamic lists

Prefer stable identifiers.

## 53. Don't use random values as React keys

Avoid `Math.random()` keys and keys that change every render.

## 54. Don't mutate React state

Use immutable updates.

## 55. Don't mutate props

Treat props as read-only.

## 56. Keep render logic pure

Do not perform side effects during render.

## 57. Don't abuse `useMemo`

Use it when expensive computation or referential stability genuinely benefits from memoization.

## 58. Don't abuse `useCallback`

Use it when referential stability actually matters.

## 59. Don't wrap everything in `memo`

Use memoization for demonstrated or well-understood rendering problems.

## 60. Don't use effects to repair render problems

Fix the design rather than adding an Effect that continually synchronizes derived state.

## 61. Avoid stale closures

Ensure callbacks use correct state/props and dependencies.

## 62. Don't ignore Hook dependency rules casually

Fix the underlying effect/callback design rather than hiding dependency problems.

## 63. Clean up manually attached event listeners

Avoid leaked listeners.

## 64. Clean up subscriptions and external resources

For WebSockets, listeners, timers, observers, and subscriptions, clean up appropriately.

## 65. Clear timers appropriately

Do not allow unnecessary intervals/timeouts to survive component lifecycles.

## 66. Don't accidentally create multiple WebSocket connections

Be careful with effects, remounts, and reconnect logic.

## 67. Don't fetch on every render

Network requests must not be triggered accidentally by render cycles.

## 68. Handle client request race conditions

For searches and rapidly changing requests, stale responses must not overwrite newer state.

## 69. Abort unnecessary browser requests where appropriate

Cancel requests that are no longer relevant when the architecture supports it.

## 70. Don't present stale UI as authoritative

Especially for:

- payments;
- permissions;
- inventory;
- subscriptions;
- account state.

## 71. Don't trust client feature flags for security

Server-side authorization remains authoritative.

## 72. Handle loading, error, empty, and success states

AI often implements only the happy path.

## 73. Empty is not an error

Design a deliberate empty state.

## 74. Make errors actionable

Avoid generic failure messages when meaningful recovery is possible.

## 75. Avoid giant loading spinners

Prefer meaningful local loading UI/skeletons where appropriate.

## 76. Avoid layout shifts caused by loading states

Reserve appropriate space.

## 77. Accessibility is required

Use:

- semantic HTML;
- labels;
- keyboard interaction;
- focus management;
- accessible names;
- appropriate ARIA;
- sufficient contrast;
- visible focus states.

## 78. Don't use `<div>` as a button

Use `<button>`.

## 79. Don't use clickable `<div>` for navigation

Use links.

## 80. Don't add ARIA when semantic HTML already solves it

Incorrect ARIA can make accessibility worse.

## 81. Dialogs need focus management

Handle focus, accessible names, closing behavior, and restoration appropriately.

## 82. Don't remove focus outlines casually

Keyboard users need visible focus.

## 83. Don't rely on color alone

Important states should not be communicated solely by color.

## 84. Form controls need labels

Placeholder text is not a substitute for a label.

## 85. Images need appropriate alt text

Decorative images should be decorative; informative images need meaningful alternatives.

## 86. Don't put huge amounts of text into `aria-label`

Labels should identify controls clearly.

## 87. Keyboard interaction must work

Interactive components should support expected keyboard behavior.

## 88. Respect reduced motion where appropriate

Avoid forcing excessive animation for users who prefer reduced motion.

## 89. Avoid unnecessary animation

Animation should support feedback/hierarchy rather than make the UI slower.

## 90. Don't animate expensive layout properties unnecessarily

Prefer efficient animation approaches.

## 91. Don't ship huge client dependencies for tiny UI needs

Check existing dependencies and native APIs before installing libraries.

## 92. Don't import entire utility libraries unnecessarily

Prefer targeted imports or native APIs where appropriate.

## 93. Avoid giant icon libraries in client bundles

Import only what is needed.

## 94. Don't load heavy libraries on the initial page without need

Consider dynamic/lazy loading for genuinely heavy client-only functionality.

## 95. Don't dynamically import everything

Dynamic imports add complexity; use them when the tradeoff is meaningful.

## 96. Avoid unnecessary heavy chart/editor/map libraries

Do not add a large library for a small interaction it does not need.

## 97. Avoid duplicate libraries

Don't add multiple date, validation, HTTP, state, or UI libraries without a concrete reason.

## 98. Prefer native `fetch` when sufficient

Follow existing project conventions rather than adding an HTTP client unnecessarily.

## 99. Don't use `window`/`document` in Server Components

Browser APIs require an appropriate client boundary.

## 100. Don't add `"use client"` blindly

Find out why browser execution is actually needed.

## 101. Don't pass unnecessary data across Server/Client boundaries

Keep client props small and serializable.

## 102. Keep sensitive computation server-side

Do not move security-sensitive/business-critical logic into the browser merely because it is easier.

## 103. Avoid giant serialized props

Pass only required data into Client Components.

## 104. Don't fetch the same data in server and client unnecessarily

Choose one appropriate data flow.

## 105. Avoid unnecessary hydration

Keep static UI server-rendered when possible.

## 106. Use Next.js metadata facilities intentionally

Manage title, description, canonical URLs, Open Graph, and relevant metadata through the framework.

## 107. Don't put sensitive information in metadata

Metadata can be public.

## 108. Use correct document semantics

Use `main`, `header`, `nav`, `section`, `article`, `footer`, `button`, `a`, `form`, and `label` appropriately.

## 109. Avoid nested interactive controls

Don't put buttons inside buttons or links inside links.

## 110. Avoid unnecessary DOM depth

Don't create huge wrapper trees just for styling convenience.

## 111. Prefer robust layout systems

Use Flexbox/Grid and responsive constraints rather than arbitrary positioning.

## 112. Don't use absolute positioning for primary layout

Reserve it for overlays and intentional composition.

## 113. Be careful with viewport-height hacks

Use modern viewport units where appropriate for mobile browser behavior.

## 114. Respect mobile safe areas

Consider safe-area insets where layouts reach device edges.

## 115. Avoid excessive breakpoints

Let content determine responsive behavior.

## 116. Avoid desktop-only assumptions

Meaningfully check narrow/mobile layouts.

## 117. Don't hardcode user-facing strings everywhere when localization is required

Follow the project's localization approach.

## 118. Don't introduce i18n infrastructure without a requirement

Localization adds complexity.

## 119. Don't hardcode locale/currency/date assumptions

Use appropriate locale-aware formatting when the product supports multiple locales.

## 120. Avoid hydration mismatches

Be careful with:

- `Date.now()`;
- random values;
- browser-only APIs;
- client-only state;
- locale differences.

## 121. Don't suppress hydration warnings casually

Understand and fix the underlying mismatch.

## 122. Use error boundaries/recovery UI appropriately

Provide intentional error handling for meaningful application sections.

## 123. Don't catch every frontend error and ignore it

Silent failures make production debugging difficult.

## 124. Don't log sensitive client data

Never log tokens, passwords, cookies, private documents, or payment secrets.

## 125. Don't expose backend stack traces in the UI

Return safe user-facing errors.

## 126. Avoid unnecessary polling

Don't poll every few seconds merely because it is easy.

## 127. Don't create WebSockets when polling is sufficient

Use the simplest mechanism that satisfies freshness requirements.

## 128. Don't create real-time infrastructure prematurely

Real-time systems add complexity.

## 129. Optimize based on actual bottlenecks

Don't prematurely memoize, virtualize, cache, lazy-load, or rewrite code without a reason.

## 130. Virtualize genuinely large lists

Don't virtualize tiny lists.

## 131. Avoid rendering thousands of DOM nodes unnecessarily

Use pagination, virtualization, or progressive loading where appropriate.

## 132. Avoid expensive work on every keystroke

Use debouncing/cancellation/server search when appropriate.

## 133. Don't debounce everything

Only debounce interactions where it provides real value.

## 134. Avoid unnecessary re-renders

Identify the actual cause before adding memoization.

## 135. Don't store derived values in state

Derive cheap values from existing state/props.

## 136. Don't duplicate server state into multiple client stores

Duplicated state can become inconsistent.

## 137. Be careful with optimistic UI

Handle server rejection, rollback, duplicate submissions, and stale state.

## 138. Never treat optimistic payment UI as confirmed payment

Show actual server/provider state for financial operations.

## 139. Keep client forms as small as practical

Do not create huge client-side state machines for ordinary forms.

## 140. Don't expose internal IDs unnecessarily

Expose only identifiers required by the UI/API.

## 141. Keep API contracts typed where practical

Use the project's existing schema/type system.

## 142. Don't create fake TypeScript types

Types must represent actual runtime contracts.

## 143. Validate untrusted external data at runtime

TypeScript does not validate runtime data.

## 144. Don't use `any` to silence real type problems

Fix the type or narrow it.

## 145. Avoid unsafe type assertions

Don't turn untrusted `unknown` into a trusted domain object without validation.

## 146. Don't use non-null assertions blindly

Only use `!` when the invariant is genuinely guaranteed.

## 147. Don't use `@ts-ignore` to hide problems

Understand and fix the underlying issue.

## 148. Don't disable lint rules casually

Fix the design or implementation where possible.

## 149. Don't copy old Next.js patterns blindly

Check the project's actual version and current architecture.

## 150. Don't mix Pages Router and App Router patterns unnecessarily

Follow the architecture already used by the project.

## 151. Keep server-only code out of client modules

Respect runtime boundaries.

## 152. Don't expose private environment variables to the browser

Only explicitly public configuration should be client-visible.

## 153. Don't fetch secrets in browser code

Use secure server-side boundaries.

## 154. Avoid unnecessary middleware

Middleware runs in an important request path; keep it lightweight.

## 155. Don't use middleware as the only authorization layer

Resource/action authorization must still happen where the resource is accessed.

## 156. Don't perform unsupported/heavy database work in middleware

Keep database operations in the appropriate runtime/boundary.

## 157. Don't assume route protection equals object authorization

A protected dashboard still needs resource-level authorization.

## 158. Use Route Handlers intentionally

Don't create a Route Handler for every frontend data operation if another existing boundary already solves it.

## 159. Don't create a BFF layer unnecessarily

Don't proxy every request through Next.js without a real frontend-specific reason.

## 160. If a BFF is needed, keep its responsibility clear

It can aggregate/adapt frontend-specific data and securely access services, but should not become an undocumented second backend.

## 161. Avoid duplicate backend business logic in Next.js

If Node.js is authoritative, don't independently implement the same rules in Route Handlers.

## 162. Frontend production review

Before declaring a frontend feature production-ready, consider:

- Server/Client boundary;
- loading state;
- error state;
- empty state;
- accessibility;
- responsive behavior;
- data fetching;
- caching;
- authorization assumptions;
- bundle impact;
- hydration;
- unnecessary dependencies;
- unnecessary client state;
- unnecessary effects;
- API contract;
- sensitive data exposure.

---

# Part III — Production-Ready Node.js Backend Rules

## 163. Do not blindly generate backend architecture

When adding a feature, do not silently decide:

- retry strategy;
- transaction boundaries;
- authentication;
- authorization;
- webhook behavior;
- caching;
- queues;
- consistency guarantees;
- database locking;
- payment state machines;
- failure recovery.

Follow existing conventions or surface important decisions.

## 164. NEVER trust the client

Everything from the client is untrusted:

- body;
- query;
- params;
- headers;
- cookies;
- IDs;
- roles;
- prices;
- quantities;
- permissions;
- subscription status;
- timestamps;
- URLs;
- uploaded files.

The server owns business truth.

## 165. Authentication is not authorization

Authentication answers "who are you?" Authorization answers "are you allowed to do this?"

Both are required where appropriate.

## 166. Never use an ID alone as authorization

Verify that the authenticated principal is allowed to access the requested resource.

## 167. Prevent mass assignment

Never blindly spread request bodies into database updates. Explicitly select writable fields.

## 168. Validate input at the API boundary

Validate type, required fields, length, range, enums, formats, arrays, nested objects, dates, files, and pagination as appropriate.

## 169. Never rely only on frontend validation

The backend must enforce validation.

## 170. Don't accept arbitrary query parameters

Explicitly map supported filters/sorts.

## 171. Limit request body size

Bound JSON, URL-encoded, multipart, and file sizes appropriately.

## 172. Don't let user input control expensive operations without limits

Bound pagination, iterations, query complexity, file sizes, batch sizes, and expensive generation.

## 173. Pagination is required for unbounded data

Do not return indefinitely growing datasets in one response.

## 174. Cap pagination limits

Never let clients request arbitrary millions of rows.

## 175. Avoid `SELECT *` in API queries

Select only fields needed by the endpoint.

## 176. Never return raw database entities blindly

Use deliberate response representations.

## 177. Never return sensitive fields

Watch for password hashes, refresh tokens, reset tokens, verification tokens, private metadata, and internal flags.

## 178. Keep database entities separate from API contracts where useful

Do not let database schema accidentally become the public API contract.

## 179. Keep controllers thin

Coordinate request context, validation, service/business logic, and response.

## 180. Don't create pointless layers

Avoid unnecessary controller/service/manager/handler/processor/adapter/factory/provider/repository stacks.

## 181. Don't create a repository pattern automatically

Follow the project's existing database abstraction.

## 182. Don't make every function generic

Prefer explicit business behavior over generic wrappers that hide logic.

## 183. Never concatenate SQL with user input

Use parameterized queries.

## 184. Dynamic SQL identifiers need allowlists

Explicitly allowlist dynamic columns, sort fields, tables, or other identifiers.

## 185. Use transactions when operations must be atomic

Multiple dependent writes may need one transaction.

## 186. Keep transactions short

Do not wait on external services inside a transaction unless genuinely required.

## 187. Consider race conditions

For critical operations, think about concurrent requests and use appropriate atomic updates, constraints, locks, transactions, or optimistic concurrency.

## 188. Database constraints are part of correctness

Use appropriate unique, foreign-key, check, not-null, and index constraints.

## 189. Application-level uniqueness is not enough

Use database uniqueness for invariants that must survive concurrency.

## 190. Use shared connection pools

Do not create a database pool for every request/module.

## 191. Release acquired database clients

When manually acquiring a pooled client, release it in `finally`.

## 192. Avoid N+1 queries

Look for 1+N query patterns and use appropriate joins/batching/eager loading.

## 193. Don't solve N+1 with absurdly large joins

Understand query shape and data duplication.

## 194. Don't fetch data you don't need

Filter/select at the database layer where appropriate.

## 195. Index based on real query patterns

Indexes have storage/write costs.

## 196. Consider composite indexes

Inspect actual filtering/sorting patterns before adding them.

## 197. Don't query the same resource repeatedly in one request

Reuse already-known data where appropriate.

## 198. Avoid synchronous Node APIs in request paths

Avoid synchronous filesystem, crypto, child-process, and other blocking APIs in request processing.

## 199. Understand the Node Event Loop

`async` does not make CPU-heavy JavaScript non-blocking.

## 200. Don't perform huge CPU operations in request handlers

Use worker threads/background jobs/separate services when appropriate.

## 201. Be careful with regular expressions

Avoid patterns that can cause catastrophic backtracking/REDOS with untrusted input.

## 202. Don't parse unlimited user-controlled JSON

Use request-size limits and validation.

## 203. Don't use `Promise.all()` blindly

Unbounded concurrency can overload Node, databases, providers, and memory.

## 204. Don't make unbounded parallel external calls

Use batching or concurrency limits.

## 205. External API calls need timeouts

Do not assume external services always respond.

## 206. Retries must be intentional

Retries can multiply load, cost, and side effects.

## 207. NEVER blindly retry non-idempotent operations

Especially payments, orders, emails, SMS, subscriptions, financial transfers, and resource creation.

## 208. Use idempotency for important repeatable mutations

Consider idempotency keys and server-side deduplication where required.

## 209. Webhooks must be idempotent

Webhook providers can retry events.

## 210. Verify webhook signatures

Never trust webhook payloads without verification.

## 211. Don't perform long-running work synchronously

Move suitable work to background processing.

## 212. Don't turn everything into a queue

Use queues only when asynchronous work, retries, workload smoothing, or long processing genuinely needs them.

## 213. Rate-limit sensitive endpoints

Especially login, signup, password reset, OTP, verification, expensive search, file generation, and payment initiation.

## 214. Don't rely on in-memory rate limiting in distributed deployments

Process-local state does not coordinate across instances.

## 215. Don't store important application state in process memory

Processes restart and instances do not share memory.

## 216. Use graceful shutdown

Stop accepting new work, finish/close active work where practical, close resources, and exit.

## 217. Don't swallow errors

Never silently ignore exceptions.

## 218. Don't log and continue as if failed work succeeded

Decide whether to recover, retry, rollback, fail, or enqueue recovery.

## 219. Centralize API error handling

Use a consistent error-handling strategy.

## 220. Never expose stack traces in production responses

Return safe public errors and keep diagnostics server-side.

## 221. Use stable error formats

Don't let every endpoint invent a different error contract without reason.

## 222. Distinguish operational and programmer errors

Don't turn unexpected bugs into fake validation errors.

## 223. Don't use HTTP 200 for failed operations

Use appropriate HTTP status semantics.

## 224. Don't expose internal error messages blindly

Don't return raw database/provider/internal error messages to users.

## 225. Use structured logging

Useful fields include timestamp, request ID, route, method, status, duration, safe identifiers, and error code.

## 226. NEVER log secrets

Never log passwords, JWTs, refresh tokens, API keys, authorization headers, cookies, payment secrets, or webhook secrets.

## 227. Be careful logging request bodies

Bodies can contain sensitive information.

## 228. Use request correlation IDs

Useful for tracing requests across services/integrations.

## 229. Keep health checks cheap

Don't make health endpoints perform expensive business work.

## 230. Don't expose sensitive health diagnostics publicly

Health endpoints should not leak internal architecture.

## 231. Use TLS in production

Sensitive API traffic requires transport security.

## 232. Configure secure cookies

Consider `HttpOnly`, `Secure`, `SameSite`, `Domain`, `Path`, and expiration.

## 233. JWT is not automatically better than sessions

Choose authentication based on requirements.

## 234. Access tokens should not be unnecessarily long-lived

Use lifetimes appropriate to the security model.

## 235. Refresh tokens need deliberate lifecycle handling

Consider rotation, revocation, expiration, secure storage, hashing, and reuse detection where appropriate.

## 236. Never hardcode secrets

Use secure configuration mechanisms.

## 237. Validate required environment configuration at startup

Fail early for missing required settings.

## 238. Centralize configuration

Avoid scattering `process.env.*` throughout the codebase.

## 239. Don't make every constant an environment variable

Only operational/environment-specific configuration belongs there.

## 240. Dependency discipline

Before installing a package:

1. Check existing dependencies.
2. Check native Node/framework functionality.
3. Check whether the project already solves the problem.
4. Check maintenance/security.
5. Consider runtime/bundle implications.
6. Decide whether it is actually necessary.

## 241. Don't install a package for a tiny helper

Prefer native functionality or a small explicit implementation when clearer.

## 242. Don't install duplicate libraries

Avoid unnecessary combinations of HTTP clients, date libraries, validation libraries, and logging libraries.

## 243. Use a supported Node.js LTS release

Follow the project's supported runtime.

## 244. Don't invent cryptography

Use established cryptographic primitives and maintained libraries.

## 245. Passwords need appropriate password hashing

Do not use raw SHA-256 as a password-storage strategy. Use an appropriate password hashing algorithm such as Argon2, bcrypt, or scrypt according to project requirements.

## 246. File uploads are hostile input

Consider size limits, allowed types, actual content, filenames, storage, path traversal, malware scanning where appropriate, and authorization.

## 247. Don't use original filenames as storage paths

Generate controlled storage names.

## 248. Keep private files private

Don't expose private documents through unrestricted public directories.

## 249. Protect against SSRF

Be careful with endpoints that fetch user-provided URLs.

## 250. Don't blindly follow redirects from untrusted URLs

Redirects can reach internal/private resources.

## 251. Don't expose internal network information

Avoid returning internal IPs, database hosts, filesystem paths, service names, or environment details.

## 252. CORS is not authentication

CORS is a browser policy, not an authorization mechanism.

## 253. Don't use wildcard CORS blindly

Especially with credentialed authentication.

## 254. Use established security headers

Use established security-header mechanisms such as Helmet where appropriate.

## 255. Reduce server fingerprinting

Avoid unnecessarily exposing framework/server information.

## 256. Don't cache private data incorrectly

Cache keys and authorization boundaries must be correct.

## 257. Don't cache everything

Caching adds complexity; first establish the bottleneck.

## 258. Cache invalidation must be designed

Know what is cached, its lifetime, and what invalidates it.

## 259. API versioning must be intentional

Don't create versions without compatibility needs, but don't casually break existing consumers.

## 260. Don't silently change API contracts

Search consumers before changing response shapes or fields.

## 261. Don't use dangerous mutations with GET

GET should not perform destructive side effects.

## 262. Don't assume GET requests only happen from clicks

Browsers, crawlers, prefetching, and retries can trigger them.

## 263. Keep middleware purposeful

Every middleware should have a reason.

## 264. Middleware order matters

Understand security headers, CORS, parsing, logging, authentication, rate limiting, authorization, routes, and error handling.

## 265. Authentication middleware should establish identity

Do not turn authentication middleware into the entire business application.

## 266. Authorization should be visible and explicit

Do not hide critical permission checks in unrelated helpers.

## 267. Business state should have explicit transitions

For `pending`, `paid`, `failed`, `cancelled`, `refunded`, etc., define valid transitions.

## 268. Never trust payment status from the frontend

Payment status must come from trusted server/provider state.

## 269. Don't mark payments successful from client claims

Use provider confirmation/webhooks/reconciliation as appropriate.

## 270. External payment operations need unknown/pending states

A timeout does not prove failure.

## 271. Don't blindly retry payments

Use provider-supported idempotency and reconciliation.

## 272. Background jobs need idempotency

Jobs can run more than once due to retries/crashes/duplicate enqueue.

## 273. Don't allow overlapping cron jobs accidentally

Use appropriate locking/scheduling semantics when needed.

## 274. Time must be handled deliberately

Consider UTC, user timezone, database timezone, DST, and server time.

## 275. Don't trust client timestamps for authoritative decisions

Use server/database time where correctness matters.

## 276. Don't assume distributed operations are atomic

PostgreSQL + Redis + Stripe + email is not one transaction.

## 277. Use an outbox pattern when genuinely needed

Use it when reliable coordination between database changes and event publication is required.

## 278. Don't make everything event-driven

Events add complexity; use them when they provide real value.

## 279. Don't introduce microservices prematurely

A modular monolith is often the better architecture.

## 280. Don't introduce Redis without a real requirement

Possible reasons include caching, distributed rate limiting, queues, and coordination.

## 281. Don't introduce Kafka without a real requirement

Scalability claims alone are not sufficient justification.

## 282. Don't over-engineer observability

Start with appropriate logs, error tracking, metrics, and health checks.

## 283. Don't leave development behavior enabled in production

Avoid debug endpoints, verbose stack traces, test credentials, fake payments, mock users, and accidental debugging.

## 284. Never silently fall back to fake data

If a required service fails, do not pretend the operation succeeded.

## 285. Don't make every failure a retry

Retry appropriate transient failures only.

## 286. Use backoff and jitter when appropriate

Avoid synchronized retry storms.

## 287. Avoid nested retry explosions

Multiple retry layers can multiply actual attempts dramatically.

## 288. Centralize external API clients

Keep provider-specific integrations in a deliberate boundary.

## 289. Don't spread provider-specific statuses everywhere

Map provider concepts into application/domain concepts where useful.

## 290. Don't hardcode third-party URLs

Centralize integration configuration.

## 291. Set network timeouts

Network requests should not hang indefinitely without deliberate timeout behavior.

## 292. Bound resources

For every endpoint consider memory, CPU, connections, request size, file size, database rows, query complexity, and external calls.

## 293. Don't expose expensive search without constraints

Use pagination, maximum page size, query limits, indexes, rate limits, and query timeouts where appropriate.

## 294. Don't fetch millions of rows and filter in JavaScript

Push appropriate filtering into the database.

## 295. Don't serialize huge objects unnecessarily

Return only what the client needs.

## 296. Stream genuinely large data when appropriate

Large exports/files may be better streamed than loaded into memory.

## 297. Don't buffer large uploads unnecessarily

Use streaming/object storage when appropriate.

## 298. Don't use memory as an important queue

Process restarts destroy in-memory queues.

## 299. Avoid global mutable state

Global mutable state is difficult to reason about and does not scale across instances.

## 300. Avoid circular dependencies

Keep dependency direction understandable.

## 301. Avoid "god services"

Services should have meaningful responsibilities.

## 302. Don't split every domain into a microservice

Modules inside one process can be enough.

## 303. Make business invariants explicit

Examples:

- balance cannot become negative;
- order cannot be paid twice;
- inventory cannot become negative;
- subscription transitions must be valid.

## 304. Consider concurrent duplicate requests

Ask what happens if the same request arrives twice simultaneously.

## 305. Consider out-of-order requests

Distributed clients can produce requests that arrive in a different order than the user's actions.

## 306. Don't trust client-generated roles/permissions

Permissions belong to trusted server-side state.

## 307. Be careful with account enumeration

Authentication flows should avoid unnecessarily revealing whether accounts exist when that creates a security issue.

## 308. OTP endpoints need strong controls

Consider rate limiting, attempt limits, expiration, one-time use, brute-force protection, and delivery abuse.

## 309. Treat authentication secrets appropriately

Don't store or expose OTPs/tokens carelessly.

## 310. Don't put secrets in URLs

Sensitive tokens should not be placed in query strings without a specific reviewed reason.

## 311. UUIDs do not replace authorization

Opaque IDs can reduce enumeration but do not prove ownership.

## 312. Don't assume internal services are automatically trusted

Internal endpoints may still be reached through SSRF, compromised services, or misconfiguration.

## 313. Keep API documentation aligned with implementation

Documentation must reflect actual validation, authentication, authorization, responses, and errors.

## 314. Don't invent API documentation

Inspect actual behavior.

## 315. Use consistent pagination contracts

Follow the project's established convention.

## 316. Cursor pagination can be useful at scale

Use it when the data/workload benefits from it; don't use it everywhere automatically.

## 317. Database migrations require deployment thinking

Consider existing data, ordering, compatibility, rollback, old application versions, and zero/low downtime.

## 318. Be careful with destructive migrations

Don't casually drop production columns/tables.

## 319. Prefer backward-compatible schema changes for rolling deployments

When required, use patterns such as:

```text
add new field
→ deploy compatible code
→ backfill
→ switch reads
→ remove old field later
```

## 320. Don't mutate production schema unexpectedly on application boot

Unless explicitly required by the deployment architecture.

## 321. Keep migrations separate from runtime business logic

Schema evolution belongs in migration tooling.

## 322. Database operations can fail

Handle appropriately:

- unique violations;
- foreign-key violations;
- connection failures;
- timeouts;
- deadlocks;
- serialization failures.

---

# Part IV — Production Review Checklists

## 323. Standard authenticated endpoint

```text
Request
  ↓
security middleware
  ↓
authentication
  ↓
input validation
  ↓
authorization
  ↓
controller
  ↓
business/service logic
  ↓
database/integration
  ↓
response DTO
  ↓
central error handling
```

Not every project requires every separate layer, but responsibilities must remain clear.

## 324. Standard mutation review

Before implementing a mutation, ask:

- Who can call this?
- What can the client control?
- What resource is changing?
- Does the caller own it?
- Can two requests happen simultaneously?
- Can it be duplicated?
- Can the external service timeout?
- Can the database partially fail?
- What happens after failure?
- Can it safely be retried?
- What should the client receive?
- What should be logged?

## 325. External API review

Before calling an external API:

- timeout?
- retry?
- idempotency?
- authentication?
- rate limits?
- response validation?
- failure states?
- logging?
- sensitive data?
- webhook reconciliation?

## 326. Database mutation review

Before changing important data:

- transaction?
- unique constraint?
- foreign key?
- race condition?
- concurrency?
- partial failure?
- rollback?
- idempotency?
- required indexes?

## 327. Security review

For every endpoint:

- authentication?
- object-level authorization?
- function-level authorization?
- property-level authorization?
- input validation?
- rate limiting?
- resource limits?
- sensitive response fields?
- error exposure?
- logging?

---

# Part V — Final Production Principle

Production-ready does **not** mean more code.

It does not automatically mean:

- 20 middleware layers;
- 10 abstraction layers;
- Redis;
- Kafka;
- microservices;
- hundreds of tests;
- dozens of dependencies.

It means the system correctly handles its actual:

- security;
- data;
- failure;
- concurrency;
- resource;
- operational;
- business requirements.

The most important question is not:

> "Does this code work?"

Ask:

> **"What happens when this code is called twice, called concurrently, given malicious input, given 100× more data, given a timeout, given a dependency failure, given an unauthorized ID, or restarted halfway through?"**

That is the difference between AI-generated code that merely works and production engineering.

# Production-Ready Next.js Frontend Rules for Claude Code

> **Purpose:** Put this file in the root of a Next.js project (for example as `CLAUDE.md`) so Claude Code follows production-oriented frontend practices instead of blindly generating visually correct but unnecessarily heavy code.
>
> **Primary principle:** Preserve the requested UI/design, but implement it with clean, maintainable, accessible, performant, secure, type-safe Next.js/React patterns.
>
> These rules are based primarily on the current Next.js production guidance and React documentation. Next.js currently recommends Server Components by default, small Client Component boundaries, appropriate caching, streaming, optimized images/fonts/scripts, accessibility checks, TypeScript, production builds, Core Web Vitals, and bundle analysis. React's current guidance emphasizes pure components, correct Hook usage, and using Effects only when they connect to external systems. 

---

## 0. How Claude Code must work in this project

### 0.1 Inspect before changing

Before implementing or modifying a feature:

- Inspect the existing project structure.
- Inspect `package.json`.
- Inspect the existing Next.js version and configuration.
- Inspect the styling system.
- Inspect existing UI primitives/components.
- Inspect existing hooks.
- Inspect existing utilities.
- Inspect existing API/data-fetching patterns.
- Inspect existing types.
- Inspect authentication/session patterns when relevant.
- Inspect existing design tokens/theme.
- Search for an existing component before creating a new one.
- Search for an existing dependency before installing another one.

### 0.2 Preserve existing architecture

Do not redesign the application's architecture merely because a new screen is being implemented.

Do not:
- replace the state-management solution without being asked;
- replace the styling solution without being asked;
- replace the API architecture without being asked;
- install alternative libraries when an existing library already solves the problem;
- rewrite unrelated files;
- refactor unrelated code merely because you prefer another style.

### 0.3 Keep the task scoped

If asked to implement a screen:

1. Understand the existing architecture.
2. Reuse existing infrastructure.
3. Implement the screen.
4. Fix issues directly required for the screen.
5. Do not turn a UI task into an unrelated architecture migration.

### 0.4 Do not perform expensive work unnecessarily

Prefer actions that consume fewer tokens/time when they can produce the same result.

- Inspect only relevant files first.
- Search targeted directories before reading the entire repository.
- Read the smallest useful file/range before reading large files.
- Reuse existing components instead of recreating them.
- Do not analyze every file when only a few files matter.
- Do not run expensive builds repeatedly after every tiny edit.
- Batch related checks when possible.
- Do not generate long explanations unless requested.
- Do not dump entire files into the conversation when a focused diff is sufficient.
- Before installing a package, check whether the project already has a suitable dependency.
- Prefer the smallest change that solves the task.

### 0.5 Delegate low-value manual work to the user when it saves tokens

When a task is simple for the user to perform locally and would require substantial tool usage or token consumption, tell the user exactly what command/action they can perform instead of doing unnecessary analysis.

Examples:

- If the user needs to inspect the browser visually, ask them to run the app and report/screenshot the result.
- If a task only requires checking one browser interaction, ask the user to test it locally rather than performing broad repository analysis.
- If bundle analysis is specifically requested, provide the exact command/setup when that is more efficient than exploring the entire project first.
- If a task requires credentials, account access, or a third-party dashboard, give the user the exact manual step instead of attempting unrelated investigation.
- If a large generated artifact is only needed for a final manual check, ask the user to run the appropriate local command and return the relevant output.

Do not delegate tasks that Claude can cheaply and reliably complete itself.

---

# 1. Next.js architecture

## 1.1 Use the App Router properly

For modern Next.js applications, prefer the App Router:

```text
app/
├── layout.tsx
├── page.tsx
├── loading.tsx
├── error.tsx
├── not-found.tsx
├── globals.css
└── feature/
    ├── page.tsx
    ├── loading.tsx
    └── ...
```

Use layouts to share UI across routes.

Do not create an unnecessarily flat or monolithic application.

## 1.2 Server Components are the default

Next.js App Router pages and layouts are Server Components by default.

Prefer Server Components for:

- server-side data fetching;
- static rendering;
- SEO content;
- sensitive server-side logic;
- database/server access;
- content that does not need browser interactivity.

## 1.3 Client Components require a reason

Only use:

```tsx
"use client";
```

when the component actually requires client functionality such as:

- `useState`;
- event handlers such as `onClick`/`onChange`;
- browser APIs;
- `useEffect` for a legitimate external-system synchronization;
- client-only libraries;
- browser storage;
- other genuinely interactive behavior.

Do NOT add `"use client"` merely because the component renders UI.

## 1.4 Keep Client Components as low as possible

If only a small portion of a page is interactive, keep the page/server tree on the server and make the interactive child a Client Component.

Bad:

```text
Entire Dashboard
└── "use client"
```

Better:

```text
Dashboard (Server)
├── Header (Server)
├── Stats (Server)
├── Activity (Server)
└── FilterControls (Client)
```

## 1.5 Do not make the root layout a Client Component unnecessarily

Keep `app/layout.tsx` server-side unless the entire layout genuinely requires client functionality.

If one child needs state, make that child a Client Component.

## 1.6 Avoid unnecessary server-to-API round trips

Do not make a Server Component call your own Route Handler just to access data that the Server Component can access directly.

Avoid:

```text
Server Component
    ↓
/api/users
    ↓
server logic
    ↓
database
```

when direct server-side data access is possible.

Use Route Handlers for browser/client-side access to backend resources where appropriate.

## 1.7 Use layouts correctly

Shared navigation, sidebars, headers, and persistent page structure should normally live in layouts rather than being duplicated across pages.

---

# 2. React fundamentals

## 2.1 Keep components pure

Components should behave predictably based on their inputs.

Do not perform arbitrary side effects during render.

Do not mutate props.

Do not mutate state directly.

## 2.2 Never mutate React state directly

Bad:

```tsx
items.push(newItem);
setItems(items);
```

Good:

```tsx
setItems(prev => [...prev, newItem]);
```

Bad:

```tsx
user.name = "Khalil";
setUser(user);
```

Good:

```tsx
setUser(prev => ({
  ...prev,
  name: "Khalil",
}));
```

## 2.3 Follow the Rules of Hooks

Hooks must be called:

- at the top level;
- from React components or custom Hooks.

Do not call Hooks:

- inside conditions;
- inside loops;
- inside nested functions;
- inside event handlers;
- after conditional returns;
- inside `try/catch/finally`;
- inside arbitrary regular functions.

## 2.4 Do not use `useEffect` as a default data-flow mechanism

Effects are primarily for synchronizing React with an external system.

Do not automatically write:

```tsx
useEffect(() => {
  fetchData();
}, []);
```

for every data requirement.

Prefer Server Component data fetching when possible.

Do not use an Effect merely to calculate derived state that could be calculated during render.

## 2.5 Avoid unnecessary `useMemo`

Do not write:

```tsx
const value = useMemo(() => simpleCalculation(), []);
```

just because it is considered a "performance best practice".

Use `useMemo` when there is a real expensive calculation or a meaningful memoization reason.

## 2.6 Avoid unnecessary `useCallback`

Do not wrap every event handler in `useCallback`.

Use it only when there is a concrete reason, such as interaction with memoized components or a demonstrated rendering/performance issue.

## 2.7 Avoid unnecessary `memo`

Do not add `React.memo` to everything.

Measure/understand the rendering problem first.

## 2.8 Keep transient state local

Keep UI state close to the component that owns it.

Examples:

- dropdown open state;
- modal open state;
- temporary input;
- hover/selection state;
- local tab state.

Do not put every small piece of UI state into global state.

---

# 3. Component architecture

## 3.1 One clear responsibility

Components should have a clear purpose.

Avoid giant files containing:

- API calls;
- business calculations;
- multiple unrelated forms;
- modals;
- charts;
- tables;
- navigation;
- all UI state;
- all validation;
- all formatting.

## 3.2 Do not over-componentize

Do not create meaningless components such as:

```text
BlueRoundedDiv.tsx
SmallGap.tsx
TextWrapper.tsx
DashboardBox.tsx
```

Create components around meaningful UI behavior or reusable patterns.

## 3.3 Reuse existing components

Before creating:

```text
NewButton.tsx
NewModal.tsx
NewCard.tsx
NewInput.tsx
```

search the project for existing equivalents.

## 3.4 Keep business logic out of visual components

Prefer:

```tsx
const total = calculateOrderTotal(order);

return <PayButton amount={total} />;
```

over putting complex calculations directly inside JSX.

## 3.5 Separate formatting from business logic

Create focused helpers such as:

```text
formatCurrency()
formatDate()
formatDuration()
```

instead of duplicating formatting everywhere.

## 3.6 Avoid giant utility files

Do not turn `utils.ts` into a junk drawer.

Group utilities by responsibility.

## 3.7 Avoid giant Context providers

Use Context for genuinely shared concerns.

Do not create one giant provider containing the entire application state.

---

# 4. TypeScript

## 4.1 Use TypeScript properly

Type component props, API responses, domain objects, and important function inputs/outputs.

## 4.2 Avoid `any`

Do not use:

```tsx
const data: any = ...
```

unless there is a very specific unavoidable reason.

Prefer real types.

When data is genuinely unknown, use `unknown` and validate/narrow it.

## 4.3 Do not use `@ts-ignore` casually

Never use `@ts-ignore` just to make an error disappear.

Understand and fix the type problem.

## 4.4 Validate external data

TypeScript does not validate runtime data.

API responses, user input, URL parameters, and external data should be validated where appropriate.

## 4.5 Keep shared types organized

Do not duplicate the same domain type in many components.

---

# 5. Data fetching and caching

## 5.1 Prefer server-side data fetching

When data can be fetched on the server, prefer Server Components.

## 5.2 Avoid request waterfalls

If requests are independent, fetch them in parallel.

Bad:

```text
user
 ↓
subscription
 ↓
workouts
 ↓
stats
```

when all four could be fetched independently.

## 5.3 Cache intentionally

Understand whether data is:

- static;
- semi-static;
- dynamic;
- user-specific;
- real-time.

Do not randomly add `no-store` or aggressive caching.

## 5.4 Protect user-specific data

Never use a cache strategy that could cause one user's private data to be served to another user.

Be especially careful with:

- dashboards;
- profiles;
- subscriptions;
- payments;
- private records;
- authentication.

## 5.5 Avoid downloading huge datasets

For large data:

- paginate;
- filter on the server;
- sort on the server;
- search on the server;
- use virtualization when appropriate.

Do not download 100,000 records simply to filter them in the browser.

---

# 6. Loading, error, and empty states

Every meaningful data-driven UI should consider:

```text
Loading
Success
Empty
Error
```

## 6.1 Loading

Use `loading.tsx`, Suspense, or local loading UI where appropriate.

## 6.2 Error

Use route-level error boundaries such as `error.tsx` where appropriate.

Provide a recovery action such as:

```text
Try again
```

## 6.3 Empty

Do not show a blank screen.

Example:

```text
No workouts yet.

Start your first workout to see it here.

[Create workout]
```

## 6.4 Partial failures

Independent dashboard sections should be able to fail independently where practical.

---

# 7. Forms

## 7.1 Production forms need states

Consider:

```text
idle
focused
typing
validation error
submitting
success
server error
disabled
```

## 7.2 Prevent duplicate submissions

Disable appropriate submit controls while a mutation is in progress.

## 7.3 Client validation is UX, not security

Always enforce important validation/security server-side.

## 7.4 Destructive actions

Use confirmation for genuinely destructive or irreversible actions.

Do not ask for confirmation for every trivial interaction.

---

# 8. Accessibility

## 8.1 Use semantic HTML

Prefer:

```html
header
nav
main
section
article
aside
footer
button
form
label
```

over generic `div`s when semantics exist.

## 8.2 Never use clickable divs for buttons

Bad:

```tsx
<div onClick={handleClick}>Delete</div>
```

Good:

```tsx
<button onClick={handleClick}>Delete</button>
```

## 8.3 Use links for navigation

Navigation should use links rather than click handlers that imitate navigation.

## 8.4 Label inputs

Every input needs an accessible label.

## 8.5 Icon-only buttons need accessible names

Example:

```tsx
<button aria-label="Delete workout">
  <TrashIcon />
</button>
```

## 8.6 Keyboard navigation

Important interactions must work with:

- Tab;
- Shift+Tab;
- Enter;
- Space;
- Escape;
- appropriate arrow keys.

## 8.7 Focus

Do not remove focus outlines without replacing them with a clear accessible focus style.

## 8.8 Do not rely on hover

Important functionality must work on touch devices and keyboards.

## 8.9 Do not use color alone

Use text, icons, labels, or other cues in addition to color.

## 8.10 Reduced motion

Respect `prefers-reduced-motion`.

## 8.11 Contrast

Maintain sufficient contrast for text and important UI elements.

## 8.12 Images

Meaningful images need useful alt text.

Decorative images should use appropriate empty alt text.

---

# 9. Images

## 9.1 Use `next/image`

Prefer Next.js Image for application images.

## 9.2 Give images appropriate dimensions/aspect ratios

Prevent layout shifts.

## 9.3 Do not ship huge images for tiny UI elements

An avatar should not require a massive source image when a small optimized representation is sufficient.

## 9.4 Use appropriate loading behavior

Do not eagerly load every image on the page.

Prioritize important above-the-fold imagery.

---

# 10. Fonts

## 10.1 Use `next/font`

Prefer Next.js Font optimization rather than arbitrary external font `<link>` tags.

## 10.2 Avoid unnecessary font families and weights

Only load what the design actually needs.

---

# 11. Navigation

## 11.1 Use `next/link` for internal navigation

Prefer:

```tsx
<Link href="/dashboard">
  Dashboard
</Link>
```

## 11.2 Do not use `window.location.href` for normal internal navigation

Use `Link` or the appropriate router API.

## 11.3 Keep navigation semantics correct

Links should look/behave like links and buttons should look/behave like actions.

---

# 12. Responsive design

## 12.1 Design for real viewport sizes

Test:

```text
320px
375px
390px
430px
768px
1024px
1280px
1440px+
```

## 12.2 Prefer CSS responsiveness

For layout changes, prefer CSS media/container queries instead of JavaScript viewport detection.

Avoid:

```tsx
if (window.innerWidth < 768) ...
```

for normal responsive layout.

## 12.3 Do not rely on hover

Touch devices may not have hover.

## 12.4 Make touch targets usable

Buttons and controls must have enough physical target area.

---

# 13. Styling and design system

## 13.1 Follow the existing styling system

If the project already uses Tailwind, continue using it.

If it uses CSS Modules, continue using them.

Do not introduce a second styling system without a strong reason.

## 13.2 Use design tokens

Standardize:

- colors;
- spacing;
- typography;
- radii;
- shadows;
- borders.

## 13.3 Avoid random pixel values

Do not generate arbitrary values like:

```text
rounded-[17px]
p-[23px]
gap-[19px]
```

unless the design genuinely requires that exact value.

## 13.4 Consistent spacing

Use a consistent spacing scale.

## 13.5 Consistent radii

Define a hierarchy such as:

```text
sm → controls
md → cards
lg → large surfaces
full → pills/avatars
```

## 13.6 Consistent typography

Define a predictable hierarchy:

```text
display
h1
h2
h3
body
small
caption
```

## 13.7 Avoid excessive visual effects

Be careful with:

- huge blur;
- excessive backdrop blur;
- huge shadows;
- filters;
- expensive gradients;
- excessive animation.

Beautiful UI should still perform well on low-end devices.

---

# 14. UI states

For interactive controls, consider:

```text
default
hover
focus
active
disabled
loading
error
selected
```

Do not design only the happy path.

---

# 15. Animation

## 15.1 Animation should communicate something

Use animation for:

- feedback;
- state changes;
- continuity;
- hierarchy;
- transitions.

## 15.2 Do not animate everything

Avoid animation on every card, icon, text element, and page.

## 15.3 Prefer CSS for simple animations

Do not create React state/update loops for simple visual effects.

## 15.4 Respect reduced motion

Use `prefers-reduced-motion`.

---

# 16. Client-side JavaScript and performance

## 16.1 Ship as little JavaScript as practical

This is a core Next.js principle.

Prefer:

```text
Server-rendered UI
+
small interactive Client Components
```

instead of:

```text
Entire application as Client Components
```

## 16.2 Every `"use client"` declaration should have a reason

Before adding it, ask:

> Does this component actually need state, event handlers, browser APIs, or a client-only dependency?

If not, keep it server-side.

## 16.3 Avoid unnecessary dependencies

Before installing a package:

1. Search existing dependencies.
2. Check whether browser/React/Next.js already solves the problem.
3. Check bundle impact.
4. Check maintenance/reliability.
5. Install only when justified.

## 16.4 Lazy-load heavy client features

Consider dynamic/lazy loading for:

- charts;
- maps;
- rich text editors;
- PDF viewers;
- large visualization libraries;
- other expensive client-only features.

## 16.5 Do not optimize imaginary problems

Do not add memoization, dynamic imports, complex caching, or state-management infrastructure without a reason.

Measure first when practical.

---

# 17. State management

## 17.1 Keep state as local as possible

Do not make every component depend on a global store.

## 17.2 Separate UI state from server state

UI state:

```text
modalOpen
selectedTab
dropdownOpen
inputValue
```

Server state:

```text
users
workouts
subscriptions
payments
```

Do not automatically treat server data as ordinary local React state.

## 17.3 Avoid unnecessary global Context

Only share state globally when there is a real need.

---

# 18. URL state

Use URL parameters for state that users should reasonably be able to:

- refresh;
- bookmark;
- share;
- navigate with back/forward.

Examples:

```text
/workouts?category=push&page=2
```

Do not put secrets or sensitive data in URLs.

---

# 19. Lists

## 19.1 Use stable keys

Prefer:

```tsx
items.map(item => (
  <Card key={item.id} />
))
```

over array indexes when items can change order, be inserted, or deleted.

## 19.2 Large lists

For large lists consider:

- server pagination;
- infinite loading;
- virtualization.

Do not render thousands of unnecessary DOM nodes.

---

# 20. Security

## 20.1 Client authorization is not security

A hidden button is not authorization.

Server-side authorization must enforce permissions.

## 20.2 Environment variables

Never expose secrets using:

```text
NEXT_PUBLIC_*
```

Only variables intentionally exposed to the browser should use that prefix.

## 20.3 Do not commit secrets

Keep `.env.*` out of Git.

Use `.env.example` with placeholders.

## 20.4 Do not store sensitive credentials casually in localStorage

Never casually put:

- passwords;
- private tokens;
- sensitive credentials;
- highly sensitive personal information

into browser storage.

Follow the application's reviewed authentication architecture.

## 20.5 Do not expose backend errors

Never display raw database/server stack traces to users.

## 20.6 CSP

A Content Security Policy should be considered for production applications where appropriate.

## 20.7 Server Actions

When using Server Actions, authorization must still be checked. Never assume that hiding the action in the UI provides security.

---

# 21. Metadata and SEO

## 21.1 Use the Next.js Metadata API

Important public pages should have appropriate:

- title;
- description;
- metadata.

## 21.2 Dynamic metadata

Use dynamic metadata for dynamic public content where appropriate.

## 21.3 Open Graph

Public/shareable pages should have appropriate OG metadata/images.

## 21.4 Sitemap and robots

For public/indexable applications, configure sitemap and robots behavior appropriately.

## 21.5 Do not optimize private pages for SEO unnecessarily

Private dashboards/settings/admin areas generally should not be treated like public marketing pages.

---

# 22. Error handling

## 22.1 Use route-level error boundaries where appropriate

Use `error.tsx` for meaningful route-level recovery.

## 22.2 Provide recovery actions

Prefer:

```text
Something went wrong.

[Try again]
```

over an unexplained blank screen.

## 22.3 Handle common network failures

Consider:

```text
401
403
404
429
500
timeout
offline
```

when relevant.

---

# 23. Authentication UX

Account-related UI should consider:

```text
checking session
authenticated
unauthenticated
session expired
insufficient permissions
```

Do not assume a user exists in client code.

---

# 24. Business logic

## 24.1 Keep business logic separate

Avoid complex business rules directly inside JSX.

## 24.2 Do not trust client calculations for security

Client calculations are for UX.

Important values/permissions must be validated server-side.

## 24.3 Do not duplicate business rules

Centralize important rules where possible.

---

# 25. Dependency discipline

Before installing a package, answer:

1. Do we already have something that does this?
2. Can Next.js/React/browser APIs solve it?
3. Is the package maintained?
4. How much client JavaScript will it add?
5. Is the feature important enough to justify it?

Do not install libraries simply because an AI-generated solution uses them.

---

# 26. Icons

Use the existing icon library consistently.

Do not mix several icon libraries unless there is a specific reason.

Do not use emoji as replacement icons unless the product deliberately uses emoji as part of its design language.

---

# 27. Naming

Use meaningful names:

```text
WorkoutCard
WorkoutForm
WorkoutList
WorkoutDetails
```

Avoid:

```text
Component2
Wrapper2
NewCard
FinalCard
Thing
Box
```

Simplify overly verbose AI-generated names.

---

# 28. File organization

For small projects:

```text
app/
components/
lib/
hooks/
types/
```

For larger projects, feature-oriented organization may be preferable:

```text
features/
├── auth/
├── workouts/
├── dashboard/
├── profile/
└── subscriptions/
```

Use the structure that matches the existing application.

Do not restructure the entire project unless asked.

---

# 29. Do not create a framework inside the framework

Production-ready does not mean maximum abstraction.

Do not build:

- unnecessary custom state frameworks;
- excessive generic component factories;
- huge configuration layers;
- abstractions used only once.

Prefer simple, understandable code.

---

# 30. Testing policy

## 30.1 Do not automatically create tests

**Only create test files/tests when the user explicitly asks for tests/testing, or when an existing project requirement/CI convention clearly requires adding them as part of the requested task.**

If tests are not requested, do not spend tokens generating a large test suite.

## 30.2 When tests ARE requested

When the user explicitly asks for tests:

- inspect existing test framework and conventions first;
- reuse the existing framework;
- test meaningful behavior rather than implementation details;
- cover important success/error/edge cases;
- avoid pointless snapshot/test duplication;
- keep tests maintainable;
- run the relevant tests after writing them when practical.

---

# 31. Bundle analysis policy

## 31.1 Do not automatically run bundle analysis

**Only perform bundle analysis when the user explicitly asks for it, or when there is a clear performance investigation requiring it.**

If you suspect bundle-size problems during normal development, tell the user:

> "This may be worth checking with a bundle analysis, but I won't run it unless you want me to."

Do not spend tokens/time running heavy analysis unnecessarily.

---

# 32. Lighthouse / performance audit policy

## 32.1 Do not automatically run full Lighthouse audits

**Only run Lighthouse or a full performance audit when the user explicitly asks for it, or when they specifically request performance investigation.**

Otherwise, suggest it to the user at the appropriate stage.

Suggested user action:

```text
Run the production build and Lighthouse locally when you are ready for a performance pass.
```

Do not repeatedly perform audits during normal UI implementation.

---

# 33. Production build policy

A production build is useful, but do not run it after every tiny change.

For a feature implementation:

- finish the focused changes first;
- then run type/lint/build checks at an appropriate milestone;
- avoid repeatedly rebuilding while making small visual adjustments.

Before deployment, use:

```bash
npm run build
npm run start
```

or the project's equivalent commands.

---

# 34. User-assisted visual QA

Some things are cheaper and more reliable for the user to inspect directly.

When appropriate, ask the user to:

1. Start the app.
2. Open the relevant page.
3. Check the requested viewport/device.
4. Take a screenshot or report the issue.
5. Return only the relevant result.

Do not spend large token budgets trying to infer purely visual problems from source code when the user can inspect the actual browser output immediately.

---

# 35. Browser DevTools tasks the user can perform

When the task specifically concerns visual/browser behavior, it may be more efficient to ask the user to inspect:

- Console errors;
- Network requests;
- failed requests;
- computed styles;
- responsive viewport;
- accessibility tree;
- performance timeline.

Give exact instructions rather than asking them to "check everything."

---

# 36. Debugging policy

When debugging:

1. Reproduce or identify the exact issue.
2. Inspect the smallest relevant area.
3. Fix the root cause.
4. Avoid unrelated refactoring.
5. Verify the fix.
6. Do not rewrite an entire component unless necessary.

---

# 37. AI-generated UI cleanup

When implementing a design generated by Claude or another AI:

## Check for:

- excessive nested divs;
- duplicated components;
- random Tailwind values;
- unnecessary `"use client"`;
- unnecessary `useEffect`;
- unnecessary `useMemo`;
- unnecessary `useCallback`;
- repeated API calls;
- fake data left in production;
- missing loading states;
- missing empty states;
- missing error states;
- inaccessible buttons;
- missing labels;
- index keys;
- giant components;
- duplicated constants;
- unnecessary dependencies;
- huge client bundles;
- hardcoded production URLs;
- secrets;
- placeholder content;
- desktop-only layout;
- hover-only interactions.

Do not blindly preserve poor implementation merely because the visual result looks correct.

---

# 38. Visual fidelity rule

When the user provides a design/reference:

**Preserve the intended visual design.**

Do not "improve" the design by changing:

- spacing;
- colors;
- typography;
- layout;
- component hierarchy;
- animation;
- interaction behavior

unless:

1. the user asks for a design change; or
2. the change is required for accessibility/responsiveness/functionality.

Production engineering should improve the implementation, not silently redesign the product.

---

# 39. Don't invent product requirements

If the user asks:

> Implement this design.

Do not invent:

- new pages;
- new features;
- new filters;
- new analytics;
- new authentication flows;
- new backend APIs;
- new settings;
- new business rules.

Implement what is requested.

If something is genuinely missing, ask or make the smallest reasonable assumption and state it.

---

# 40. Do not modify unrelated files

A UI task should not randomly modify:

```text
auth/
database/
backend/
deployment/
CI/
unrelated pages/
```

unless the requested feature actually requires it.

---

# 41. Production readiness checklist

Before declaring a feature complete, review:

## Architecture

- [ ] Server Component used by default.
- [ ] `"use client"` has a concrete reason.
- [ ] Client boundary is as small as practical.
- [ ] No unnecessary server → API → server request.
- [ ] Existing architecture was reused.

## React

- [ ] Components are pure.
- [ ] State is not mutated directly.
- [ ] Hooks follow the Rules of Hooks.
- [ ] No unnecessary Effects.
- [ ] No unnecessary `useMemo`.
- [ ] No unnecessary `useCallback`.
- [ ] No unnecessary `memo`.

## Components

- [ ] Components have clear responsibilities.
- [ ] Existing components were reused.
- [ ] No giant component.
- [ ] No meaningless micro-components.
- [ ] Business logic is separated appropriately.

## TypeScript

- [ ] No unnecessary `any`.
- [ ] No casual `@ts-ignore`.
- [ ] Important data is typed.
- [ ] External data is validated where appropriate.

## UX

- [ ] Loading state exists where needed.
- [ ] Empty state exists where needed.
- [ ] Error state exists where needed.
- [ ] Success feedback exists where appropriate.
- [ ] Duplicate submissions are prevented where appropriate.
- [ ] Destructive actions are handled appropriately.

## Accessibility

- [ ] Semantic HTML.
- [ ] Buttons are actual buttons.
- [ ] Links are actual links.
- [ ] Inputs have labels.
- [ ] Icon-only buttons have accessible names.
- [ ] Keyboard navigation works.
- [ ] Focus is visible.
- [ ] Hover is not required.
- [ ] Color is not the only state indicator.
- [ ] Reduced motion is respected.
- [ ] Contrast is appropriate.

## Responsive

- [ ] Mobile layout works.
- [ ] Tablet layout works.
- [ ] Desktop layout works.
- [ ] Large screens work.
- [ ] Touch interactions work.
- [ ] No JS viewport detection for simple CSS layout.

## Performance

- [ ] Images use appropriate optimization.
- [ ] Fonts are optimized.
- [ ] No unnecessary client-side JavaScript.
- [ ] No unnecessary dependencies.
- [ ] Large client components are lazy-loaded when appropriate.
- [ ] No obvious request waterfalls.
- [ ] Large lists are handled appropriately.

## Security

- [ ] No secrets in client code.
- [ ] No secrets in `NEXT_PUBLIC_*`.
- [ ] `.env.*` is not committed.
- [ ] Client-side authorization is not treated as security.
- [ ] Sensitive data is protected.
- [ ] Backend errors are not exposed.

## SEO

- [ ] Public page has appropriate title.
- [ ] Public page has appropriate description.
- [ ] OG metadata is handled where relevant.
- [ ] Indexing behavior is intentional.

## Code quality

- [ ] No debugging leftovers.
- [ ] No fake production data.
- [ ] No duplicate constants.
- [ ] No unnecessary dependencies.
- [ ] No unrelated refactors.
- [ ] Naming is clear.
- [ ] Imports are clean.

---

# 42. Final verification

When the implementation is complete, perform an appropriate lightweight review first.

Check:

1. TypeScript errors.
2. Lint errors.
3. Browser console errors if available.
4. Obvious accessibility issues.
5. Responsive layout issues.
6. Loading/error/empty states.
7. Unnecessary Client Components.
8. Unnecessary dependencies.
9. Unnecessary API calls.

Only perform heavier tasks such as:

- full test suites;
- bundle analysis;
- Lighthouse;
- extensive performance profiling;

when the user explicitly requests them, the project requires them, or there is a concrete reason to investigate them.

---

# 43. Token/cost efficiency rules for Claude Code

The goal is not to minimize tokens at the expense of correctness. The goal is to avoid wasting tokens on work that does not improve the result.

## Always do

- Search before creating duplicate code.
- Read relevant files before editing.
- Reuse existing components.
- Make focused changes.
- Batch related edits.
- Prefer concise tool output.
- Verify the relevant result instead of rereading the entire project.
- Explain only important changes.

## Avoid by default

- Reading the entire repository.
- Rewriting complete files when a focused edit is enough.
- Running full builds after every tiny change.
- Running tests when the user did not request tests.
- Running Lighthouse when the user did not request performance auditing.
- Running bundle analysis when the user did not request bundle investigation.
- Installing packages without checking existing dependencies.
- Creating documentation for trivial changes unless requested.
- Performing unrelated refactors.
- Generating large test suites without being asked.
- Re-explaining the entire architecture after every change.

## Ask the user to perform simple local checks when cheaper

Examples:

> "Please open `/dashboard` at 390px width and tell me whether the sidebar should be a drawer or bottom navigation."

> "Please run `npm run build` and paste the first error if it fails."

> "Please open DevTools → Console and paste the relevant error."

> "If you want a full performance audit, I can prepare the Lighthouse/bundle-analysis steps, but I won't run that during normal UI work."

---

# 44. Important distinction: suggest vs execute

When a heavy or optional task is not required:

**Suggest it; do not automatically execute it.**

Examples:

### Tests

If tests were not requested:

> "Tests could be added for this feature if you want. I have not created them."

### Bundle analysis

If performance isn't being investigated:

> "Bundle analysis could be useful later if this page becomes heavy. I have not run it."

### Lighthouse

If a performance audit wasn't requested:

> "Run Lighthouse when you want to do a performance pass. I have not run a full audit."

### Full production build

Do not repeatedly run it during visual iteration.

Run it at an appropriate milestone or when requested.

---

# 45. The standard decision hierarchy

When deciding how to implement something, prefer:

```text
1. Existing project pattern
        ↓
2. Native Next.js/React capability
        ↓
3. Existing project dependency
        ↓
4. Small custom implementation
        ↓
5. New dependency
        ↓
6. New architecture
```

Do not jump directly to #5 or #6.

---

# 46. The standard Client/Server decision

Ask:

```text
Does this need:
- browser API?
- state?
- event handler?
- client-only library?
- Effect for external synchronization?
```

If NO:

```text
→ Prefer Server Component
```

If YES:

```text
→ Create the smallest Client Component necessary
```

Remember:

> A component does not need to be Client Component simply because it contains JSX.

---

# 47. The standard implementation decision

For every requested UI feature:

```text
Understand request
      ↓
Inspect existing project
      ↓
Find reusable components
      ↓
Determine Server vs Client boundary
      ↓
Implement smallest appropriate change
      ↓
Add loading/error/empty states
      ↓
Check accessibility
      ↓
Check responsive behavior
      ↓
Check TypeScript/lint
      ↓
Stop
```

Do not continue refactoring indefinitely.

---

# 48. Definition of "production-ready"

A feature is production-ready when:

- it implements the requested behavior;
- it matches the intended design;
- it works responsively;
- it is accessible;
- it handles normal loading/error/empty states;
- it uses appropriate Server/Client boundaries;
- it is type-safe;
- it does not introduce unnecessary dependencies;
- it does not expose secrets;
- it does not contain obvious performance problems;
- it follows existing project conventions;
- it does not introduce unrelated changes;
- appropriate verification has been completed.

Production-ready does **not** mean:

- maximum abstraction;
- maximum number of tests;
- maximum number of libraries;
- maximum use of memoization;
- maximum documentation;
- maximum configuration;
- maximum token usage.

The goal is **high-quality software with the smallest reasonable complexity**.

---

# 49. Core principle

> **Make the browser do only what it needs to do.**
>
> **Make the server do what belongs on the server.**
>
> **Reuse what already exists.**
>
> **Keep components small and understandable.**
>
> **Do not add complexity without a reason.**
>
> **Preserve the requested design while improving the implementation.**
>
> **When an optional expensive check is not requested, suggest it instead of automatically spending tokens/time on it.**

---

## Official references

- Next.js Production Checklist: https://nextjs.org/docs/app/guides/production-checklist
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- React Rules: https://react.dev/reference/rules
- React Rules of Hooks: https://react.dev/reference/rules/rules-of-hooks
- React Hooks / Effects: https://react.dev/reference/react/hooks
- React `useMemo`: https://react.dev/reference/react/useMemo


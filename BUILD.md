# BUILD.md — How Brolife was built, and what it is

This document describes the **code that exists in this repository right now**. Proposals and
future work live in `IMPROVEMENTS.md`; anything marked *Not implemented* below is deliberately
absent from the current build.

---

## 1. Product intent

Brolife is an AI productivity companion with a distinct premise: a **"big-brother" persona** that
talks to you like a friend who wants you to win, wrapped around a **nightly alternation between
two focuses** — building a side hustle on Monday/Wednesday/Friday/Sunday, and health on
Tuesday/Thursday/Saturday. Everything in the UI reinforces that one idea: the header badge, the
dashboard card, the chat quick-starters, the smart timetable template, and the profile explainer
all read from the same `getCurrentFocus()` rule.

The target user is someone with a day job who wants to make progress on personal goals in the
evening and needs external structure to do it.

**Deliberate scope of this build:** a complete, self-contained frontend where every table, chart,
schedule and goal persists across reloads and where each screen works without a server. It is a
functional product shell — real state, real persistence, real CRUD — with one honest exception: the
chat's reply generator is rule-based rather than model-based (§5.1).

---

## 2. Architecture

### 2.1 Stack, and why

| Layer | Choice | Rationale |
|---|---|---|
| UI runtime | React 19 + TypeScript 5.5 | Component model fits the tab-heavy dashboard; types catch shape drift between storage and components |
| Build | Vite 5 with `@vitejs/plugin-react-swc` | Instant HMR for a UI-heavy build; SWC keeps refresh near-instant |
| Styling | Tailwind CSS 3.4 + CSS variables | Utility speed with a themable token layer, required for the light/dark switch |
| Components | shadcn/ui (Radix primitives + CVA) | Accessible dialogs, tabs, selects and sliders copied into the repo, so there is no runtime dependency on a component library version |
| Routing | `react-router-dom` 6 | Two routes only, but present so the app can grow; `*` catches bad URLs |
| Data fetching | `@tanstack/react-query` | Provider is mounted for future server data; today nothing fetches over the network |
| Persistence | `localStorage` behind a typed wrapper | Zero-infrastructure, instant reads, works offline; the whole app state is a few JSON blobs |
| Icons | `lucide-react` | Consistent stroke weight, tree-shakeable |
| Charts | `recharts` (available via `components/ui/chart.tsx`) | Kept in the design system; the current 7-day trends are hand-built divs for full styling control |

### 2.2 Runtime shape

`index.html` → `src/main.tsx` (`createRoot`) → `src/App.tsx`:

```
QueryClientProvider
└── TooltipProvider
    ├── Toaster
    └── BrowserRouter
        ├── "/"      → pages/Index.tsx   (the whole product)
        └── "*"      → pages/NotFound.tsx
```

`pages/Index.tsx` is the shell: header, tips banner, and a five-tab `Tabs` region. It owns the
user profile and the active tab, and passes the profile down to `ProfileSettings`; each tab body is
an independent component that reads and writes its own slice of storage.

```
Index (state: activeTab, userProfile, currentFocus, showWelcome, showTips)
├── WelcomeWizard ......... gate shown when no real name is stored
├── Dashboard tab
│   ├── welcome card + two CTA buttons
│   ├── "Today's Focus" card (from getCurrentFocus)
│   └── ProgressTrackers ... 4 trackers, weekly averages, 7-day trend bars
├── Chat tab .............. ChatAssistant
├── Schedule tab .......... TimetableGenerator
├── Goals tab ............. GoalManagement
└── Profile tab ........... ProfileSettings
```

### 2.3 Directory map

| Path | Purpose |
|---|---|
| `src/main.tsx` | Entry point; mounts `<App />`, imports global CSS |
| `src/App.tsx` | Providers, router, error route |
| `src/pages/Index.tsx` | Product shell: header, theme toggle, tips, tab orchestration |
| `src/pages/NotFound.tsx` | 404 route |
| `src/components/ChatAssistant.tsx` | Chat UI: message list, quick starters, typing state, response generator |
| `src/components/TimetableGenerator.tsx` | Half-hour time grid, slot CRUD, smart-schedule template |
| `src/components/ProgressTrackers.tsx` | Four trackers, sliders, suggestions, 7-day trend, weekly summary |
| `src/components/GoalManagement.tsx` | Goal CRUD, milestones, deadline countdown, motivational states |
| `src/components/ProfileSettings.tsx` | Name, companion name, theme, working hours, focus areas |
| `src/components/WelcomeWizard.tsx` | Four-step onboarding with progress bar |
| `src/components/ui/*` | shadcn/ui primitives (Radix wrappers) — untouched design system |
| `src/hooks/use-toast.ts` | Toast store and `useToast()` |
| `src/hooks/use-mobile.tsx` | Breakpoint hook for the responsive tab labels |
| `src/lib/storage.ts` | **The data layer**: types, storage keys, typed get/set per entity, utilities |
| `src/lib/utils.ts` | `cn()` — `clsx` + `tailwind-merge` |
| `src/index.css` | Tailwind layers and the CSS-variable theme tokens |
| `public/` | Favicon, `robots.txt`, source archive |
| `public/favicon.svg` | App icon |

---

## 3. Feature-by-feature implementation

### 3.1 Onboarding wizard (`WelcomeWizard.tsx`)

Four steps over local `useState`, with a `Progress` bar driven by `(step / 4) * 100`:

1. **Welcome / value framing** — three cards previewing chat, tracking and goals.
2. **Identity** — the user's name (`userName`).
3. **Companion naming** — `broName`, with one-tap suggestions (`Bro`, `Buddy`, `Champ`, `Chief`,
   `Coach`, `Ace`).
4. **Focus areas** — multi-select from six options (`health`, `learning`, `side-hustle`,
   `productivity`, `mindfulness`, `creativity`).

Completion persists the profile via `userProfileStorage.set()` and calls `onComplete`, which the
shell uses to swap the wizard out for the dashboard and fire a welcome toast. The gate is a
**sentinel check**: the shell opens the wizard when no profile name exists or it still equals the
placeholder `'Champion'`. That means onboarding shows for genuinely new users without a separate
`isOnboarded` flag, and a returning user with a real name goes straight in.

### 3.2 AI chat (`ChatAssistant.tsx`)

- Seeded with a persona-aware greeting interpolating `userName` and `broName`.
- **Quick starters** — four contextual buttons (set tonight's goals, plan the evening, "I need
  motivation", "what should I focus on?") that inject a fully-formed prompt, so the user never
  faces an empty box. Their prompt text already knows the current focus.
- Send path: append the user message, clear the input, set `isTyping`, then after
  `1500 + random()*1000` ms append the bot message. **Enter** sends, **Shift+Enter** is reserved for
  newlines; a send button covers touch.
- Auto-scroll on every message change via a bottom sentinel ref and `scrollIntoView({behavior:'smooth'})`.
- Rendering: user vs. bot bubbles, avatars, per-message timestamps, a pulsing "Online" badge and a
  focus badge in the header.

**Response engine (§5.1 covers the trade-off).** `generateBotResponse(text)` is a deterministic
classifier over lowercased keywords, with five branches — goals/targets, schedule/plan/time,
motivate/encourage/unmotivated, focus/productive/what-should, and a default. Branches produce
markdown-ish structured advice that is *focus-aware* (a side-hustle night gives project and client
work; a health night gives movement, meal prep and sleep). Motivation and default branches pick
randomly from four pre-written variants to avoid repetition.

### 3.3 Smart timetable (`TimetableGenerator.tsx`)

- **Time grid**: 35 half-hour slots enumerated literally from `07:30` through `00:30`, covering the
  product's 7:30 AM → 12:30 AM window with no gaps.
- **Slot model**: `{ id, time, activity, category, duration }` with five categories
  (`work`, `health`, `learning`, `personal`, `side-hustle`), each with a fixed colour used for the
  badge and the card accent.
- **CRUD**: add and edit through `Dialog`s (time select, activity input, category select, numeric
  duration clamped 15–480), delete via icon button. Every mutation writes through `saveSlots()`,
  which both sets component state and persists, so no optimistic/real divergence is possible.
- **Ordering**: after each add or update the array is re-sorted by `time.localeCompare`, which works
  because all times are fixed-width `HH:MM` strings.
- **Smart schedule**: `generateSmartSchedule()` replaces the day with a 13-block template that
  spans 07:30 → 23:30 — morning routine, breakfast, two deep-work blocks with a hydration break,
  lunch, afternoon work, learning, workout, dinner, the focus block, wind-down, sleep prep. The
  focus block's label and category come from `getCurrentFocus()` at generation time, so pressing the
  button on a Tuesday yields health and on a Wednesday yields side hustle.
- Empty state is a real call to action, not a placeholder.

### 3.4 Progress trackers (`ProgressTrackers.tsx`)

- Four domains in a typed union: `health`, `food`, `learning`, `goals`; values 0–100.
- **Today's record** is loaded by matching `formatDate(new Date())` against stored rows.
- **Editing** is explicit: an "Update Progress" button reveals `Slider`s (step 5). Each change calls
  `progressStorage.addDaily()`, which **upserts by date** — so a day can be revised all evening and
  still produce exactly one row.
- **Weekly window**: the last seven calendar days are materialised as a dense array, filling
  missing days with zeros. Dense fill is what makes the trend bars and averages honest — a skipped
  day shows as a gap in performance, not as a disappearing day.
- **Suggestions**: `getAISuggestion(category, value)` buckets into low (<40), medium (40–69) and
  high (≥70) with written copy per domain. Copy varies by domain *and* level, so the four cards
  never echo each other.
- **Visualisation**: per-tracker 7-day bars (height = value %) coloured by threshold, plus a weekly
  summary grid of four averages computed by `calculateWeeklyAverage()`.

### 3.5 Goal management (`GoalManagement.tsx`)

- Full CRUD on `Goal`: create and edit in dialogs, delete with an icon button.
- **Milestones** are dynamic rows — add/remove while creating or editing; empty rows are filtered
  out on save so no blank milestones persist.
- **Progress is derived, never typed**: `toggleMilestone()` recomputes
  `progress = round(completed / total * 100)`. One source of truth, and the progress bar cannot
  disagree with the checklist.
- **Deadline awareness**: `getDaysUntilTarget()` yields a signed day count; the badge switches
  between `outline` (plenty of time), `secondary` (≤7 days) and `destructive` (overdue, shown as
  "N days overdue").
- **State-driven encouragement**: `getMotivationalMessage(progress, daysLeft)` — 100%
  congratulation, then 80/60/40 bands, then a crunch-time message when under a week remains.
  Completed goals get a green border, tinted background and a trophy.

### 3.6 Profile (`ProfileSettings.tsx`)

- Local draft state with a **dirty flag**: the Save button appears only when something changed, and
  saving calls back into the shell, which persists and toasts.
- Fields: display name, companion name (with suggestions and a live preview line that quotes the
  persona), theme (light/dark), working hours (two `time` inputs), and focus areas (six tiles,
  toggleable, mirrored as badges).
- An explainer card documents the alternating-focus rule with the exact weekday split, so the
  system is discoverable rather than magic.

### 3.7 Shell, navigation and tips (`Index.tsx`)

- Sticky blurred header with gradient logo, greeting, focus badge, tips toggle and theme toggle.
- Five tabs (Dashboard, Chat, Schedule, Goals, Profile) with `lucide` icons; labels collapse to
  icons under `sm`, and every trigger is wrapped in a `Tooltip` so the collapsed state stays clear.
- Switching tabs fires a toast describing the destination — a lightweight orientation cue.
- The tips banner shows the current tab's tip from a single `tabInfo` map, so copy lives in one
  place instead of being scattered across components.
- Theme is applied imperatively: `document.documentElement.classList.toggle('dark', …)`, matching
  Tailwind's `darkMode: ['class']`.
- Dashboard composes the welcome card, two large CTA buttons and the focus card, then mounts
  `ProgressTrackers` — the dashboard is a composed view, not a second implementation.

---

## 4. Data flow and state

### 4.1 Storage layer (`src/lib/storage.ts`)

One module owns every type and every key. Five keys, all namespaced `brolife_*`:

| Key | Shape |
|---|---|
| `brolife_user_profile` | `UserProfile` (name, companion name, theme, preferences) |
| `brolife_goals` | `Goal[]` |
| `brolife_progress` | `ProgressData[]` (one row per date) |
| `brolife_chat_history` | `ChatMessage[]` (capped at 100) |
| `brolife_timetable` | `TimetableSlot[]` |

`storage.get/set/remove` are generic and **failure-tolerant**: reads catch parse errors and return
the caller's default, writes catch quota/private-mode errors and log instead of throwing. That is
why a corrupted or blocked `localStorage` degrades to an empty app rather than a white screen.

Each entity then gets a small typed façade — `userProfileStorage`, `goalsStorage` (with `add`,
`update`), `progressStorage` (with `addDaily` upsert), `chatStorage` (with `add` and trim),
`timetableStorage`. Components call these instead of touching `localStorage`, so schema changes have
exactly one place to change.

Utilities: `generateId()` (timestamp base36 + random suffix — collision-safe enough for local data,
no dependency), `formatDate()` (ISO `YYYY-MM-DD` for date keys), and `getCurrentFocus()`.

```ts
// the product's central rule
export const getCurrentFocus = (): 'side-hustle' | 'health' => {
  const day = new Date().getDay();          // 0 = Sunday
  return [1, 3, 5, 0].includes(day) ? 'side-hustle' : 'health';
};
```

### 4.2 State management

No global store. Three deliberate patterns:

1. **Load-on-mount, write-through**: components hydrate `useState` from storage in a `useEffect`
   with `[]` deps, and every mutation writes storage in the same handler. Because there is a single
   mounted consumer per slice (one tab body at a time), there is no stale-cache problem to solve —
   and no `zustand`/Redux indirection to maintain.
2. **Lift only what is shared**: the profile lives in `Index` because the header, chat, tabs and
   profile form all read it. The active tab lives there because the dashboard's CTA buttons must be
   able to change it. Everything else stays local to its component.
3. **Derive, don't store**: goal progress is computed from milestones, weekly averages from the
   dense 7-day array, the focus label from `getCurrentFocus()`. Nothing that can be computed is
   persisted.

### 4.3 Hooks

`use-toast.ts` is the shadcn toast reducer: a reducer with `ADD/UPDATE/DISMISS/REMOVE` actions, a
module-level listener set so any component can push a toast, and `TOAST_LIMIT = 1` so
notifications never stack into a wall. `use-mobile.tsx` exposes a media-query boolean used for
responsive behaviour. No custom data hooks: the storage façades are already thin and synchronous.

### 4.4 Composition and the UI system

Behaviour is composed from shadcn primitives rather than rebuilt: `Dialog` for every create/edit
form, `Select` for constrained choices (times, categories), `Slider` for 0–100 input, `Progress` for
bars, `Badge` for categorical colour, `Tabs` for navigation, `Tooltip` for discoverability,
`ScrollArea` for the chat, `Checkbox` for milestones. `cn()` merges conditional Tailwind classes,
which is how `getProgressColor()` and category colours are injected without string-concatenation
conflicts. Component-local colour maps (categories, thresholds) keep palette decisions next to the
data they describe.

---

## 5. Key implementation decisions and trade-offs

### 5.1 The chat is rule-based, not model-based — deliberately

`generateBotResponse()` is a keyword classifier, not an API call. **There is no Groq client, no API
key and no network request in this repository** (verified by scanning `src/` for provider names and
key patterns). The consequence is honest: replies are on-topic, focus-aware and instant, but not
open-ended.

Why ship it this way: an API key in a client-side bundle is a leaked key, and a chat that fails
offline is worse than one that always answers. The upgrade path is small and is the top item in
`IMPROVEMENTS.md` — replace the body of `generateBotResponse` with a server call, keep the message
model, typing indicator and error/retry handling, and put the key in a server-side environment
variable. The component's shape already supports it (the send path is already `async`).

### 5.2 Other trade-offs

| Decision | Trade-off accepted |
|---|---|
| `localStorage` as the only store | Instant, offline, zero cost — but per-device and lost on cache clear. Backend persistence is required before this is a product. |
| One page, tabs instead of routes | No URL deep-linking per feature; in exchange, tab switching is instant and state (chat scroll, drafts) survives navigation |
| Sentinels instead of explicit onboarding flags | No migration needed, but renaming the placeholder `'Champion'` would re-trigger the wizard |
| Fixed half-hour grid | Simple and predictable, but only half-hour granularity; the 7:30–00:30 window is hard-coded by design |
| Static smart-schedule template | Deterministic and testable, but it does not yet optimise against goals or actual completion rates |
| Derived progress only | Clean invariants, but milestones must exist for progress to move |
| No `framer-motion`, `zustand`, `date-fns`, `uuid`, `zod` usage | All are in `package.json` but unused by `src/`; Tailwind animations, local state and `generateId` cover the need. Pruning them would shrink the bundle further. |
| Design-system fonts | Uses the template's default stack; no custom font download |

### 5.3 Current limitations (accurate, not aspirational)

- Chat: no LLM; no streaming; no server-side history; the chat transcript is written to storage by
  `chatStorage` but the component keeps its own message list, so a reload starts a fresh greeting.
- Progress: manual 0–100 entry only — no passive/background measurement, no confidence intervals.
- Timetable: template generation and manual editing; no re-planning when a block slips, no
  cross-check against progress data.
- Goals: milestones and deadlines; no sub-goal decomposition, no velocity or risk prediction.
- No accounts, no multi-device sync, no sharing, no notifications, no voice.
- Accessibility: semantic structure, labelled controls and tooltips are in place, but there is no
  automated a11y test and no keyboard-focus audit beyond what Radix provides.
- No test suite (see §6.3).

---

## 6. Build, tooling and validation

### 6.1 Project setup

```bash
pnpm install            # dependencies (pnpm 8.10.0 pinned via packageManager)
pnpm run dev            # Vite dev server with HMR
pnpm run build          # production build → dist/
pnpm run preview        # serve the built output
pnpm run lint           # eslint --quiet ./src
```

Scripts live in `package.json`; `lint` runs ESLint 9 with `--quiet`, so only errors fail the run.
The dev server and the platform's preview both reload automatically on file changes — no restart
step is needed after editing.

### 6.2 Configuration that matters

- **`vite.config.ts`** — SWC React plugin for fast refresh, the `@` alias to `./src`, and
  `@metagptx/vite-plugin-source-locator` (prefix `mgx`) used by the development environment. The
  alias is why every import reads `@/components/...` instead of deep relative paths.
- **`tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`** — project references; the app
  config carries `strict` mode, bundler module resolution and the `@/*` path mapping that mirrors
  Vite's alias. TypeScript and Vite must stay in sync on that alias, or imports break in one and not
  the other.
- **`tailwind.config.ts`** — `darkMode: ['class']`, content globs covering `./src/**/*.{ts,tsx}`
  (plus template paths), CSS-variable-driven colour tokens (`background`, `primary`, `muted`,
  `card`, `sidebar`, …), token-derived radii, accordion keyframes, and the `tailwindcss-animate`
  + `aspect-ratio` plugins. `tailwindcss-animate` is what powers the `animate-in fade-in
  slide-in-*` tab transitions used throughout.
- **`src/index.css`** — Tailwind base/components/utilities plus the `:root` and `.dark` HSL variable
  blocks that make theme switching a class toggle with no re-render.
- **`postcss.config.js`** — Tailwind and autoprefixer only.
- **`components.json`** — shadcn/ui conventions (aliases, CSS variables, style), which is what keeps
  newly generated primitives consistent with the existing ones.
- **`eslint.config.js`** — flat config: `@eslint/js` recommended, `typescript-eslint`, React Hooks,
  React Refresh, browser globals.

### 6.3 Assets and packaging

- `public/favicon.svg` and `public/robots.txt` are served as-is; React 19 + Vite need no special
  asset plumbing for component-level imagery.
- `public/brolife-source.zip` is the downloadable source archive, regenerated so it mirrors the
  repository (see §7).
- Multi-page/deep-link hosting needs an SPA fallback to `index.html`; `BrowserRouter` routes are
  client-side only.

### 6.4 Validation performed

- `pnpm install` — lockfile in sync, 399 packages, no resolution step needed.
- `pnpm run lint` — no errors.
- `pnpm run build` — succeeded: 1,738 modules transformed, ~528 kB JS (164 kB gzip) and ~67 kB CSS
  (11.6 kB gzip). Vite warns that the main chunk exceeds 500 kB; that is expected for a
  component-library-heavy single-page app and is the trigger for route/tab-level code splitting
  once more features land.
- Repository contents verified by cloning the remote and counting files in the tree.

---

## 7. Repository, archive and delivery

- Git branch `main`; the tree contains 83 files: `src/` (66 files), `public/`, all build/TS/lint
  config, `README.md`, `.gitignore`, and these documents.
- `.gitignore` excludes `node_modules/`, `dist/`, `build/`, `*.tsbuildinfo`, caches (`.vite/`,
  `.cache/`, `.turbo/`, coverage), logs, and every `.env*` variant — so dependencies, build output,
  caches and secrets can never be committed by accident.
- **No secrets are present.** No `.env` file exists in the repo, no API key appears in source, and
  the application performs no outbound API calls. Any future key must arrive through a server-side
  environment variable, never through `import.meta.env` in a client bundle.
- `brolife-source.zip` is generated from the project root with exclusions for `node_modules`,
  `dist`/`build`, `.git`, caches and the archive itself, then copied into `public/` so the app can
  serve its own source.

---

## 8. Production hardening — what a next pass would change

1. **Backend + auth** — Postgres tables for profile, goals, milestones, progress days and timetable
   blocks, with row-level ownership; migrate the `storage.ts` façade to async calls so components do
   not change. Keep the same typed entity interfaces.
2. **Secrets and the real model** — move chat generation into a server function, hold the key
   server-side, add streaming, timeouts, retry and a graceful offline message.
3. **The precision engine** — append-only event log plus recomputable daily metrics (see
   `IMPROVEMENTS.md` §1.2). This is the largest genuine gap between the current build and the
   product's promise.
4. **Error handling** — `react-error-boundary` is already a dependency: wrap each tab so one
   failing feature cannot blank the shell; add a global `ErrorBoundary` around the router.
5. **Tests** — Vitest + Testing Library for the pure logic that already deserves coverage
   (`getCurrentFocus`, progress upsert-by-date, milestone-derived progress, weekly averages,
   `formatDate` across timezones), then Playwright for the onboarding → goal → schedule flow.
6. **Accessibility and performance** — automated a11y checks, visible focus rings on custom tiles,
   `aria-live` for chat and toasts, and route/tab-level `lazy()` splitting to address the chunk-size
   warning.
7. **Dependency hygiene** — remove the unused packages listed in §5.2 to cut install size and audit
   surface.

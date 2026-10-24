# Brolife — Improvement & Differentiation Plan

> **Status legend.** Everything in this document is a **proposal**. Nothing here is shipped in the
> current build (see `BUILD.md` for exactly what exists today). Each item is written so it can be
> turned into an engineering ticket without further design work.

Current baseline, for context: a browser-only React SPA where the "AI bro" chat is a deterministic
rule-based responder (`src/components/ChatAssistant.tsx`), all progress is self-reported on
0–100% sliders (`src/components/ProgressTrackers.tsx`), and every byte of state lives in
`localStorage` behind `src/lib/storage.ts`. The whole point of the ideas below is to move Brolife
from *"a tracker you have to remember to update"* to *"a companion that observes, computes and
speaks up on its own."*

---

## 1. How to make Brolife more unique

Brolife already has a genuine hook: an alternating nightly focus system
(side-hustle on Mon/Wed/Fri/Sun, health on Tue/Thu/Sat, implemented in `getCurrentFocus()`).
That single rule is the seed of a real identity — **a companion with a model of your week**.
The differentiators below all deepen that identity rather than adding unrelated features.

### 1.1 Voice activation — talk to Brolife, hands-free

Voice is the highest-leverage UX change: it removes the "open the app, find the slider, drag it"
friction that kills every habit tracker. Today the only input path is a text box
(`Input` + `handleKeyPress` in `ChatAssistant.tsx`).

**Scope (four layers, independently shippable)**

| Layer | Behaviour | Notes |
|---|---|---|
| Push-to-talk | Hold the mic button → stream audio → transcript lands in the chat input | Simplest, no wake-word model, works on desktop and Android Chrome |
| Wake word | "Hey Bro" (configurable to the user's `broName`) starts listening | Runs fully on-device; no audio leaves the browser until the word matches |
| Speech output | Bot replies are spoken with the companion's voice | Barge-in support: speaking stops when the user starts talking |
| Daily briefing | 60–90 s hands-free morning/evening summary: focus, open goals, at-risk blocks | Generated from real numbers, then spoken — this is where Brolife feels alive |

**Technically fitting APIs / models**

| Concern | Option | Why |
|---|---|---|
| Speech → text | Web Speech API (`SpeechRecognition`) | Zero cost, zero keys, Chrome/Edge/Android support; ideal for push-to-talk |
| Speech → text (portable) | OpenAI `whisper-1` / `gpt-4o-transcribe`, or Deepgram Nova | Needed for Safari/Firefox and for noisy rooms; server-side keeps keys out of the bundle |
| Wake word | Porcupine (Picovoice) or `openWakeWord` compiled to WASM | On-device, ~1 MB, custom keyword |
| Text → speech | Browser `SpeechSynthesis` (instant, free) → ElevenLabs / OpenAI TTS for a consistent persona | Start free, upgrade for a branded voice |
| Conversation | Groq-hosted Llama (see §1.4) with a strict JSON tool-calling schema | Sub-second latency matters far more for voice than for text |

**Design rules that keep it from becoming a gimmick**

1. Every spoken utterance must also be visible on screen (accessibility, quiet environments).
2. Voice capture never blocks the UI; transcription failures degrade to text silently.
3. Wake-word audio is discarded unless the wake word fires — a privacy promise you can state.
4. Speaking rate and voice are profile settings next to `broName`.

*Effort:* M (push-to-talk + TTS), L (wake word + briefing). *Impact:* very high — it is the single
most demoable, most memorable thing Brolife could do.

---

### 1.2 Mathematical background tracking — precision instead of sliders

This is the differentiating *engine*. Instead of trusting one 0–100 slider per day, Brolife keeps a
**state estimate per domain** with an explicit uncertainty, updates it continuously from every
signal it can observe, and reports the estimate *with a confidence band*.

#### 1.2.1 State and observation model

Let the tracked state at the end of day *t* be

```
x_t = [ h_t, s_t, n_t, l_t, g_t ]ᵀ        each component ∈ [0, 1]
```

| Symbol | Domain | Primary observations |
|---|---|---|
| `h` | Health / movement | step count, workout log, block completion |
| `s` | Sleep | bedtime, wake time, sleep duration |
| `n` | Nutrition | meal logs, protein/veg flags, water |
| `l` | Learning | minutes studied, milestones, sessions |
| `g` | Goal progress | milestone completions, deadline pressure |

Observations arrive asynchronously and with different reliability:

```
z_t = H·x_t + v_t ,    v_t ~ N(0, R_t)
```

`R_t` is a **per-source reliability matrix**. A wearable sync gets a small variance; a manual slider
gets a large one. Concretely, with a reliability score `ρ ∈ (0,1]` per source:

```
R_t = diag( σ₀² / ρ_source )        σ₀² = 0.09   (≈ 30% daily swing = 1σ)
```

#### 1.2.2 Discrete-time update — Kalman form

Prediction (state persists, decays toward the personal baseline `μ`):

```
x̂_t⁻ = F·x̂_{t-1} + (I − F)·μ
P_t⁻  = F·P_{t-1}·Fᵀ + Q

F = diag(f) ,  f_i = exp(−Δt / τ_i)     τ_health = 3 d, τ_sleep = 2 d,
                                        τ_nutrition = 2 d, τ_learning = 5 d, τ_goals = 10 d
Q = diag(q) ,  q_i = 0.02               process noise: habits drift
```

Correction (only for the domains that actually produced an observation this tick):

```
K_t   = P_t⁻·Hᵀ·(H·P_t⁻·Hᵀ + R_t)⁻¹
x̂_t   = x̂_t⁻ + K_t·(z_t − H·x̂_t⁻)
P_t   = (I − K_t·H)·P_t⁻
```

Because `H` is a selection matrix (one row per observed domain), the whole thing collapses to a
scalar update per domain — cheap enough to run on every event, even in a browser tab.

**Fallback without a full matrix:** the same behaviour is approximated by a time-aware EMA whose
coefficient is derived from the elapsed gap, so a 6-hour-late observation counts less than a fresh one:

```
α_t = 1 − exp(−Δt / τ_i)
ŝ_t = α_t·z_t + (1 − α_t)·ŝ_{t-1}
```

This is the version to ship first; the Kalman form is the upgrade once multiple sources exist.

#### 1.2.3 Composite daily score with weights

One number the user can trust, computed from the state vector:

```
D_t = Σ_i w_i · φ(x̂_i) ,    Σ w_i = 1
```

* `φ` is a saturating curve so 60→70 never feels worth more than 90→100:
  `φ(x) = x^0.85` (concave) is enough; use `1 − exp(−3x)` if you want a hard ceiling.
* Weights come from the profile's `preferences.focusAreas` (already stored today) via softmax, then
  renormalised, so "side hustle + learning" actually changes the number:

```
w_i = exp(β·a_i) / Σ_j exp(β·a_j)      β = 2.0 ,  a_i = declared emphasis (0 if not selected)
```

* On an alternate-focus night, the night's focus domain gets a `w_i × 1.35` boost before
  renormalisation — this makes the existing Mon/Wed/Fri rule *mathematically* meaningful.

#### 1.2.4 Confidence intervals and error bounds

Every reported number ships with an interval, never a bare percentage:

```
σ_i = √(P_t)ᵢᵢ            CI₉₅(x_i) = x̂_i ± 1.96·σ_i
```

With the EMA fallback, `σ` is tracked analytically:

```
σ_t² = α_t²·σ_obs² + (1 − α_t)²·σ_{t-1}²
```

**Bounded-error property (worth stating in the UI):** for observations bounded by `ε_max` and a
fixed `α`, the steady-state estimation error of the EMA is bounded by

```
|ŝ − x| ≤ 2·α·ε_max / (2 − α)
```

so a user who under-reports by at most 20 points can never be more than ~22 points off at `α = 0.5`.
That turns "we're pretty accurate" into a claim with an actual number behind it.

#### 1.2.5 Drift and bias correction

Self-reports drift systematically: people over-report learning on busy days and under-report
nutrition on weekends. Detect it from the residuals and remove it:

```
r_t = z_t − H·x̂_t⁻            (innovation)
b_i ← b_i + γ·r_t_i           γ = 0.05      (slow-moving bias term, per domain, per weekday class)
```

Rebuild post-hoc with `x̂ ← clip(x̂ + b, 0, 1)`. Report the bias back to the user ("your Sunday
nutrition logs run ~12 points high") — that is a *unique* feature no habit app ships.

#### 1.2.6 Derived metrics

Computed from the reconciled state, not from raw logs:

| Metric | Formula | Reads as |
|---|---|---|
| Adherence rate | `A = completed_blocks / planned_blocks` over a rolling 7/28-day window | "You finish 78% of what you plan" |
| Rolling mean | `μ_w = (1/w)·Σ x̂_{t−k}` | Smooth trend line |
| Volatility | `EWMA variance: V_t = λV_{t−1} + (1−λ)(x̂_t − μ_t)²`, λ = 0.94 | Consistency, not just average |
| Streak (decayed) | `S_t = 1 + λ_s·S_{t−1}` on success, `λ_s = 0.8`, reset on miss | Forgives one bad day without zeroing a 40-day streak |
| Recovery time | days from a below-threshold day back to baseline | "You bounce back in 2 days" |
| Goal velocity | `d(progress)/dt` vs. required velocity `(100 − p)/(days_left)` | Early warning on at-risk goals |
| Load balance | share of minutes per category vs. declared focus weights | "Your health share fell 18% this week" |

The **goal velocity vs. required velocity** comparison is the killer metric: it predicts failure
weeks before a deadline instead of celebrating a progress bar that was never going to close.

#### 1.2.7 Background recomputation — idempotent by construction

The precision work must never be blocked by a UI render, and must be reproducible.

1. **Append-only event log.** Every signal is an immutable event:
   `{ id (uuid), user_id, kind, domain, value, occurred_at, source, reliability }`.
   Nothing is ever updated in place; corrections are new events.
2. **Deterministic projection.** Metrics are a pure function of
   `(events, metric_version, tz)`. Same inputs → same output, always.
3. **Idempotent upsert.** Writes go to `daily_metrics` keyed
   `UNIQUE(user_id, local_date, metric_version)` with `ON CONFLICT … DO UPDATE`. Re-running a
   worker for a day is a no-op in effect, so retries and backfills are safe.
4. **Watermarks + hashing.** A worker processes events where `occurred_at > watermark`; it stores
   `input_hash = sha256(sorted event ids)` so it can skip days whose inputs did not change.
5. **Dirty-day fanout.** A late event recomputes only its own day plus the 28 days that depend on it
   (rolling windows), not the whole history.
6. **Scheduling.** Client: `requestIdleCallback` + on-visibility-change. Server: a nightly cron per
   timezone band, plus an on-write trigger for "today". Nightly is for *aggregates*, never for
   correctness — the day's value is always recomputable.
7. **Observability.** Each run records `rows_touched`, `duration_ms`, `metric_version`; a mismatch
   between a client-computed and server-computed day is a bug signal, not a silent drift.

*Effort:* L. *Impact:* very high — this is the "precision and perfection" claim made real, and it
is the moat: competitors store logs, Brolife stores *estimates with error bars*.

---

### 1.3 Other differentiators (ranked by uniqueness ÷ effort)

**Adaptive re-planning when a block slips.** Today, if a 09:00 deep-work block slides 40 minutes,
every later block is silently wrong. Proposed: on block completion/miss, re-solve the remainder of
the day by greedy insertion against remaining minutes and priority — push flexible blocks
(`personal`, `learning`), protect fixed ones, and *tell* the user what moved. Effort M, impact high;
it is the difference between a plan and a schedule.

**Circadian / energy-aware scheduling.** Place high-cognitive work in the user's personal peak
window, learned from when deep-work blocks are actually completed (not self-declared "I'm a morning
person"). Learned peak hour ∝ argmax of completion rate by hour, with a Beta prior. Effort M,
impact high, and it composes with the Kalman state.

**Predictive reminders (quiet by default).** Fire only when the model says a target is at risk:
`P(goal_missed) > 0.6` given current velocity, or `x̂_health` trending below baseline for 3 days.
Probability comes from the velocity distribution already computed. Effort S–M, impact high.

**Compound-goal decomposition.** Turn "get fit" into 4–6 milestones with dates using the chat model,
then let goal velocity police it. Today milestones are typed by hand. Effort M, impact medium-high.

**Weekly AI review with evidence.** A Sunday digest that cites its own numbers: adherence 78%,
volatility down 12%, the one domain that slipped, and one concrete change for next week. Never
generic praise. Effort S once metrics exist.

**Offline-first sync + auth.** Local-first writes, background push, conflict resolution
last-write-wins per field with an event log for audit. Effort L, impact medium (enabler).

**Privacy-first posture as a feature.** "Wake word and state estimation run on-device; only the
numbers you approve leave your browser." Effort S, impact medium — and it is honest, given the
architecture.

---

## 2. Prioritised roadmap

| Priority | Feature | User value | Effort | Depends on |
|---|---|---|---|---|
| **Now** | `.env`-based Groq chat (replace `generateBotResponse`) | Turns the demo assistant into a real one | S | — |
| **Now** | Event log + `daily_metrics` + EMA state engine | Foundation for every precision claim | M | — |
| **Now** | Derived metrics: adherence, rolling mean, volatility, goal velocity | Immediately visible "smart" numbers | S | Event log |
| **Now** | Adaptive re-planning of remaining day | Fixes the biggest broken promise (stale schedules) | M | Existing timetable model |
| **Now** | Push-to-talk + spoken replies (Web Speech API) | Hands-free capture, zero cost | M | — |
| **Next** | Backend persistence + auth (Postgres, per-user rows) | Multi-device, no data loss | L | — |
| **Next** | Wake word ("Hey Bro") + hands-free daily briefing | Signature demo moment | M | TTS, metrics |
| **Next** | Circadian peak-window scheduler | Schedule that fits the person | M | Completion events |
| **Next** | Predictive at-risk reminders | Prevents misses instead of reporting them | S | Goal velocity |
| **Next** | Bias/drift correction surfaced to the user | Unique, trust-building insight | M | Kalman/EMA history |
| **Later** | Kalman multi-source fusion (wearable, calendar) | True precision with real sensors | L | Event log, backend |
| **Later** | Compound-goal decomposition via LLM | Onboarding depth | M | Chat API |
| **Later** | Weekly AI review with evidence | Retention loop | S | Metrics |
| **Later** | Offline-first sync + conflict resolution | Reliability | L | Backend |
| **Later** | On-device wake word + local inference | Privacy differentiator | L | Wake word |

Sequencing note: **event log → metrics → adaptive re-planning** is the spine. Voice and the LLM
chat are independent and can ship in parallel; both become far better once metrics exist, because
the assistant can then answer "how consistent was I this week?" with a real number.

---

## 3. Data model and schema additions

### 3.1 Client (extends `src/lib/storage.ts`)

```ts
export interface TrackEvent {
  id: string;
  kind: 'progress' | 'block_done' | 'block_missed' | 'goal_milestone' | 'voice_capture';
  domain: 'health' | 'sleep' | 'food' | 'learning' | 'goals';
  value: number;          // normalised 0..1
  occurredAt: string;     // ISO
  source: 'manual' | 'wearable' | 'voice' | 'derived';
  reliability: number;    // (0,1]
}

export interface DailyMetric {
  localDate: string;                  // YYYY-MM-DD in the user's tz
  metricVersion: number;              // bump to force recompute
  state: Record<string, number>;      // h, s, n, l, g
  sigma: Record<string, number>;      // per-domain std-dev
  score: number;                      // D_t
  adherence: number;                  // 0..1
  volatility: number;                 // EWMA variance
  streak: number;                     // decayed
  inputHash: string;                  // skip recompute when unchanged
  computedAt: string;
}
```

New storage key `brolife_events` (append-only array, cap by days not count) and
`brolife_metrics` (keyed by `localDate`). Both are pure caches — deleting them loses no source data.

### 3.2 Server (Postgres)

```sql
create table track_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  domain text not null check (domain in ('health','sleep','food','learning','goals')),
  value numeric not null check (value >= 0 and value <= 1),
  occurred_at timestamptz not null,
  source text not null default 'manual',
  reliability numeric not null default 0.6,
  created_at timestamptz not null default now()
);
create index on track_events (user_id, occurred_at desc);

create table daily_metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  metric_version int not null default 1,
  state jsonb not null,
  sigma jsonb not null,
  score numeric not null,
  adherence numeric,
  volatility numeric,
  streak int,
  input_hash text,
  computed_at timestamptz not null default now(),
  primary key (user_id, local_date, metric_version)
);

create table voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript text,
  intent text,               -- e.g. 'log_progress', 'reschedule', 'briefing'
  confidence numeric,
  created_at timestamptz not null default now()
);

create table goal_predictions (
  goal_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  velocity numeric,          -- progress points / day
  required_velocity numeric,
  miss_probability numeric,  -- 0..1
  computed_at timestamptz not null default now()
);
```

Existing `goals`, `progress`, `timetable` shapes map over directly; `milestones` becomes a child
table (`goal_milestones`) once server-side, and `timetable_blocks` gains
`planned_start`, `planned_minutes`, `actual_start`, `actual_minutes`, `status`.

---

## 4. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Precision claims that the data cannot support | Always render `± 1.96σ`; never show a score without its interval; publish the bounded-error formula |
| Sparse data → confident nonsense | Hard rule: below 3 observations in a 7-day window, show "not enough signal" instead of a number |
| Spurious "AI insight" | Insights must cite the underlying metric and window; no insight ships without a number attached |
| Voice misrecognition logging the wrong value | Confirm destructive voice actions (logging, rescheduling) with a 1-tap undo card |
| Wake word always-listening privacy concern | On-device detection, audio discarded unless the word fires, explicit toggle, documented in the UI |
| LLM key exposure | Key lives server-side (edge function); the browser never holds it |
| Background worker drift / double counting | Append-only events + `input_hash` + idempotent upsert + deterministic projection; recompute is always safe |
| Timezone off-by-one on "today" | Store `local_date` computed from the user's tz, never the server's |
| Notification fatigue | Predictive reminders capped at 2/day and only above the risk threshold |
| Over-engineering before validation | The EMA fallback ships first; Kalman only when a second source actually exists |

### Success metrics (KPIs) per feature

| Feature | Primary KPI | Target |
|---|---|---|
| Real LLM chat | % sessions with ≥3 turns; answer helpfulness ≥4/5 | ≥40% of DAU; ≥4.0 |
| Event log + metrics | % of days with a computed `daily_metrics` row | ≥95% |
| Adherence / velocity | User opens the metric card ≥3×/week | ≥50% of WAU |
| Adaptive re-planning | % of slipped days where remaining blocks were re-planned; blocks completed after re-plan | ≥80%; +15% completion |
| Push-to-talk | % of logs created by voice; transcription edit rate | ≥25%; <10% |
| Wake word + briefing | Briefing plays ≥4×/week; hands-free retention | ≥30% of users; 7-day retention +8 pts |
| Circadian scheduler | Deep-work blocks completed in the learned peak window | +10 pts vs. baseline |
| Predictive reminders | Precursor misses prevented (at-risk goal met by deadline) | ≥20% of flagged goals |
| Bias correction | Mean absolute residual reduction after correction | ≥30% |
| Weekly review | Open rate; next-week plan acceptance | ≥45%; ≥30% |

---

## 5. What "unique" means, in one paragraph

Most habit apps are **forms plus streak counters**: you report, they store. Brolife's opportunity is
to be a **model of you**: a state estimate with error bars that gets sharper every day, a schedule
that re-solves itself when life slips, and a companion that can *say* — out loud, hands-free —
"your health trend is down 12% and your Sunday nutrition logs run 12 points high, so here is the
only two things worth doing tonight." Voice is the interface; the mathematics is the substance;
the alternating-focus identity is the reason the two feel like one product.

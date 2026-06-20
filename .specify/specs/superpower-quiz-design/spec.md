# Spec: Superpower Quiz Design

## Purpose

Define a **deterministic, offline-capable, anti-extractive quiz** that assigns a
player one of **7 superpowers** (Connector · Strategist · Disruptor · Storyteller
· Alchemist · Escape Artist · Coach) plus an **orientation** (internal/external),
feeding the [`mobility-quest-superpower-campaign`](../mobility-quest-superpower-campaign/spec.md)
intake. This spec exists to **scope the quiz so it doesn't go wild** — a small,
honest instrument grounded in psychometric evidence, not a sprawling personality
engine.

**Problem**: A type quiz is easy to build badly. The levers that make quizzes feel
accurate — flattery, authority cosplay, faux-personalization, hard binning — are
exactly the **Barnum/dark-pattern** moves a values-driven, AI-wary community
rejects. We need a quiz that is *evidence-based, falsifiable, dignified, and
deterministic*, not a "our AI divined your soul" toy.

**Practice**: Deftness Development — spec kit first, API-first, **deterministic
over AI**. The item bank and scoring are authored data + pure functions; no model
required. Dual-track / Portland-AI-allergy first-class.

> **Evidence base:** [RESEARCH_quiz-construction.md](./RESEARCH_quiz-construction.md)
> (deep-research, 2026-06-20). Every Design Decision below cites it.

## Design Decisions

| Topic | Decision (← research) |
|-------|------------------------|
| **Score continuous, label discrete** | Keep an internal continuous score per superpower; resolve to a type only at the end. Type labels flip on retest (~39–76% for MBTI) because of **binning**, not bad items — so never output a lone hard label. (§3 v1–v3,v5) |
| **Primary + secondary, with margin** | Always report a **primary + secondary** superpower and the **margin** between them (as a band/%). Below a confidence threshold, present them as a near-tie. (§2, §3) |
| **Quasi-ipsative forced-choice, behavioral** | Items are **situational "what would you do"** forced-choice; options are **not equally desirable**; each option weights one or more superpowers. Reduces acquiescence/social-desirability bias and breaks single-axis dominance. Avoid pure ipsative (inflates ties, cripples validation) → normalize by item count. (§1 [1-5], §2) |
| **Item count vs UX tension — resolved by multi-weighted options** | Psychometrics wants ≥3–4 signals/type (~21–28); UX wants ≤~10 Q / 2–3 min. Resolve: each forced-choice **option carries weight for multiple superpowers**, so **~12 questions** yield ≥3–4 signals/type. (§1 [9-11], §5 [u1-u3]) |
| **Deterministic scoring + tie-break** | Additive per-type → **normalize percent-of-max** → rank all 7 → `margin = top − second`. Near-tie → present both (optional deterministic pairwise tiebreak item). Exact tie → **fixed ordered chain, never random**. (§2) |
| **Fixed-length default** | Fixed 12-item form (deterministic, explainable, offline). Optional **rule-based early-stop** later (terminate when lead > max remaining), never IRT/CAT. (§2 [13-score,15-score]) |
| **Refuse Barnum levers** | Descriptions are **behavioral/contextual, falsifiable, differentiated** (a wrong type should be rejectable); **include each superpower's real shadow** (overuse/avoidance from its Strategy Guide) so favorability isn't equalized; **no two-sided hedges**, **no authority cosplay**, **no faux-personalization**. (§4 b1-b14) |
| **Result is a lens, taker is authority** | Frame as a **time-bound snapshot**, invite disagreement ("Does this fit? try the adjacent one"), **disclose the mechanism** ("computed from 12 questions; a lens, not a verdict"), **never label/limit/gate**. (§4 b8-b11) |
| **No dark patterns** | **No email/signup gate before results** (show first, offer capture after); no confirmshaming; affirmative opt-in; symmetric opt-out; mobile-first; accessible (labels, keyboard, focus). Narrative **heist** framing (Wendell voice) for intrinsic motivation. (§5 u6-u15) |
| **Orientation captured, not scored** | The internal/external **orientation** is a separate dimension (the addendum's polarity = `MoveAspect` inner/outer), surfaced as its own question/toggle, not blended into superpower scoring. |
| **Coach handled honestly** | Coach now has a full **[Coach Strategy Guide](./coach-strategy-guide.md)** matching the other six (authored in the Strategist's POV). Coach = softened Disruptor, **Fire (Frustration→Triumph)**, the integrator of the other six aimed at a person's agency; helps people abandon an outgrown level + its story. Shadows: the Taskmaster (overuse) / the Empty Cheerleader (avoidance). |

## Conceptual Model

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player taking the quiz → revealed `Superpower` + `orientation` (per-campaign) |
| **WHAT** | The quiz item bank + deterministic scoring/assignment |
| **WHERE** | Drives the campaign superpower intake (`cyoa-intake` / ECI `superpowerWeights`) |
| **Energy** | n/a directly (a discovery surface, not a contribution surface) |
| **Personal throughput** | Result maps to the 5 WAVE moves via each superpower's Wake/Clean/Grow/Show framing (from the guides) |

### Item shape (authored data)

```ts
interface QuizOption {
  id: string
  label: string                                   // behavioral, in Wendell's voice
  weights: Partial<Record<Superpower, number>>    // quasi-ipsative; multi-type ok
}
interface QuizItem {
  id: string
  situation: string                               // "what would you do" prompt
  options: QuizOption[]                            // forced-choice (pick one)
}
interface OrientationItem { id: string; prompt: string /* internal vs external */ }
```

### Scoring (pure function)

```ts
interface QuizResult {
  ranked: { superpower: Superpower; pct: number }[]  // all 7, percent-of-max
  primary: Superpower
  secondary: Superpower
  margin: number            // primary.pct − secondary.pct
  confident: boolean        // margin >= CONFIDENCE_THRESHOLD
  orientation: SuperpowerOrientation
}
function scoreQuiz(answers: QuizAnswer[]): QuizResult   // deterministic, offline
```

## API Contracts (API-First)

- **Pure lib** (`src/lib/superpowers/quiz/{items,score}.ts`): `scoreQuiz` + the
  authored item bank. No I/O.
- **Bridge**: `scoreQuiz` output maps to the campaign spec's
  `SuperpowerRoutingResult` (`superpower` = primary, `orientation`); secondary +
  margin carried for the reveal. No new persistence here (the campaign spec owns
  per-campaign storage).
- **No Route Handler / external surface** in this spec.

## User Stories

### P1: An honest result
**As a quiz-taker**, I want a primary + secondary superpower with a visible
confidence margin and each type's shadow, so the result feels like an honest lens,
not flattery.
**Acceptance**: result shows ranked top-2 + margin band; descriptions include the
overuse/avoidance shadow; no two-sided hedges; a foreign type's description is
A/B-distinguishable from one's own (Barnum check).

### P2: Dignified, no dark patterns
**As an AI-wary community member**, I want to see my result **without** an email
gate, with the mechanism disclosed and myself as the final authority.
**Acceptance**: results render before any capture ask; "how this works / what it
can't tell you" present; "Does this fit? try the adjacent one" affordance; no
confirmshaming; WCAG-accessible.

### P3: Deterministic & offline
**As an engineer**, I want `scoreQuiz` to be a pure, reproducible function with a
fixed tie-break, so results never depend on a model or randomness.
**Acceptance**: same answers → same result; ties resolved by fixed ordered chain;
unit-tested incl. exact-tie and near-tie cases.

### P4: Verification quest
A Twine cert that walks a tester through taking the quiz and seeing a primary +
secondary + shadow, framed toward the fundraiser.

## Functional Requirements

### Phase 1 — Item bank + scoring (pure, no I/O)
- **FR1**: Author a **~12-item** forced-choice situational bank + a small set of
  candidate items (over-generate ~3–4×, trim) so each superpower gets ≥3–4 signals;
  options quasi-ipsative, multi-weighted; copy in Wendell's voice. Items derived
  from each Strategy Guide's "Signs Someone Needs an X" + shadows + element/emotion
  (Coach from addendum).
- **FR2**: `scoreQuiz` — additive → percent-of-max normalization → rank all 7 →
  margin → confident flag → primary/secondary; **fixed ordered tie-break**.
- **FR3**: Orientation item(s) → `orientation`, captured separately.
- **FR4**: Unit tests: determinism, exact-tie chain, near-tie (margin < threshold),
  item-count normalization, every superpower reachable.

### Phase 2 — Result descriptions (authored copy)
- **FR5**: Authored, **falsifiable, behavioral** descriptions per superpower
  including its **shadow**; no two-sided hedges; no equalized favorability.
- **FR6**: Result framing copy: lens-not-verdict, mechanism disclosure, "taker is
  authority / try the adjacent one." A **Barnum self-check** doc: confirm a foreign
  type's description is distinguishable.

### Phase 3 — Wire into the campaign intake (owned by the campaign spec)
- **FR7**: Map `QuizResult` → `SuperpowerRoutingResult`; render reveal with
  primary + secondary + margin band + shadow (UI_COVENANT). No email gate.
- **FR8**: Verification quest `cert-superpower-quiz-v1` (Twine + idempotent seed),
  fundraiser-framed.

## Non-Functional Requirements
- **Deterministic / offline**: item bank + `scoreQuiz` are data + pure functions;
  AI never required (optional flavor only, behind `aiEnabled()`).
- **Accessible**: WCAG 2.1 — programmatic labels, keyboard, focus on error, DOM
  order = visual order; mobile-first.
- **Ethical**: no Barnum levers, no dark patterns; results never label/limit/gate.
- **Bounded scope**: 12 items, 7 types, 1 orientation axis. Expanding the item bank
  or adding types is a deliberate follow-up, not creep.

## Out of Scope
- Adaptive/IRT/CAT scoring (deterministic rule-based early-stop only, if ever).
- Statistical validation pipeline / norming against a population.
- Persisting results (the campaign spec owns per-campaign storage).
- A Coach Strategy Guide (content follow-up tracked in the campaign spec).

## Verification Quest
- **ID**: `cert-superpower-quiz-v1`
- **Steps**: take the 12-item quiz → see primary + secondary + margin + shadow →
  read the mechanism disclosure → confirm "try the adjacent one" works.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/).

## Open Questions
1. **Confidence threshold value** — start ~10% of scale (≈"3–4 pts"); tune after a
   small pilot. (§2)
2. **Pairwise tiebreak item** — include a deterministic disambiguation question for
   near-ties, or just present both? Lean: present both; add tiebreak only if pilots
   show frequent near-ties.
3. **Progress indicator** — research is mixed; A/B or omit for a 12-item quiz.
   (§5 u4-u5)

## Dependencies / References
- Parent: [`mobility-quest-superpower-campaign`](../mobility-quest-superpower-campaign/spec.md)
  (consumes the result; owns persistence + reveal UI).
- Canon: six Superpower Strategy Guides + Outlines (Drive); addendum (Coach).
- Evidence: [RESEARCH_quiz-construction.md](./RESEARCH_quiz-construction.md).
- Verification: [cyoa-certification-quests](../cyoa-certification-quests/).

# Spec: Lenses Goal-Setting Onboarding

## Status

Product/spec update after hostile review plus Claude Design handoff. This replaces the over-narrow "Daily Lenses inside Tap the Vein only" framing and incorporates the prototype decisions in `design-handoff/`.

## Purpose

Create a humane Lenses process where a new player moves from a vague sense of what they are moving toward into a year-level goal frame across five domains:

- Relationships
- Career
- Money
- Health
- Allyship

The process should align with the Fasttrack/Lenses planning document, borrow lightly from Wishcraft-style imagining, use the player's Allyship Superpower as a reflection lens, and connect every lower-level goal/task back to the goal one lens higher.

Tap the Vein remains the daily execution surface. Lenses onboarding is the upstream imagining and goal-setting surface.

## Product Ruling

Lenses has two related but distinct jobs:

1. **Goal imagining and setting**: a new-player onboarding process that creates yearly, quarterly, monthly, and weekly domain goals.
2. **Daily execution**: Tap the Vein uses the active weekly/monthly lens frame to brainstorm and keep up to five actions for the day.

The earlier rule that "there are no other player-facing Daily Lenses features" was too narrow. The corrected rule is:

- Do not create a separate **daily** planning workflow outside Tap the Vein.
- Do create a Lenses goal-setting onboarding process upstream of Tap the Vein.

## User Flow

### 1. Superpower First

When possible, Lenses begins after the superpower quiz.

If the player has no superpower result, offer the quiz first or allow a temporary "choose what sounds most like you" fallback.

The superpower is not destiny. It can shape prompts, examples, and reflection language, but the player's own dreaming and distillation is the source of record.

### 2. Vague Movement

The player starts with a vague movement statement:

- "What are you moving toward?"
- "What would feel different if this year worked?"
- "What would make you feel more alive, settled, connected, free, proud, generous, or clear?"

This keeps the first step humane. It does not begin with metrics.

### 3. Ten-Minute Workshop Loop

The player spends about ten minutes in each active domain/cadence, using the same humane authoring loop:

```text
free-write -> make up to 10 options -> keep up to 5 -> lock in
```

The timer is ambient. It must not block the player, auto-advance, shame them, or imply they failed if they need more or less time.

For the yearly pass, the workshop runs across all five domains:

- Relationships
- Career
- Money
- Health
- Allyship

This is the Wishcraft-aligned part: before narrowing to goals, the player gets permission to dream, name desire, and let images surface without immediate feasibility policing.

Prompt shape:

- Relationships: "Who are you with? What is the quality of contact?"
- Career: "What are you making, practicing, selling, serving, or becoming known for?"
- Money: "What flow of income, stability, generosity, or receiving would change your life?"
- Health: "What body, energy, rhythm, and practice would carry you?"
- Allyship: "Who is better off because you showed up?"

### 4. Authored Goal Options

For each domain, the player turns their writing into up to ten candidate goal options, then keeps up to five.

The app may offer deterministic prompt examples or superpower-shaped seed language based on:

- the player's superpower,
- the vague movement statement,
- the dream notes,
- the domain.

Examples:

- Connector + Relationships: "Build a weekly repair/check-in ritual with the person you most want to grow with."
- Storyteller + Career: "Publish a body of work that makes your central message legible."
- Strategist + Money: "Build a simple, trackable income system that makes the next step obvious."
- Coach + Allyship: "Create a recurring dojo where people practice leaving old levels behind."

These are seeds, not generated marching orders. The product should not depend on LLM goal generation. The player must be able to write, edit, reject, or park every option.

### 5. Yearly Domain Goals

The player leaves the first pass with an authored year frame across the five domains:

- Relationships
- Career
- Money
- Health
- Allyship

Each active domain should have at least one kept yearly goal and may keep up to five. A domain can also be parked without red/failure language.

Each yearly goal requires:

- title,
- domain,
- satisfaction payoff,
- optional metric,
- optional story/imagery,
- superpower suggestion source,
- status: active, parked, draft, or complete.

### 6. Quarterly, Monthly, Weekly Descent

The same structure repeats at lower time lenses:

- Quarterly goals derive from yearly goals.
- Monthly goals derive from quarterly goals.
- Weekly actions derive from monthly goals.
- Daily Tap the Vein tasks derive from weekly actions.

Non-negotiable rule:

Every kept yearly goal across all five domains must be offered a descent path. The prototype only demonstrates the Health thread for legibility; production must not ship a Health-only descent.

Every lower-level goal or task must either:

1. explicitly progress the goal one lens higher, or
2. be marked as maintenance, recovery, or parked.

This prevents the system from becoming a loose task bucket.

Recommended UX for production: a goal/lens picker at the top of each cadence so the player descends one parent goal at a time, with progress across all active parent goals.

## Example Structure

```text
Yearly / Health
  Practicing Tai Chi and Qi Gong daily

Quarterly / Health
  Weekly Qigong/Tai Chi practice
  Do Qi Gong in my house
  Go on a walk 1x/week
  Meditate 1x/week

Monthly / Health
  Sign up for Bruce Frantzis Qigong
  Go on a walk 1x/week

Weekly / Health
  Watch 5 Bruce Frantzis videos
  Practice Qigong
  Meditate
  Go on a walk
  Brush teeth 3x

Tap the Vein / Today
  Keep: Practice Qigong
  Attached to Weekly Health -> Monthly Health -> Quarterly Health -> Yearly Health
```

## BAR and Tap the Vein Integration

Tap the Vein creates raw daily tasks. These tasks should not automatically flood the BAR system.

Use the other branch's lazy promotion rule:

- A TTV task becomes a BAR only when the player chooses keep, plant, or upgrade.
- The promoted BAR receives:
  - `lensId` for today's temporal lens,
  - `lensGoalId` for the specific weekly/monthly/yearly goal it serves,
  - emotional-alchemy triad when planted:
    - desired outcome,
    - current dissatisfaction,
    - desired satisfaction.

This makes BARs meaningful artifacts instead of an automatic task dump.

## Humane Octalysis Alignment

Use white-hat motivational drives:

- **Epic Meaning**: goals are connected to a life/year the player wants to move toward.
- **Development and Accomplishment**: progress is visible through year -> quarter -> month -> week -> today.
- **Empowerment of Creativity and Feedback**: the player edits all suggestions and can dream before narrowing.
- **Ownership and Possession**: goals become authored Lenses, not app-generated obligations.
- **Social Influence and Relatedness**: optional Dojo/coaching support helps people stay with the process.

Avoid black-hat pressure:

- no streak shame,
- no "you are behind" copy,
- no red failure states for parked goals,
- no auto-generated obligations,
- no public accountability by default,
- no daily guilt for domains not touched today.

## Weekly reflection (GTD review — ritual, not planner)

**Authority:** [productivity-modality-alignment/RESEARCH.md](../productivity-modality-alignment/RESEARCH.md) (PMA B2). Adapt Mindwtr/Tandem guided review; **never** ship inbox-zero or productivity-planner chrome.

The Observatory **week close** (and optional year-frame review after workshop) is a **three-beat ritual** — not a spreadsheet audit:

| Beat | GTD analog | Player-facing copy (examples) | System hooks |
|------|------------|-------------------------------|--------------|
| **1. Clear** | Get Clear | "What carried weight this week? Anything to compost?" | TTV carry/compost summary; compost ledger |
| **2. Current** | Get Current | "Which quests need a next honest step?" | Orphan quests without `NextActionBridge`; shadow quests (QLA) |
| **3. Creative** | Get Creative | "What wants to move next week? Park what can wait." | Parked `LensGoal` revisit; weekly descent picker |

**Rules:**
- Optional cadence — suggest after 7 days since last review, never punish skip.
- One screen per beat max in v1; player can exit after any beat.
- No "inbox zero", "behind", "streak broken", or competitor app names.
- Daily close stays in **Tap the Vein** (carry/compost only); weekly beats live at **Observatory `/observatory/week`** or workshop **review** screen.

**Verification:** Hostile copy review in [COPY_AUDIT_PMA.md](./COPY_AUDIT_PMA.md).

## Data Model Direction

Keep `Lens` as the temporal container:

- yearly,
- quarterly,
- monthly,
- weekly,
- daily.

Add domain-scoped goals under lenses:

```prisma
model LensGoal {
  id                 String   @id @default(cuid())
  playerId           String
  lensId             String
  domain             String   // relationships | career | money | health | allyship
  title              String
  description        String?
  satisfactionPayoff String?
  metric             String?
  parentGoalId       String?
  superpowerSource   String?
  status             String   @default("active") // draft | active | parked | complete
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([playerId, lensId])
  @@index([playerId, domain])
  @@index([parentGoalId])
}
```

Persist workshop/dream material separately from locked goals. The design promises that discarded options remain available as dream notes.

Minimum contract:

```prisma
model LensWorkshopDraft {
  id        String   @id @default(cuid())
  playerId  String
  lensId    String
  domain    String?
  cadence   String   // year | quarter | month | week
  parentGoalId String?
  freewrite String?
  options   Json     // up to 10 authored options, including discarded ones
  keptOrder Json     // ordered option indexes or ids
  status    String   @default("draft") // draft | locked | parked | skipped
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([playerId, lensId])
  @@index([parentGoalId])
}
```

Extend BAR/TTV linkage:

```prisma
// CustomBar
lensGoalId String?

// TapTheVeinTask
lensGoalId String?
priorityRank Int? // 1-5 daily kept order; 1-3 can be Top 3
lifeLensDomain String?
```

Exact Prisma naming can change during implementation, but the contract must preserve:

- temporal lens,
- domain goal,
- parent goal lineage,
- BAR/task association.

## Branch Coordination

Other branch inspected:

- `remotes/origin/claude/kind-darwin-5pyp5c`
- `remotes/origin/claude/spec-curie-924a57af2c`

The richer branch already contains:

- Tap the Vein runner UI,
- TTV session/task persistence,
- lazy task-to-BAR promotion,
- `Lens`,
- calendar lens scaffolding,
- `CustomBar.lensId`,
- `gardenId`,
- EA triad fields,
- Observatory skeleton.

Do not rebuild those pieces here. Merge or cherry-pick them, then add:

- `LensGoal`,
- superpower-based prompt seeds/examples,
- Lenses onboarding flow,
- parent-child goal lineage,
- Tap the Vein `lensGoalId` attachment.

## Functional Requirements

- **FR1**: A new player can start Lenses after the superpower quiz.
- **FR2**: A player can complete the free-write -> options -> keep loop across all five domains.
- **FR3**: The app supports deterministic superpower-shaped prompt/examples without requiring AI-generated goals.
- **FR4**: The player can save at least one and up to five yearly goals per active domain.
- **FR5**: Each saved yearly goal includes a satisfaction payoff.
- **FR6**: Quarterly goals can be created under every kept yearly goal, across all five domains.
- **FR7**: Monthly goals can be created under every kept quarterly goal.
- **FR8**: Weekly actions can be created under every kept monthly goal.
- **FR9**: Tap the Vein tasks can attach to a LensGoal.
- **FR10**: A TTV task promoted to a BAR preserves `lensId` and `lensGoalId`.
- **FR11**: A lower-level task/goal must show which higher goal it serves or be marked maintenance/recovery/parked.
- **FR12**: The UI avoids shame language and overcommitment pressure.
- **FR13**: Free-write notes and discarded options persist as dream notes.
- **FR14**: Planting a BAR from a Tap the Vein task is always explicit; no automatic BAR creation from capture alone.

## Acceptance Criteria

- New player moves from vague movement to yearly goals across Relationships, Career, Money, Health, and Allyship.
- Yearly goals are authored through dreaming, option-making, and keeping, not accepted from a mysterious authority.
- Quarterly, monthly, and weekly goals retain parent lineage across every active domain/goal, not only Health.
- Tap the Vein daily tasks can be attached to active weekly/monthly goals.
- BARs created from Tap the Vein tasks retain goal lineage.
- Prompt examples or superpower seeds are editable, rejectable, and never mandatory.
- Parked goals are treated as wise focus, not failure.
- The flow does not create BARs automatically from every task.

## Design Handoff

Claude Design output is preserved in:

- `design-handoff/README.md`
- `design-handoff/BARS Lenses Onboarding.dc.html`
- `design-handoff/BARS Lenses Onboarding - Canvas.dc.html`
- `design-handoff/screens/*.png`

Implementation should treat `design-handoff/README.md` as the prototype source of truth for interaction details, copy, states, and guardrails. The `.dc.html` files are reference prototypes, not production code to copy directly.

## Out of Scope For First Implementation

- AI-only goal generation with no deterministic fallback.
- Public accountability/social pressure.
- Full analytics dashboard.
- Cross-player goal comparison.
- Automatic judging of whether a goal is "good."
- Replacing Tap the Vein with a separate daily Lenses workflow.

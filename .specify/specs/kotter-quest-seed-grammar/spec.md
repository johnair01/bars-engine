# Spec: Kotter Quest Seed Grammar (deterministic BAR/quest composition)

**Spec ID:** KQSG  
**Status:** active  
**Related:** WMC (world-map-campaign-deck-portals), [`src/lib/kotter.ts`](../../../src/lib/kotter.ts), [`src/lib/portal-context.ts`](../../../src/lib/portal-context.ts), [`CampaignMilestone`](../../../prisma/schema.prisma) (milestone gating), quest grammar / emotional alchemy

---

## Problem

Campaign quest seeds (especially “Raise the urgency” and later Kotter beats) lack **structured context**. Teams default to LLM generation, which is **token-expensive** and **quality-unstable** when inputs are thin.

We need a **grammatical** composition model so BARs/quests interface cleanly with:

- **Kotter stage** (1–8) — what kind of change work this is
- **Allyship domain** — `getStageAction` / warm phrasing already in [`kotter.ts`](../../../src/lib/kotter.ts) + [`domain-context.ts`](../../../src/lib/domain-context.ts)
- **I Ching hexagram** — upper/lower trigram structure via [`getHexagramStructure`](../../../src/lib/iching-struct.ts)
- **Emotional alchemy** (`aligned` | `curious` | `skeptical`) — stance paragraph, matches `CustomBar.emotionalAlchemyTag` + gameboard filtering
- **Game Master face** — short lens line, aligns with spoke / changing-line voice (`CustomBar.gameMasterFace`)

**Extension (v1 design):** Stage must imply **stage-legal, metabolizable moves**—not only ordering. **Six GM faces × eight Kotter stages** define a **move library**; **milestone completion** gates which stage’s moves are **available**, tightening the loop and making **show up** actionable.

---

## Design

### Slot grammar (composer)

Each composed quest/BAR fills these **slots** (all deterministic strings, no LLM):

| Slot | Source |
|------|--------|
| Stage headline | `getStageAction(stage, allyshipDomain)` — *see § Headline refresh; may be replaced by face-move title* |
| Kotter name | `KOTTER_STAGES[stage].name` |
| Campaign goal line | Stage-specific one-liner (Kotter canonical) |
| Hexagram frame | `{upper} over {lower}` + trigram essence lines |
| Micro beat | Stage-specific observable action (1–8 table) — *to align with § Face–stage moves* |
| Evidence prompt | Stage-specific “success looks like” |
| Stance (optional) | One of three emotional-alchemy paragraphs |
| Face lens (optional) | One of six GM-face micro lines |
| Portal theme (optional) | Deck card / spoke flavor |
| Owner line (optional) | Campaign owner sentence (deck wizard) |

### API

- [`fillKotterQuestSeedSlots`](../../../src/lib/kotter-quest-seed-grammar.ts) — inspect filled slots (UI preview, tests, future prompts).
- [`composeKotterQuestSeedBar`](../../../src/lib/kotter-quest-seed-grammar.ts) — returns `{ title, description, kotterStage, campaignGoal, emotionalAlchemyTag, gameMasterFace, completionEffects }` for Prisma `CustomBar` writes.
- `completionEffects.grammar === 'kotter-seed-v1'` for downstream tooling.

### Integration

- **Deck wizard (stage 1):** [`buildRaiseUrgencyQuestPayload`](../../../src/lib/campaign-deck-quests.ts) delegates to `composeKotterQuestSeedBar` with `kotterStage: 1`, alchemy/face null until CYOA supplies them.
- **Future:** Composer accepts optional **`gmFaceMoveId`** (from § Face–stage move matrix) to set title, micro-beat, evidence, and `completionEffects.moveId` for UI + completion checks.

---

## Addendum A — Six-face headline critique & copy direction

**Problem with current domain headlines** (`getStageAction(1, domain)`): they read as **org deficit** (“We need resources”) not **play-speak** or **bounded moves**. They work as admin shorthand, not as metabolizable invitations.

| Face | Guidance |
|------|-----------|
| **Shaman** | Prefer **surfacing** verbs: what’s unnamed, draining, or below awareness—not “we need.” |
| **Regent** | **Bound** scope: one week, one owner, one audience—headlines must imply a fence. |
| **Challenger** | **Cost of waiting / silence**—who loses, what stays hidden if we don’t act. |
| **Architect** | **Composable slot**: `[verb] + [object] + [scope]` so UI can render checks and evidence. |
| **Diplomat** | **Invitation**, not pleading—who carries this with us; what’s worth one honest conversation. |
| **Sage** | **Why this stage**—one clause that distinguishes Urgency from Coalition (etc.). |

### Dual face semantics (avoid confusion)

| Role | Meaning |
|------|--------|
| **Structural face** | How the path opened (changing line / portal / hub draw). Stored on spoke or hub state. |
| **Reading / voice face** | How headline + move copy are **rendered** when the player opens the quest. Optional; can differ from structural. |

**Pattern:** Persist a **neutral move id** + `structuralFace`; at render, if `readingFace` is set, append one **tint line** (“Read as Regent: …”) without overwriting stored structural face. Alternatively store `headlineVariantKey` resolved from `(moveId, readingFace)`.

---

## Addendum B — Stage-specific metabolism (not only order)

**Rule:** Each stage exposes **verbs that are invalid or misleading** at other stages. Completion rubrics and quest types should **enforce** stage legality (e.g. via `completionEffects.kotterStage` + UI gates).

| Stage | Stage-legal emphasis (examples) | Defer to later stages |
|-------|-----------------------------------|------------------------|
| 1 Urgency | Name gap, cost of delay, first witness to truth | Formal coalition map, scaling systems |
| 2 Coalition | Named roles, invites, shared load | Full vision doc, org-wide comms plan |
| 3 Vision | Picture of “done” in plain language | Obstacle teardown at scale |
| 4 Communicate | One channel, one audience, one message | Long-term culture anchor |
| 5 Obstacles | Smallest step that loosens one blocker | “Win” celebration as primary |
| 6 Wins | Document and repeat what worked | New vision rewrite |
| 7 Build on | Repeat + one new participant | First-urgency naming only |
| 8 Anchor | Habit / role / ritual that survives energy dip | One-off heroics |

The **face–stage move table** (§C) is the canonical source of **actionable** copy per stage; composer micro-beats should **converge** to these moves over time.

---

## Addendum C — GM face × Kotter stage move matrix (v1 draft)

**Purpose:** For each **Kotter stage** (1–8), offer **six distinct player moves** (one per GM face). Each move is **show-up actionable**: title + one-sentence action + completion evidence. Moves are **gated** by campaign progress (§D).

**Move ID pattern:** `K{stage}_{face}` — e.g. `K1_shaman`, `K4_architect`.

### Stage 1 — Urgency

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | Surface the unnamed cost | Write or speak one sentence: what is draining or unsaid that the campaign cannot pretend away? | Timestamped note or BAR body with that sentence |
| regent | Bound one shortage | Name **one** concrete shortage, **one** time window (e.g. this week), **one** owner who acknowledges it | Text names all three |
| challenger | Name the cost of silence | Who loses if nobody says this out loud? One sentence + one named or role-level “who” | Sentence + who |
| architect | Diagram the gap | One list, sketch, or bullet flow: current state → what’s missing → first crack | Image or pasted list |
| diplomat | One trusted witness | Tell **one** specific person the truth of the moment; log who (initials ok) and date | Log line |
| sage | Name the story we’re in | Before recruiting anyone: what narrative are we already inside? Two sentences max | Two sentences in BAR/quest reply |

### Stage 2 — Coalition

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | Who feels the same heat? | Name one person or role who is already emotionally “in it” with you | Name + one line why |
| regent | Formalize one ask | One written ask: role, time box, deliverable | Pasted ask |
| challenger | Challenge vague help | Convert “help us” into one measurable micro-commitment from someone | Quote + commitment |
| architect | RACI stub | One row: Responsible / Accountable / Consulted / Informed for **one** work stream | Table or list |
| diplomat | Bridge two silos | Name two groups; one gesture that connects them this week | Two names + gesture |
| sage | Why we need more than me | One paragraph: why coalition, why now | Paragraph |

### Stage 3 — Vision

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | Felt picture of done | Describe the future in **sensory** terms (not slogans), 3–5 sentences | Text |
| regent | Success criteria | Three bullet “we will know we’re there when…” | Three bullets |
| challenger | What we refuse | One line: what outcome is **not** acceptable | One line |
| architect | Vision → milestone ladder | Ordered list: 3 milestones, smallest first | Ordered list |
| diplomat | Newcomer paragraph | Same vision as if explaining to someone who arrived today | Paragraph |
| sage | Story arc | Beginning / turn / where we’re headed—in one short arc | Short text |

### Stage 4 — Communicate

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | Emotional hook | One sentence: why **this** message now | Sentence |
| regent | One audience, one channel | Name audience + single channel for this beat | Two fields |
| challenger | Why now, why you | Challenge yourself: why should **they** care this week? | Short answer |
| architect | Message architecture | Headline + 3 bullets + one CTA | Structured text |
| diplomat | Tone check | Read aloud once; one line: how it lands for the least aligned listener | Note |
| sage | Through-line | One sentence linking vision → this message | Sentence |

### Stage 5 — Obstacles

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | Obstacle as feeling | Name the obstacle **as experience**, then restate as fact | Two lines |
| regent | Owner of the blocker | Who owns removing or escalating this? Name them | Name |
| challenger | Smallest wedge | What’s the tiniest action that proves the obstacle can move? | Action + date |
| architect | Dependency map | What must be true before X? 3 nodes max | Mini map text |
| diplomat | Who needs to hear the block | One stakeholder to inform so we’re not heroing alone | Name |
| sage | Pattern | Is this obstacle recurring? One line pattern name | Line |

### Stage 6 — Wins

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | Felt win | What did it **feel** like when it landed? | Sentence |
| regent | Win on record | Date, owner, metric or observable | Log |
| challenger | So what next | What does this win **demand** we do next? | Line |
| architect | Repeat playbook | Steps to reproduce in one numbered list | List |
| diplomat | Thank in public | One public or group thank-you naming names | Link or paste |
| sage | Meaning | One sentence: what this win **means** for the story | Sentence |

### Stage 7 — Build on

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | New energy | Who is newly drawn in after the win? | Name |
| regent | Scale decision | What do we **not** scale yet (guardrail)? | Line |
| challenger | Next edge | What’s the next honest stretch? | Line |
| architect | Systemize one piece | One thing we’ll repeat on a schedule | What + cadence |
| diplomat | Invite one more | One new person into the next beat | Name |
| sage | Chapter title | Name this phase of the campaign in 5 words max | ≤5 words |

### Stage 8 — Anchor

| Face | Move title | Player action | Complete when |
|------|------------|---------------|---------------|
| shaman | Ritual | One recurring ritual that holds meaning | What + when |
| regent | Owner of the long haul | Role + name for sustained ownership | RACI line |
| challenger | What we won’t slip on | One non-negotiable | Line |
| architect | Check-in cadence | When we review this: calendar rule | Rule |
| diplomat | Culture line | One sentence newcomers hear about how we work | Sentence |
| sage | Legacy | One sentence: what remains when energy dips | Sentence |

---

## Addendum D — Milestone gating (tight loop)

**Goal:** Players only see **moves for stages they’ve earned**. **Showing up** = picking a **legal face move** for the **current unlocked stage** (and domain/hex context as needed).

### Gating model (conceptual)

1. **Unlock level:** `unlockedKotterStage` ∈ {1..8} per `(playerId, campaignRef)` or per **instance** (shared campaign clock). Start at **1**.
2. **Advance trigger:** Completing a **campaign milestone** (existing [`CampaignMilestone`](../../../prisma/schema.prisma) + contributions, or admin “close milestone”) bumps unlock: e.g. milestone key `advance_kotter_to_2` sets floor to stage 2 moves.
3. **UI:** Move picker shows only moves where `move.stage <= unlockedKotterStage` (or exactly `== instance.kotterStage` if campaign uses strict lockstep—product choice).
4. **Strict lockstep (recommended v1):** `Instance.kotterStage` is source of truth; milestones **advance** `kotterStage` when criteria met; face moves for **current stage only** are selectable (simplest mental model).

### Data we will add (implementation phase)

- `GmFaceStageMove` record or static JSON: `id`, `kotterStage`, `face`, `title`, `action`, `evidence`, `allyshipDomain?` (optional filter).
- `completionEffects`: `{ moveId: "K1_regent", grammar: "kotter-seed-v1" }`.
- Action: `getAvailableFaceMoves(playerId, campaignRef)` — filters by `kotterStage` + milestone state.
- Optional: `PlayerCampaignProgress` JSON on instance or player: `{ unlockedStageMax, completedMilestoneIds[] }`.

### Acceptance (gating)

- Until milestone M1 completes, only **Stage 1** six moves appear in the move picker for that campaign.
- After admin (or rule) advances campaign to stage 2, **Stage 2** six moves appear; stage 1 moves may **archive** or **stay as compost** (product choice—spec default: stage 1 moves remain completable for late joiners if tied to hex portal, but **primary** CTA is current stage).

---

## Acceptance criteria (updated)

1. All eight Kotter stages have distinct micro-beat + evidence lines **or** equivalent coverage in the face–stage matrix (convergence target).
2. Composition is **pure** (same inputs → same output) aside from explicit timestamps in merged `completionEffects` from callers.
3. `npm run test:kotter-quest-seed-grammar` passes.
4. `npx tsc --noEmit` passes.
5. **Spec:** Face–stage matrix and milestone gating documented (this doc).
6. **Implementation (future task):** `GmFaceStageMove` registry in code + `getAvailableFaceMoves` + composer integration + UI move picker gated by `Instance.kotterStage` / milestones.

---

## Reference — current stage-1 domain headlines (to refresh)

| Domain | Current (`getStageAction(1, d)`) | Direction |
|--------|----------------------------------|-----------|
| GATHERING_RESOURCES | We need resources | → “Name what’s running out” / face-move title |
| SKILLFUL_ORGANIZING | We need capacity | → “Name the missing piece of the system” |
| RAISE_AWARENESS | People need to know | → “Say what people still don’t see” |
| DIRECT_ACTION | What needs doing now? | → “Name the smallest honest next move” |

These remain valid as **fallback neutral** lines until move-matrix titles replace them per selected face.

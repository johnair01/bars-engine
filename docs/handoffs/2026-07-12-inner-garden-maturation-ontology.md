# Inner Garden — Maturation Ontology: fruit, seeds, lenses, campaigns

> **Third in the handoff set** (after the design synthesis and the world-representation
> doc). This one answers the ontology gap: *what happens after you harvest fruit, how
> fruit becomes more seeds, and how a single BAR matures all the way into a campaign* —
> grounded in the objects that already exist in `bars-engine`.
>
> **The finding in one line:** the forward spine is built; the **return loop is not**.
> The ontology feels weak not because concepts are missing but because four seams that
> turn fruit back into seeds / lens-progress / campaign-progress are **unwired**.

---

## 1. The maturation spine (real objects)

A charge travels a ladder that already exists in code
(`src/lib/bar-seed-metabolization/types.ts`):

```
captured → context_named → elaborated → shared_or_acted → integrated
```

and every seed carries a **`soilKind`** — where it belongs:

```
holding_pen   (personal parking)   ┐
thread        (a personal sequence) ├─ personal soil
campaign      (shared)              ┘ ← shared soil
```

`bar-home.ts` already routes each phase to a home surface
(`captured→capture`, `context_named/elaborated→garden`, `shared_or_acted→hand`,
`integrated→quests` = "graduated out of the nursery"). **The garden renders this ladder.**
Fruit is produced at the **`shared_or_acted → integrated`** transition: you acted or
shared, and now you integrate the result — that integration *is* the harvest.

---

## 2. The reframe: fruit is a seed with a decision attached

In nature the entire purpose of fruit is to carry seed onward. So "what happens after
fruit" is not a reward-collection question — it's a **fork in the developmental path**:
the player decides where the metabolized charge goes next. That decision *is* the
progression mechanic, and it maps exactly onto the three things you're trying to grow
(more seeds, lens progress, campaign progress), plus honest release.

Crucially, per the existing ethos (`bsm/copy.ts`: *"no shame metrics… not on a
counter"*), **progress is qualitative, not a score.** "More productivity" = momentum you
feel — you always leave a harvest holding a live next-seed, horizons visibly fill, stages
visibly advance — never a tallied point-count.

---

## 3. Fruit's four fates → real mechanics

| Fate | What it grows | Real object / transition | Status |
|---|---|---|---|
| **Sow inward** | more seeds | mint a child `CustomBar` (new `captured`) with `sourceBarId`/`parentId`/`rootId` = the fruit; link via `NextActionBridge` | **seam** — `NextActionBridge` only *links existing* BARs; nothing *mints* a child on harvest (`quest-completion.ts` only logs) |
| **Bank into a Lens** | vertical progress | mark the serving `LensGoal` satisfied (`status:'complete'`); roll daily→weekly→…→vision via `parentLensId`/`parentGoalId` | **seam** — `'complete'` enum value exists but **no writer**; roll-up is authoring-descent only |
| **Share into a campaign** | horizontal progress | `MilestoneContribution` (with `barId`) → `CampaignMilestone.currentValue += need.value` → milestone `complete` → **Kotter stage advances** | contribution **wired**; **seam** — Kotter auto-advance deferred to "Phase 2" (`quest-completion.ts:32`) |
| **Water the kernel** | **births a campaign** | harvest waters one of six faces on a `campaign_kernel` BAR (`wateringProgress`); all six → `promoteCampaignBarToInstance` → `Instance` at `kotterStage:1` | promote **built**; **seam** — watering currently fed by dedicated watering-quests, not ordinary harvest |
| **Compost** | honest release | set `compostedAt` + `releaseNote` (soft archive) | **built** |

The elegance: fates 1–3 are exactly your three growth targets; "water the kernel" is the
special case of "share" that *creates* shared soil where none existed; compost keeps it
honest ("composting, not necromancy").

---

## 4. The headline: how a BAR matures into a campaign (mostly built)

**The definition, grounded in the existing promote-gate:**

> A BAR matures into a campaign when its charge has been **watered from all six faces** —
> when one person has metabolized it from every altitude (Shaman, Regent, Challenger,
> Architect, Diplomat, Sage) and it is ready to become shared soil.

This is not invented — it is the existing gate in `promoteCampaignBarToInstance`
(`src/actions/campaign-bar.ts`): a `campaign_kernel` BAR with all six `WATERING_FACES`
complete is promoted to an `Instance` (the runtime campaign/world) at **Kotter stage 1
(urgency)**, with `kernelBarId` pointing back at the originating BAR. The six-face
watering is a gorgeous expression of "too big to hold from one altitude alone."

From there the campaign advances through the eight Kotter stages
(`urgency → coalition → vision → communicate → obstacles → wins → build_on → anchor`) as
others' fruit becomes `MilestoneContribution`s that fill `MilestoneNeed`s and complete
`CampaignMilestone`s. The original BAR remains the `kernelBarId` — the seed the whole
world grew from.

**Two ladders, kept distinct (both real):**
- **BAR-seed → quest** ("graduate"): `growQuestFromBar` → `mintQuestFromText`, lineage via
  `sourceBarId` + carried `lensId`/`lensGoalId`. Personal elaboration.
- **campaign_kernel → Instance** ("promote"): the six-face gate above. Campaign birth.

---

## 5. The two ledgers (what "progress" concretely means)

| | **Vertical — Lens** | **Horizontal — Campaign** |
|---|---|---|
| Grows | personal development / altitude | collective impact |
| Unit of progress | a satisfied `LensGoal` | a met `MilestoneNeed` |
| Roll-up | daily → weekly → … → vision (`parentLensId`) | need → milestone → **Kotter stage** |
| Feel | horizons filling | stages advancing |
| Built? | structure yes; **accrual writer = seam** | contribution/milestone **wired**; Kotter advance = seam |

Both are **state machines, not counters** (goal statuses; Kotter stages) — which is what
keeps the economy calm and shame-free.

---

## 6. Worked walkthrough — one BAR, capture → campaign

*Example charge (Mastering Allyship register): "In standup I raised an equity concern and
got talked over. I'm deflated and second-guessing whether to speak up again."*

| # | Step | Real object / phase | Built? |
|---|---|---|---|
| 1 | **Capture** the charge | `CustomBar type='charge_capture'`, `seedMetabolization.maturity='captured'` | ✅ |
| 2 | **Name the soil + context** — "this belongs to my *weekly* horizon; holding_pen for now" | `maturity='context_named'`, `soilKind='holding_pen'`, `lensId=<weekly>` | ✅ |
| 3 | **Plant** it as a seed in the weekly field | garden projection places a `seed` anchor (see world-rep doc) | ✅ (world stub) |
| 4 | **A weed appears** — the blocker "maybe I'm being too sensitive" (a *myth* shadow card) | blocker → `weed` anchor; gates watering | ⚠️ myth→weed injection unbuilt |
| 5 | **Clean** the weed via 3·2·1 | `shadow_321` session; `source321SessionId` links back | ✅ |
| 6 | **Grow to a quest** — "prepare to re-raise the concern with a bounded ask" | `growQuestFromBar` → `mintQuestFromText`; `maturity='elaborated'`, `sourceBarId` set, `lensId`/`lensGoalId` carried | ✅ |
| 7 | **Show up** — complete the move (the bounded ask, delivered) | `MoveAttempt` → `completed`; `maturity='shared_or_acted'` | ✅ (service) |
| 8 | **Harvest fruit** — an `insight` OutputBar at *satisfied* altitude (a **triumph** spirit) | fruit = `OutputBar × altitude`; ripe = `SatisfactionSpirit` | ⚠️ harvest→fruit not modeled as an object |
| 9a | **Sow inward** — the fruit reveals a next action: "propose a standup norm: hold space for equity flags" → a **child seed** | new `CustomBar captured`, `sourceBarId=<fruit>`, `rootId` carried | ⚠️ **seam 1** (mint-on-harvest) |
| 9b | **Bank to Lens** — the triumph satisfies the weekly goal "advocate for myself under pressure"; rolls toward the vision lens | `LensGoal.status='complete'`; roll-up daily→…→vision | ⚠️ **seam 2** (no writer) |
| 10 | The child seed (norm proposal) recurs and **others feel it too** — it's outgrowing one person | signal: needs a plan (Architect) + others (Diplomat) | — |
| 11 | **Water the kernel from six faces** — each altitude's harvest waters one face of a `campaign_kernel`: Shaman (name the hurt), Challenger (the bold ask), Regent (the norm/role), Architect (the standup ritual), Diplomat (bring teammates), Sage (the pattern) | `wateringProgress[face]=true` per harvest | ⚠️ **seam 4** (watering fed by harvest) |
| 12 | **Campaign is born** — all six faces watered → promote | `promoteCampaignBarToInstance` → `Instance`, `kotterStage=1`, `kernelBarId=<BAR>` | ✅ (promote built) |
| 13 | **Others contribute** — teammates' fruit fills milestone needs ("3 standups run with the norm") | `MilestoneContribution` → `currentValue += value` → milestone `complete` | ✅ (wired) |
| 14 | **Campaign matures** — milestones complete advance Kotter `urgency→coalition→…→anchor` | `Instance.kotterStage` advances | ⚠️ **seam 3** (auto-advance) |

The charge that started as *"I got talked over"* is now the **kernel of a team-norms
campaign** — and its lineage (`rootId`) threads every contributor's fruit back to that
first felt signal.

---

## 7. The four unwired seams (the "weak ontology," made precise)

To close the loop, four small, well-bounded wirings — each connects two things that
already exist:

1. **Harvest → child seed.** On a harvest resolution, *mint* a lineage-carrying
   `CustomBar` (not just link an existing one). Extend `NextActionBridge` /
   `onPlayerQuestCompletion` (today it only logs).
2. **Harvest → Lens satisfaction + roll-up.** Add the writer that sets `LensGoal.status`
   and rolls satisfaction up the `parentLensId` chain. (Enum value exists; no writer.)
3. **Completion → Kotter advance.** Implement the deferred "Phase 2" in
   `quest-completion.ts`: a completed milestone advances `Instance.kotterStage`.
4. **Harvest → kernel face-watering.** Let an ordinary harvest (not just a dedicated
   watering-quest) water a `campaign_kernel` face, feeding the existing six-face
   promote-gate.

Plus two supporting gaps already noted elsewhere: **harvest→fruit as a first-class
object** (step 8), and **myth→weed injection** (step 4).

---

## 8. Decisions that are yours

1. **Campaign-birth trigger.** Keep the **six-face watering** gate (elegant: charge
   engaged from every altitude) and feed it from ordinary harvests? Or add a *lighter*
   birth trigger (e.g. first shared contribution, or a quest that explicitly needs
   others) for BARs that shouldn't need all six faces? *Recommend: keep six-face as the
   canonical birth, feed it from harvest; it's already built and it's the strongest
   definition.*
2. **Seed multiplication cadence.** How many child seeds may one harvest sow — exactly
   one "next smallest honest action," or 1–3? *Recommend: default one (matches the
   existing "next smallest honest action" framing), allow up to 3 for a rich harvest.*
3. **Lens satisfaction unit.** Does one fruit *complete* a `LensGoal`, or *contribute
   toward* it (many fruits → one goal)? *Recommend: contribute-toward, with the goal
   completing qualitatively when its `satisfactionPayoff` feeling is met — no counter.*
4. **Which campaign object.** Birth via `campaign_kernel → Instance` (the runtime world),
   with the authored `Campaign` record created later by a steward? *Recommend: yes — the
   kernel/Instance path is the real birth; `Campaign` is steward tooling on top.*

---

### Appendix — evidence trail
- Maturity + soil: `src/lib/bar-seed-metabolization/{types,parse,copy}.ts`, `src/lib/bar-home.ts`.
- Lineage: `CustomBar.{sourceBarId,parentId,rootId}` (`prisma/schema.prisma`),
  `src/lib/quests/mint.ts`, `src/actions/bars.ts` (`growQuestFromBar`/`growDaemonFromBar`),
  `src/lib/next-action-bridge.ts`.
- Lens: `prisma/schema.prisma` (`Lens`/`LensGoal`), `src/lib/lenses/{ensure,lineage,types}.ts`,
  `src/actions/lens-goals.ts`.
- Campaign birth: `src/actions/campaign-bar.ts` (`createCampaignSeed`,
  `advanceCampaignWatering`, `promoteCampaignBarToInstance`, `WATERING_FACES`),
  `Instance.{kotterStage,kernelBarId}`.
- Kotter: `KOTTER_BEATS` (`quest-grammar/compileQuestCore.ts`), `src/lib/blessed-objects.ts`.
- Milestones: `CampaignMilestone`/`MilestoneNeed`/`MilestoneContribution`/`SpokeMoveBed`
  (`prisma/schema.prisma`), `src/actions/{milestone-needs,campaign-contributions,plant-bar-on-spoke}.ts`.
- Completion (stub): `src/actions/quest-completion.ts`.
- Fruit vocabulary: `OutputBar` (`allyship-deck/types.ts`), `SatisfactionSpirit`
  (`emotional-alchemy/types.ts`).
</content>

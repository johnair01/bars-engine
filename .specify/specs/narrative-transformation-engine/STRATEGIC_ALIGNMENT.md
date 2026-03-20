# ED vs codebase direction: strategic alignment (Mar 2026)

## Your stated north star

**Campaign automation** — NPCs taking meaningful **moves**, plus **skilled deck management** (collective/domain decks, hand/discard, BAR-as-move). Backlog anchors: **NSPE** (NPC & simulated player ecology), **DSBD** (Dominion-style BAR decks), **GMGB** (game map ↔ gameboard), **GJ/GK** (campaign playbook / invitations), **DT** + **FN** + **FO** (flow sim, transformation harness, minimal agent mind). **Charge → quest** and **BAR → quest** engines handle *intake → quest shape* from BARs/charges.

## What ED is (spec intent)

**Narrative Transformation Engine (ED)** turns **free-text “stuck narrative”** into a **bounded loop**: parse → lock type → WCGS-aligned prompts → optional alchemy/321 → **quest seed**. It is **psychotech gameplay**, not campaign orchestration. Primary surfaces: Emotional First Aid, 321/shadow, charge/BAR-adjacent **text** intake.

## What the codebase already has (overlap)

| Area | Location | Relation to ED |
|------|----------|----------------|
| **Parsed narrative + lock + quest seed assembly** | `src/lib/transformation-move-registry/` (`ParsedNarrative`, `assembleQuestSeed`, `renderMovePrompt`, lock filters) | **ED Phase 2 & 5 largely duplicate this** — registry is the canonical move + seed layer. |
| **Phase 1 parse + lock** | `src/lib/narrative-transformation/` (`parseNarrative`, `detectLockType`) | **New**; types aligned to registry to avoid a second ontology. |
| **Charge → WCGS suggestions** | `src/lib/charge-quest-generator/` | **Parallel intake** (structured charge BAR), not prose narrative; complementary. |
| **BAR → quest pipeline** | `bar-quest-generation-engine` spec + actions | **BAR-first** quest proposals; ED is **text-first** seed — can converge at `QuestSeed` / CustomBar. |
| **NPC / sim actors** | `proposeActorAction`, `simulateAgentGameLoop`, flow sim | **Flow and choice machinery**; not narrative parsing. NSPE says NPCs use **existing pipelines** (Forge, BAR→quest). |
| **Deck / campaign cards** | `dominion-style-bar-decks` spec, `BarDeck` / bindings | **Economy of moves**; independent of whether the move came from ED, charge, or book analysis. |

**Conclusion:** ED is **still relevant** as the **text → structured narrative → registry-backed seed** adapter. It is **not** on the critical path for **deck state, NPC turn-taking, or campaign automation** unless you explicitly wire “NPC dialogue / persona inner monologue → ED → quest/BAR.”

## Verdict

| Question | Answer |
|----------|--------|
| Is ED obsolete? | **No** — it fills a gap the registry assumes: **“here is a `ParsedNarrative`”** from raw text. |
| Is ED blocking campaign automation? | **No.** Automation is **NSPE + DSBD + playbook/agent loop + sim**. |
| Should ED scope change? | **Yes — tighten and integrate, don’t parallel-build.** |

## Recommended scope adjustments (v0 → v0.1)

1. **Treat `transformation-move-registry` as canonical for moves and `assembleQuestSeed`.** ED Phase 2 should be **selection/wiring** (pick move IDs by lock/stage), not a second move catalog (“Perspective Shift”, etc. in `plan.md` should defer to registry IDs).

2. **Narrow ED’s “product” definition:**  
   - **Core deliverable:** `parseNarrative` + optional `buildQuestSeedFromText(rawText, moveIdBundle, context)` calling **registry only**.  
   - **Defer:** Standalone REST surface (`/api/narrative-transformations/*`) until a consumer (EFA intake, admin tool, or NPC batch job) needs it.

3. **Campaign/NPC track — explicit optional hook (later):**  
   - **NSPE US-C1** (“NPCs propose … via existing forge/**transformation pipeline**”) is the right join: ED output should be **one input type** to the same structures NPC/human flows already use (`QuestSeed`, CustomBar drafts).  
   - **Do not** position ED as the driver of **ActorDeckState** or **pickQuestForAgent** — that stays simulation + deck specs.

4. **Backlog stance:** Keep **ED** in stack as **infra/library** aligned to **EE/FK** (move registry / encounter geometry), not as a **campaign milestone**. If you need a single “automation epic,” sequence **NSPE → DSBD → GMGB** (with **DT/FO** for testing); keep **ED** as **supporting** text-to-seed capability.

## Dependencies to re-read when reprioritizing

- `.specify/specs/npc-simulated-player-content-ecology/spec.md` — NPC content via **existing** pipelines.  
- `.specify/specs/dominion-style-bar-decks/spec.md` — deck/hand; BAR as move.  
- `.specify/specs/transformation-move-registry/spec.md` — **owns** move catalog + `assembleQuestSeed`.  
- `.specify/specs/bar-quest-generation-engine/spec.md` — BAR → quest; merge point for seeds.

---

*This note is advisory; update `spec.md` / `tasks.md` when the squad locks scope.*

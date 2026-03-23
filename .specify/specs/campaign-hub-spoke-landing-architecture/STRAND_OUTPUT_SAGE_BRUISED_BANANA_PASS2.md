# Sage consult pass 2 — Bruised Banana instance IDs

**Tool:** MCP `sage_consult` (bars-agents)  
**Date:** 2026-03-18  
**IDs used (from `npx tsx scripts/with-env.ts "npx tsx scripts/list-bb-instances.ts"` on dev DB):**

| Role | id | slug | notes |
|------|-----|------|--------|
| Residency | `BB-BDAY-001` | `bb-bday-001` | `campaignRef: bruised-banana`, `kotterStage: 1` |
| Allyship parent | `cmmwjrnx30001q8jnt1nsqwms` | `allyship-nonprofit` | `sourceInstanceId: BB-BDAY-001` |
| Sub: book | `cmmwjro320003q8jnjn082kj5` | `allyship-book` | parent = nonprofit |
| Sub: card game | `cmmwjroby0005q8jnuas6pdq3` | `allyship-card-game` | parent = nonprofit |
| Sub: fundraising | `cmmwjroez0007q8jne3k9hh8y` | `allyship-fundraising` | `linkedInstanceId` + `sourceInstanceId` = `BB-BDAY-001` |

> **Prod / other envs:** re-run `scripts/list-bb-instances.ts` — CUIDs differ; `BB-BDAY-001` may be seed-specific.

**Metadata:** `consulted_agents`: Shaman, Regent, Diplomat · `discerned_move`: wake_up · **Hexagram 44** in payload (reflective pause / alignment).  
**Flags:** `Architect consultation failed due to overlapping operations`; `Challenger consultation rate limit exceeded` — **balanced later** via Challenger-voice consult → [STRAND_OUTPUT_CHALLENGER_BALANCE.md](./STRAND_OUTPUT_CHALLENGER_BALANCE.md).

---

## Sage synthesis (pass 2)

Each element in the Bruised Banana campaign architecture and associated allyship initiatives demands precise unfolding, but the current blend of inputs, interrupted workflows, and the intrinsic nature of the campaign call for patience and alignment. Hexagram 44 advises a reflective pause and a strategic alignment of energies, ensuring resonance between the intentions of Bruised Banana and the BARS Engine design.

### Recommended approach for Bruised Banana

1. **MVP residency runway strategy**
   - **Preparation phase:** Internal alignment, resource gathering, allyship engagement across the residency framework.
   - **Activation events:** Low-key events via **`/event`**, then more elaborate spoke quests as milestones align.
   - **Expansion / milestone tracking:** Detailed spokes after alignment hurdles; **`/campaign/board`** for sub-campaign evolution.

2. **Hub / spokes integration**
   - **Primary route (Sage suggestion):** Start with **`/residency/hub`** as centralized navigation weaving narrative into allyship fabric. *(Engineering note: route does not exist yet — v1 might be `/event` or `/campaign/board` until hub ships.)*

3. **I Ching ritual for period 1**
   - **Ritual:** Community elder or influential ally casts during first alignment event; physical + virtual engagement.
   - **Naming landings:** Cast informs timed narrative releases — “cycle epiphanies” with communal pulse.

4. **Period 1 milestones (examples from Sage)**
   - ~100 active engagements per sub-campaign *(verify measurability in your analytics)*.
   - Completion of preparation phase for core spokes.
   - First comprehensive allyship partner onboarding.

5. **Risks**
   - Misalignment between BB primary vision and spoken interpretations.
   - Fragmentation from multi-instance threads without consolidated feedback.
   - Over-reliance on emotional alchemy without strategic timing → confused shared objectives.

6. **Next implementation tasks (Sage)**
   - Solidify **`/residency/hub`** capabilities: BAR reflections + narrative layering.
   - Validate technical readiness for allyship sub-campaign support; map dependencies.
   - Synchronicity / linkage review (e.g. quest map JSON ↔ instance graph).

---

## Legibility note (API)

The query involved orchestrating complex integral structures; “readiness of elements needs reevaluation.”

**Generative deps cited:** `BB-BDAY-001`, `allyship-nonprofit`

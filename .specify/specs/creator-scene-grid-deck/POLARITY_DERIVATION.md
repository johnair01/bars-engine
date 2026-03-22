# Scene Atlas — how grid axes are derived

**Values vs polarities (canonical):** see [`docs/VALUES_AND_POLARITIES.md`](../../../docs/VALUES_AND_POLARITIES.md) and wiki [`/wiki/values-and-polarities#footnote`](/wiki/values-and-polarities#footnote) (player footnote).

**Value-pair quality (Johnson-style audit):** [VALUE_PAIRS_AUDIT.md](./VALUE_PAIRS_AUDIT.md) — which labels read as true polarity pairs vs metaphor soup; vision for WCGS-linked player choice.

## Vocabulary (playbook vs archetype vs Polarity)

| Term | Meaning |
|------|--------|
| **Playbook** | Player-facing label for the character pattern. Same data as Prisma **`Archetype`** (`player.archetypeId`). |
| **Archetype overlay** | `ARCHETYPE_PROFILES` — `archetype_id` (e.g. `bold-heart`), trigram, agency. **Pair2 resolves through this**, not from a separate “playbook polarity” system. |
| **Prisma `Polarity`** | Linked to **`NationMove`** (clarity, prestige, framework, …). **Not** the 52-card grid; do not wire grid axes from this table unless we explicitly redesign. |
| **`GridAxisPair`** | Two pole labels for one dimension of the 2×2. Renamed from overloading “polarity.” |

## Problem we stepped back from

**Pair2** was initially keyed only by `Archetype.primaryWaveStage` (Wake/Clean/Grow/Show). In narrative seeds, **six of eight** playbooks use `showUp`, so every such archetype got the same axis: *Offering · Receiving*. That is not fine-grained enough to reflect playbook identity.

## Current model (after tuning)

| Axis | Source | Notes |
|------|--------|--------|
| **Pair1** | `Nation.element` | Stable metaphor: wood → Rising/Rooting, fire → Flare/Ember, metal → Define/Refine, etc. See `ELEMENT_AXIS` in `polarities.ts`. |
| **Pair2** | **`Archetype` row → `resolvePlaybookProfileFromArchetypeRow` → overlay profile → trigram → `TRIGRAM_RELATIONAL_PAIR2`** | Name `(Qian)` and/or description (“The Bold Heart…”) maps to **Bold Heart** profile, then trigram Heaven → *Spark · Restraint*. Fallback: trigram parse without profile, then wave. |

Trigram → pair2 table lives in `src/lib/creator-scene-grid-deck/archetype-trigram-polarities.ts` and is aligned with agency language in `ARCHETYPE_PROFILES` (`archetype-influence-overlay/profiles.ts`).

## Full trigram table (pair2)

| Trigram | Pair2 (− pole · + pole) | Profile anchor |
|---------|-------------------------|----------------|
| Heaven | Spark · Restraint | Bold Heart — initiate vs hold back |
| Earth | Nurture · Self-nurture | Devoted Guardian — care outward vs inward |
| Thunder | Breakthrough · Timing | Decisive Storm — shock vs moment |
| Wind | Subtle · Direct | Subtle Influence — oblique vs plain |
| Water | Venture · Anchor | Danger Walker — lean in vs steady |
| Fire | Clarify · Tact | Truth Seer |
| Mountain | Pause · Proceed | Still Point — hold vs step |
| Lake | Widen · Deepen | Joyful Connector — breadth vs depth of connection |

## Override order (player)

1. `storyProgress.gridPolarities` — set by **quest `completionEffects`** (`commitDerivedSceneAtlasAxes` freezes derived axes with `source: oriented`, or `mergeGridPolarities` for explicit pairs / CYOA `fromInput`) or any writer of the same JSON shape.
2. Nation + playbook / `Archetype` derivation (above) — only if step 1 absent.
3. Default Top/Bottom × Lead/Follow

**UI:** `source: oriented` shows as **Onboarding (axes committed)**; other stored sources (e.g. `adventure`) show as **Values orientation (your choices)**.

## Audit locally

With `DATABASE_URL` set:

```bash
npx tsx scripts/audit-creator-grid-polarities.ts
```

Runs nation × archetype combinations (or all archetypes) and prints derived axes for review.

## Further tuning

- Replace element-only pair1 with **nation-specific** axes when authored (same pattern as trigram table).
- Add `Archetype.slug` in DB later to avoid parsing `name` strings.
- Workshop labels with narrative team using this doc as the single source of truth.

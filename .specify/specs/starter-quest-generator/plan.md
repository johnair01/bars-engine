# Plan: Starter Quest Generator v1 + Emotional Alchemy Integration

## Summary

Extend post-onboarding quest assignment with domain-biased selection and canonical emotional move resolution. No new tables. Reuse CustomBar, ThreadQuest, assignOrientationThreads.

## Phases

### Phase 1: resolveMoveForContext

- Create `src/lib/quest-grammar/resolveMoveForContext.ts`.
- Implement DOMAIN_MOVE_PREFERENCE: GATHERING_RESOURCES → water/wood/earth moves; SKILLFUL_ORGANIZING → earth/metal/wood; RAISE_AWARENESS → metal/fire/water; DIRECT_ACTION → fire/wood.
- Map element names to move-engine IDs (e.g. water_wood, earth_metal).
- When lens present: getMovesForLens(lens), intersect with domain preference, return first match.
- Return null when no match.

### Phase 2: Seed 5 Starter Quest Templates

- Add to `scripts/seed-onboarding-thread.ts` or create `scripts/seed-starter-quest-pool.ts`.
- 5 CustomBars:
  1. Strengthen the Residency — GATHERING_RESOURCES (donation flow)
  2. Invite an Ally — RAISE_AWARENESS
  3. Declare a Skill — SKILLFUL_ORGANIZING
  4. Test the Engine — DIRECT_ACTION (or reuse bb-explore-market-quest)
  5. Create Momentum — RAISE_AWARENESS
- Each: allyshipDomain, campaignRef: 'bruised-banana', type: 'onboarding', isSystem: true, TwineStory (minimal).

### Phase 3: getStarterQuestsForPlayer + Domain-Biased Assignment

- Create `getStarterQuestsForPlayer(playerId, campaignRef)` in `src/actions/quest-thread.ts` or `src/lib/starter-quests.ts`.
- Resolve player domain from campaignDomainPreference or storyProgress lens→domain.
- Query CustomBar where campaignRef, type onboarding, status active, allyshipDomain in pool.
- Return { primary: domain match, optional: 2 from other domains }.
- Extend assignOrientationThreads: when lens present and campaignRef bruised-banana, call getStarterQuestsForPlayer. Option A: Replace fixed bruised-banana thread quests with dynamic set. Option B: Create per-player "starter pack" thread with dynamic quests. Option C: Keep bruised-banana thread; add primary quest at position 1 when domain differs from default.

### Phase 4: Move Resolution + Verification

- When assigning starter quest, call resolveMoveForContext(domain, lens). Attach move to quest metadata (e.g. completionEffects JSON or new optional field).
- Verification quest: cert-starter-quest-generator-v1.

## File Impacts

| File | Action |
|------|--------|
| `src/lib/quest-grammar/resolveMoveForContext.ts` | Create |
| `src/lib/quest-grammar/index.ts` | Export resolveMoveForContext |
| `scripts/seed-onboarding-thread.ts` or `scripts/seed-starter-quest-pool.ts` | Add 5 starter quest CustomBars |
| `src/actions/quest-thread.ts` | Add getStarterQuestsForPlayer; extend assignOrientationThreads |
| `scripts/seed-cyoa-certification-quests.ts` | Add cert-starter-quest-generator-v1 |

## Domain → Move ID Mapping

From emotional-alchemy-interfaces §4:

| Domain | Elements | Move IDs (from move-engine) |
|--------|----------|----------------------------|
| GATHERING_RESOURCES | Water, Wood, Earth | water_wood, earth_metal, wood_fire, etc. |
| SKILLFUL_ORGANIZING | Earth, Metal, Wood | earth_metal, wood_earth, metal_water |
| RAISE_AWARENESS | Metal, Fire, Water | metal_water, water_wood, fire_earth |
| DIRECT_ACTION | Fire, Wood | wood_fire, fire_transcend |

Pick one canonical move per domain for Phase 1.

## Dependencies

- bruised-banana-post-onboarding-short-wins (CG) — done
- campaign-onboarding-twine-v2 (BX) — done
- move-engine, lens-moves — exist

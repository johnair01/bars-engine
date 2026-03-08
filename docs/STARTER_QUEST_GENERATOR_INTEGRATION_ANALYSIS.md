# Starter Quest Generator v1 — Integration Analysis

This document maps the ChatGPT-generated "Starter Quest Generator v1 + Emotional Alchemy Grammar Integration" prompt to the existing BARS Engine data models and identifies overlap, gaps, and recommended integration approach.

## Executive Summary

**The prompt duplicates significant existing infrastructure.** The system already has:
- Post-onboarding quest assignment (`assignOrientationThreads`, `bruised-banana-orientation-thread`)
- Domain/lens-based personalization (`campaignDomainPreference`, lens→domain mapping)
- Emotional alchemy grammar (15 canonical moves, lens-moves, domain↔move preference)
- Quest model (`CustomBar` with `allyshipDomain`, `moveType`, `gameMasterFace`)

**Recommended approach**: Extend existing models and flows rather than introducing new tables or APIs. Add a `resolveMoveFromContext` module that uses the canonical grammar; extend the bruised-banana short-wins thread with domain-biased quest selection.

---

## 1. Mapping: ChatGPT Prompt → Existing System

### 1.1 Trigger: `onboarding_completed`

| ChatGPT | Existing |
|---------|----------|
| Event: `onboarding_completed` | `createCampaignPlayer` → `assignOrientationThreads`; `saveOnboardingSelections` → `assignGatedThreads`; `processCompletionEffects` sets `onboardingComplete` |
| **Gap**: No explicit `onboarding_completed` event bus. Completion is implicit in createCampaignPlayer flow and quest-engine completion effects. |

### 1.2 Player Context

| ChatGPT | Existing |
|---------|----------|
| `player_id` | `Player.id` |
| `campaign_id` | `Instance` or `campaignRef` (e.g. `bruised-banana`) |
| `nation` | `Player.nationId` |
| `archetype` | `Player.playbookId` (Playbook = archetype) |
| `developmental_lens` | `storyProgress.state.lens` (community/creative/strategic/allyship) or `storyProgress.state.gm` (Game Master face: shaman, challenger, etc.) |
| `intended_impact_domain` | `Player.campaignDomainPreference` (JSON array) or derived from lens via `lensToDomain` in quest-thread.ts |
| `created_bar` | BAR created in onboarding (BruisedBananaTwinePlayer) |
| `campaign_phase` | `instance.kotterStage` (1–8) or fixed Phase 1 |

**Existing lens→domain mapping** (quest-thread.ts):
```ts
allyship → RAISE_AWARENESS
creative → GATHERING_RESOURCES
strategic → SKILLFUL_ORGANIZING
community → DIRECT_ACTION
```

### 1.3 Quest Assignment Model

| ChatGPT | Existing |
|---------|----------|
| `quest_templates` table | **None**. Quests are `CustomBar` records. No separate template model. |
| `generated_quests` table | **None**. Quests are assigned via `ThreadQuest` (thread + quest + position). |
| 1 primary + 2 optional from pool | `assignOrientationThreads` assigns **pre-seeded threads** (fixed quest lists). `bruised-banana-orientation-thread` has 2 quests: Explore Market, Request from Library. |
| Domain matching for primary | **Partial**. Lens→domain exists; thread assignment does not select quests by domain. All players get same 2 quests. |

### 1.4 Starter Quest Pool (ChatGPT 5 templates)

| ChatGPT Template | Domain | Existing Equivalent |
|------------------|--------|---------------------|
| **Strengthen the Residency** | gather_resources | Donation flow exists (`/event/donate`); no dedicated "Strengthen" quest |
| **Invite an Ally** | raise_awareness | No invite quest in orientation |
| **Declare a Skill** | skillful_organizing | No skill-declaration quest |
| **Test the Engine** | direct_action | `bb-explore-market-quest` (Explore Market) is light direct_action |
| **Create Momentum** | raise_awareness | No momentum/post quest |

**Existing bruised-banana short wins**: Explore Market + Request from Library. Neither maps 1:1 to the 5 templates.

### 1.5 Emotional Alchemy Grammar

| ChatGPT | Existing |
|---------|----------|
| `POST /emotional-alchemy/resolve-move` | **No API**. Internal modules only. |
| Input: `source_context_tags`, `desired_outcome_tags` | **Different ontology**. Existing uses: unpacking labels (Q2/Q4/Q6), dissatisfaction→satisfaction channels, domain↔move preference. |
| Output: `move_id`, `move_name`, `state_transition`, `player_facing_copy` | `move-engine.ts`: 15 canonical moves with `id`, `name`, `narrative`. `lens-moves.ts`: `getMovesForLens`. No "resolve from tags" function. |
| `emotional_source_context_tags` on quest | **Not on CustomBar**. Could add JSON field or use `completionEffects` / metadata. |

**Existing emotional alchemy**:
- `move-engine.ts`: 15 canonical moves (Transcend, Generative, Control)
- `lens-moves.ts`: `getMovesForLens(lens)` → subset of moves per Game Master face
- `emotional-alchemy.ts`: `deriveMovementPerNode` (translate/transcend from unpacking)
- `emotional-alchemy-interfaces.md`: Domain↔Move preference, Lens→flavor
- `CustomBar.moveType`: `wakeUp` | `cleanUp` | `growUp` | `showUp` (4 moves, not 15)
- `CustomBar.gameMasterFace`: shaman | challenger | regent | architect | diplomat | sage

### 1.6 Data Models

| ChatGPT | Existing |
|---------|----------|
| `quest_templates` | **Use CustomBar** with `type: 'quest'`, `isSystem: true`. Add `allyshipDomain` to filter. |
| `generated_quests` | **Use PlayerQuest** + ThreadQuest. No "generated" table. |
| `emotional_alchemy_resolution_logs` | **Optional**. Could add for debugging; not required for MVP. |
| `emotional_source_context_tags` | **Add to CustomBar** as optional JSON field if needed. |

---

## 2. Overlap (Avoid Duplication)

### 2.1 Do NOT Create

- **`quest_templates` table** — Use `CustomBar` with a convention (e.g. `campaignRef: 'bruised-banana'`, `type: 'onboarding'`, seed script).
- **`generated_quests` table** — Use `ThreadQuest` + `PlayerQuest` (assign quests to threads, assign threads to players).
- **New `onboarding_completed` event bus** — Use existing `assignOrientationThreads` call sites.
- **New emotional alchemy ontology** — The 15-move system and domain↔move preference already exist. Do not introduce `source_context_tags` / `desired_outcome_tags` as a parallel system unless we map them to the existing channel/unpacking model.

### 2.2 Reuse

- **assignOrientationThreads** — Extend to support domain-biased quest selection when assigning bruised-banana thread.
- **lens→domain mapping** — Already in quest-thread.ts. Use for primary quest selection.
- **CustomBar** — All quests. Add `allyshipDomain` to starter quests; use for domain matching.
- **move-engine.ts, lens-moves.ts** — Canonical moves. Build `resolveMoveForQuest(quest, playerContext)` on top.
- **campaignDomainPreference, storyProgress** — Player context.
- **QuestThread, ThreadQuest** — Thread-based assignment.

---

## 3. Gaps (What to Build)

### 3.1 Domain-Biased Starter Quest Selection

**Current**: All players get same 2 quests (Explore Market, Request from Library).

**Needed**: Primary quest by `intended_impact_domain` (or lens-derived domain):
- GATHERING_RESOURCES → Strengthen the Residency (donation)
- SKILLFUL_ORGANIZING → Declare a Skill
- RAISE_AWARENESS → Invite an Ally OR Create Momentum
- DIRECT_ACTION → Test the Engine (Explore Market is close)

**Implementation**: Extend `assignOrientationThreads` or add `getStarterQuestsForPlayer(playerId)` that returns 1 primary + 2 optional from a pool of CustomBar quests, filtered by domain. Use existing ThreadQuest pattern or a new "starter quest pack" that gets assigned.

### 3.2 Resolve Move from Context (Internal Module)

**ChatGPT wants**: API that takes context tags and returns canonical move.

**Existing**: No such function. `getMovesForLens` takes lens only. Domain↔move preference is documented but not implemented as a resolver.

**Recommended**: Create `src/lib/quest-grammar/resolveMoveForContext.ts`:
```ts
export function resolveMoveForContext(params: {
  allyshipDomain: string
  lens?: string
  campaignPhase?: number
}): CanonicalMove | null
```
- Use `DOMAIN_MOVE_PREFERENCE` from emotional-alchemy-interfaces (domain → preferred moves)
- Use `getMovesForLens` when lens present
- Return first matching move. No HTTP API needed initially; call from quest generation/assignment.

### 3.3 Starter Quest Templates as CustomBars

**ChatGPT 5 templates** — Create as CustomBar records (or extend seed):
1. Strengthen the Residency (GATHERING_RESOURCES) — donation
2. Invite an Ally (RAISE_AWARENESS)
3. Declare a Skill (SKILLFUL_ORGANIZING)
4. Test the Engine (DIRECT_ACTION) — Explore Market or new
5. Create Momentum (RAISE_AWARENESS)

Each with `allyshipDomain`, `moveType` (or derived from resolveMoveForContext). Seed via `seed-onboarding-thread.ts` or new `seed-starter-quest-pool.ts`.

### 3.4 Optional: Emotional Context Tags on CustomBar

If we want quests to request moves by context:
- Add `emotionalContextTags` JSON field to CustomBar (optional)
- Or store in `completionEffects` / `docQuestMetadata` as metadata
- `resolveMoveForContext` could accept `questId` and read tags from CustomBar

---

## 4. Recommended Integration Spec (High Level)

### Phase 1: Extend Existing (No New Tables)

1. **Seed 5 starter quest templates** as CustomBar records with `allyshipDomain`, `campaignRef: 'bruised-banana'`, `type: 'onboarding'`.
2. **Create `resolveMoveForContext`** in quest-grammar — domain + lens → canonical move. Use move-engine + lens-moves + domain preference.
3. **Extend assignOrientationThreads** (or add `assignStarterQuestsForCampaign`) — when lens/campaignDomainPreference present, select 1 primary quest by domain + 2 optional from pool. Assign via ThreadQuest to a "starter" thread or extend bruised-banana-orientation-thread to be dynamic.

### Phase 2: Optional Enhancements

4. **Add `emotionalContextTags` to CustomBar** — if we want template-driven move resolution.
5. **POST /api/quests/generate-starter** — if client needs to fetch starter quests asynchronously. Otherwise, assignment happens server-side in createCampaignPlayer flow.
6. **Log unresolved moves** — when resolveMoveForContext returns null, log for admin review.

### Phase 3: Defer

- `quest_templates` table
- `emotional_alchemy_resolution_logs` table
- Full `source_context_tags` / `desired_outcome_tags` ontology (map to existing channel model if needed later)

---

## 5. File Reference

| Concern | Existing Files |
|---------|----------------|
| Orientation assignment | `src/actions/quest-thread.ts` — assignOrientationThreads |
| Lens→domain | `src/actions/quest-thread.ts` lines 256–267 |
| Campaign signup | `src/app/campaign/actions/campaign.ts` — createCampaignPlayer |
| Canonical moves | `src/lib/quest-grammar/move-engine.ts` |
| Lens moves | `src/lib/quest-grammar/lens-moves.ts` |
| Domain↔move | `.agent/context/emotional-alchemy-interfaces.md` §4 |
| Short wins seed | `scripts/seed-onboarding-thread.ts` §10 |
| CustomBar schema | `prisma/schema.prisma` — CustomBar |
| Bruised Banana spec | `.specify/specs/bruised-banana-post-onboarding-short-wins/spec.md` |

---

## 6. Summary

| ChatGPT Proposal | Recommendation |
|-----------------|----------------|
| quest_templates table | Use CustomBar; seed 5 starter quests |
| generated_quests table | Use ThreadQuest + PlayerQuest |
| POST /emotional-alchemy/resolve-move | Create internal `resolveMoveForContext`; no HTTP API initially |
| POST /quests/generate-starter | Optional; assignment can stay in createCampaignPlayer flow |
| emotional_source_context_tags on quest | Optional JSON on CustomBar |
| 5 starter templates | Seed as CustomBars; map to existing domains |
| Domain matching for primary | Extend assignOrientationThreads or add helper |
| Safe fallback when unresolved | resolveMoveForContext returns null; quest still renders |

**Bottom line**: The prompt's goals (starter quests by domain, canonical emotional move resolution) align with existing architecture. Integrate by extending `assignOrientationThreads`, adding `resolveMoveForContext`, and seeding the 5 templates as CustomBars—without new tables or duplicate ontologies.

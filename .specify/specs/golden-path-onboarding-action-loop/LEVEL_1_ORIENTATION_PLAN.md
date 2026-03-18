# Level 1 Orientation Plan — Unblock the Delightful L1 Experience

**Purpose**: Unblock whatever exists from creating a delightful Level 1 player experience. Deliver Level 1 nation orientation, archetype orientation, and campaign orientation as quests. Define what triggers player level advancement.

---

## Current State (Blockers)

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| **Welcome to the Conclave** thread | `status: 'deprecated'` | Has Nation → Archetype → Signal quests; not assigned (only `active` threads are) |
| **Build Your Character** thread | `status: 'active'` | Single quest; requires nation+archetype already |
| **Bruised Banana orientation** | Dynamic, `status: 'active'` | Assigned only when `lens` from campaign signup |
| **Guided flow** (`/conclave/guided`) | Form-based | Nation/archetype dropdowns; fallback when no orientation |
| **Campaign landing** | Implemented | `/campaigns/[slug]/landing` with inviter, starter quest CTA |
| **Onboarding controller** | Deprecated | `/conclave/onboarding` redirects to Twine or dashboard |

### What Blocks L1

1. **No active nation/archetype orientation** — Main thread is deprecated. New direct signups get no orientation thread → redirect to guided form.
2. **Campaign orientation only for Bruised Banana** — Lens-based; invite path may land on campaign landing but no quest-based campaign orientation.
3. **No player level** — No `playerLevel` field or derivation. Level triggers undefined.
4. **Scattered completion effects** — `setNation`, `setPlaybook`, `markOnboardingComplete` exist in quest-engine; nation/archetype quests exist but thread is deprecated.

---

## Level Triggers (What Advances a Player Level)

### Proposed Derivation (No Schema Change Initially)

Derive `playerLevel` from existing fields. Add `getPlayerLevel(playerId)` server action.

| Level | Condition | Triggers |
|-------|-----------|----------|
| **1** | New player | `!nationId \|\| !archetypeId` OR no campaign orientation completed |
| **2** | Loop established | `nationId && archetypeId` AND (`hasCompletedFirstQuest` OR campaign orientation done) |
| **3** | Creator | Level 2 AND `hasCreatedFirstQuest` |
| **4** | Contributor | Level 3 AND (stewarded slot OR contributed quest to campaign) |
| **5** | Admin | `roles` includes `admin` |
| **6** | Fork owner | Out of scope (deployment) |

### Campaign Orientation Completion

**New**: Track "campaign orientation completed" per player per instance.

- **Option A**: `InstanceParticipation` or `InstanceMembership` — joining a campaign = orientation done.
- **Option B**: Complete a quest with `completionEffects: [{ type: 'completeCampaignOrientation', instanceId: '...' }]`.
- **Option C**: `Player.hasCompletedCampaignOrientation` (boolean) — simple; one campaign. For multi-campaign, extend later.

**Recommendation**: Option B. Create a completion effect `completeCampaignOrientation` that sets a flag or creates `InstanceParticipation`. Reuse existing `InstanceMembership` if it already means "joined campaign."

### Level 1 → 2 Trigger (Concrete)

```
Level 2 when:
  player.nationId != null
  AND player.archetypeId != null
  AND (player.hasCompletedFirstQuest OR hasCompletedCampaignOrientation(playerId, instanceId))
```

---

## Level 1 Orientation Quests

### 1. Nation Orientation (L1)

**Quest**: "Declare Your Nation" (or "Choose Your Nation" for L1 framing)

- **Type**: `onboarding`
- **Twine story**: Narrative CYOA that ends with nation choice. Passes `nationId` to completion.
- **Completion effect**: `setNation` (from input)
- **Unlock**: Visible when `!player.nationId`

**Exists**: `Declare Your Nation` in seed-onboarding-thread. Uses `setNation`. Need to ensure Twine story exists and is published. **Action**: Verify story; if missing, create skeleton or import.

### 2. Archetype Orientation (L1)

**Quest**: "Discover Your Archetype"

- **Type**: `onboarding`
- **Twine story**: Narrative CYOA that ends with archetype choice. Passes `playbookId` to completion.
- **Completion effect**: `setPlaybook` (from input)
- **Unlock**: Visible when `!player.archetypeId` (or after nation done for ordered flow)

**Exists**: Same as nation. **Action**: Verify story; ensure `setPlaybook` maps to `archetypeId`.

### 3. Campaign Orientation (L1)

**Quest**: "Enter the Campaign" (or "Join [Campaign Name]")

- **Type**: `onboarding`
- **Content**: Campaign name, inviter, why it matters. Single CTA: "Accept your first quest" or "Enter the campaign."
- **Completion effect**: `completeCampaignOrientation` (new) — creates `InstanceParticipation` or sets flag; optionally assigns starter quest.
- **Unlock**: Visible when player has invite with `instanceId` or lands on campaign landing, and has not completed campaign orientation for that instance.

**Does not exist** as a dedicated quest. Campaign landing has CTA to accept first quest; no "orientation" quest in between. **Action**: Create quest + completion effect.

---

## Implementation Plan

### Phase 1: Unblock Nation + Archetype (Reactivate or Replace)

1. **Reactivate main orientation thread** OR create new L1 orientation thread.
   - **Option A**: Change `Welcome to the Conclave` from `deprecated` to `active` in seed-onboarding-thread.
   - **Option B**: Create new thread `level-1-orientation-thread` with Nation → Archetype → (Campaign or Signal).
   - **Recommendation**: Option A for speed. The quests exist; the thread is correct. Only status blocks assignment.

2. **Verify Twine stories** for Nation and Archetype:
   - `Declare Your Nation`, `Discover Your Archetype` — must exist and be published.
   - If missing: seed skeleton stories (seed script already has `ensureSkeletonStory`).

3. **Ensure completion effects** work: `setNation`, `setPlaybook` in quest-engine `processCompletionEffects`.

### Phase 2: Campaign Orientation Quest

1. **Add completion effect** `completeCampaignOrientation`:
   - Input: `instanceId` or `instanceSlug`
   - Action: Create `InstanceParticipation` (or `InstanceMembership`) for player + instance.
   - Optionally: assign first campaign quest to player.

2. **Create quest** "Enter the Campaign" (or instance-specific title):
   - Twine or simple form: campaign name, inviter, CTA.
   - Completion effect: `completeCampaignOrientation`.
   - Add to orientation thread when invite has `instanceId` — or as separate thread for campaign path.

3. **Wire campaign landing** → if player not logged in, auth then redirect to `/campaigns/[slug]/landing`. If logged in and no campaign orientation, show quest or CTA that completes it.

### Phase 3: Player Level Derivation

1. **Add `getPlayerLevel(playerId)`** in `src/actions/player-level.ts` or `src/lib/player-level.ts`:
   - Derive from nationId, archetypeId, hasCompletedFirstQuest, hasCreatedFirstQuest, InstanceParticipation, roles.
   - Return 1–5 (6 is fork owner, out of scope).

2. **Add `hasCompletedCampaignOrientation(playerId, instanceId?)`**:
   - Check `InstanceParticipation` or equivalent.

3. **Use in UI**: Pass `playerLevel` to dashboard, modals, GM prompts. Hide L2+ content for L1.

### Phase 4: Level-Aware UI

1. **Dashboard**: When `playerLevel === 1`, show only:
   - Current orientation quest (Nation, Archetype, or Campaign)
   - One CTA. No Explore, Character, Campaign modals. No Journeys, Graveyard.

2. **Progressive unlock**: When level advances, reveal next surfaces.

---

## Tasks (Checklist)

### Phase 1: Unblock Nation + Archetype

- [ ] **T1.1** Change `Welcome to the Conclave` thread `status` from `deprecated` to `active` in seed-onboarding-thread.ts
- [ ] **T1.2** Verify Twine stories "Declare Your Nation", "Discover Your Archetype" exist and are published (run seed, check DB)
- [ ] **T1.3** If missing, ensure skeleton stories are created by seed script
- [ ] **T1.4** Run `npx tsx scripts/seed-onboarding-thread.ts` and verify new players get orientation thread assigned
- [ ] **T1.5** Test: new player (no nation/archetype) → lands on dashboard → sees orientation thread with Nation quest first

### Phase 2: Campaign Orientation

- [ ] **T2.1** Add `completeCampaignOrientation` completion effect in quest-engine (create InstanceParticipation or use existing membership)
- [ ] **T2.2** Create "Enter the Campaign" quest with completion effect
- [ ] **T2.3** Add campaign orientation quest to flow: when invite has instanceId, include in orientation or as separate step
- [ ] **T2.4** Wire campaign landing: logged-in player without campaign orientation sees quest or CTA

### Phase 3: Player Level

- [ ] **T3.1** Create `getPlayerLevel(playerId)` — derive from existing fields
- [ ] **T3.2** Create `hasCompletedCampaignOrientation(playerId, instanceId?)`
- [ ] **T3.3** Document level triggers in PLAYER_LEVELS.md

### Phase 4: Level-Aware UI (Optional / Follow-on)

- [ ] **T4.1** Dashboard: when L1, hide Explore/Character/Campaign modals, Journeys, Graveyard
- [ ] **T4.2** Dashboard: single primary CTA = current orientation quest
- [ ] **T4.3** Pass playerLevel to GM prompts for level-appropriate copy

---

## File Impacts

| File | Change |
|------|--------|
| `scripts/seed-onboarding-thread.ts` | `status: 'active'` for Welcome thread |
| `src/actions/quest-engine.ts` | Add `completeCampaignOrientation` in processCompletionEffects |
| `src/lib/player-level.ts` (new) | getPlayerLevel, hasCompletedCampaignOrientation |
| `src/app/page.tsx` | Use getPlayerLevel for conditional UI (Phase 4) |
| `src/actions/campaign-landing.ts` | Optional: return campaign orientation status |
| `prisma/schema.prisma` | No change for Phase 1–3; InstanceParticipation may already exist |

---

## Dependencies

- **InstanceParticipation** / **InstanceMembership**: Check schema for "player joined instance." If none, use completion effect to create a record or add `Player.hasCompletedCampaignOrientation` (boolean) for single-campaign v1.
- **Twine stories**: Must exist for Nation, Archetype. Run `scripts/import-onboarding-twine.ts` or equivalent if not seeded.

---

## Success Criteria

1. New player (direct signup) gets orientation thread with Nation → Archetype → Signal (or Campaign when applicable).
2. Completing Nation quest sets `player.nationId`.
3. Completing Archetype quest sets `player.archetypeId`.
4. Completing Campaign orientation creates participation record (or equivalent).
5. `getPlayerLevel()` returns correct level based on completion state.
6. Level 2 unlocks when nation + archetype + (first quest OR campaign orientation) complete.

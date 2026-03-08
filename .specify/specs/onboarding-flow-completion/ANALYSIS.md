# Onboarding Flow Completion — Integration Analysis

Maps the external onboarding spec kit (source: user-provided onboarding_spec_kit.md) to the current BARS Engine codebase. API-first, no duplication.

---

## 1. Spec Kit → Current System Mapping

### Part 1: Onboarding State Machine

| Spec | Current | Gap / Action |
|------|---------|--------------|
| `onboarding_state` enum (new_player, campaign_intro, identity_setup, vector_declaration, onboarding_complete, starter_quests_generated) | `Player.onboardingComplete` (boolean), `Player.storyProgress` (JSON), `hasSeenWelcome`, `hasCompletedFirstQuest`, `hasCreatedFirstQuest`, `onboardingCompletedAt` | **Gap**: No explicit state machine. storyProgress.state holds lens, nationId, playbookId, campaignDomainPreference, gm. |
| Event-driven transitions | Implicit: `createCampaignPlayer` → assignOrientationThreads; `processCompletionEffects` → markOnboardingComplete; quest completion → advance thread | **Partial**: Events exist but not as a formal bus. |
| Resumable / deterministic | storyProgress persists; orientation threads have ThreadProgress.currentPosition | **OK**: Resumable via thread position. |

**Recommendation**: Add `onboarding_state` as optional string field on Player (or derive from storyProgress + flags). Defer full state machine until needed for external consumers. Internal flows can continue using storyProgress + thread progress.

---

### Part 2: API Endpoints

| Spec | Current | Gap / Action |
|------|---------|--------------|
| `GET /onboarding/state` → `{ player_id, onboarding_state }` | No such route. `getOnboardingStatus` (server action) returns hasSeenWelcome, hasCompletedFirstQuest, etc. | **Gap**: No HTTP API for onboarding state. |
| `POST /onboarding/advance` → `{ player_id, event }` | No such route. State advances via createCampaignPlayer, quest completion, processCompletionEffects. | **Gap**: No event-driven advance API. |

**Recommendation (API-first)**: Define contract before UI.

- **Route**: `GET /api/onboarding/state` — returns `{ playerId, onboardingState, ... }`. Use Server Action `getOnboardingState()` internally; route wraps it for external callers.
- **Route**: `POST /api/onboarding/advance` — accepts `{ event }`, validates, updates state. Use existing completion flows; route is thin wrapper that emits event and calls existing logic.

---

### Part 3: Nation Registry

| Spec | Current | Gap / Action |
|------|---------|--------------|
| Table `nations` with id, name, description, lore_snippet, icon_url, system_tags | `Nation` model: id, name, description, element, imgUrl, archived, wakeUp/cleanUp/growUp/showUp | **Partial**: name, description, imgUrl exist. No lore_snippet, system_tags. |
| icon_url | imgUrl | **OK**: Same concept. |
| lore_snippet | — | **Gap**: Could add or use description. |
| system_tags | — | **Gap**: Optional. Could add JSON or reuse existing. |

**Recommendation**: Extend Nation with optional `loreSnippet`, `systemTags` (JSON) if needed. Avoid new table; use existing Nation.

---

### Part 4: Archetype Registry

| Spec | Current | Gap / Action |
|------|---------|--------------|
| Table `archetypes` with id, name, description, core_strength, icon_url, system_tags | `Playbook` model: id, name, description, moves, content, centralConflict, primaryQuestion, vibe, energy, etc. | **OK**: Playbook = archetype. Rich fields. |
| core_strength | centralConflict, primaryQuestion, vibe | **OK**: Semantic equivalent. |
| icon_url | — | **Gap**: Playbook has no imgUrl. Could add. |

**Recommendation**: No new table. Playbook is archetype. Add imgUrl to Playbook if icon needed.

---

### Part 5: Starter Quest Trigger

| Spec | Current | Gap / Action |
|------|---------|--------------|
| On `onboarding_completed` → `POST /quests/generate-starter` with player_id, campaign_id | `assignOrientationThreads` called from createCampaignPlayer; bruised-banana-orientation-thread assigned when lens present | **OK**: Trigger exists. |
| Returns 1–3 quests | `getStarterQuestsForPlayer` returns { primary, optional } (1 + 2) | **OK**: Implemented. |
| Emit `starter_quests_generated` | No explicit event. Thread assignment is implicit. | **Gap**: Could add analytics/log event. |
| `onboarding_state` → `starter_quests_generated` | Not tracked. | **Gap**: If we add onboarding_state, set it here. |

**Recommendation**: Keep current flow. Optionally add `POST /api/quests/generate-starter` as thin wrapper around `getStarterQuestsForPlayer` for external/mobile clients. Server Actions remain primary.

---

### Part 6: First Campaign Entry Screen

| Spec | Current | Gap / Action |
|------|---------|--------------|
| "You've entered the Bruised Banana Campaign." | Dashboard shows orientation threads, quests. No explicit "campaign entry" screen. | **Gap**: No dedicated post-onboarding screen. |
| Display Nation, Archetype, Intended Impact, Starter quests | Dashboard shows threads with quests. Nation/playbook in player profile. campaignDomainPreference in storyProgress. | **Partial**: Data exists; no consolidated "campaign entry" view. |
| Optional: active players, new BARs, funding progress | Instance has goalAmountCents, currentAmountCents. Activity feed exists. | **Partial**: Can surface. |

**Recommendation**: Add optional "Campaign Entry" component/section on dashboard when `onboardingComplete` and `campaignRef=bruised-banana`. Reuse existing data. Defer to Phase 2.

---

### Part 7: Strengthen the Residency Quest

| Spec | Current | Gap / Action |
|------|---------|--------------|
| Template `strengthen_residency`, domain `gather_resources` | `starter-strengthen-residency` CustomBar exists, allyshipDomain GATHERING_RESOURCES | **OK**: Implemented. |
| 4 completion options: Contribute Support, Invite an Ally, Share Feedback, Share the Campaign | Current quest has generic Twine (START → STEP_1 → END). No structured 4-option flow. | **Gap**: Options not implemented as distinct completion paths. |
| Completion events: donation_received, invite_sent, feedback_submitted, campaign_shared | No such events. Quest completion uses processCompletionEffects. | **Gap**: Event taxonomy not wired. |

**Recommendation**: Extend Strengthen the Residency Twine with 4 branches (Donate, Invite, Feedback, Share). Each branch can set completion type in inputs. processCompletionEffects can branch on completion type for visible effects (funding, invite count, etc.).

---

### Part 8: Emotional Alchemy Integration

| Spec | Current | Gap / Action |
|------|---------|--------------|
| `POST /emotional-alchemy/resolve-move` with player_id, quest_template_id, source_context_tags, desired_outcome_tags | `resolveMoveForContext` (internal) takes allyshipDomain, lens. No HTTP API. No tag-based ontology. | **Partial**: Internal resolution exists. |
| Quest must NOT define emotional transitions locally | CustomBar has moveType, gameMasterFace. resolveMoveForContext used by getStarterQuestsForPlayer. | **OK**: Move resolved from grammar. |
| If grammar fails: log, quest still renders | resolveMoveForContext returns null; getStarterQuestsForPlayer attaches null resolvedMove. | **OK**: Graceful fallback. |

**Recommendation**: No new HTTP API for emotional alchemy initially. Internal `resolveMoveForContext` suffices. If external consumers need it, add `POST /api/emotional-alchemy/resolve-move` as thin wrapper. Map spec's `source_context_tags` / `desired_outcome_tags` to domain + lens when possible.

---

### Part 9: Visible System Effects

| Spec | Current | Gap / Action |
|------|---------|--------------|
| Funding progress increases | Instance.currentAmountCents, goalAmountCents. Donation flow exists. | **OK**: Exists. |
| Invite counter increases | Invite model. No "invite counter" on campaign. | **Gap**: Could add Instance.inviteCount or similar. |
| Activity feed updates | VibulonEvent, quest completion. | **Partial**: Exists. |
| Vibeulons minted | mintVibulon, VibulonEvent. | **OK**: Exists. |
| Effects update campaign UI immediately | Dashboard revalidates. | **OK**: revalidatePath. |

**Recommendation**: Wire Strengthen the Residency completion to at least one visible effect (e.g. vibeulon mint, funding increment). Ensure completionEffects in quest definition triggers it.

---

## 2. Overlap (Avoid Duplication)

| Spec Proposal | Do NOT Create | Use Instead |
|---------------|---------------|-------------|
| New `nations` table | — | Nation (extend if needed) |
| New `archetypes` table | — | Playbook |
| `quest_templates` table | — | CustomBar with allyshipDomain |
| `generated_quests` table | — | ThreadQuest + PlayerQuest |
| New emotional alchemy ontology | — | move-engine, lens-moves, resolveMoveForContext |
| Parallel state machine | — | Derive from storyProgress + flags or add single field |

---

## 3. API Contract (Deftness: Contract Before UI)

### GET /api/onboarding/state

**Response**:
```json
{
  "playerId": "string",
  "onboardingState": "new_player | campaign_intro | identity_setup | vector_declaration | onboarding_complete | starter_quests_generated",
  "nationId": "string | null",
  "playbookId": "string | null",
  "campaignDomainPreference": ["string"] | null,
  "hasLens": boolean
}
```

**Implementation**: Server Action `getOnboardingState(playerId?)` → route handler returns JSON. Derive `onboardingState` from storyProgress + onboardingComplete + thread progress.

### POST /api/onboarding/advance

**Request**:
```json
{
  "event": "campaign_intro_viewed | nation_selected | archetype_selected | developmental_lens_selected | intended_impact_selected | bar_created | onboarding_completed | starter_quests_generated"
}
```

**Response**:
```json
{
  "success": boolean,
  "onboardingState": "string",
  "error": "string | null"
}
```

**Implementation**: Validate event; map to existing flows (e.g. nation_selected → update Player.nationId; onboarding_completed → assignOrientationThreads, set onboardingComplete). No new tables.

### POST /api/quests/generate-starter (Optional)

**Request**:
```json
{
  "campaignRef": "bruised-banana"
}
```

**Response**:
```json
{
  "primary": { "id": "string", "title": "string", "description": "string", "allyshipDomain": "string", "resolvedMove": { "id": "string", "name": "string" } | null },
  "optional": [...]
}
```

**Implementation**: Thin wrapper around `getStarterQuestsForPlayer(playerId, campaignRef)`.

---

## 4. Implementation Priority (Spec Order, Integrated)

| Priority | Spec Part | Action | Files |
|----------|-----------|--------|-------|
| 1 | State machine | Add `onboarding_state` derivation or optional field; implement GET /api/onboarding/state | `src/actions/onboarding.ts`, `src/app/api/onboarding/state/route.ts` |
| 2 | Starter quest trigger | Already done. Optionally add POST /api/quests/generate-starter | `src/lib/starter-quests.ts`, `src/app/api/quests/generate-starter/route.ts` |
| 3 | Nation/Archetype registries | Extend Nation (loreSnippet?), Playbook (imgUrl?) if needed. No new tables. | `prisma/schema.prisma`, seed |
| 4 | Strengthen the Residency | Extend Twine with 4 completion branches; wire completionEffects | `scripts/seed-onboarding-thread.ts`, CustomBar completionEffects |
| 5 | Emotional grammar | Already done (resolveMoveForContext). No API unless external. | `src/lib/quest-grammar/resolveMoveForContext.ts` |
| 6 | Visible effects | Wire Strengthen completion → vibeulon mint / funding signal | `src/actions/quest-engine.ts`, processCompletionEffects |

---

## 5. Dependencies

- [starter-quest-generator](../starter-quest-generator/spec.md) — done
- [campaign-onboarding-twine-v2](../campaign-onboarding-twine-v2/spec.md) — lens, state in storyProgress
- [bruised-banana-post-onboarding-short-wins](../bruised-banana-post-onboarding-short-wins/spec.md) — bruised-banana-orientation-thread
- [STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md](../../docs/STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md)

---

## 6. Summary

| Spec Goal | Status | Next Step |
|-----------|--------|-----------|
| Deterministic, resumable onboarding | Partial | Add onboarding_state derivation or field |
| GET /onboarding/state | Missing | Create route + Server Action |
| POST /onboarding/advance | Missing | Create route; wire to existing flows |
| Nation/Archetype registries | OK (Nation, Playbook) | Extend fields if needed |
| Starter quest trigger | Done | Optional API wrapper |
| Strengthen the Residency | Exists, generic | Add 4-option Twine + completion effects |
| Emotional grammar | Done | No API unless external |
| Visible system effects | Partial | Wire quest completion to effects |

**Bottom line**: Most infrastructure exists. Add API contracts (GET/POST onboarding), extend Strengthen the Residency quest, and optionally add onboarding_state. No new tables; extend existing models.

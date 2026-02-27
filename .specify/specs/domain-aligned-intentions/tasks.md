# Tasks: Domain-Aligned Intentions (U)

## Phase 1: Predefined options + Choose path

- [x] Create `src/lib/intention-options.ts` with INTENTION_OPTIONS (cross-domain + per-domain)
- [x] Add `intentionMode: 'options'` to QuestDetailModal; render options grid
- [x] Pass `campaignDomainPreference` to QuestDetailModal (via parent)
- [x] Order options: domain-aligned first when preference set; "Following my curiosity" always visible

## Phase 2: Update intention entry point

- [x] Create `src/actions/intention.ts` with `updatePlayerIntention`
- [x] Create `IntentionUpdateModal` (or minimal modal) with three paths
- [x] Dashboard: resolve intention from storyProgress ?? orientation quest
- [x] Dashboard: add "Update intention" button/link near intention display

## Phase 3: Verification quest (required for UI features)

- [x] Add cert-domain-intentions-v1 to seed-cyoa-certification-quests.ts
- [x] Twine story: choose predefined intention → complete → update intention on dashboard

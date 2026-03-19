# Plan: Game Loop — Charge → Quest → Campaign

## Overview

Fix the 321→quest flow, add placement (thread/campaign), and extend the dashboard with campaign overview. Phases are ordered for quick wins first—unblock 321→quest before full placement and dashboard.

**Source**: [STRAND_CONSULT.md](./STRAND_CONSULT.md) — Game Master analysis.

## Phases

### Phase 1: Diagnose and fix 321→quest (quick win)

**Goal**: Ensure "Turn into Quest" from 321 succeeds and surfaces the new quest. Unblock users.

1. **Diagnose** — Add logging to `createQuestFrom321Metadata`; check nation/archetype gate, extractCreationIntent, DB. Verify Shadow321Form `handleTurnIntoQuest` path.
2. **Fix redirect** — After create, redirect to Hand with `?quest=<id>` (or `/hand?quest=<id>`). Ensure `router.push` and `router.refresh` work.
3. **Surface quest** — Hand or dashboard should highlight the newly created quest. Optional: placement modal on Hand when `?quest=` present.

**File impacts**:
- `src/actions/charge-metabolism.ts` — add logging; optional `target` param for placement
- `src/components/shadow/Shadow321Form.tsx` — fix redirect (Hand with quest param)
- `src/app/hand/page.tsx` — read `?quest=`; optionally show placement modal

### Phase 2: Placement API and Hand integration

**Goal**: Players can add quests (from 321 or BARs) to threads or as subquests on the gameboard.

1. **Placement API** — Create or extend `src/actions/quest-placement.ts`: `addQuestToThread`, `addQuestAsSubquestToGameboard`, `getPlacementOptionsForQuest`.
2. **Hand extension** — Add personal quests (unplaced); "Add to thread" / "Add as subquest to gameboard" actions.
3. **Post-321 placement** — After create, show placement options. Limit to 2–3 suggested (Challenger: minimal path).
4. **Quest detail** — For orphan quests, show placement actions in QuestDetailModal or Hand card.

**File impacts**:
- `src/actions/quest-placement.ts` (new or extend)
- `src/app/hand/page.tsx` — personal quests, placement actions
- `src/components/shadow/Shadow321Form.tsx` — placement UI after create (or redirect to Hand with modal)
- `src/components/QuestDetailModal.tsx` — placement actions for orphan quests

### Phase 3: Dashboard campaign overview

**Goal**: "Campaigns I'm responsible for" and "next effective milestone" on dashboard. Start minimal.

1. **Campaign responsibility query** — Campaigns where player is leader/owner. Instance membership + role.
2. **Next milestone** — Per campaign: key quest or Kotter stage. Minimal: progress bar for key quests.
3. **Dashboard section** — Add "Campaigns I'm responsible for" with 2–3 prioritized. Reduce overwhelm (Diplomat, Shaman).

**File impacts**:
- `src/actions/campaign.ts` or new `getCampaignsForPlayer` — campaigns where player leads/owns
- `src/app/page.tsx` or dashboard component — campaign overview section
- Schema: Instance, InstanceMember, role—verify exists

## Dependencies

- [Game Loop BARS↔Quest↔Thread↔Campaign](../game-loop-bars-quest-thread-campaign/spec.md) — placement API contracts
- QuestThread, ThreadQuest, GameboardSlot
- Instance, InstanceMember (campaign ownership)

## Verification

- 321 → Turn into Quest → Quest created → Redirect to Hand with quest visible
- Hand: "Add as subquest to gameboard" → Quest appears under slot
- Hand: "Add to thread" → Quest appears in thread
- Dashboard: "Campaigns I'm responsible for" (when player leads campaigns)
- `npm run build` and `npm run check` pass

# Plan: Phase 1 Face Moves Remainder

## Summary

Implement Challenger (issue challenge, propose move), Architect (offer blueprint via fork integration), and Diplomat (offer connection, host event). All moves create CustomBar via `createFaceMoveBar`. API-first: define actions, then wire UI.

## Prerequisites

- [game-master-face-moves](../game-master-face-moves/spec.md) Phase 1 partial — Shaman, Regent, Sage done
- `createFaceMoveBar`, `createFaceMoveBarAs` in [src/actions/face-move-bar.ts](../../src/actions/face-move-bar.ts)
- `FACE_MOVE_TYPES` includes challenger, architect, diplomat

## Phase 1: Server Actions

### 1.1 Add actions to face-move-bar.ts

| Action | Face | MoveType | Notes |
|--------|------|----------|-------|
| `issueChallenge` | challenger | issue_challenge | Wrapper around createFaceMoveBar |
| `proposeMove` | challenger | propose_move | Import ALL_CANONICAL_MOVES; random pick if moveId omitted |
| `offerConnection` | diplomat | offer_connection | Self-directed for MVP |
| `hostEvent` | diplomat | host_event | Thin wrapper |

### 1.2 Extend forkQuestPrivately

In [src/actions/gameboard.ts](../../src/actions/gameboard.ts), after creating the fork and before `revalidatePath`:

```ts
await createFaceMoveBar('architect', 'offer_blueprint', {
  title: `Blueprint: ${original.title}`,
  description: original.description,
  barType: 'vibe',
  questId: original.id,
  metadata: { forkedQuestId: fork.id },
})
```

Use `createFaceMoveBarAs(player.id, ...)` if needed for creator context.

## Phase 2: Hand Page UI

### 2.1 Face Moves section

Add collapsible section to [src/app/hand/page.tsx](../../src/app/hand/page.tsx):

- **Issue challenge**: Title + description inputs; optional quest select (from active quests); submit → `issueChallenge`
- **Get move**: Single button → `proposeMove({})`; show result or redirect
- **Offer connection**: Suggested player name + message; submit → `offerConnection`
- **Host event**: Title + description; submit → `hostEvent`

Use client component for forms (or inline server actions with `useTransition`). Keep styling consistent with existing hand page (zinc, purple accents).

## File Impacts

| Action | Path |
|--------|------|
| Modify | src/actions/face-move-bar.ts (add issueChallenge, proposeMove, offerConnection, hostEvent) |
| Modify | src/actions/gameboard.ts (forkQuestPrivately — add Architect BAR) |
| Modify | src/app/hand/page.tsx (add Face Moves section) |

## Implementation Order

1. Add `issueChallenge`, `proposeMove`, `offerConnection`, `hostEvent` to face-move-bar.ts
2. Extend forkQuestPrivately with Architect offer_blueprint
3. Add Face Moves UI to hand page
4. Run `npm run build` and `npm run check`

## Verification

- Execute each move; verify CustomBar created with correct `gameMasterFace` and `completionEffects.faceMove.moveType`
- Fork a quest from gameboard; verify Architect BAR created
- Hand page renders Face Moves section; forms submit without error

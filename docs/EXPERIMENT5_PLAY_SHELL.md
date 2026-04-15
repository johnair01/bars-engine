# Experiment 5: Play Shell + Hub Adapter

## Goal
Build a one-shot GUI vertical slice that keeps hub-and-spoke boundaries:
- Spoke UI: `/play`
- Hub logic: BAR and quest resolution adapters on server

## Implemented

1. `src/app/play/page.tsx`
- Replaced old loop page with Experiment 5 shell container.
- Loads recent BAR context for current player.

2. `src/components/play/Experiment5PlayShell.tsx`
- Scene toggle (`farm` / `forest`)
- Nation selector (5 nations)
- Sprite grid using Experiment 4 nation variants
- Charge input
- Buttons:
  - `Resolve quest proposals` -> `POST /api/play/resolve`
  - `Seed interaction BAR` -> `POST /api/bars`

3. `src/app/api/play/resolve/route.ts`
- Session-authenticated adapter (no `BARS_API_KEY` exposed client-side).
- Resolves player campaign context from latest `InstanceMembership` or active instance.
- Builds BAR analysis signal from charge/bar text.
- Calls `resolveQuestForPlayer(...)` in hub domain.

4. `src/app/api/play/sprites/[nation]/[asset]/route.ts`
- Serves Experiment 4 files from:
  - `content/assets/experiments/exp4/variants/{nation}/{asset}`
- Strict filename and nation validation.

## Contract

### `POST /api/play/resolve`
Request:
```json
{
  "chargeText": "string",
  "scene": "farm | forest",
  "nationKey": "argyra | lamenth | meridia | pyrakanth | virelune"
}
```

Response (200):
- `collective`
- `player`
- `proposals`
- `meta`
- `sourceBar`

Error:
- `401` if not logged in
- `400` for bad payload or missing campaign context
- `404` if downstream entities are missing

## Notes
- This is a vertical slice, not full runtime.
- The adapter is intentionally server-side to preserve secret boundaries and keep `/play` as a spoke.

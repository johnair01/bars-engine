# Plan: Inner Garden Emulator Shell

## Objective

Make Inner Garden playable and legible as a handheld-console style game inside bars-engine, without rewriting the vanilla game or changing the BAR bridge contract.

The work ships in two milestones:

1. Mobile-control hotfix.
2. Emulator shell redesign with cartridge lobby, app-owned system overlays, and viewport prototypes.

## Phase 1 — Mobile-Control Hotfix

Fix the immediate blockers without changing the player-facing route architecture.

Implementation decisions:

- Keep keyboard controls working.
- Keep `inner-garden-control.v1` temporarily.
- Add `inner-garden-control.v2` as the semantic control contract.
- Translate semantic controls to durable game input inside the vanilla game.
- Replace one-frame virtual taps with a queued/tick-consumed input mechanism.
- Add visible Back/Escape control.

Acceptance:

- Portrait mobile D-pad moves the player.
- A/B trigger primary game actions.
- Back/Escape can close/cancel game UI.
- Controls do not require a physical keyboard.

## Phase 2 — Cartridge Lobby

Replace the current BAR-list-first `/inner-garden` page with a game entry lobby.

Implementation decisions:

- `/inner-garden` becomes a cartridge-style lobby.
- The player can start without selecting a BAR.
- Eligible BAR seed selection moves to an app-owned overlay.
- The lobby must still allow a player to choose a raw Hand/Vault BAR before entering.
- Existing direct links with `barId` must keep working.

Acceptance:

- `/inner-garden` feels like a pre-game entry surface.
- The old eligible BAR list is not the primary page layout.
- Starting without a BAR reaches `/inner-garden/play?chapter=1`.
- Selecting a BAR reaches `/inner-garden/play?chapter=1&barId=...`.

## Phase 3 — Console Runtime Shell

Redesign `/inner-garden/play` as the canonical console runtime.

Implementation decisions:

- Use the Gameboy-style shell on both desktop and mobile.
- Mobile portrait layout has the screen above physical-style controls.
- Desktop centers the console shell with a larger screen and visible controls.
- Remove competing app chrome from the play surface where possible.
- Preserve the iframe-based vanilla runtime for this milestone.

Required controls:

- D-pad: up, down, left, right
- A: primary interact
- B: action / secondary
- Start: system overlay
- Select: BAR seed overlay
- Back: overlay close or game Escape

Acceptance:

- The game reads visually as a console, not a webpage iframe.
- Controls are discoverable and usable.
- The screen and controls do not overlap.

## Phase 4 — App-Owned System Overlays

Add React-owned overlays for shell-level interaction while preserving canvas gameplay.

App overlays:

- system / pause menu
- controls help
- BAR seed selection
- import status
- completion result status

Implementation decisions:

- Start toggles system overlay.
- Select opens BAR seed overlay.
- Back closes topmost overlay, otherwise sends Escape to the game.
- Canvas NPC dialogs and canvas menu remain in the game for this milestone.

Acceptance:

- A player can access controls help without keyboard.
- A player can import a BAR from an overlay.
- Import and completion status are visible outside the canvas.
- App overlays do not permanently block play.

## Phase 5 — Viewport Prototype Review

Prototype and compare two map presentation strategies before refactoring the game viewport.

Prototype A:

- Keep current 960x640 canvas/map/camera.
- Frame it inside the emulator shell.

Prototype B:

- Use the existing `CanvasScaler` direction to test a smaller handheld internal viewport.
- Adjust only enough to produce comparable screenshots.

Acceptance:

- Capture matched desktop and mobile screenshots for both prototypes.
- Choose one viewport strategy before deeper map or asset work.
- Do not change farming, BAR bridge, map data, or asset pipeline as part of the prototype unless required to render the comparison.

## File Impacts

Likely runtime files:

```text
src/app/inner-garden/page.tsx
src/app/inner-garden/play/InnerGardenPlayClient.tsx
public/inner-garden-game/js/core/Game.js
public/inner-garden-game/js/core/Input.js
public/inner-garden-game/js/core/CanvasScaler.js
scripts/smoke-inner-garden-game.mjs
```

Likely test additions:

```text
src/lib/inner-garden/__tests__/bridge.test.ts
scripts/smoke-inner-garden-game.mjs
```

## Verification

Run:

- existing Inner Garden bridge tests
- Inner Garden static smoke check
- route validation if route annotations change
- browser verification on mobile portrait and desktop

Required screenshots:

- cartridge lobby
- mobile console shell
- desktop console shell
- system overlay
- BAR seed overlay
- imported BAR state
- Prototype A viewport
- Prototype B viewport

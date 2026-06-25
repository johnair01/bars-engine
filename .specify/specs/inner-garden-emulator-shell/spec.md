# Spec: Inner Garden Emulator Shell

## Problem

The current Inner Garden app route proves the vanilla game can boot inside bars-engine and receive BAR imports, but it does not yet provide a playable handheld experience.

Immediate feedback from the playtest:

- Mobile controls do not reliably work.
- There is no visible Escape/Back control.
- The app shell feels like a webpage with an iframe rather than a game threshold.
- The `/inner-garden` entry page still behaves like a BAR list instead of a game lobby.
- Mobile and desktop need a coherent presentation model for the map, screen, and controls.

This spec governs the next Inner Garden UX slice. It supersedes the previous "iframe plus mobile dock" approach for presentation and controls, but it does **not** replace the existing BAR bridge contracts.

## Authority And Cross-Links

This spec kit is the implementation authority for Inner Garden emulator-shell UX.

Related authority remains in:

- [`six-guide-calrunia-orientation/PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md`](../six-guide-calrunia-orientation/PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md)
- [`six-guide-calrunia-orientation/BARS_CALRUNIA_WORLD_MECHANICS.md`](../six-guide-calrunia-orientation/BARS_CALRUNIA_WORLD_MECHANICS.md)

Inherited decisions:

- Inner Garden is the canonical Calrunian play layer for this slice.
- Pixi remains deprecated as the canonical runtime.
- bars-engine owns auth, BARs, campaigns, persistence, and return-path artifacts.
- Inner Garden owns seed/card/cultivation gameplay.
- The bridge owns translation between the two.

## User Stories

### US1: Enter Inner Garden As A Game

As a Mastering Allyship player, I want `/inner-garden` to feel like a game entry point, so that entering Calrunia feels like crossing a threshold rather than opening another utility list.

Acceptance:

- `/inner-garden` shows a cartridge-style pre-game lobby.
- The player can start Inner Garden without choosing a BAR.
- The player can choose an eligible BAR seed from the lobby or a system overlay.
- The old raw BAR list is no longer the primary entry experience.

### US2: Play On Mobile Without A Keyboard

As a mobile player, I want reliable on-screen controls, so that I can move, interact, act, open system UI, select a BAR, and cancel without a physical keyboard.

Acceptance:

- D-pad movement works on portrait mobile.
- A/B controls map to the current game actions.
- Start opens a system overlay.
- Select opens BAR seed selection/import overlay.
- Back closes overlays or sends Escape/cancel to the game.
- Touch controls do not cover the game screen.

### US3: Keep Desktop Play Legible

As a desktop player, I want the same game identity with better space, so that desktop does not feel like a different product.

Acceptance:

- Desktop uses the same emulator-shell metaphor.
- Keyboard controls remain active.
- Visible buttons remain available for discoverability.
- The screen is larger on desktop, but the shell language remains coherent.

### US4: Preserve The BAR Bridge

As a player importing a raw BAR, I want the BAR to still become game material and return as a linked result, so the UX redesign does not break the core Shaman loop.

Acceptance:

- `bars-inner-garden.v1` still imports one eligible BAR as seed + witness card.
- `inner-garden-bars.v1` still creates one linked Chapter 1 Shaman result BAR.
- Direct links using `/inner-garden/play?chapter=1&barId=...` still work.

## Hostile Six Game Master Review

### Shaman

The current build has no ritual coherence. The player enters "Inner Garden," but the body experience says "webpage with a tiny iframe." If this is supposed to feel like crossing into Calrunia, the shell must become part of the fiction: cartridge, console, screen, controls, pause layer. Otherwise the world never arrives.

### Challenger

The controls failing is not an isolated bug; it is the truth leaking out. The previous slice shipped a screenshot solution, not a play solution. The next acceptance test must be hostile: on an actual portrait mobile viewport, can a player move, cancel, open/close overlays, select choices, and return to play without a keyboard?

### Regent

The current `/inner-garden` page has unclear authority. Is it a selector, lobby, game route, or BAR intake page? Governance says: `/inner-garden` becomes the cartridge lobby, `/inner-garden/play` becomes the console runtime, BAR selection becomes an overlay, and bridge contracts remain stable.

### Architect

The iframe bridge is viable, but the input contract is too primitive. Raw key strings are a leaky abstraction. The next contract must use semantic controls: `up`, `down`, `left`, `right`, `a`, `b`, `start`, `select`, `back`. The viewport question must be prototyped before refactoring the map.

### Diplomat

This should be framed as "the demo taught us what the real interaction model needs," not "the previous patch was bad." The screenshots were useful. The player feedback is more useful. The spec should preserve momentum while naming that this is now a console UX problem, not just a button placement problem.

### Sage

The correct move is two-step: fix playability immediately, then redesign the shell. Do not mix nation, sect, or campaign systems into this pass. The purpose of this spec is entry, controls, overlays, and viewport proof. The deeper curriculum can wait until the game can be comfortably held.

## Control Contract

The current `inner-garden-control.v1` raw-key bridge may remain during migration.

The canonical next contract is `inner-garden-control.v2`:

```ts
type InnerGardenControlV2 = {
  schemaVersion: 'inner-garden-control.v2'
  control: 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select' | 'back'
  action: 'press' | 'release' | 'tap'
}
```

Required mappings:

| Control | Game Meaning |
| --- | --- |
| `up/down/left/right` | movement |
| `a` | primary interact |
| `b` | action/cancel-adjacent action |
| `start` | app-owned system overlay |
| `select` | BAR seed/import overlay |
| `back` | close overlay or Escape/cancel in game |

The game must consume virtual taps durably. A tap cannot disappear because it was cleared before the next game update.

## Route Authority

| Route | Role |
| --- | --- |
| `/inner-garden` | Cartridge lobby / pre-game entry |
| `/inner-garden/play` | Authenticated console runtime |
| `/inner-garden/play?chapter=1&barId=...` | Direct runtime entry with BAR import |
| `/inner-garden-game/index.html` | Static vanilla runtime, not primary player-facing app route |

## Overlay Policy

React app shell owns system overlays:

- pause / system menu
- controls help
- BAR seed selection
- import status
- completion / result status

The vanilla canvas keeps these for this slice:

- NPC dialog
- existing in-game menu
- current BAR capture canvas flow
- farming/cultivation loop

Overlay behavior:

- Start opens or closes the system overlay.
- Select opens BAR seed selection.
- Back closes the topmost app overlay; if none is open, it sends Escape/cancel to the game.
- App overlays must not permanently block play.

## Viewport Prototypes

Prototype A: current map/assets/camera framed in emulator shell.

Prototype B: handheld internal viewport using the existing `CanvasScaler` direction.

Rules:

- Capture matched desktop and mobile screenshots for both prototypes.
- Do not refactor maps, assets, farming, or BAR bridge logic until screenshots prove Prototype B is better.
- The viewport decision must be made from visual proof, not preference.

## Out Of Scope

- No new database tables.
- No full React rewrite of the vanilla game.
- No nation, sect, or full Guide campaign progression.
- No Pixi runtime revival.
- No map/asset rewrite until the viewport prototype review is complete.

## Acceptance Summary

- `/inner-garden` is a cartridge lobby.
- `/inner-garden/play` is a console runtime.
- Mobile controls work without a keyboard.
- Escape/Back exists and cancels correctly.
- BAR import and completion bridge behavior remains intact.
- Screenshots prove the lobby, mobile console, desktop console, overlays, and viewport prototypes.

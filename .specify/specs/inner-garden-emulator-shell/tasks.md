# Tasks: Inner Garden Emulator Shell

## Spec Kit

- [x] T1: Create `spec.md` with player problem, user stories, hostile six-face review, route authority, control contract, overlay policy, viewport prototypes, and acceptance criteria.
- [x] T2: Create `plan.md` with phased implementation order and verification requirements.
- [x] T3: Create `tasks.md` as the working implementation checklist.

## Cross-Link Authority

- [x] T4: Cross-link `six-guide-calrunia-orientation/PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md`.
- [x] T5: Cross-link `six-guide-calrunia-orientation/BARS_CALRUNIA_WORLD_MECHANICS.md`.
- [x] T6: State that this spec supersedes the previous iframe/dock UX decisions without replacing the BAR bridge contracts.

## Phase 1 — Mobile-Control Hotfix

- [x] T7: Add `inner-garden-control.v2` semantic control handling.
- [x] T8: Preserve `inner-garden-control.v1` raw-key compatibility during migration.
- [x] T9: Replace one-frame virtual taps with durable queued input consumed by the next game update.
- [x] T10: Add visible Back/Escape control to the mobile shell.
- [x] T11: Map `a`, `b`, `start`, `select`, and `back` to the correct shell/game behaviors.
- [x] T12: Add a mobile control smoke check that verifies D-pad, A/B, Start, Select, and Back.

## Phase 2 — Cartridge Lobby

- [ ] T13: Replace `/inner-garden` primary layout with a cartridge-style pre-game lobby.
- [ ] T14: Add Start Garden action that enters `/inner-garden/play?chapter=1`.
- [ ] T15: Add Choose BAR Seed action that exposes eligible raw Hand/Vault captures.
- [ ] T16: Preserve direct `/inner-garden/play?chapter=1&barId=...` import entry.
- [ ] T17: Ensure the old eligible BAR list is no longer the primary page experience.

## Phase 3 — Console Runtime Shell

- [ ] T18: Redesign `/inner-garden/play` as the console runtime shell.
- [ ] T19: Add mobile portrait shell with screen above controls.
- [ ] T20: Add desktop shell with centered console frame and visible controls.
- [ ] T21: Remove or suppress competing app chrome from the play surface where practical.
- [ ] T22: Ensure screen and controls never overlap.

## Phase 4 — App-Owned System Overlays

- [ ] T23: Add React system/pause overlay opened by Start.
- [ ] T24: Add controls help overlay.
- [ ] T25: Add BAR seed selection overlay opened by Select.
- [ ] T26: Add import status overlay/state.
- [ ] T27: Add completion/result status overlay/state.
- [ ] T28: Implement Back behavior: close top overlay, otherwise send Escape/cancel to game.
- [ ] T29: Keep canvas NPC dialog and canvas menu operational for this milestone.

## Phase 5 — Viewport Prototype Review

- [ ] T30: Capture Prototype A using current 960x640 map/camera framed in the console shell.
- [ ] T31: Build Prototype B using the existing `CanvasScaler` direction for a handheld internal viewport.
- [ ] T32: Capture matched desktop and mobile screenshots for both prototypes.
- [ ] T33: Record the viewport decision before any deeper map or asset refactor.

## Bridge Regression

- [ ] T34: Verify `bars-inner-garden.v1` still imports one eligible BAR as one seed and one witness card.
- [ ] T35: Verify `inner-garden-bars.v1` still creates one linked Chapter 1 Shaman result BAR.
- [ ] T36: Verify no database schema changes were introduced.

## Acceptance Review

- [ ] T37: Confirm mobile play requires no physical keyboard.
- [ ] T38: Confirm `/inner-garden` reads as a game lobby, not a utility list.
- [ ] T39: Confirm `/inner-garden/play` reads as a console runtime, not a webpage iframe.
- [ ] T40: Confirm app-owned overlays do not permanently block play.
- [ ] T41: Attach or link final screenshots for lobby, mobile shell, desktop shell, overlays, import state, and viewport prototypes.

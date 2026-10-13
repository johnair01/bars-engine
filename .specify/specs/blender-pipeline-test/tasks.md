# Tasks: Blender pipeline test plan

## The plan (this thread, 2026-10-13)

- [x] [claude] Read the call sheet, the hardening kit, the cave-studio kit, the README, #285's diff and the manifest.
- [x] [claude] Write spec.md (the tests, tiers, kill lines, fixtures, the score trap) and plan.md (files, order, CI).
- [x] [claude] Reach test on every fork: none reach Wendell. Each stands as a council position in spec.md.
- [x] [claude] Found on reading the code, recorded as known-gap tests: G2 (a sidecar with no `license` key crashes
  instead of stopping cleanly) and G2b (`build_viewer.py --allow-restricted` lets a Royalty Free model into a page,
  against `cs-cc0-or-own`). Neither is fixed here.

## Before the build (next thread)

- [ ] [claude] Falsify: R2 twice on #285's branch. Byte for byte, or which mesh differs.
- [ ] [claude] Check whether #285 has merged; if so, plan against main.
- [ ] [claude] Read the Painted Wooden Chair 02 id from its sidecar into `fixtures.json`.

## Build

- [ ] [claude] 1. Offline tier: G1, G2, G2b, G6, G7, and the CI step. G2 and G2b marked known gaps.
- [ ] [claude] 2. Raise G2 and G2b on the board as positions (the record answers them).
- [ ] [claude] 3. `bpy` tier: G3 to G5, R1 to R3, W1 to W4. Commit `walk_keys.json` after W3's frames are looked at.
- [ ] [claude] 4. Contact sheet, `LOOKED.md`, first look written.
- [ ] [claude] 5. Network tier: V1, A1 to A4, N1, N2, N4, N5 (N5 in the background).
- [ ] [claude] 6. After #285 merges: P1 to P6, dressing pieces on the sheet.

## Steps only Wendell can take

- [ ] [wendell] N3 is `cave-studio-02`, already on Your steps.
- [ ] [wendell] E3, after the first republish (the build thread writes the step then, with both links).

## Verify and ship

- [ ] [claude] Offline and `bpy` tiers pass on main in one run; summary pasted here.
- [ ] [claude] Definition of done in spec.md checked.
- [ ] [claude] Ledger record written; call sheet updated.

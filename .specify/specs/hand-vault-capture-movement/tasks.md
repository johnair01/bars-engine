# Tasks: Hand/Vault — Capture Routing + Bidirectional Movement

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). Fixes issue #132. API-first order. No migration. Check off as completed.

## Phase 0 — Prerequisites (verify, already shipped)

- [x] **T0.1** `HandSlot` model + base actions (`addBarToHandForPlayer`, `promoteVaultBarToHand`, `depositHandBarToVault`, `resolveOverflow`, `readHandDb`) exist in `src/actions/hand.ts` + `src/lib/hand-service.ts`.
- [x] **T0.2** `captureBar` (`src/actions/capture-bar.ts`) + `CaptureBox` Hand/Vault toggle + inline overflow modal work as reference.
- [ ] **T0.3** Confirm no `CustomBar.location`/Hand field is needed (reuse `HandSlot`) — recorded in spec Design Decisions.

## Phase 1 — Capture routes to Hand (API → UI)

- [ ] **T1.1** `src/actions/bars.ts` — extend `captureBarFromCanvas`: after creating the BAR, `await addBarToHandForPlayer(playerId, bar.id)` (import from `@/lib/hand-service`). Return `{ barId, title, placedIn: 'hand' }`, or `{ barId, title, placedIn: 'vault' }` when the Hand is full (Fork A: no `overflow` needed for the canvas — the BAR simply stays in the Vault). Keep existing `revalidatePath` calls. Type-check green.
- [ ] **T1.2** `src/components/bars/SeedCaptureWhiteboard.tsx` (`handleCapture`) — branch on result: `placedIn:'hand'` → `setCaptured` "in your Hand"; `placedIn:'vault'` (Hand full, **Fork A**) → `setCaptured` + **Vault-fallback toast** "Hand full — saved to Vault; hold it later" (no modal); `error` → `setCaptureError`. Run media upload in both non-error branches.
- [ ] **T1.3** `src/components/now/OverflowModal.tsx` — extract the overflow markup from `CaptureBox.tsx` into a shared component; refactor `CaptureBox` to use it (no behavior change). (Whiteboard does **not** use it — Fork A is silent fallback; extraction is for reuse/testability.)
- [ ] **T1.4** `src/components/bars/SimpleCaptureForm.tsx` — pass `destination: 'hand'`; route to `/bars/kept?dest=hand`.
- [ ] **T1.5** `src/app/bars/kept/page.tsx` — confirm `dest=hand` copy/links read correctly ("landed in your Hand"; onward to Tune / Now).
- [ ] **T1.6** Verify on `/`: a whiteboard capture appears in the Hand glance and does not increment Vault (unless Hand was full).

## Phase 2 — Bidirectional movement UI

- [ ] **T2.0** Discovery — enumerate the exact Vault/feed/garden list components that render owned BAR rows (under `src/components/hand/Vault*`, garden list, feed). Record the target files here before editing.
- [ ] **T2.1** Movement copy constants (`HOLD_IN_HAND` / `RETURN_TO_VAULT`) in one shared module so `hand-vault-rename` can repoint. **No `getBarHandState` action** — compute `inHand`/`handFull` inline in the server components from `HandSlot` (Architect).
- [ ] **T2.2** `src/components/hand/HandLocationToggle.tsx` (new, client) — "Hold in Hand" (Vault→Hand via `promoteVaultBarToHand`) / "Return to Vault" (Hand→Vault via `depositHandBarToVault`); non-blocking hand-full message; `compact?` prop for list rows; `router.refresh()` after success. Visibly distinct from the Compost affordance (Return ≠ archive).
- [ ] **T2.3** `src/app/bars/[id]/page.tsx` — render `HandLocationToggle` (~L216), seeded with inline `inHand`/`handFull`. **Gate to `isOwner` only** (never `isRecipient`). Honor Fork B eligibility (non-planted in v1).
- [ ] **T2.4** Vault/feed/garden rows (files from T2.0) — add compact `HandLocationToggle` on owned-BAR rows.
- [ ] **T2.5** `src/components/now/HandGlance.tsx` — empty slot: replace the `/bars/create` link with a Vault-picker control (bottom-sheet of Vault BARs) → `promoteVaultBarToHand(targetSlot)`; keep a "create new" affordance.

## Phase 3 — Verification Quest

- [ ] **T3.1** `scripts/seed-hand-vault-movement-cert.ts` — idempotent seed for `cert-hand-vault-movement-v1` (TwineStory + CustomBar, `isSystem: true`, `visibility: 'public'`, deterministic id). Steps per spec; Bruised Banana framing.
- [ ] **T3.2** `package.json` — add `"seed:cert:hand-vault-movement": "tsx scripts/seed-hand-vault-movement-cert.ts"`.
- [ ] **T3.3** Run the seed; confirm the quest is completable end to end.

## Phase 4 — Fail-Fix & Backlog

- [ ] **T4.1** `npm run build` — green.
- [ ] **T4.2** `npm run check` — lint + type-check green.
- [ ] **T4.3** Manual mobile pass (360px): whiteboard capture → Hand; detail toggle both ways; full-hand overflow; empty-slot pull.
- [ ] **T4.4** Confirm `BACKLOG.md` entry; run `npm run backlog:seed`.
- [ ] **T4.5** Comment resolution summary on issue #132; check off completed tasks here.

## Out of scope

- `CustomBar.location` column (rejected — `HandSlot` encodes location).
- Changing `CaptureBox` default-Vault behavior.
- Hand reordering / carrying-slot semantics (owned by `hand-vault-bounded-inventory`).
</content>

# Tasks: Hand/Vault — Capture Routing + Bidirectional Movement

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). Fixes issue #132. API-first order. No migration. Check off as completed.

## Phase 0 — Prerequisites (verify, already shipped)

- [x] **T0.1** `HandSlot` model + base actions (`addBarToHandForPlayer`, `promoteVaultBarToHand`, `depositHandBarToVault`, `resolveOverflow`, `readHandDb`) exist in `src/actions/hand.ts` + `src/lib/hand-service.ts`.
- [x] **T0.2** `captureBar` (`src/actions/capture-bar.ts`) + `CaptureBox` Hand/Vault toggle + inline overflow modal work as reference.
- [x] **T0.3** Confirm no `CustomBar.location`/Hand field is needed (reuse `HandSlot`) — recorded in spec Design Decisions.

## Phase 1 — Capture routes to Hand (API → UI)

- [x] **T1.1** `src/actions/bars.ts` — extended `captureBarFromCanvas`: after creating the BAR, `addBarToHandForPlayer(playerId, bar.id)` (imported from `@/lib/hand-service`). Returns `{ barId, title, placedIn: 'hand' | 'vault' }`; Hand full → BAR stays in Vault, `placedIn: 'vault'` (Fork A). Existing `revalidatePath` calls kept. Type-check green.
- [x] **T1.2** `src/components/bars/SeedCaptureWhiteboard.tsx` — `captured` state carries `placedIn`; `CapturedOverlay` shows "Held in your Hand" or the Vault-fallback line ("Hand full — saved to your Vault. Hold it later from your Hand."). No modal. Media upload unchanged (runs before `setCaptured` in the non-error path).
- [ ] **T1.3** `src/components/now/OverflowModal.tsx` — extract the overflow markup from `CaptureBox.tsx` into a shared component. **Deferred**: Fork A means the whiteboard never needs it, and `CaptureBox` already works inline; pure refactor, low value now. Left as follow-up.
- [x] **T1.4** `src/components/bars/SimpleCaptureForm.tsx` — passes `destination: 'hand'`; derives `dest` from the result (Vault fallback) and routes to `/bars/kept?dest=…`.
- [x] **T1.5** `src/app/bars/kept/page.tsx` — `dest=hand` reads "landed in your Hand"; secondary CTA → `/hand` ("Go to your Hand").
- [ ] **T1.6** Verify on `/`: a whiteboard capture appears in the Hand glance and does not increment Vault (unless Hand was full). **Pending manual run** (build blocked by Google Fonts network fetch in sandbox; code paths type-check clean).

## Phase 2 — Bidirectional movement UI

- [x] **T2.0** Discovery — owned BAR rows: Vault private drafts render via the large shared `StarterQuestBoard` (high-risk to thread per-row state through → deferred); the **Garden list** (`src/app/bars/garden/page.tsx`) is a clean server component with maturity in hand → chosen as the list surface for v1.
- [x] **T2.1** `src/lib/hand-movement.ts` — `HOLD_IN_HAND` / `RETURN_TO_VAULT` / `HAND_FULL_HINT` constants + `isHandVaultMovable(maturity)` (Fork B). **No `getBarHandState` action** — `inHand`/`handFull` computed inline via `readHandDb` in the server components.
- [x] **T2.2** `src/components/hand/HandLocationToggle.tsx` (new, client) — "Hold in Hand" / "Return to Vault" via `promoteVaultBarToHand` / `depositHandBarToVault`; non-blocking hand-full hint; `compact?` prop; `router.refresh()` after. Distinct from Compost (no archive).
- [x] **T2.3** `src/app/bars/[id]/page.tsx` — renders the toggle in a location section, gated to `isOwner` + capture types + `isHandVaultMovable` (Fork B). `inHand`/`handFull` read inline from `readHandDb`.
- [x] **T2.4** Garden rows (`src/app/bars/garden/page.tsx`) — compact `HandLocationToggle` on movable owned rows (sibling of the row `Link` to avoid nested interactives). Vault `StarterQuestBoard` rows deferred per T2.0.
- [x] **T2.5** `src/components/now/HandGlance.tsx` — empty slot opens an `EmptySlotSheet` bottom-sheet (lazy-loads `listMovableVaultBars`) → `promoteVaultBarToHand({ barId, targetSlot })`, plus a "+ Capture new" link. New read action `listMovableVaultBars` in `src/actions/hand.ts`.

## Phase 3 — Verification Quest

- [ ] **T3.1** `scripts/seed-hand-vault-movement-cert.ts` — idempotent seed for `cert-hand-vault-movement-v1` (TwineStory + CustomBar, `isSystem: true`, `visibility: 'public'`, deterministic id). Steps per spec; Bruised Banana framing.
- [ ] **T3.2** `package.json` — add `"seed:cert:hand-vault-movement": "tsx scripts/seed-hand-vault-movement-cert.ts"`.
- [ ] **T3.3** Run the seed; confirm the quest is completable end to end.

## Phase 4 — Fail-Fix & Backlog

- [~] **T4.1** `npm run build` — **blocked in sandbox**: Turbopack fails fetching Google Fonts (Geist, Geist Mono, Press Start 2P) — a network restriction, not a code error. Re-run in an environment with outbound font access.
- [x] **T4.2** `tsc --noEmit` clean; `eslint` on changed files: 0 errors (3 pre-existing/style warnings). (`npm run check` also runs `prisma generate` + build-reliability; type-check + lint are the code gates and pass.)
- [ ] **T4.3** Manual mobile pass (360px): whiteboard capture → Hand; detail toggle both ways; full-hand fallback; empty-slot pull. **Pending** (needs running app).
- [ ] **T4.4** Confirm `BACKLOG.md` entry; run `npm run backlog:seed`.
- [ ] **T4.5** Comment resolution summary on issue #132; check off completed tasks here.

## Out of scope

- `CustomBar.location` column (rejected — `HandSlot` encodes location).
- Changing `CaptureBox` default-Vault behavior.
- Hand reordering / carrying-slot semantics (owned by `hand-vault-bounded-inventory`).
</content>

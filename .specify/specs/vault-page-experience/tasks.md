# Tasks: Vault Page Experience

Spec: [.specify/specs/vault-page-experience/spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## Phase A — Vault UX (style guide)

- [x] **VPE-A1**: Add aggregate **counts** for Private drafts, Personal quests, Charge captures on `/hand` (efficient queries).
- [x] **VPE-A2**: Implement **collapsible** sections with default **collapsed** when count > threshold (config constant, e.g. `VAULT_COLLAPSE_THRESHOLD=5`).
- [x] **VPE-A3**: **Load more** or capped initial render for draft/quest lists (match UI guide: no unbounded dense scroll).
- [x] **VPE-A4**: **Header summary row** — counts + placeholder for primary CTA (wire to compost route when VPE-C exists).
- [x] **VPE-A5**: Optional **staleness** indicator (“idle 30+ days”) — `createdAt` + `VAULT_STALE_DAYS` (see `src/lib/vault-ui.ts`).
- [x] **VPE-A6**: Audit **duplicate nav** on Vault header; remove or consolidate pills per spec FR-A4.
- [x] **VPE-A7**: Self-check vs [UI Style Guide](/wiki/ui-style-guide); note gaps in PR or `docs/` if any remain.

**Implementation notes (2026-03-17):** `src/lib/vault-ui.ts` constants; `VaultSummaryStrip`, `VaultCollapsibleSection`, `VaultLoadMore`, `VaultQuickLinks`; `src/app/hand/page.tsx` refactored; unplaced quest count uses `threadQuests: { none: {} }` for accuracy.

## Phase E — Vault nest (rooms + four moves)

Design: [VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md)

- [x] **VPE-E1**: Add nested routes `/hand/charges`, `/hand/quests`, `/hand/drafts`, `/hand/invitations` with **full** lists (reuse lobby query logic; DRY via shared module — `src/lib/vault-queries.ts`, `VAULT_ROOM_LIST_CAP`).
- [ ] **VPE-E2**: **`VaultFourMovesStrip`** (or `VaultRoomMoves`) — Wake Up / Clean Up / Grow Up / Show Up with **room-specific** actions + links to `/hand/moves` + wiki.
- [ ] **VPE-E3**: **Lobby** (`/hand`) — add prominent **“Open room”** cards or links; optionally reduce duplicate long lists to teasers (coordinate with product).
- [ ] **VPE-E4**: Breadcrumbs / **← Vault** on nested pages; optional `hand/layout.tsx` subnav.
- [ ] **VPE-E5**: Extend [UI Style Guide](/wiki/ui-style-guide) Vault subsection with **rooms + four moves** pattern.
- [x] **VPE-E6**: Rename stray copy **“Quest Wallet”** → **Vault** in primary app surfaces (`/hand/moves`, forge-invitation, game-map, landing, charge explore, unpack flows, bars nav). Older specs may still say Quest Wallet.

## Phase B — Caps

- [x] **VPE-B1**: Define **config source** for `maxPrivateDrafts` / `maxUnplacedQuests` — `VAULT_MAX_PRIVATE_DRAFTS`, `VAULT_MAX_UNPLACED_QUESTS` in `src/lib/vault-limits.ts` (+ defaults).
- [x] **VPE-B2**: **`assertCanCreatePrivateDraft`** — `createCustomBar` (private unassigned), `createChargeBar`.
- [x] **VPE-B3**: **`assertCanCreateUnplacedVaultQuest`** — `createQuestFrom321Metadata`, `growQuestFromBar`, `createQuestFromSuggestion`, `createQuestFromWizard` (private + category `quest` or 321 link).
- [x] **VPE-B4**: **`VAULT_CAP_MESSAGES`** — errors point to Vault Drafts / Quests rooms; compost referenced as future.
- [x] **VPE-B5**: **`npm run test:vault-limits`** — `readVaultCap` parsing (no DB).
- [x] **VPE-B6**: **`docs/ENV_AND_VERCEL.md`** — Vault caps subsection for operators/players with env table.

## Phase C — Vault Compost v1

- [x] **VPE-C1**: Finalize **eligibility** matrix (which `CustomBar` rows can be composted).
- [x] **VPE-C2**: Prisma **`CompostLedger`** (or agreed model) + **`npm run db:sync`** + migration for production path per repo rules.
- [x] **VPE-C3**: Server action: **compost transaction** (ledger + archive/delete sources).
- [x] **VPE-C4**: Vault **CTA** → compost flow (page or modal).
- [x] **VPE-C5**: **Salvage payload** schema (JSON) documented in spec or code comments.
- [x] **VPE-C6**: Copy pass: **compost / metabolize** framing (Voice Style Guide).
- [x] **VPE-C7**: Tests for compost happy path + rollback on failure.

**Implementation notes (2026-03-21):** `compostEligibleWhere` + `loadCompostEligibleBars` in `src/lib/vault-queries.ts`; `src/lib/vault-compost.ts` (`VaultSalvagePayload`, `parseSalvagePayload`); `src/actions/vault-compost.ts` (`runVaultCompost` transaction: ledger → archive `CustomBar` → `playerQuest.deleteMany`); `/hand/compost` + `VaultCompostClient`; `VaultSummaryStrip` CTA; `npm run test:vault-compost`. Migration `20260317180000_add_compost_ledger`.

## Phase D — Hard compost (deferred)

- [ ] **VPE-D1**: Spike: organizer input = ledger only; output = suggestion list (no auto-merge).
- [ ] **VPE-D2**: Wire optional agent/worker — behind feature flag.

## Verification (each phase)

- [ ] `npm run build` && `npm run check`
- [ ] Backend/tests if touching Python: `cd backend && make check` (N/A unless shared APIs)

## Sage / analysis

- [x] **VPE-S1**: [VAULT_ANALYSIS.md](./VAULT_ANALYSIS.md) + Sage `sage_consult` synthesis captured.

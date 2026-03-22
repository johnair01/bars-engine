# Plan: Vault Page Experience

Implement per [.specify/specs/vault-page-experience/spec.md](./spec.md). Checklist: [.specify/specs/vault-page-experience/tasks.md](./tasks.md).

## Phase A — Readability & style-guide alignment (UI only)

**Goal:** Vault feels **calm and scannable** at any inventory size.

1. **`src/app/hand/page.tsx`** — Fetch **counts** for each section (aggregate queries or lightweight `count` + existing lists with `take` / cursor).
2. **Section components** — Collapsible panels with **badge titles** (`Private drafts (N)`).
3. **`StarterQuestBoard` / list wrappers** — “Show 5” + **Load more** OR virtualized short list; align with wiki (avoid infinite scroll for dense actions).
4. **Header** — Summary strip: counts + optional staleness (if cheap query).
5. **Wiki / dev note** — One-line reference that Vault follows [UI Style Guide](/wiki/ui-style-guide).

**Files (expected):** `src/app/hand/page.tsx`, `src/components/hand/*`, possibly `src/components/StarterQuestBoard.tsx`, shared `CollapsibleVaultSection` utility.

**Follow-on:** Phase E splits content into **nested pages** — see [VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md).

---

## Phase B — Inventory caps

**Goal:** **Regent** rules — bounded drafts and unplaced quests.

1. **Config** — `AppConfig` keys or env (`VAULT_MAX_PRIVATE_DRAFTS`, `VAULT_MAX_UNPLACED_QUESTS`) — exact mechanism in tasks.
2. **Enforcement** — Central helper `assertVaultCapacity(playerId, kind)` used by:
   - BAR creation (private draft path)
   - Quest creation from BAR / 321 that creates **unplaced** personal quest
3. **Errors** — User-safe messages + link to Vault / compost when Phase C exists.

**Files (expected):** `src/lib/vault-limits.ts` (new), `src/actions/create-bar.ts` (or equivalent), quest-creation actions, Prisma queries as needed.

**Schema:** Prefer **no** migration if caps are config-only; if tracking compost sessions needs DB, defer to Phase C.

---

## Phase C — Vault Compost v1

**Goal:** Repeatable **game loop** — salvage + release; **ledger** for future organizer.

1. **Prisma** — `CompostLedger` (or named) model + migration **or** reuse existing tables if design fits — see spec FR-C3.
2. **Server action / route** — Transaction: validate eligibility → write ledger → archive sources.
3. **UI** — `/hand/compost` or modal wizard from Vault CTA: multi-select → salvage fields → confirm.
4. **Rewards** — Minimal v1 (ledger + optional badge/vibeulon) — align with economy tasks.

**Files (expected):** `prisma/schema.prisma`, `src/app/hand/compost/page.tsx` (or modal), `src/actions/vault-compost.ts`, tests.

---

## Phase D — Hard compost organizer (later)

**Goal:** Batch suggestions from **ledger**, not raw vault.

- Spike: read N ledger entries → produce merge/cluster suggestions (rules or agent).
- **Separate PR** after Phase C stable.

---

## Phase E — Vault nest (rooms + four moves)

**Goal:** Vault feels like a **place** — **lobby** at `/hand`, **rooms** for real work; each room is a **move surface** for the **4 Moves** (see `src/app/hand/moves/page.tsx`).

**Design:** [.specify/specs/vault-page-experience/VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md)

1. **Routes** — `src/app/hand/charges/page.tsx`, `quests/page.tsx`, `drafts/page.tsx`, `invitations/page.tsx` (reuse queries from lobby; extract shared data loaders to `src/lib/vault-queries.ts` or similar).
2. **Layout** — optional `src/app/hand/layout.tsx` enhancements: subnav “Rooms” or card links from lobby.
3. **`VaultFourMovesStrip`** — props: `room: 'charges' | 'quests' | 'drafts' | 'invitations'`; maps each move to links/actions (EFA for Clean Up, etc.).
4. **Lobby** — slim to teasers + deep links to rooms (incremental: can ship routes first, then thin lobby).

---

## Ambiguity score: ~0.25

Open: exact cap numbers, vibeulon rewards, delete vs archive default — resolve in Phase B/C tasks with product sign-off.

**Phase E:** Room-specific verbs per move — resolve with copy pass + [Voice Style Guide](/wiki/voice-style-guide).

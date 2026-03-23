# Spec: Vault Page Experience — Caps, Compost Loop, Style-Guide Alignment

## Purpose

The **Vault** (`/hand`, titled “Vault”) is where players hold **private drafts**, **charge captures**, **unplaced personal quests**, and **invitation BARs**. As creation tools improve, the Vault risks becoming an **infinite inbox** — overwhelming, hard to scan, and misaligned with the [UI Style Guide](/wiki/ui-style-guide) principle: **uncluttered by default**.

This spec defines:

1. **Information architecture** on the Vault that matches the wiki (counts, progressive disclosure, calm lists).
2. **Inventory limits** (BAR drafts, unplaced quests) so “law” bounds overload (Regent/Challenger).
3. A **Vault Compost** gameplay loop: players **salvage** useful parts from stale BARs/quests and **release** the rest — framed as care, not shame (Diplomat).
4. A **future** “hard compost” pipeline that organizes suggestions using **compost ledger output**, not a raw vault dump (Sage integration).

**Background:** [VAULT_ANALYSIS.md](./VAULT_ANALYSIS.md) (Six Faces, gaps, Sage `sage_consult` synthesis).

**Nested place model:** [VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md) — Vault is **not only one page**; it is a **small place** with **rooms** (nested routes), **depth** (lobby vs work surfaces), and **four moves** on each room page so navigation reinforces **useful throughput**.

**Practice:** Deftness Development — dual-track (works without AI); compost ledger is structured input for optional organizer.

---

## Problem Statement

| Issue | Evidence / risk |
|-------|-------------------|
| Unbounded lists | Private drafts query has **no `take`**; personal quests can grow without UX brakes. |
| Style guide drift | Wiki asks for collapsible sections, count badges, load-more; Vault is a long vertical stack. |
| No game rule for hoarding | Players are never asked to **choose** what to keep; cognitive and DB growth unbounded. |
| “Hard compost” needs signal | Batch organization only works after **noise reduction** — compost produces that signal. |
| Flat vault | One scroll does not feel like a **place**; players need **rooms** to **peek** and **dig in**. |

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Vault route** | **Lobby** at `/hand`; **rooms** at nested paths (e.g. `/hand/drafts`, `/hand/quests`) — see [VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md). |
| **Four Moves on every room** | Each room page exposes **Wake Up / Clean Up / Grow Up / Show Up** (throughput moves from `/hand/moves`) as **concrete affordances**, not wiki-only links. |
| **Depth / order** | Lobby stays **shallow**; **dense** work lives in rooms (“most useful / richest work” **deeper** — players **choose** to enter). |
| **Limits (v1)** | **Configurable** via env — `VAULT_MAX_PRIVATE_DRAFTS` (default 100), `VAULT_MAX_UNPLACED_QUESTS` (default 50). `0` or negative = **unlimited**. Implemented in `src/lib/vault-limits.ts`. |
| **Over-cap behavior** | Player **cannot create** new drafts/quests until under cap **or** they complete **Vault Compost** / archive / place — Regent clarity first. |
| **Staleness** | Today `CustomBar` has **`createdAt` only** (no `updatedAt`). v1 staleness = age since `createdAt`, or add `updatedAt` in a migration if “last touched” is required. |
| **Compost (v1)** | **Salvage** structured snippets (title fragment, tags, optional vibeulon shard) + **archive or delete** source per product policy; persist a **compost ledger** row per session for downstream organizer. |
| **Hard compost (later)** | Async job or agent step reading **ledger + player prefs**; out of scope for v1 except **schema/API hook**. |
| **Existing fields** | Prefer `CustomBar.archivedAt`, `mergedIntoId` where applicable before new models. |

---

## User Stories

### P1: Vault matches UI style guide (readability)

**As a** player with many drafts, **I want** the Vault to show **counts** and **collapsed sections** by default when I have many items, **so** I stay oriented without scrolling fatigue.

**Acceptance:**

- Section headers show **badges** (e.g. “Private drafts (12)”).
- When count **> threshold** (configurable, e.g. 5), default **collapsed** with one-line teaser or “Expand”.
- Long lists use **pagination or “Load more”**, not unbounded scroll for dense actions.
- [UI Style Guide](/wiki/ui-style-guide) self-check documented in tasks.

### P2: Command center header

**As a** player, **I want** a short **summary row** at the top (counts, optional staleness hint, one primary action), **so** I know “where I am in my work” (Sage).

**Acceptance:**

- At least: total drafts, unplaced quests, charge captures (if any).
- Optional v1: “X items idle 30+ days” if staleness computed.
- Primary CTA: **Enter Vault Compost** when compost is implemented; until then, link to **most urgent** surface (e.g. oldest draft) or placeholder copy approved by design.

### P3: Inventory caps (Regent)

**As a** player, **I want** clear **rules** on how many drafts and unplaced quests I may hold, **so** the game feels fair and bounded.

**Acceptance:**

- Server-side enforcement: creating a draft or unplaced quest **fails** with a clear message when over cap.
- Message explains **paths down**: compost, archive, place quest, delete (per policy).
- Caps readable from admin or config (no magic numbers only in component code).

### P4: Vault Compost — repeatable “quest”

**As a** player over cap or with stale items, **I want** to **break down** selected BARs/quests into **useful parts** and **release** the rest, **so** clearing the Vault feels like a **game**, not punishment.

**Acceptance:**

- Flow: select 1+ eligible items → **salvage** (structured fields) → **confirm release** of remainder.
- **Repeatable**; no one-shot flag required.
- Rewards: **compost ledger** entry + optional **small in-game reward** (e.g. vibeulons, badge) — exact economy in tasks.
- Copy uses **compost / metabolize** framing (Voice Style Guide: presence, no shame).

### P5: Hard compost organizer (v2 placeholder)

**As a** player who composts regularly, **I want** a later **organize** pass that **clusters** and **suggests merges**, **so** I benefit from cleanup without raw-AI-on-whole-vault.

**Acceptance (v2):**

- Input = **compost ledger** (+ optional player tags), not full vault snapshot.
- Delivered as separate milestone; this spec only **reserves** ledger shape and API stub if needed.

### P6: Vault as nested rooms (place, not only a page)

**As a** player, **I want** the Vault to feel like **a place with rooms** I can **enter**, **so** I can **peek** from the lobby and **go deeper** only when I’m ready to work.

**Acceptance:**

- **Lobby** (`/hand`) provides orientation + **links into** room routes; long lists may be **teasers** or remain summarized (product choice).
- At least these **rooms** exist as routes (exact slugs per [VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md)): charges, quests, drafts, invitations; compost when Phase C ships.
- Collapsibles on the lobby **do not** replace room pages — they complement **peek** behavior.

### P7: Four Moves strip on every room page

**As a** player in a Vault room, **I want** the **four throughput moves** to be **actionable here**, **so** visiting the page means I can **Wake Up / Clean Up / Grow Up / Show Up** in ways that match **this** room.

**Acceptance:**

- Shared component (e.g. `VaultFourMovesStrip`) on each room with **room-specific** primary actions per move (see design note).
- Links to `/hand/moves` and wiki remain as **reference**, not the only implementation.
- Face-move mint actions (`FaceMovesSection` scale) stay **out of scope** for this requirement unless product ties them in later.

---

## Functional Requirements

### Phase A — Vault UX (no schema required)

- **FR-A1**: Section headers with **count badges** for Private drafts, Personal quests, Charge captures.
- **FR-A2**: **Collapsible** sections when item count > threshold.
- **FR-A3**: **Truncate + expand** or “Load more” for draft/quest lists.
- **FR-A4**: Reduce redundant **local nav chrome** on Vault if it duplicates global nav (design discretion).

### Phase B — Caps

- **FR-B1**: Configurable **max private draft BARs** per player (active, visibility private, unclaimed, non-invite).
- **FR-B2**: Configurable **max unplaced personal quests** (same definition as `hand/page.tsx` query).
- **FR-B3**: Enforce on **create** paths (server actions / API); return actionable errors.
- **FR-B4**: Document caps in [wiki/game rules](/wiki/rules) or player-facing FAQ if they exist.

### Phase C — Vault Compost v1

- **FR-C1**: Eligibility rules (e.g. private draft, unplaced quest; exclude system/invite BARs).
- **FR-C2**: **Compost session** UX (multi-select → salvage form → confirm).
- **FR-C3**: Persist **CompostLedger** (or equivalent) with: `playerId`, `createdAt`, `sources[]`, `salvagePayload` JSON, `outcome` enum.
- **FR-C4**: Soft-delete or **archive** sources per retention policy (align with `archivedAt`).

### Phase D — Hard compost (optional, later)

- **FR-D1**: Worker or agent reads ledger; outputs suggestions; **no** requirement in v1.

### Phase E — Vault nest (rooms + four moves)

- **FR-E1**: Nested routes under `/hand` for each **room** (charges, quests, drafts, invitations; compost when ready).
- **FR-E2**: **Lobby** lists may be reduced to **counts + short teasers + “Open room →”** as implementation catches up (avoid duplicating full lists on lobby + room indefinitely).
- **FR-E3**: **`VaultFourMovesStrip`** (or equivalent) on every room page — four buttons/rows with **room-scoped** server actions or links.
- **FR-E4**: Breadcrumb or persistent **← Vault** back to lobby on all nested pages.
- **FR-E5**: Optional: shared layout `src/app/hand/(vault)/layout.tsx` for nav between rooms.

---

## Non-Goals (v1)

- Full merge UI for all BAR types.
- AI-generated prose for every compost action.
- Changing `/bars` or global quest list — Vault-scoped only.
- Fixing unrelated performance issues unless blocking caps/compost.

---

## Dependencies

- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) — **hard vault gate** on CYOA spokes; **[vault compost modal mini-game](../vault-compost-minigame-modal/spec.md)** (stub) for in-flow capacity relief
- [VAULT_ANALYSIS.md](./VAULT_ANALYSIS.md)
- [VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md)
- `src/app/hand/page.tsx`, `src/components/hand/*`, `StarterQuestBoard`
- [UI Style Guide](/wiki/ui-style-guide) — `src/app/wiki/ui-style-guide/page.tsx`
- Prisma `CustomBar` (`archivedAt`, `mergedIntoId`, etc.)

---

## Acceptance (release gate)

- [ ] `npm run build` && `npm run check` pass.
- [ ] New server paths covered by tests where logic is non-trivial (caps, compost transaction).
- [ ] Player-facing copy reviewed against [Voice Style Guide](/wiki/voice-style-guide).

---

## Changelog

| Date | |
|------|--|
| 2026-03-17 | Initial spec kit from Vault analysis + Sage consult. |
| 2026-03-21 | Nested Vault rooms + Four Moves per room ([VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md)); Phase E in spec. |
| 2026-03-21 | **Phase B**: inventory caps — `vault-limits.ts`, env vars, enforcement on create paths (see tasks.md). |
| 2026-03-21 | **Phase C**: Vault Compost v1 — `CompostLedger`, `/hand/compost`, `runVaultCompost`, `VaultSalvagePayload` in `src/lib/vault-compost.ts`; migration `20260317180000_add_compost_ledger`. |
| 2026-03-18 | Linked **modal compost mini-game** spec (stub) for hub/spoke CYOA hard gate without leaving journey. |

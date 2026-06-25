# Spec: Core Game Loop Audit

## Purpose

Audit the **core game loop** — how a BAR (the engine's core artifact) flows from
capture through to a quest or daemon — and identify the gaps ("holes") so we can
pave them deliberately. The loop's *mechanics* mostly exist as server actions and
are partly wired; the failure is that the loop is **fractured across pages with
unclear pathways**, and one surface (Tap the Vein) is islanded from the BAR system
entirely.

**Problem**: a player can't fluidly run the intended loop. Inventory is scattered
across 5+ pages; you can't add charge to an existing BAR or launch a 3·2·1 from
one; daemons have no hub to connect to; and committed TTV tasks never become BARs.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over
AI. This is an **audit + remediation map**: each hole below is a scoped fix that
can ship independently and may graduate to its own spec.

## The canonical loop

```
capture a BAR → fill it with charge → do a 3·2·1 on it → grow it to a quest → have it exist as a daemon
```

Every stage should be reachable **from the BAR itself** (the artifact owns its
destinations — see `src/lib/navigation-contract.ts`), and every BAR should be
visible in one place.

## Audit (status as of this spec)

| # | Stage | Status | Evidence | Hole |
|---|-------|--------|----------|------|
| 1 | **Capture a BAR** | ✅ EXISTS | `src/app/bars/capture/page.tsx`, `src/actions/capture-bar.ts:47` (`captureBar`), `createBarForUpload` (`bars.ts:97`) | — |
| 2 | **Vault — see all BARs** | ⚠️ FRAGMENTED | `/vault` (lobby), `/vault/charges`, `/vault/quests`, `/bars` (created/received/sent), `/bars/garden` (seeds) | No single "all my BARs" surface; 5+ pages to see the full inventory |
| 3 | **BAR detail + actions** | ⚠️ PARTIAL | `/bars/[id]/page.tsx:25`; `GrowFromBar` (`src/components/bars/GrowFromBar.tsx`) has Plant-as-Quest / Wake-a-Daemon / Forge-Artifact; tune at `/bars/[id]/tune` | No "add charge" and no "do a 3·2·1" action on the BAR; tune is a separate page |
| 4 | **Charge a BAR** | ⚠️ ISOLATED | charge is its own type `charge_capture` (`charge-capture.ts:67`); listed at `/vault/charges` | Can't attach/raise charge **on an existing BAR**; charge ≠ a property of a BAR |
| 5 | **3·2·1 on a BAR** | ⚠️ PARTIAL | `/shadow/321?chargeBarId=` (`shadow/321/page.tsx`); reachable via `/vault/charges → Explore` or standalone | No "Do a 3·2·1 on this" button on BAR detail or the charge card |
| 6 | **Grow to quest** | ✅ EXISTS | `growQuestFromBar` (`bars.ts:779`) wired via `GrowFromBar` on BAR detail; `NAV.grow_quest` | — |
| 7 | **Daemons** | ⚠️ PARTIAL | `/daemons` (own discovered); `growDaemonFromBar` (`bars.ts:865`) → `discoverDaemon('bar')`; `summonDaemon` | No **hub** to browse/connect to daemons; personal-only, no shared/community daemons |
| 8 | **TTV ↔ BAR** | ❌ MISSING | `src/actions/tap-the-vein.ts` never touches `CustomBar`; `TapTheVeinTask` has no `barId` | Committed TTV tasks never become BARs — TTV dead-ends, isolated from the loop |

## The holes (remediations)

Ordered by leverage — each is independently shippable.

### H1 — TTV tasks become BARs *(highest leverage; unblocks the loop for TTV)*
A committed `TapTheVeinTask` should create a linked `CustomBar` (type `bar`,
maturity `captured`) so the task can then be tuned, charged, 3·2·1'd, grown to a
quest, or become a daemon — i.e., TTV feeds the loop instead of dead-ending.
- **Prisma**: `TapTheVeinTask.barId String?` (soft link; `CustomBar` stays the
  projection, the task stays canonical for lifecycle — per the TTV migration spec).
- **API**: extend `commitTask` to also create the BAR (reusing the `captureBar`
  create path) and store `barId`; idempotent (create only when `barId` null).
- **UI**: task cards link to their BAR; "upgrade to quest" routes through
  `growQuestFromBar(task.barId)` instead of the current status-only stub.

### H2 — Unified "all my BARs" view
One surface listing every BAR the player holds (bar + charge + quest + seed),
filterable by type/maturity — instead of 5 fragmented pages.
- **UI**: a single `/bars` (or `/vault/all`) index over `listMyBars` +
  charges + quests + garden seeds, with type/maturity filters. Reuse existing
  `list*` actions; no new persistence.

### H3 — "Do a 3·2·1 on this" from a BAR
Add the 3·2·1 launch to the artifact's action set.
- **UI**: a button on `/bars/[id]` (and on the charge card) →
  `/shadow/321?chargeBarId={id}&returnTo=/bars/{id}`. The runner already accepts
  `chargeBarId`. Add `'321'` to the `GrowFromBar` form set (or a sibling action row).

### H4 — Charge an existing BAR
Make charge a thing you can **add to** a BAR, not only a separate capture.
- **Decision needed**: model charge as (a) a property/meter on `CustomBar`
  (`intensity` exists — extend semantics) vs (b) a link from a `charge_capture`
  BAR to a target BAR. Spec the smaller of the two; default to **(a)** — raise
  `intensity` / attach an emotional-alchemy tag on an existing BAR via the tune
  surface, surfaced as "add charge."

### H5 — Daemon hub (browse + connect)
A place daemons "exist" that players can browse and connect to, beyond their own
summoned list.
- **UI**: `/daemons` gains a discovery/hub view (shared/community daemons +
  connect/summon). **Decision needed**: are non-owned daemons visible, and what
  does "connect" grant? (move-set extension vs follow). Likely its own spec.

### H6 — Inline tune on BAR detail
Fold the `/bars/[id]/tune` fields (nation, intensity, emotional-alchemy tag,
moveType) into an inline edit on the detail page so capture → tune is one surface.

## API / data summary (API-first)

| Hole | Prisma | Action(s) |
|------|--------|-----------|
| H1 | `TapTheVeinTask.barId String?` | extend `commitTask`; route `upgradeTask` through `growQuestFromBar` |
| H2 | — | reuse `listMyBars` / charges / quests / garden |
| H3 | — | none (link to existing `/shadow/321`) |
| H4 | extend `CustomBar.intensity` semantics (no new column) | `tuneBar`/`addCharge` |
| H5 | TBD (own spec) | extend `daemons` actions |
| H6 | — | reuse tune action |

## Conceptual Model

| Dimension | Mapping |
|-----------|---------|
| WHAT | BAR (`CustomBar`) — the artifact that flows the loop |
| Energy | charge (`charge_capture` / `intensity`) fuels it; Vibeulons reward completion |
| Throughput | Wake (capture) → Clean (3·2·1) → Grow (quest) → Show (daemon/quest work) |

## Verification

- Per remediation: `npm run build` + `npm run check`; a `cert-*` verification
  quest for any user-facing change (per spec-kit Verification Quest rule).
- Loop smoke (manual, L4): capture a BAR → add charge → 3·2·1 → grow to quest →
  grow to daemon, **all reachable from the BAR**; and: commit a TTV task → see it
  as a BAR in the unified view → grow it.

## Out of scope
- Rebuilding existing mechanics (capture/grow/321 runner all stay).
- The TTV Tier 2 economy / idea-storm / inline-321 (separate spec
  `tap-the-vein-tier-2`); H1 (TTV→BAR) is the bridge and is tracked here + there.

## Remediation order (recommended)
1. **H1 — TTV→BAR** (unblocks TTV, smallest schema delta)
2. **H3 — 3·2·1 from a BAR** (button only)
3. **H2 — unified BAR view** (reuses existing actions)
4. **H6 — inline tune** (UI consolidation)
5. **H4 — charge an existing BAR** (needs a model decision)
6. **H5 — daemon hub** (graduate to its own spec)

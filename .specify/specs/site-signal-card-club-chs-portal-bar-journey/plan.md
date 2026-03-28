# Plan: Site signal — Card Club + CHS portal BAR journey

Implement per [.specify/specs/site-signal-card-club-chs-portal-bar-journey/spec.md](./spec.md). **Order: Phase A → Phase B → Phase B2** (Sage consult + landing signal).

## Phase A — World lobby (fast path)

| Area | Files / anchors |
|------|-----------------|
| Librarian | [`src/components/world/AnchorModal.tsx`](../../../src/components/world/AnchorModal.tsx) — new branch `librarian_npc` |
| Nation gate | [`src/app/world/[instanceSlug]/[roomSlug]/page.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/page.tsx) (RSC: load player + room, redirect or pass `blocked` prop) **and/or** [`RoomCanvas.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx) (client guard before `router.push` on embassy portals) |
| Data | `getCurrentPlayer` + `nation` include; `MapRoom` query includes `roomType`, `nationKey` |
| Nation key mapping (SCL-A2) | **Player:** `getPlayerNationKey` — `slugifyName(Player.nation.name)` when `nationId` set; else `avatarConfig.nationKey` (lowercase). **Room:** `MapRoom.nationKey` (seed: `pyrakanth`, `lamenth`, `virelune`, `argyra`). Match is case-insensitive. **Embassy:** `anchor.config` JSON `{ nationKey }` must match a `nation_room` on the same map. |
| Seeds | [`scripts/seed-bar-lobby-world.ts`](../../../scripts/seed-bar-lobby-world.ts) — verify `nationKey` on nation rooms matches `Nation` keys in DB |

## Phase B — Portal CYOA + BAR clarity

| Area | Files |
|------|--------|
| Copy / graph | Portal adventure passages (admin or `scripts/seed-campaign-portal-adventure.ts` / instance-linked adventure) |
| Player UI | [`AdventurePlayer.tsx`](../../../src/app/adventure/[id]/play/AdventurePlayer.tsx) — contextual strip for hex/face; post–bar_emit CTA to `/library` when `campaignRef` + `portalSpokeIndex` set |
| BAR templates | [`emit-bar-from-passage`](../../../src/actions/emit-bar-from-passage.ts) / passage `metadata` for move-typed defaults |
| Milestone copy | Links to `/campaign/board`, `/event`, etc., driven by instance — avoid fake ticks |

## Phase B2 — Landing-first + quest leg + admin LEGO (FR-B6–B9)

| Track | Intent | Primary artifacts |
|-------|--------|-------------------|
| **Routing** | Spoke entry shows landing before CYOA | [`/campaign/landing`](../../../src/app/campaign/landing/) (or CHS successor), hub/spoke links, [CHS spec](../campaign-hub-spoke-landing-architecture/spec.md), [CHS_RUNTIME_DECISIONS](../campaign-hub-spoke-landing-architecture/CHS_RUNTIME_DECISIONS.md) |
| **State** | `ref`, `spoke`, move, face (hex) consistent across landing → `AdventurePlayer` | Query param contract and/or campaign-deck topology / player-campaign metadata — document single source of truth in code comment + CHS runtime doc |
| **Quest** | Gather-resources-shaped gate before BAR | Passage graph + optional `QuestThread` / quest completion hooks; align [ESC gather-resources grammar](../encounter-slot-context-schema/spec.md) if used |
| **Seed / vault** | Honest CTAs | SMB/CBS tasks when ready; until then, vault + “what helps campaign” links (BBMT) |
| **Admin LEGO** | No mandatory co-play | **UGA** `validateFullAdventurePassagesGraph` on save; **preview=1** admin play; **Twine/seed** for portal; optional [DT](../flow-simulator-cli/spec.md) fixture for spoke regression |

### Query / state contract (SCL-B8)

| Field | How it reaches `AdventurePlayer` |
|-------|----------------------------------|
| `ref` | Query `ref` on `/adventure/.../play` — campaign reference for hub strip + actions |
| `spoke` | Query `spoke` 0–7 — spoke index; `portalSpokeIndex` prop |
| `kotterStage` | Query from spoke redirect — collective stage |
| `hexagram`, `face` | Query from spoke redirect, sourced from **`campaignHubState`** for that spoke (not yet from landing-only picks) |
| `returnTo` | Preserved on spoke redirect — default hub |

Landing → CYOA does **not** add new query keys in v1; **hex/face** stay tied to hub draw until a follow-up passes explicit overrides from the landing page.

### Authoring checklist (FR-B9 / SCL-B10)

1. Edit portal adventure passages (admin or seed script) — **UGA** validation on save.
2. Admin **preview** adventure with `preview=1` where supported.
3. Prefer **seed** (`seed-campaign-portal-adventure` or instance link) for reproducible spokes.
4. Optional: **DT** / CLI fixture for regression on `Portal_*` entry.

## Verification

- `npm run build` && `npm run check`
- `npm run test:scl-portal` && `npm run test:site-signal-schema` (SCL-B6 automation)
- Manual quest in spec § Verification Quest (steps 1–5); run after `npm run seed:portal-adventure` when validating copy/graph in DB

## References

- [`src/lib/spatial-world/pixi-room.ts`](../../../src/lib/spatial-world/pixi-room.ts) — anchor types
- [tasks.md](./tasks.md)

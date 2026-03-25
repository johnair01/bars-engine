# Spec: NOW / Event / Vault throughput & clarity (NEV)

## Purpose

Improve **player-facing clarity** on the dashboard (NOW), **Vault** entry points, **charge metabolization** lifecycle, and **`/event`** information architecture — including **Bruised Banana** bingo as **modal** games rather than crowding the event page.

**Problem**: The four-move compass reads too dim vs the identity header; Vault “Capture a BAR” misroutes to charge capture; today’s charge stays prominent after 321 / quest work; `/event` is hard to discover from NOW and the event page is dense; bingo grids belong in invites/orientation, not inline on the landing.

**Practice**: Deftness Development — spec kit first, API-first where persistence changes, deterministic behavior over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Vault primary BAR CTA | Same destination as NOW **Create BAR**: `/bars/create` (not `/capture`). Keep charge capture under Throughput / dedicated capture flow. |
| Compass visual weight | Match **header** legibility: stronger border/surface, higher-contrast labels; still use cultivation-card tokens (no random neon). |
| Charge “compost” | Use existing **`archivedAt`** on `CustomBar` (`charge_capture`) when metabolized; **`getTodayCharge`** ignores archived rows. |
| 321 ↔ charge link | Optional **`chargeSourceBarId`** on `Shadow321Session` for provenance + archive when outcome metabolizes (not `skipped`). |
| Quest from charge | **`growQuestFromBar`** archives source `charge_capture`; quest keeps **`sourceBarId`**. |
| Event page bingo | **Button → modal** housing `PartyMiniGameGridInteractive`; deep links `#` still open modal via hash (Phase 2 optional). |
| Section order | **Wake Up: Learn the story** before **live events / BB blocks**; long tails use **`<details>`** collapsibles. |

## Conceptual Model

| Dimension | Application |
|-----------|-------------|
| WHO | Logged-in player; campaign instance context on `/event`. |
| WHAT | BARs, quests, charge_capture rows, 321 sessions. |
| WHERE | NOW (`/`), Vault (`/hand`), Event (`/event`). |
| Personal throughput | Four moves compass + Create BAR vs Capture Charge distinction. |

## API Contracts

### `getTodayCharge` (server)

**Behavior**: Returns today’s `charge_capture` for the player **only if** `archivedAt` is null (and existing date window rules).

### `persist321Session` (server)

**Input** (extended): existing fields + optional `chargeSourceBarId?: string | null`.

**Behavior**: When `chargeSourceBarId` is set and `outcome` is one of `quest_created`, `fueled_system`, `daemon_awakened`, `bar_created`, set `archivedAt` on that charge BAR (owner + type guard). Do **not** archive on `skipped`.

### `createQuestFrom321Metadata` (server)

**Input** (extended): optional `chargeSourceBarId` at end of arg list; forwarded to `persist321Session`; when creating quest, set `sourceBarId` to charge id when provided.

### `fuelSystemFrom321` / `awakenDaemonFrom321`

**Input** (extended): optional charge bar id for the same archive + session provenance path.

### `growQuestFromBar` (server)

**Behavior**: After successful quest creation, if source BAR is `charge_capture`, set `archivedAt` on source.

## User Stories

### P1: Compass visibility

**As a** player, **I want** the four-move + current-move block to be as readable as the header, **so** I can orient without squinting.

### P2: Vault Create BAR parity

**As a** player, **I want** the Vault hero CTA to match NOW “Create BAR”, **so** I don’t accidentally open charge capture.

### P3: Charge compost

**As a** player, **I want** a charge to leave “today’s slot” after I’ve grown a quest or finished a metabolizing 321 path, **so** the dashboard reflects reality.

### P4: Event discoverability

**As a** player, **I want** a clear path from NOW to `/event`, **so** I can find residency nights.

### P5: Event page density

**As a** player, **I want** story first and lighter chrome, **so** I’m not overwhelmed before RSVP.

### P6: Bingo in modals

**As a** player / guest, **I want** bingo behind buttons, **so** the event page stays scannable; full grids open when I choose.

## Functional Requirements

- **FR1**: Brighten `OrientationCompass` container and quadrant/current-move typography (accessibility: contrast).
- **FR2**: Vault header CTA → `/bars/create`, copy aligned with Create BAR.
- **FR3**: `getTodayCharge` filters `archivedAt: null`.
- **FR4**: `growQuestFromBar` archives `charge_capture` sources after quest creation.
- **FR5**: Schema: `Shadow321Session.chargeSourceBarId`; wire Runner + optional Form; archive on metabolizing outcomes.
- **FR6**: Reorder `/event`: Wake Up section before BB Apr 2026 blocks; optional collapsible wrappers for secondary sections.
- **FR7**: BB bingo: modal triggers instead of inline grids.
- **FR8**: NOW: prominent “Residency events” link near compass / ritual line.

## Verification Quest

- **ID**: `cert-now-event-vault-qol-v1`
- **Steps**: (1) Dashboard — compass contrast; link to `/event`. (2) Vault — CTA → `/bars/create`. (3) Capture charge → grow quest or 321 fuel — today’s charge clears. (4) `/event` — Wake Up before BB block; bingo opens in modal.

## Dependencies

- [party-mini-game-event-layer](.specify/specs/party-mini-game-event-layer/spec.md)
- [charge-capture-ux-micro-interaction](.specify/specs/charge-capture-ux-micro-interaction/spec.md) (if present)
- [UI_COVENANT.md](../../../UI_COVENANT.md) for visual changes

## References

- `src/components/dashboard/OrientationCompass.tsx`
- `src/app/hand/page.tsx`
- `src/app/event/page.tsx`, `BruisedBananaApr2026EventBlocks.tsx`
- `src/actions/charge-capture.ts`, `charge-metabolism.ts`, `bars.ts`, `daemons.ts`

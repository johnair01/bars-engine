# Bruised Banana House Instance (engine)

**Spec:** [.specify/specs/bruised-banana-house-instance/spec.md](../.specify/specs/bruised-banana-house-instance/spec.md)  
**Backlog:** Y (row 21) in `.specify/backlog/BACKLOG.md`

## What it is

A dedicated **`Instance`** for **house coordination** (skillful organizing, shared care for the physical/social house) — **parallel** to the public **fundraiser** instance (`campaignRef: bruised-banana`, e.g. `bb-bday-001`).

| Field | Value |
|-------|--------|
| **Slug** | `bruised-banana-house` |
| **`campaignRef`** | `bruised-banana-house` |
| **`parentInstanceId`** | Main Bruised Banana residency instance when found (`campaignRef: bruised-banana` or slugs `bruised-banana` / `bb-bday-001`) |
| **Domains** | `SKILLFUL_ORGANIZING` (primary + allyship) |
| **`domainType`** | `house` |

## Seed

```bash
npm run seed:bb-house
npm run seed:bb-house-quests
```

- **bb-house** — idempotent (upsert by slug). If no residency instance exists yet, `parentInstanceId` stays `null` until you re-run after seeding BB (e.g. `npm run seed:quest-map`).
- **bb-house-quests** — upserts three **stub** quests (`bb-house-daily-round`, `bb-house-weekly-systems`, `bb-house-monthly-deep`) with `campaignRef: bruised-banana-house` and `docQuestMetadata.houseRecurring.cadence` (`daily` / `weekly` / `monthly`). No cron — cadence is guidance for operators.

### Optional: operator memberships

Comma-separated emails (must already exist as `Player` rows with `contactType: email`):

```bash
export BB_HOUSE_MEMBER_EMAILS="wendell@example.com,jj@example.com"
npm run seed:bb-house
```

Creates/updates `InstanceMembership` with `roleKey: house_operator`.

## House state stub

`Instance.goalData` JSON (v1 placeholder from seed):

```json
{
  "v": 1,
  "schema": "bruised-banana-house-state-v1",
  "house": { "note": "…", "seededAt": "…" }
}
```

Future work: drive this from recurring quests or admin UI (see spec Phase 2).

## Operator state (Admin → Edit instance)

When slug or `campaignRef` is `bruised-banana-house`, the instance editor shows **Operator note** and **Health signal (1–5)**. Values merge into `goalData` via `src/lib/bruised-banana-house-state.ts` (schema `bruised-banana-house-state-v1`).

## Product notes

- **Do not** confuse this instance with the **event/fundraiser** active instance in `AppConfig` unless you intentionally switch active instance for testing.
- Public routes for `?ref=bruised-banana-house` (board, hub) can be wired when the team wants a visible “house” campaign surface.

## See also

- [.specify/specs/bruised-banana-house-integration/ANALYSIS.md](../.specify/specs/bruised-banana-house-integration/ANALYSIS.md) — domain model and phased plan
- [Wiki: Bruised Banana campaign](/wiki/campaign/bruised-banana)

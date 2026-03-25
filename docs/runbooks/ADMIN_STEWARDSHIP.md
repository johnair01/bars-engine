# Admin stewardship — four moves & six faces

This runbook matches [`.specify/specs/admin-stewardship-four-moves/spec.md`](../../.specify/specs/admin-stewardship-four-moves/spec.md). **Admin routes require the global `admin` role** (see [`src/app/admin/layout.tsx`](../../src/app/admin/layout.tsx)).

## Four moves (wayfinding)

| Move | Intent | Example tasks | Primary routes |
|------|--------|---------------|----------------|
| **Wake up** | Learn what the world is, orient | Instance story, active campaign, docs | `/admin/instances`, `/admin/docs`, `/wiki` |
| **Clean up** | Repair data, permissions, drift | Fix event times, host list, config | `/admin/campaign-events`, `/admin/config`, `/admin/instances` |
| **Grow up** | Author / extend content | Quests, Twine, decks, proposals | `/admin/adventures`, `/admin/twine`, `/admin/quest-proposals` |
| **Show up** | Ship to players | Active instance, `/event`, invites | `/event`, [`PLAYER_EVENT_CREATION.md`](./PLAYER_EVENT_CREATION.md) |

## Six Game Master faces × admin jobs

| Face | Example admin jobs |
|------|---------------------|
| **Shaman** | Clarify copy on `/event`, instance wake/show blocks; verify changes **feel** reflected in-world. |
| **Regent** | Set **active instance**, **campaign hosts** (`/admin/campaign-events`), instance membership. |
| **Challenger** | Before bulk edits, confirm **instance id** and **campaign** scope; avoid cross-tenant mistakes. |
| **Architect** | Instances, schema-adjacent config, maps, adventures — **structure** of the world. |
| **Diplomat** | Onboarding admins with this doc; align names with player UI (`EventArtifact`, `/event`). |
| **Sage** | Keep **runbooks** and **spec kits** aligned; dev/chat for **new** surfaces, not routine event edits. |

## Campaign events (stewardship UI)

- **List + edit:** [`/admin/campaign-events`](../../src/app/admin/campaign-events/page.tsx) — pick an **instance**, open an **event**, edit metadata and schedule (same permission model as `/event` schedule edit: steward / owner / **campaign host**).
- **Reassign hosts:** On the event page, **Campaign hosts** — **global admins only** (comma-separated **player ids**). This is **transitional**; narrow over time as players own their productions.

## Bulk host assignment (CLI)

To add your player id to **`hostActorIds`** on every `EventCampaign` (e.g. after seeding):

```bash
npm run assign:campaign-hosts
```

Uses `CAMPAIGN_OWNER_EMAIL` or defaults to `admin@admin.local` (first player on that account). Override:

```bash
npx tsx scripts/with-env.ts "tsx scripts/assign-player-to-all-campaign-hosts.ts" -- --email you@example.com
```

## Related

- [PLAYER_EVENT_CREATION.md](./PLAYER_EVENT_CREATION.md) — in-app **create** gathering (hosts/stewards).
- [admin-stewardship-four-moves spec](../../.specify/specs/admin-stewardship-four-moves/spec.md)

## Privacy note

Deep admin visibility into player-owned productions should **shrink** as hosts self-serve. Prefer **in-app host tools** and **documented** admin overrides.

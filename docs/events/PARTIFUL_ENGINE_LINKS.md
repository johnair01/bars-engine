# Bruised Banana Apr 2026 — Partiful → engine URLs

**Partiful** stays canonical for **RSVP, address gate, and logistics**.  
Paste these **in-app orientation** links wherever you want guests to soft-demo the engine **before** or **alongside** Partiful (description, confirmation email, text blast).

Replace `<host>` with your deployment origin (e.g. `https://your-app.vercel.app`).

## Event-invite BARs (no login)

| Night | Stable path | Full URL pattern |
|-------|----------------|------------------|
| **April 4 — Dance** | `/invite/event/bb-event-invite-apr4-dance` | `https://<host>/invite/event/bb-event-invite-apr4-dance` |
| **April 5 — The Game** | `/invite/event/bb-event-invite-apr26` | `https://<host>/invite/event/bb-event-invite-apr26` |

Seed (local / deploy): `npx tsx scripts/with-env.ts "npx tsx scripts/seed-bruised-banana-event-invite-bar.ts"`

## Campaign home (context + anchors)

| Purpose | Path |
|---------|------|
| In-engine campaign / two nights | `/event` |
| Jump to April 4 block | `/event#apr-4` |
| Jump to April 5 block | `/event#apr-5` |
| Invite mini-game anchor (Apr 4) | `/event#bb-invite-bingo-apr4` |
| Invite mini-game anchor (Apr 5) | `/event#bb-invite-bingo-apr5` |

## Event-scoped initiation Twine (EIP)

| Event slug | Initiation URL | Adventure slug (publish in Admin) |
|------------|----------------|-------------------------------------|
| `apr-4-dance` | `/campaign/event/apr-4-dance/initiation` | `bruised-banana-event-apr-4-dance-initiation-player` |
| `apr-5-game` | `/campaign/event/apr-5-game/initiation` | `bruised-banana-event-apr-5-game-initiation-player` |

Optional: `?segment=sponsor` for sponsor variant. Optional: `?ref=bruised-banana` (default).

Set **`partifulUrl`** and **`eventSlug`** on the `event_invite` `CustomBar` (see seed script); the invite page shows **RSVP on Partiful** + **Begin initiation**.

Partiful **copy** for titles and body text: [bruised-banana-apr-2026-partiful-copy.md](./bruised-banana-apr-2026-partiful-copy.md).

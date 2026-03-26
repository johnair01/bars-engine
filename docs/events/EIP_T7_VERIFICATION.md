# EIP T7 — Seed verification & QA gate

**Spec:** [.specify/specs/event-invite-party-initiation/tasks.md](../../.specify/specs/event-invite-party-initiation/tasks.md) (T7)

Use this before shipping public **event_invite** URLs so the database matches what Partiful and guests will hit.

## 1. Seed (local or deploy target DB)

```bash
npm run seed:event-invite-bar
```

Optional — real **Partiful RSVP** URLs without editing the seed file (HTTPS only):

- `EIP_PARTIFUL_APR4_URL` — April 4 dance event on Partiful  
- `EIP_PARTIFUL_APR5_URL` — April 5 (The Game) on Partiful  

If unset, the seed uses `https://partiful.com/` as a placeholder until you set URLs in **Hand → Vault** or re-seed with env set.

## 2. Automated verify

```bash
npm run verify:event-invite-seed
```

Checks:

- **BARs** `bb-event-invite-apr4-dance` and `bb-event-invite-apr26` exist, `type=event_invite`, public `active`, `campaignRef=bruised-banana`, `eventSlug` matches `apr-4-dance` / `apr-5-game`, `storyContent` parses as [`EventInviteStory`](../../src/lib/event-invite-story/schema.ts), `partifulUrl` is HTTPS.
- **Initiation** Adventures `bruised-banana-event-apr-4-dance-initiation-player` and `bruised-banana-event-apr-5-game-initiation-player` are `ACTIVE` and the **start passage** exists.

**Strict Partiful (e.g. pre-prod):** fail if Partiful is still the placeholder:

```bash
EIP_VERIFY_STRICT=1 npm run verify:event-invite-seed
```

## 3. Manual incognito QA

On the **same host** you will paste into Partiful (see [PARTIFUL_ENGINE_LINKS.md](./PARTIFUL_ENGINE_LINKS.md)):

| Step | URL |
|------|-----|
| Doorway Apr 4 | `/invite/event/bb-event-invite-apr4-dance` |
| Doorway Apr 5 | `/invite/event/bb-event-invite-apr26` |
| Initiation Apr 4 | `/campaign/event/apr-4-dance/initiation` |
| Initiation Apr 5 | `/campaign/event/apr-5-game/initiation` |

Confirm: **RSVP on Partiful** opens the real event (not a blank home page), **Begin initiation** loads Twine without the “not published” fallback, **JSON CYOA** choices work through to ending CTAs.

## 4. Ops references

- [HOST_EVENT_INVITE_BAR.md](./HOST_EVENT_INVITE_BAR.md) — steward editing, Vault  
- [bruised-banana-apr-2026-partiful-copy.md](./bruised-banana-apr-2026-partiful-copy.md) — Partiful copy

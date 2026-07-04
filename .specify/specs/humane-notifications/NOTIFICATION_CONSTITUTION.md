# Notification Constitution — bars-engine

**Status:** Locked (v1 policy). Implement per [spec.md](./spec.md).

Steward-facing summary. Hostile read aloud before shipping any new notification type.

---

## Channel stack (v1)

| Priority | Channel | Role |
|----------|---------|------|
| 1 | **In-app** | Truth: invites, completions, waiting-for, INV4 forger witness |
| 2 | **Email** | Reach when tab closed: invites (transactional), opt-in daily ritual |
| 3 | **Web push** | Not v1 — optional later, settings-only |
| 4 | **SMS** | Separate spec — not humane-notifications |

---

## Default preferences

| Preference | Default | Notes |
|------------|---------|-------|
| `campaignInviteEmail` | `true` | Transactional — someone invited you |
| `dailyReminder.enabled` | `false` | **Opt-in only** |
| `unsubscribedAll` | `false` | Legal kill switch |
| `waitingForEmail` | `false` | Future PMA follow-up |

---

## Copy — always

- Gentle, game voice, one clear action
- Who sent this and why (for invites)
- Link to settings + unsubscribe (for ritual emails)

## Copy — never

Per [COPY_AUDIT_PMA.md](../lenses-observatory-intake/COPY_AUDIT_PMA.md):

- inbox zero, you're behind, catch up
- streak broken / don't break the chain (unless separate opt-in celebratory POF — not in email v1)
- productivity, planner, task manager
- Todoist / Notion / Mindwtr / Tandem in player-facing email

---

## Cadence limits

- **Daily reminder:** ≤1 per local calendar day; skip if Tap the Vein already sealed
- **Quiet hours:** 08:00–21:00 local (initial default)
- **Invites:** per event, no batch spam

---

## Adding a new notification type (gate)

Before shipping any new email or push type:

1. Is it **transactional** (user or another person triggered it) or **ritual** (system cadence)?
2. Ritual → must be **opt-in** with unsubscribe
3. Pass COPY_AUDIT hostile read
4. Add row to [metadata-shape.md](./metadata-shape.md) `NotificationType` enum
5. Log to `NotificationLog`
6. Update this file if policy changes

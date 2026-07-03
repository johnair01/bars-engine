# Spec: Humane Notifications

## Purpose

Define how bars-engine reaches players **outside the tab** without shame spirals, dark patterns, or productivity-app chrome. Locks the notification constitution for v1: **email primary**, **in-app source of truth**, **opt-in daily ritual**, **transactional campaign invites**.

**Problem:** No unified notification policy exists. Prior specs either defer email (`lens-integration-refactor`: “not automated email reminders”) or assume phone-first SMS (`events-bar-framework/PHONE_FIRST_IMPLEMENTATION_PLAN.md`, not implemented). INV4 explicitly avoids push/email. Players need campaign invites when away; practitioners may want a gentle daily nudge — both must be humane and opt-out friendly.

**Practice:** Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. Reuse canonical `sendEmail` (`src/lib/email/`); persist-then-send.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Primary channel (v1)** | **Email** via Resend + `@react-email` — already wired |
| **In-app** | Source of truth for invitation state, ritual completions, derived inbox (no separate push required for core flows) |
| **Daily reminder** | **Opt-in only** (default off). Max one per local day. Skip if TTV already sealed today |
| **Campaign / event invite** | **Transactional email** (default on) + existing `EventInvite` / BAR delivery in-app |
| **Web push** | **Deferred** (Phase 3). Never required for invites or daily ritual |
| **SMS** | **Out of scope** for this spec — see `events-bar-framework/PHONE_FIRST_IMPLEMENTATION_PLAN.md` if pursued later |
| **Forger witness (INV4)** | **In-app only** — no email when invitee accepts |
| **Waiting-for follow-up** | **In-app first**; optional email only when player opts into `waitingForEmail` (ties to PMA external-blocker metadata) |
| **Unsubscribe** | Every non-transactional email includes one-click + settings link; `unsubscribedAll` legal kill switch |
| **Copy** | [COPY_AUDIT_PMA.md](../lenses-observatory-intake/COPY_AUDIT_PMA.md) + constitution below — no streak shame, no “behind” |

## Notification Constitution (locked)

### We send

| Type | Channel | Default | Cadence |
|------|---------|---------|---------|
| Campaign / event invitation | Email + in-app | On | Per invite (transactional) |
| Daily practice reminder | Email | **Off** until opted in | ≤1/day, local timezone |
| Auth / account (password reset, etc.) | Email | On | As needed |
| Awaken / funnel (chapter one, RSVP confirm) | Email | On at submit | Per funnel action |

### We do not send (v1)

- Streak broken / “you missed N days”
- Inbox-zero or productivity shame
- Marketing blasts without separate explicit opt-in
- Push permission on first visit
- SMS without separate phone-first spec
- Email when forger’s invitee accepts (use Quest Wallet / hand — INV4)

### Humane rules

1. **Opt-in for rhythm** — daily reminder off until player enables
2. **Transactional for social** — someone invited you; deliver even if app closed
3. **One tap out** — unsubscribe in every ritual email; settings page mirrors prefs
4. **Frequency cap** — max 1 daily + invite-related per day; batch where possible
5. **Quiet hours** — no sends before 8:00 or after 21:00 **player local time** (configurable later)
6. **Persist then send** — save `NotificationLog` / invite row before `sendEmail`; tolerate provider failure
7. **Explain why** — settings show last 10 sends with type + date

## Conceptual Model

| Dimension | Value |
|-----------|--------|
| **WHO** | Player (`Player` + `Account.email`) |
| **WHAT** | Deliveries: invite, daily ritual nudge, (future) waiting-for follow-up |
| **WHERE** | Outbound: email; inbound awareness: NOW / Inspirations / settings |
| **Energy** | Invites = Show Up (social); daily nudge = Wake Up (optional ritual) |
| **Throughput move** | Daily reminder supports **Tap the Vein** open; invites support **campaign entry** |

```text
Event / steward action
    → persist EventInvite + NotificationLog (pending)
    → sendEmail (invite template)
    → update log (sent | skipped | failed)

Cron (daily reminder)
    → players where dailyReminder.enabled
    → skip if unsubscribedAll OR already sealed TTV today
    → sendEmail (ritual template)
```

## API Contracts (API-First)

### `getNotificationPreferences(playerId)`

**Output:** `NotificationPreferences` — see [metadata-shape.md](./metadata-shape.md)

### `updateNotificationPreferences(input)`

**Input:** Partial prefs (validated server-side)  
**Output:** `{ success: true, prefs } | { error: string }`  
**Server Action** — `src/actions/notification-preferences.ts`

### `unsubscribeByToken(token)`

**Input:** signed token from email footer  
**Output:** `{ success: true } | { error: string }`  
**Route Handler** — `GET /api/notifications/unsubscribe?token=…` (no auth cookie required)

### `sendCampaignInviteEmail(input)` (internal)

**Input:** `{ eventInviteId | inviteBarId, toEmail, inviterName, campaignTitle, ctaUrl }`  
**Output:** `SendEmailResult` from `src/lib/email/send.ts`  
Called from existing `createEventInvitation` / campaign invite actions **after** DB persist.

### `runDailyReminderCron()` (internal)

**Route Handler** — `POST /api/cron/daily-reminder` (Vercel Cron + `CRON_SECRET`)  
Idempotent per player per local calendar day via `NotificationLog`.

- **Route Handler:** cron, unsubscribe link
- **Server Action:** settings UI, preference updates

## User Stories

### P1: Campaign invite reaches me when I’m away

**As a** player invited to a campaign or event, **I want** an email with a clear CTA, **so** I can RSVP without remembering to open the app.

**Acceptance:** Email sent after invite persisted; in-app `EventInvite` row exists; email lists who invited and one link; “not interested” / mute in footer.

### P2: Optional daily ritual nudge

**As a** player who opted in, **I want** at most one gentle email per day to open Tap the Vein, **so** I can start practice without guilt if I skip.

**Acceptance:** Default off; enable in settings; no send if TTV sealed today; unsubscribe works; copy passes COPY_AUDIT hostile read.

### P3: Control my channels

**As a** player, **I want** a settings page for notification prefs, **so** I know what I signed up for and can turn off ritual email.

**Acceptance:** Toggle daily reminder; toggle campaign invite email (with warning that invites are social); view recent sends; `unsubscribedAll` stops all non-auth email.

### P4: In-app inbox without push

**As a** player, **I want** pending invitations visible in-app, **so** email is not the only surface.

**Acceptance:** Inspirations / NOW / event surfaces show pending `EventInvite`; aligns with existing BAR invite flow.

## Functional Requirements

### Phase 1 — Preferences + constitution

- **FR1:** `Player.notificationPrefsJson` (or `NotificationPreference` table) per [metadata-shape.md](./metadata-shape.md)
- **FR2:** `NotificationLog` table for audit + idempotent cron
- **FR3:** Settings UI at `/settings/notifications` (or section in existing settings)
- **FR4:** Signed unsubscribe tokens + route

### Phase 2 — Campaign invite email

- **FR5:** React email template `CampaignInviteEmail` — game voice, one CTA, footer prefs
- **FR6:** Wire `createEventInvitation` (and campaign invite paths) to send after persist
- **FR7:** Respect `campaignInviteEmail: false` (skip send, keep in-app)

### Phase 3 — Daily reminder (opt-in)

- **FR8:** `DailyReminderEmail` template — no streak language
- **FR9:** Vercel Cron + `runDailyReminderCron` with timezone + quiet hours + TTV sealed skip
- **FR10:** Opt-in prompt surfaced once after positive moment (first sealed TTV or quest complete) — dismissible, not blocking

### Phase 4 — Deferred

- **FR11 (defer):** Web Push — service worker, VAPID, settings-only opt-in
- **FR12 (defer):** Waiting-for follow-up email when PMA external-blocker metadata ships

## Non-Functional Requirements

- **NFR1:** `sendEmail` never throws; callers persist first (existing contract)
- **NFR2:** CAN-SPAM: physical address or compliant Resend footer; `List-Unsubscribe` header on ritual emails
- **NFR3:** No notification copy with forbidden phrases per COPY_AUDIT_PMA
- **NFR4:** Portland / AI-trust: no “AI assistant” framing in notification bodies
- **NFR5:** `CRON_SECRET` required for cron route in production

## Persisted data & Prisma

| Model / field | Purpose |
|---------------|---------|
| `Player.notificationPrefsJson String?` | Preferences blob |
| `NotificationLog` | `playerId`, `type`, `channel`, `status`, `externalId`, `sentAt`, `metadataJson` |

**Migration:** `npx prisma migrate dev --name humane_notifications` — see [tasks.md](./tasks.md).

## Verification Quest

- **ID:** `cert-humane-notifications-v1`
- **Narrative:** Verify invite email + opt-in daily reminder + unsubscribe — framed as party prep (guests get invite email; stewards trust the engine won’t spam).
- **Steps:** (1) Receive campaign invite email with CTA. (2) Open settings; enable daily reminder. (3) Confirm copy has no shame phrases. (4) Unsubscribe link disables ritual emails. (5) In-app invite still visible without email.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Dependencies

- [productivity-modality-alignment](../productivity-modality-alignment/spec.md) — COPY_AUDIT, no punitive streaks
- [cyoa-invitation-throughput/INV4](../cyoa-invitation-throughput/INV4_FORGER_NOTIFICATION_SPEC.md) — forger in-app only
- [lenses-observatory-intake/COPY_AUDIT_PMA.md](../lenses-observatory-intake/COPY_AUDIT_PMA.md)
- [events-bar-framework/PHONE_FIRST_IMPLEMENTATION_PLAN.md](../events-bar-framework/PHONE_FIRST_IMPLEMENTATION_PLAN.md) — SMS deferred
- `src/lib/email/` — Resend layer

## References

- `src/lib/email/send.ts`, `src/actions/campaign-invitation.ts`
- `prisma` — `EventInvite`, `Invite`, `Account.email`
- [metadata-shape.md](./metadata-shape.md)
- [NOTIFICATION_CONSTITUTION.md](./NOTIFICATION_CONSTITUTION.md) — steward-facing summary

# Plan: Humane Notifications

Implement per `.specify/specs/humane-notifications/`.

## Phase 1 — Schema + preferences API

**Goal:** Persist prefs and audit log; settings UI skeleton.

| Area | Files |
|------|-------|
| Schema | `prisma/schema.prisma` — `Player.notificationPrefsJson`, `NotificationLog` |
| Lib | `src/lib/notifications/prefs.ts` — parse/merge defaults |
| Actions | `src/actions/notification-preferences.ts` |
| Unsubscribe | `src/app/api/notifications/unsubscribe/route.ts` |
| UI | `src/app/settings/notifications/page.tsx` |
| Env | `NOTIFICATION_UNSUBSCRIBE_SECRET`, document in `docs/ENV_AND_VERCEL.md` |

**Order:** migrate → prefs lib → actions → unsubscribe route → settings page

## Phase 2 — Campaign invite email

**Goal:** Transactional invite email on existing invite flows.

| Area | Files |
|------|-------|
| Template | `src/lib/email/templates/CampaignInviteEmail.tsx` |
| Send helper | `src/lib/notifications/send-campaign-invite.ts` |
| Wire | `src/actions/campaign-invitation.ts` (after persist) |
| Log | `NotificationLog` on send/skip/fail |

Respect `campaignInviteEmail: false` — log `skipped`, keep in-app invite.

## Phase 3 — Daily reminder (opt-in)

**Goal:** Cron + template + opt-in prompt.

| Area | Files |
|------|-------|
| Template | `src/lib/email/templates/DailyReminderEmail.tsx` |
| Cron | `src/app/api/cron/daily-reminder/route.ts` |
| Job logic | `src/lib/notifications/daily-reminder.ts` — timezone, quiet hours, TTV sealed skip |
| Vercel | `vercel.json` cron schedule (e.g. hourly; job filters by local hour) |
| Opt-in UI | Banner on NOW or post-TTV-seal — dismissible once |

**Env:** `CRON_SECRET` for cron auth.

## Phase 4 — Verification quest

| Area | Files |
|------|-------|
| Seed | `scripts/seed-cert-humane-notifications.ts` |
| npm | `package.json` — `seed:cert:humane-notifications` |
| Quest id | `cert-humane-notifications-v1` |

## Deferred (document only)

- Web Push (service worker, VAPID, `Player.pushSubscriptionJson`)
- SMS (`events-bar-framework/PHONE_FIRST_IMPLEMENTATION_PLAN.md`)
- Waiting-for follow-up email (after PMA external-blocker metadata)

## Out of scope

- Marketing newsletters
- Slack/Discord bots
- Punitive streak emails
- Replacing INV4 in-app forger witness with email

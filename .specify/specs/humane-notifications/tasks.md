# Tasks: Humane Notifications

## Phase 1 — Preferences + audit

- [x] HNTF-1.1 Prisma: `Player.notificationPrefsJson`, model `NotificationLog` — migration `20260703150000_humane_notifications`
- [x] HNTF-1.2 `src/lib/notifications/prefs.ts` — defaults, merge, validate
- [x] HNTF-1.3 `getNotificationPreferences` / `updateNotificationPreferences` server actions
- [x] HNTF-1.4 Signed unsubscribe token + `GET /api/notifications/unsubscribe`
- [x] HNTF-1.5 Settings page `/settings/notifications` — toggles + recent sends list
- [x] HNTF-1.6 Document env: `NOTIFICATION_UNSUBSCRIBE_SECRET`, `CRON_SECRET` in `docs/ENV_AND_VERCEL.md`

## Phase 2 — Campaign invite email

- [x] HNTF-2.1 `CampaignInviteEmail` React template (COPY_AUDIT pass)
- [x] HNTF-2.2 `sendEventInviteEmail` — persist log → `sendEmail`
- [x] HNTF-2.3 Wire `createEventInvitation`
- [x] HNTF-2.4 Skipped send logged when pref off or no email

## Phase 3 — Daily reminder

- [x] HNTF-3.1 `DailyReminderEmail` template (no streak copy)
- [x] HNTF-3.2 `runDailyReminderCron` — quiet hours, timezone, TTV sealed skip, idempotent `periodKey`
- [x] HNTF-3.3 Vercel cron route + `vercel.json` schedule
- [x] HNTF-3.4 Opt-in prompt on NOW after first TTV seal
- [ ] HNTF-3.5 Hostile copy read (steward) — gate before merge

## Phase 4 — Verification

- [x] HNTF-4.1 `scripts/seed-cert-humane-notifications.ts` — `cert-humane-notifications-v1`
- [x] HNTF-4.2 `npm run build` + `npm run check`

## Backlog / cross-spec

- [x] HNTF-0.1 Spec kit: spec.md, plan.md, tasks.md, constitution, metadata-shape
- [x] HNTF-0.2 BACKLOG row `HNTF` + `npm run backlog:seed`
- [x] HNTF-0.3 Link from [productivity-modality-alignment/plan.md](../productivity-modality-alignment/plan.md) waiting-for → defer email to `waitingForEmail` pref

## Deferred

- [ ] HNTF-D1 Web Push (Phase 4 in plan)
- [ ] HNTF-D2 SMS (phone-first spec)
- [ ] HNTF-D3 Waiting-for follow-up email (PMA Phase C)

# Tasks: Humane Notifications

## Phase 1 — Preferences + audit

- [ ] HNTF-1.1 Prisma: `Player.notificationPrefsJson`, model `NotificationLog` — `npx prisma migrate dev --name humane_notifications`
- [ ] HNTF-1.2 `src/lib/notifications/prefs.ts` — defaults, merge, validate
- [ ] HNTF-1.3 `getNotificationPreferences` / `updateNotificationPreferences` server actions
- [ ] HNTF-1.4 Signed unsubscribe token + `GET /api/notifications/unsubscribe`
- [ ] HNTF-1.5 Settings page `/settings/notifications` — toggles + recent sends list
- [ ] HNTF-1.6 Document env: `NOTIFICATION_UNSUBSCRIBE_SECRET`, `CRON_SECRET` in `docs/ENV_AND_VERCEL.md`

## Phase 2 — Campaign invite email

- [ ] HNTF-2.1 `CampaignInviteEmail` React template (COPY_AUDIT pass)
- [ ] HNTF-2.2 `sendCampaignInviteEmail` — persist log → `sendEmail`
- [ ] HNTF-2.3 Wire `createEventInvitation` (and other invite entry points)
- [ ] HNTF-2.4 Manual test: invite sends email; pref off skips with `skipped` log

## Phase 3 — Daily reminder

- [ ] HNTF-3.1 `DailyReminderEmail` template (no streak copy)
- [ ] HNTF-3.2 `runDailyReminderCron` — quiet hours, timezone, TTV sealed skip, idempotent `periodKey`
- [ ] HNTF-3.3 Vercel cron route + `vercel.json` schedule
- [ ] HNTF-3.4 Opt-in prompt (post first seal or quest complete) — dismissible
- [ ] HNTF-3.5 Hostile copy read (steward) — gate before merge

## Phase 4 — Verification

- [ ] HNTF-4.1 `scripts/seed-cert-humane-notifications.ts` — `cert-humane-notifications-v1`
- [ ] HNTF-4.2 `npm run build` + `npm run check`

## Backlog / cross-spec

- [x] HNTF-0.1 Spec kit: spec.md, plan.md, tasks.md, constitution, metadata-shape
- [x] HNTF-0.2 BACKLOG row `HNTF` + `npm run backlog:seed`
- [x] HNTF-0.3 Link from [productivity-modality-alignment/plan.md](../productivity-modality-alignment/plan.md) waiting-for → defer email to `waitingForEmail` pref

## Deferred

- [ ] HNTF-D1 Web Push (Phase 4 in plan)
- [ ] HNTF-D2 SMS (phone-first spec)
- [ ] HNTF-D3 Waiting-for follow-up email (PMA Phase C)

# MVP Ship Plan — Game Loop v0.1

**Date:** 2026-02-16  
**Goal:** First testers can complete full game loop by EOD  
**Branch:** `cursor/mvp-game-loop-3884`

---

## Status Table (Pre-Fix)

| Feature | Exists? | Works E2E? | Breakpoint | Fix ETA |
|---------|---------|-----------|------------|---------|
| Signup | YES (`/conclave/guided` → `GuidedAuthForm`) | YES (open signup, auto-invite) | None known | 0 min |
| Login | YES (`/login` → `LoginForm`) | YES (bcrypt + cookie) | None known | 0 min |
| Nation Selection | YES (embedded in guided onboarding flow) | PARTIAL — depends on DB seed | No standalone page if guided flow breaks | 15 min |
| Archetype Selection | YES (embedded in guided onboarding flow) | PARTIAL — depends on DB seed | No standalone page if guided flow breaks | 15 min |
| Quest Creation | YES (`/quest/create` QuestWizard + `/create-bar` CreateBarForm) | PARTIAL — public quests cost 1 vibeulon, new users have 0 | New users can't create public quests | 10 min |
| Quest List | YES (dashboard `/` shows active/completed quests) | YES | None | 0 min |
| BAR Creation | YES (`/create-bar` CreateBarForm) | PARTIAL — same vibeulon cost issue | Same as quest creation | 0 min (same fix) |
| BAR List | YES (dashboard shows custom bars) | YES | None | 0 min |
| Vibeulon Wallet | YES (`/wallet`) | YES | Need initial balance for new users | 5 min |
| Vibeulon Transfer | YES (`VibulonTransfer` component on wallet page) | YES (dropdown select recipient) | No "received" visibility | 10 min |
| Available Quests | YES (`/bars/available`) | YES | None | 0 min |
| Pick Up Quest | YES (`pickUpBar` action) | YES | None | 0 min |
| Complete Quest | YES (`submitQuestReturn` action) | YES (grants +1 vibeulon) | None | 0 min |

## Critical Gaps

1. **New users get 0 vibeulons** → Can't create public quests. Fix: seed 3 vibeulons on signup.
2. **No standalone onboarding page** → If guided flow breaks, no fallback for nation/archetype. Fix: add `/onboarding` page.
3. **No "received transfers" view** → Recipients can't see what was sent to them. Fix: add to wallet page.
4. **No nav between key pages** → Users must know URLs. Fix: add nav bar to dashboard.
5. **No feature flags** → No way to toggle modes. Fix: add env-based flags.

## Shortcuts & Feature Flags

| Flag | Value | Purpose |
|------|-------|---------|
| `QUEST_GENERATOR_MODE` | `"placeholder"` | Bypass AI quest generation, use templates |
| `MVP_SEED_VIBEULONS` | `3` | Auto-seed vibeulons for new signups |
| `MVP_MODE` | `true` | Enable simplified flows |

## Execution Plan (2 hours)

```
0:00–0:15  Write plan + audit (THIS DOC) ✓
0:15–0:30  Seed vibeulons on signup + standalone onboarding page
0:30–0:50  Ensure quest creation works E2E (private quest = free, no blockers)
0:50–1:10  Add received transfers to wallet + nav bar links
1:10–1:30  Feature flags + admin seed tool
1:30–1:50  Smoke test all 5 requirements
1:50–2:00  Final commit + known issues doc
```

## Smoke Test Steps

1. **Create User A** — Go to `/conclave/guided`, enter email + password
2. **Complete onboarding** — Go through guided flow OR use `/onboarding` fallback
3. **Select Nation + Archetype** — Via guided flow or onboarding page
4. **Verify dashboard** — User sees nation, archetype, 3 vibeulons
5. **Create Quest** — Go to `/quest/create` or `/create-bar`, create a private quest
6. **See quest in list** — Return to dashboard, quest visible in "Active Quests"
7. **Create User B** — New browser/incognito, signup at `/conclave/guided`
8. **User A sends vibeulon to User B** — Go to `/wallet`, select User B, send 1
9. **User B sees received vibeulon** — Go to `/wallet`, see balance + transfer history
10. **User A creates public quest** — Uses 1 vibeulon to stake a public quest
11. **User B picks up quest** — Go to `/bars/available`, claim quest

## Known Limitations (Ship Anyway)

- AI quest generator not active in MVP (uses templates/manual creation)
- No email verification (open signup)
- Transfer by dropdown only (not by email/username search)
- No push notifications for received vibeulons
- Onboarding story flow is the primary path; fallback page is minimal

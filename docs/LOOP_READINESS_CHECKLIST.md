# Basic Game Loop Readiness Checklist

Use this checklist before shipping changes that affect the core player loop.

Goal: keep the loop reliable while minimizing compute.

---

## Pre-Launch Seeds

Before first launch (or after adding new content), run these seeds in order:

| Order | Script | Purpose |
|-------|--------|---------|
| 1 | `npm run seed:party` | Creates Bruised Banana instance and campaigns |
| 2 | `npm run seed:quest-map` | Creates 8 Kotter-stage quests (Q-MAP-1 … Q-MAP-8) |
| 3 | `npm run seed:onboarding` | Creates orientation threads and first quest |
| 4 | `npm run seed:cert:cyoa` | Creates certification quests (including go-live, admin mobile) |

Re-run `npm run seed:cert:cyoa` after adding new certification quests to the seed script.

---

## Loop Definition (What must work)

1. Player can **sign in**
2. Player can **open and complete a quest**
3. Quest completion **mints vibulons correctly**
4. Player can **see updated wallet/state**
5. Player can **repeat the cycle** without errors

---

## Deploy to production

Before merging to `main` / Vercel: **[DEPLOY_RUNBOOK.md](./DEPLOY_RUNBOOK.md)** (build, lint, smoke, post-deploy checks).

---

## 0) Pre-Flight (2-3 min)

- [ ] On correct branch and latest code is pushed
- [ ] Preview URL printed for this branch (`npm run preview:link`)
- [ ] `DATABASE_URL` is set for any DB scripts you run
- [ ] No planned destructive reset during this release window

### Automated checks (loop:ready)

`npm run loop:ready` runs the automated portion: build, db:reset-history, core quest config verification, test:feedback-cap, db:feedback-cap-history. Use this as the primary gate.

```bash
DATABASE_URL="postgres://..." npm run loop:ready
```

Run quick mode (skip build):

```bash
DATABASE_URL="postgres://..." npm run loop:ready:quick
```

### Manual pre-flight

```bash
git branch --show-current
git status --short
npm run preview:link
```

---

## 1) Data Safety & Audit Visibility (2 min)

Run against the target DB (staging/prod) and confirm history visibility:

```bash
DATABASE_URL="postgres://..." npm run db:reset-history
DATABASE_URL="postgres://..." npm run db:feedback-cap-history
```

- [ ] Reset history command runs successfully
- [ ] No unexpected reset events since last release
- [ ] Feedback-cap history command runs successfully

---

## 2) Automated Core Reward Check (2-3 min)

Run the feedback cap integration test:

```bash
DATABASE_URL="postgres://..." npm run test:feedback-cap
DATABASE_URL="postgres://..." npm run db:feedback-cap-history
```

Expected:
- rewards by run: `[1,1,1,1,1,0]`
- total vibulons minted: `5`
- completed/started audit entries saved

- [ ] Script passes with expected reward sequence
- [ ] Result is persisted in `audit_logs`

---

## 3) Manual UI Smoke (5-8 min)

- [ ] Run `npm run preview:link` and open that URL before manual verification

### Auth
- [ ] `/login` loads
- [ ] Existing user can sign in with email/password

### Set Your Intention
- [ ] Quest shows direct input path
- [ ] Quest shows guided help path
- [ ] Either path can complete and advance flow

### Feedback Quest
- [ ] Dropdowns have visible labels before interaction
- [ ] Completion works with optional fields behavior
- [ ] Repeating completion respects cap (after 5 rewarded runs)

### Wallet/State
- [ ] Wallet page reflects updated vibeulon count
- [ ] No blocking UI errors in dashboard loop

---

## 4) Compute Guardrails (always-on)

- [ ] Keep loop on deterministic server actions (no AI required for default path)
- [ ] Run heavy tests only once per release candidate
- [ ] Use guided/Twine assistance only when explicitly chosen by player
- [ ] Avoid unnecessary resets; if reset is required, verify audit trail afterward

---

## 5) Go / No-Go Gate

### GO if all true:
- [ ] `npm run loop:ready` passes (automated: build, reset-history, core quest config, feedback-cap test)
- [ ] Manual smoke (Section 3) shows no loop-breaking UI defects

### NO-GO if any true:
- [ ] loop:ready exits with FAIL
- [ ] Quest completion fails or does not mint correctly
- [ ] Sign-in or core quest modal is broken

---

## Quick Incident Log (copy/paste)

```txt
Timestamp:
Environment:
Commit:
Issue:
Steps to reproduce:
Expected:
Actual:
Temporary mitigation:
Follow-up task:
```

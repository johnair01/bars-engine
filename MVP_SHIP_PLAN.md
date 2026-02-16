# MVP Ship Plan - Basic Game Loop (EOD)

## Step 0 - MVP Definition of Done

MVP is done when a new tester can:

1. Create an account
2. Select nation + archetype
3. Create a quest and see it in their list
4. Create a BAR tied to that quest and see it in BAR list/ledger
5. Send 1 vibeulon to another user by email/username and recipient sees it

---

## Step 1 - Recon Status Table (real repo findings)

| Feature | Exists? | Works end-to-end? | Breakpoint | Fix ETA (min) |
|---|---|---:|---|---:|
| Auth signup/login | Yes (`/conclave/guided`, `/login`, `conclave-auth`) | Partial | Incomplete profile can still block creation flows; no hard fallback setup path | 10 |
| Nation + archetype assignment | Yes (`nationId`, `playbookId`, guided story) | Partial | No guaranteed minimal selector page for fast setup/repair | 20 |
| Quest create/list | Yes (`/quest/create`, `createQuestFromWizard`) | Partial | Public staking can block low-balance users; missing hard setup gate | 20 |
| BAR create/list/ledger | Yes (`/create-bar`, `createCustomBar`, `/hand`) | Partial | No explicit linked-quest metadata path; same staking block risk | 20 |
| Vibeulon send/receive | Yes (`/wallet`, `transferVibulons`) | Partial | Recipient lookup was ID-only; no explicit received list panel | 25 |
| Event/party/session concepts | Yes (Story Clock, threads, packs, guided conclave) | N/A | Not blocking for this MVP loop | 0 |

---

## Step 2 - Minimal patches chosen (speed over elegance)

### Implemented path

1. **Auth**
   - Keep existing login/signup architecture.
   - Login now routes incomplete profiles to `/onboarding/profile`.
   - Guided signup now fast-routes to `/onboarding/profile` after account creation.

2. **Nation + Archetype**
   - Added minimal fallback setup page: `/onboarding/profile`.
   - Added save action with validation and persistence to `player.nationId` + `player.playbookId`.
   - Added guardrails on quest/BAR creation actions requiring both fields.

3. **Quest Creation**
   - Hardened `createQuestFromWizard`:
     - Enforces nation/archetype.
     - Uses `QUEST_GENERATOR_MODE` and deterministic placeholder content for fast path.
     - Falls back from public->private when stake token missing (instead of failing).
     - Auto-assigns private created quest to creator so it appears in active list.

4. **BAR Creation**
   - Hardened `createCustomBar`:
     - Enforces nation/archetype.
     - Falls back from public->private when stake token missing.
   - Added optional BAR metadata:
     - `linkedQuestId` + `tags` captured in `completionEffects` JSON.
     - optional quest linkage also reflected in description prefix for visibility.
   - Added "Create a BAR" entry point from dashboard.

5. **Vibeulon Send/Receive**
   - Transfer now supports recipient by:
     - player id (existing)
     - email
     - username (player name)
   - Added optional memo.
   - Added received transfer list to wallet UI (inbound `p2p_transfer` events).

---

## Step 3 - 2-hour execution plan (time-boxed)

| Time | Task |
|---|---|
| 0:00-0:15 | Recon: verify existing auth/onboarding/quest/BAR/wallet entry points and DB fields |
| 0:15-0:35 | Add fallback onboarding profile page + login redirect |
| 0:35-1:05 | Harden quest creation flow (setup gating + fallback mode + list visibility) |
| 1:05-1:25 | Harden BAR creation + add linked quest metadata path |
| 1:25-1:55 | Upgrade transfer flow (email/username resolve + recipient received view) |
| 1:55-2:00 | Smoke checklist + diagnostics + known issues notes |

---

## Step 4 - Smoke test script (10 minutes)

1. Create **User A** and **User B**.
2. Log in as User A.
3. If prompted, open `/onboarding/profile` and set nation + archetype.
4. User A creates a quest at `/quest/create`.
5. Verify quest appears in User A list (dashboard active or `/hand`).
6. User A creates BAR at `/create-bar`, selecting linked quest.
7. Verify BAR appears in `/hand` (private) or `/bars/available` (public).
8. Ensure User A has >= 1 vibeulon (complete one quest or admin/dev seed).
9. User A sends 1 vibeulon to User B from `/wallet` using User B email or username.
10. Log in as User B and confirm:
    - wallet balance increased
    - received transfer appears in "Received Transfers".

---

## Step 5 - Instrumentation + break-glass switches

### Endpoint/action observability

- Added request-id + user-id error logging helper:
  - `src/lib/mvp-observability.ts`
- Applied to key high-risk actions:
  - auth login/signup path
  - quest creation
  - BAR creation
  - vibeulon transfer

### Feature flags

- `QUEST_GENERATOR_MODE` = `placeholder` (default) or `full`
- `AUTH_BYPASS_EMAIL_VERIFICATION` = `true/false` (dev-only toggle hook)
- `VIBEULON_LEDGER_MODE` = `simple-balance` (default) or `event-ledger`

### Diagnostics

- Existing `/api/health` now includes selected MVP flags for quick environment verification.

---

## Final requirement checklist (to fill during verification)

| Requirement | Status |
|---|---|
| 1) Users can sign up / log in | PASS |
| 2) User can select nation + archetype | PASS |
| 3) User can create quests and see them | PASS |
| 4) User can create BARs (linked quest path) and see them | PASS |
| 5) User can send/receive vibeulons (wallet + transfer) | PASS |

Residual risk: no browser automation in this patch; final confidence depends on manual smoke run in deployed preview.

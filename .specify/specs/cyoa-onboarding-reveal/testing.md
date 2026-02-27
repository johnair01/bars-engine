# Testing CYOA Onboarding Reveal and Quest Handoff

Use this to verify the recently built features on the **local server**. You can run the steps yourself or give the **Agent prompt** below to an AI agent (e.g. Antigravity) to create quests in the app and test the flow.

---

## Prerequisites

- **Database** with world content (nations, playbooks). If needed: `npm run db:seed` or `npm run db:reset`.
- **At least one player** (e.g. from seed or sign-up). The onboarding seed script uses the first admin or first player as creator.
- **Local server** running: `npm run dev` (default: http://localhost:3000).

---

## 1. Seed the onboarding thread and quests

The orientation thread "Welcome to the Conclave" and its quests must exist so new campaign sign-ups have quests to complete.

**Option A – npm script (recommended):**

```bash
npm run seed:onboarding
```

**Option B – direct script:**

```bash
npx tsx scripts/seed-onboarding-thread.ts
```

You should see output like: `Thread: "Welcome to the Conclave"`, four quests (Welcome, Declare Your Nation, Discover Your Archetype, Send Your First Signal), and "New players will be auto-assigned via assignOrientationThreads()".

**Option C – create/edit in Admin UI:**

1. Log in as an admin player.
2. Go to **Admin → Journeys** (http://localhost:3000/admin/journeys).
3. Open the **Welcome to the Conclave** thread (or create a new thread with type **orientation**).
4. Ensure the thread has at least one quest; link Twine stories to quests if you want full narrative flow.

---

## 2. Manual test: full CYOA flow

1. **Landing (logged out)**  
   - Open http://localhost:3000  
   - Confirm the primary CTA is **"Begin the Journey"** (links to `/campaign`).  
   - Confirm **Sign Up** and **Log In** are secondary.

2. **Campaign**  
   - Click **Begin the Journey** → http://localhost:3000/campaign  
   - Play through the Wake-Up CYOA until you reach the sign-up node (choice with `targetId` `Game_Login` or `signup`).  
   - Confirm **CampaignAuthForm** appears ("Claim Your Destiny").

3. **Sign up**  
   - Submit email + password.  
   - Confirm redirect to **/conclave/onboarding** (not `/conclave/guided`).

4. **Onboarding**  
   - Confirm you are sent to the first orientation quest (Twine play at `/adventures/.../play` or dashboard with `?focusQuest=...`).  
   - Confirm the orientation thread shows **"Enter Ritual"** / **"Start Journey"** and you can open the first quest.

5. **Campaign state (optional)**  
   - If the campaign stores `nation` / `playbook` (or `nationId` / `playbookId`) in `campaignState`, sign up with a new account and confirm the new player has nation/playbook prefilled and any gated threads assigned.

---

## 3. Certification quest verification

A certification quest runs through the same flow as the manual test and rewards vibeulons on completion.

1. **Seed the certification quest**
   ```bash
   npm run seed:cert:cyoa
   ```
   You should see: `Story seeded: Certification: CYOA Onboarding V1`, `Quest seeded: ...`, `CYOA Certification Quests seeded.`

2. **Open Adventures** (e.g. http://localhost:3000/adventures), find the quest **"Certification: CYOA Onboarding V1"** with the **Certification** badge.

3. **Play through** the Twine story: follow each step (landing CTA → campaign → sign-up redirect → first quest visible), then reach the final passage and complete the quest.

4. **Confirm** you receive the vibeulon reward and that each step in the story matches the feature (landing, campaign, sign-up redirect, first quest).

---

## 4. Agent prompt: create quests in app and test

Copy the block below into your agent (e.g. Antigravity) so it can create quests on the local server and verify the features.

```markdown
## Task: Test CYOA onboarding on local server

The bars-engine app has recently shipped: (1) landing CTA "Begin the Journey" → /campaign, (2) campaign sign-up → /conclave/onboarding (skip guided), (3) campaign state used to prefill nation/playbook and assign gated threads, (4) orientation thread with "Enter Ritual" and focusQuest.

**Assumptions:** Local dev server is running (npm run dev, default http://localhost:3000). Database has world content (nations, playbooks); if not, run `npm run db:seed` or `npm run db:reset`.

**Steps:**

1. **Seed the orientation thread and quests** so new sign-ups have quests to complete.
   - Run: `npm run seed:onboarding` (or `npx tsx scripts/seed-onboarding-thread.ts`).
   - If that fails (e.g. no players), ensure at least one player exists (e.g. create via app sign-up or seed).

2. **Create quests in the app (Admin)** so the orientation thread is usable.
   - Log in as an admin (or a user with admin access).
   - Go to http://localhost:3000/admin/journeys.
   - Open the "Welcome to the Conclave" thread (type: orientation). If it’s missing, run the seed from step 1.
   - Ensure the thread has at least one quest with a Twine story linked (or a dashboard fallback). Add or reorder quests as needed so the first quest is playable.

3. **Verify the flow in the browser.**
   - Open http://localhost:3000 in an incognito or logged-out window.
   - Confirm the primary button is "Begin the Journey" and it goes to /campaign.
   - Go to /campaign and play to the sign-up node; submit the form.
   - Confirm redirect to /conclave/onboarding (not /conclave/guided).
   - Confirm the user lands on the first orientation quest (Twine or dashboard with focusQuest) and can start the ritual.

4. **Report:** List any step that failed (command, URL, or behavior) and what you saw instead.
```

---

## 5. Quick reference

| What | Where |
|------|--------|
| Landing (logged out) | http://localhost:3000 |
| Campaign (CYOA) | http://localhost:3000/campaign |
| Admin Journeys (threads) | http://localhost:3000/admin/journeys |
| Admin thread edit | http://localhost:3000/admin/journeys/thread/[id] |
| Seed onboarding | `npm run seed:onboarding` or `npx tsx scripts/seed-onboarding-thread.ts` |
| Seed CYOA cert quest | `npm run seed:cert:cyoa` |

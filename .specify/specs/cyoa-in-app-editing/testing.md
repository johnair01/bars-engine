# Testing: In-App CYOA Editing

## Prerequisites
- Database with `DATABASE_URL` set (run `npm run env:pull` if needed)
- At least one player (for seed creator; `npm run db:seed` if needed)

## 0. Seed verification quests (Adventures page)
```bash
npm run seed:cert:cyoa
```
This seeds both the CYOA Onboarding and In-App CYOA Editing certification quests. They appear on the Adventures page with the "Certification" badge. Run this first so the quests are visible.

## 1. Seed Wake-Up Adventure
```bash
npm run seed:wake-up
```
Expected: `Adventure: Wake-Up Campaign (wake-up)`, `Passages: N created`, `Campaign will serve from DB`.

## 2. Campaign loads from DB
1. Open http://localhost:3000/campaign (logged out)
2. Campaign should load the first node (Center_Witness) from the database
3. Play through a few choices — nodes should load from DB

## 3. Edit passage in Admin
1. Log in as admin
2. Go to Admin → Adventures → Wake-Up Campaign (or /admin/adventures and select wake-up)
3. Click Edit on any passage (e.g. Center_Witness)
4. Change the text (e.g. add "— edited in Admin" at the end)
5. Save
6. Open /campaign in incognito — the edited text should appear

## 4. Edit start node
1. In Adventure detail, Settings → Start Node
2. Select a different passage (e.g. Center_ChooseLens) and Save
3. Open /campaign — campaign should begin at the new node
4. Set back to Center_Witness if desired

## 5. Verification quest (cert-cyoa-editing-v1)
1. Run `npm run seed:cert:cyoa` if not done.
2. Go to Adventures — you should see "Certification: In-App CYOA Editing V1" with the Certification badge.
3. Play through the quest: verify Wake-Up in DB, edit a passage, confirm on /campaign.
4. Complete the quest and receive the vibeulon reward.

## 6. Fallback when no DB Adventure
- To test file fallback: set Adventure status to DRAFT (or delete it), or use a DB without the wake-up Adventure
- /campaign should still load from files (map.json + node JSON files)

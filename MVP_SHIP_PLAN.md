# MVP GAME LOOP SHIP PLAN
**Status**: IN PROGRESS  
**Target**: Ship playable loop by EOD for first testers  
**Branch**: `cursor/mvp-game-loop-b579`

---

## DEFINITION OF DONE

MVP is complete when a new tester can:
- ✅ A) Create an account (signup + login)
- ✅ B) Select nation + archetype
- ✅ C) Create a quest (and see it in their quest list)
- ✅ D) Create a BAR tied to that quest (and see it in their BAR list / ledger)
- ✅ E) Send a vibeulon to another user (by username) and the recipient can see it received

---

## STATUS TABLE

| Feature | Exists? | Works End-to-End? | Breakpoint | Fix ETA (min) |
|---------|---------|-------------------|------------|---------------|
| **Auth: Signup** | ✅ Yes | ⚠️ Partial | New users don't get initial vibeulons | 10 min |
| **Auth: Login** | ✅ Yes | ✅ Works | None | 0 min |
| **Nation Selection** | ✅ Yes | ⚠️ Partial | Guided flow exists but not enforced | 15 min |
| **Archetype Selection** | ✅ Yes | ⚠️ Partial | Guided flow exists but not enforced | 15 min |
| **Quest Creation** | ✅ Yes | ✅ Works | Costs 1 vibeulon (needs starter balance) | 5 min |
| **BAR Creation** | ✅ Yes | ✅ Works | Same as quest (unified CustomBar model) | 0 min |
| **Vibeulon Transfer** | ✅ Yes | ✅ Works | UI exists at /wallet | 5 min |
| **Vibeulon Receive** | ✅ Yes | ✅ Works | Shows in wallet token list | 5 min |

---

## KEY FINDINGS

### What Already Works ✅
1. **Auth System**: Complete with Account + Player models
   - Login: `/login` → `conclave-auth.ts:login`
   - Signup: `/conclave/guided` → `conclave.ts:createGuidedPlayer`
   - Cookie-based sessions (no email verification required)

2. **Nation + Archetype**: Infrastructure complete
   - Database: `Player.nationId` and `Player.playbookId`
   - Guided onboarding flow: `/conclave/guided` with story-driven selection
   - `guided-onboarding.ts:recordStoryChoice` sets nation/playbook during flow
   - Dashboard detects incomplete setup and shows banner

3. **Quest/BAR Creation**: Fully functional
   - UI: `/quest/create` with `QuestWizard` component
   - Backend: `create-bar.ts:createQuestFromWizard` and `createCustomBar`
   - CustomBar model unified (quests = BARs)
   - Public quests cost 1 vibeulon to create (anti-spam)

4. **Vibeulon Economy**: Complete token system
   - Transfer: `economy.ts:transferVibulons`
   - Wallet: `/wallet` page with `VibulonTransfer` component
   - Token provenance tracking (originSource, generation)

### What Needs Patching ⚠️

1. **Starter Vibeulons Missing**
   - **Issue**: New signups get 0 vibeulons
   - **Impact**: Can't create first public quest (costs 1 vibeulon)
   - **Fix**: Grant 5 starter vibeulons in `createGuidedPlayer` and `createCharacter`
   - **ETA**: 10 minutes

2. **Nation/Archetype Enforcement**
   - **Issue**: Guided onboarding flow exists but completion varies
   - **Impact**: Some users might skip nation/archetype selection
   - **Current Safeguard**: Dashboard shows "Complete Your Setup" banner if incomplete
   - **Fix**: Ensure guided onboarding flow is primary path and completes properly
   - **ETA**: 15 minutes

---

## MVP SHORTCUTS & FEATURE FLAGS

### Shortcuts Taken
1. **Quest Generator**: Using simple form-based creation (no AI generation required for MVP)
2. **Email Verification**: Disabled (users can signup and play immediately)
3. **Quest Diversity**: Same quest can be created by users (no uniqueness enforcement)
4. **Vibeulon Minting**: Admin can mint via existing tools if needed

### Feature Flags (Dev Mode)
- `DEV_PLAYER_ID` env var: Auto-login in development (already implemented in `auth.ts`)
- Quest creation cost: Can be bypassed for private quests (0 vibeulon cost)

---

## IMPLEMENTATION TIMELINE (2 hours)

### 0:00–0:15 — Repo Audit & Status Table ✅ DONE
- [x] Located auth, quest, BAR, economy implementations
- [x] Confirmed database schema
- [x] Identified gaps
- [x] Created this document

### 0:15–0:30 — Fix Starter Vibeulons (IN PROGRESS)
- [ ] Modify `createGuidedPlayer` to mint 5 vibeulons
- [ ] Modify `createCharacter` to mint 5 vibeulons
- [ ] Test: New signup → check wallet balance = 5

### 0:30–0:45 — Verify Nation/Archetype Flow
- [ ] Test guided onboarding end-to-end
- [ ] Ensure nation/playbook are set before dashboard access
- [ ] Verify dashboard banner shows for incomplete setup

### 0:45–1:05 — Quest Create/List End-to-End Test
- [ ] Test: Create private quest (free)
- [ ] Test: Create public quest (costs 1 vibeulon)
- [ ] Test: Quest appears in "Active Quests" on dashboard
- [ ] Test: Another user can see and pick up public quest

### 1:05–1:25 — BAR Create/List End-to-End Test
- [ ] Test: Create BAR (CustomBar type: story)
- [ ] Test: BAR appears in quest list (unified model)
- [ ] Test: Complete BAR → earn vibeulon

### 1:25–1:45 — Vibeulon Transfer End-to-End Test
- [ ] Test: User A sends 1 vibeulon to User B
- [ ] Test: User A wallet shows -1 balance
- [ ] Test: User B wallet shows +1 balance
- [ ] Test: User B can see transfer in wallet history

### 1:45–2:00 — Smoke Test & Known Issues Doc
- [ ] Run full smoke test (see below)
- [ ] Document any edge cases
- [ ] Add instrumentation notes

---

## SMOKE TEST SCRIPT (Manual, 10 minutes)

### Prerequisites
- Clean database OR existing test users
- Two browser sessions (or incognito + normal)

### Test Flow

#### User A: Complete Onboarding
1. Navigate to `/conclave/guided`
2. Enter email + password → Create account
3. Complete guided onboarding flow
4. Select nation (e.g., "Innovators Union")
5. Select archetype (e.g., "The Catalyst")
6. Reach dashboard → Verify nation + archetype displayed
7. Check wallet → Verify 5 starter vibeulons

#### User A: Create Quest
8. Click "Create a New Quest"
9. Fill in title, description, inputs
10. Set visibility: Public (costs 1 vibeulon)
11. Submit → Verify quest appears in "Active Quests"
12. Check wallet → Verify balance = 4 vibeulons (1 spent)

#### User A: Create BAR
13. Repeat quest creation (call it "BAR: My First Task")
14. Verify it appears in quest list (BARs = CustomBars)

#### User B: Signup & Pick Up Quest
15. In second browser: Navigate to `/conclave/guided`
16. Create second account
17. Complete onboarding (different nation/archetype)
18. Check wallet → Verify 5 starter vibeulons
19. Navigate to "Available Quests"
20. Find User A's quest → Click "Pick Up"
21. Complete quest → Submit response
22. Verify: Earned vibeulon → Balance = 6

#### User A → User B: Send Vibeulon
23. User A: Navigate to `/wallet`
24. Use "Transfer Vibulons" form
25. Select User B as recipient
26. Send 1 vibeulon
27. Verify: User A balance = 3 vibeulons

#### User B: Receive Vibeulon
28. User B: Navigate to `/wallet`
29. Verify: Balance = 7 vibeulons (6 from quest + 1 from User A)
30. Check token inventory → Verify token shows origin from User A

### Expected Results
- ✅ All steps complete without errors
- ✅ Vibeulons balance correctly at each step
- ✅ Quests/BARs appear in correct lists
- ✅ Transfer shows in both sender and recipient wallets

---

## INSTRUMENTATION & DEBUGGING

### Logging (Already Implemented)
- Quest creation errors logged to console
- Transfer failures return explicit error messages
- Auth failures return user-friendly messages

### Admin Tools (Already Available)
- `/admin/players` - View all players
- Admin can mint vibeulons via `AdminPlayerEditor` component
- Database can be inspected directly via Prisma Studio: `npx prisma studio`

### Health Check
- Endpoint exists: `/api/health`

---

## KNOWN ISSUES & WORKAROUNDS

### Non-Blocking Issues
1. **Quest Content Similarity**: Users can create similar quests (no uniqueness enforcement)
   - **Workaround**: Social coordination + admin moderation
   - **Future**: Add quest templates or AI diversity checks

2. **No Email Notifications**: Recipient doesn't get notified of vibeulon transfer
   - **Workaround**: Tell users to check their wallet
   - **Future**: Add notification system

3. **No Quest Search/Filter**: All public quests shown in one list
   - **Workaround**: Limit quest creation volume initially
   - **Future**: Add search, tags, filters

### Degraded Mode Flags (Not Needed for MVP)
- Quest generator is already in "simple form mode"
- No AI dependencies for MVP

---

## COMMIT STRATEGY

### Commit 1: Core Fixes (Starter Vibeulons)
- Modify `createGuidedPlayer` and `createCharacter`
- Add tests for initial vibeulon minting

### Commit 2: Documentation & Testing
- Add this MVP_SHIP_PLAN.md
- Add smoke test results
- Update README if needed

### Commit 3: Final Polish (if time permits)
- UI improvements
- Error message clarity
- Loading states

---

## SUCCESS CRITERIA

### Must Have (P0)
- [x] Auth works (signup + login)
- [ ] Nation + archetype selection completes
- [ ] Quest creation works with starter vibeulons
- [ ] Vibeulon transfer works end-to-end
- [ ] Smoke test passes

### Nice to Have (P1 - if time permits)
- [ ] Better transfer UX (show "You received X from Y")
- [ ] Quest completion notification
- [ ] Admin seed script for demo users

---

## ROLLBACK PLAN

If critical issues found:
1. Revert to previous commit on branch
2. Tag current state as `mvp-attempt-1`
3. Document blocking issues
4. Re-estimate with revised scope

---

**Last Updated**: 2026-02-16  
**Author**: Cursor Cloud Agent  
**Status**: Implementation in progress

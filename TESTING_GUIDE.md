# MVP Testing Guide

## Automated Tests

### Database-Level Tests
Run the automated MVP loop test to verify core functionality at the database level:

```bash
npm run test:mvp-loop
```

This tests:
- ✅ User signup with starter vibeulons
- ✅ Nation + Archetype assignment
- ✅ Quest creation (costs 1 vibeulon)
- ✅ BAR creation (unified CustomBar model)
- ✅ Vibeulon transfer between users

**Prerequisites**: 
- `DATABASE_URL` must be set
- Database must be seeded with nations and playbooks: `npm run db:seed`

---

## Manual UI Testing

The following tests verify the end-to-end user experience. Run these in a browser with the dev server running (`npm run dev`).

### Test Suite 1: New User Onboarding (User A)

#### 1.1 Signup Flow
1. Navigate to `http://localhost:3000`
2. Click "Sign Up"
3. Enter email and password
4. Submit form

**Expected Result**:
- ✅ Redirected to guided onboarding story
- ✅ No errors in console

#### 1.2 Guided Onboarding
1. Progress through story nodes
2. Make choices that align with a nation
3. Select a nation from the reveal page
4. Click "Learn More" and confirm nation choice
5. Progress through playbook selection nodes
6. Select a playbook from the reveal page
7. Confirm playbook choice
8. Complete conclusion node

**Expected Result**:
- ✅ Nation displayed on dashboard
- ✅ Archetype/playbook displayed on dashboard
- ✅ Redirected to dashboard after completion

#### 1.3 Verify Starter Balance
1. On dashboard, check the "Vibeulons" widget (top right)
2. Click the widget to navigate to `/wallet`

**Expected Result**:
- ✅ Balance shows 5 vibeulons
- ✅ Wallet page lists 5 tokens with "Welcome Gift" origin

---

### Test Suite 2: Quest Creation (User A)

#### 2.1 Create a Public Quest
1. From dashboard, click "Create a New Quest"
2. Fill in:
   - **Title**: "Test Public Quest"
   - **Description**: "This is a test quest for MVP verification"
   - **Input Label**: "Your response"
   - **Visibility**: Public
3. Submit form

**Expected Result**:
- ✅ Success message displayed
- ✅ Redirected to dashboard
- ✅ Quest appears in "Active Quests" section
- ✅ Vibeulon balance decreased by 1 (now 4 vibeulons)

#### 2.2 Create a Private Quest/BAR
1. Click "Create a New Quest" again
2. Fill in:
   - **Title**: "Private BAR: Personal Reflection"
   - **Description**: "A personal task for myself"
   - **Visibility**: Private
3. Submit form

**Expected Result**:
- ✅ Quest created without vibeulon cost
- ✅ Appears in "Active Quests" section
- ✅ Vibeulon balance unchanged (still 4)

---

### Test Suite 3: Second User Signup (User B)

Open a second browser (or incognito window) and repeat Test Suite 1:

#### 3.1 Create User B
1. Navigate to `http://localhost:3000`
2. Sign up with different email
3. Complete guided onboarding
4. Select different nation/playbook than User A
5. Verify starter balance: 5 vibeulons

**Expected Result**:
- ✅ User B created successfully
- ✅ Different nation/playbook selected
- ✅ 5 starter vibeulons in wallet

---

### Test Suite 4: Quest Discovery and Completion (User B)

#### 4.1 Find Available Quests
1. From dashboard, click "Available Quests"
2. Browse the list

**Expected Result**:
- ✅ User A's public quest visible
- ✅ User A's private quest NOT visible
- ✅ System quests visible

#### 4.2 Pick Up and Complete a Quest
1. Click on User A's public quest
2. Click "Pick Up" or "Start Quest"
3. Fill in the response field
4. Submit completion

**Expected Result**:
- ✅ Quest moved to User B's active quests
- ✅ Completion form submitted successfully
- ✅ User B earned 1 vibeulon (balance: 6)
- ✅ Quest moved to "Graveyard" (completed section)

---

### Test Suite 5: Vibeulon Transfer (User A → User B)

#### 5.1 Send Vibeulons
1. As User A, navigate to `/wallet`
2. Use the "Transfer Vibeulons" form:
   - **Recipient**: Select User B from dropdown
   - **Amount**: 1
3. Click "Send Vibulons"

**Expected Result**:
- ✅ Success message displayed
- ✅ User A balance decreased by 1 (now 3 vibeulons)
- ✅ Transfer event logged in wallet history

#### 5.2 Verify Receipt
1. As User B, navigate to `/wallet`
2. Check balance and token list

**Expected Result**:
- ✅ User B balance increased by 1 (now 7 vibeulons)
- ✅ New token visible with origin showing User A's transfer
- ✅ Transfer event shows in User B's wallet

---

## Edge Cases and Error Handling

### Test: Insufficient Balance
1. As a user with 0 vibeulons, try to create a public quest

**Expected Result**:
- ✅ Error message: "Need 1 Vibeulon to stake a Public Quest"
- ✅ Quest NOT created

### Test: Transfer to Self
1. Try to transfer vibeulons to yourself

**Expected Result**:
- ✅ Error message: "Cannot send to self"
- ✅ Transfer NOT processed

### Test: Incomplete Profile
1. Create a new user and skip nation/playbook selection (if possible)
2. Try to access dashboard

**Expected Result**:
- ✅ Banner shown: "Complete Your Setup"
- ✅ Button to "Continue Journey" redirects to guided onboarding

---

## Success Criteria

### P0 (Must Pass)
- [ ] All 5 test suites complete without errors
- [ ] Starter vibeulons granted (5 per user)
- [ ] Nation + playbook assigned through guided flow
- [ ] Quest creation works and deducts vibeulons
- [ ] Vibeulon transfer visible in both wallets

### P1 (Nice to Have)
- [ ] No console errors during flows
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] UI is responsive on mobile

---

## Troubleshooting

### Issue: "DATABASE_URL not set"
**Solution**: Set the `DATABASE_URL` environment variable in `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Issue: "No nations or playbooks in database"
**Solution**: Run the seed script:
```bash
npm run db:seed
```

### Issue: "Insufficient vibeulons" on signup
**Solution**: Verify the fix in `conclave.ts` is deployed:
- Check that `createGuidedPlayer` and `createCharacter` both mint 5 vibeulons
- Restart the dev server

### Issue: User stuck in onboarding
**Solution**: Reset onboarding progress:
1. Navigate to `/conclave/guided?reset=true`
2. Complete the flow again

---

## Reporting Issues

If any test fails:
1. Note the test suite and step number
2. Screenshot the error (if UI issue)
3. Copy console logs (if applicable)
4. Note the user state (vibeulons, nation, playbook)
5. Report in the issue tracker or team chat

---

## Automated Test Output Example

When running `npm run test:mvp-loop`, you should see:

```
🧪 MVP GAME LOOP END-TO-END TEST

════════════════════════════════════════════════════════════
Testing Core Requirements:
  1. User signup/login
  2. Nation + Archetype assignment
  3. Quest creation
  4. BAR creation
  5. Vibeulon transfer
════════════════════════════════════════════════════════════

TEST 1: User Signup
  ✓ User created with 5 starter vibeulons

TEST 2: Nation + Archetype Assignment
  ✓ Nation set: Argyra
  ✓ Archetype set: Heaven (The Catalyst)

TEST 3: Quest Creation
  ✓ Quest created (1 vibeulon spent, balance: 4)

TEST 4: BAR Creation
  ✓ BAR created (type: story)

TEST 5: Vibeulon Transfer
  ✓ Transfer successful (sender: 3, recipient: 1)

Cleaning up test data...
  ✓ Test data cleaned up

════════════════════════════════════════════════════════════

7 passed, 0 failed

✅ ALL MVP REQUIREMENTS VERIFIED!

What this proves:
  ✓ Users can sign up and get starter vibeulons
  ✓ Nation + Archetype can be assigned
  ✓ Quests can be created (costs 1 vibeulon)
  ✓ BARs can be created (same as quests)
  ✓ Vibeulons can be transferred between users

🚀 MVP GAME LOOP IS READY FOR TESTERS!
```

---

**Last Updated**: 2026-02-16  
**Version**: MVP v0.1

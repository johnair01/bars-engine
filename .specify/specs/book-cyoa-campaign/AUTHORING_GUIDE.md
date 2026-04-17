# Authoring Guide — Creating a Book CYOA

Step-by-step for stewards creating a new library book CYOA.

## Step 1: Define Pedagogical Spine

1. What's the reframe? (Epiphany Bridge text)
2. What's the practice? (The quest)
3. What move(s)? (wake_up, clean_up, grow_up, show_up)
4. How many slots? (min: intro, bridge, practice, recap)

## Step 2: Seed Book + Quest

See `scripts/seed-mtgoa-chapter1-cyoa.ts` for full example pattern.

## Step 3: Create Adventure

```typescript
const adventure = await db.adventure.create({
  data: {
    slug: 'your-book-chapter-1',
    title: 'Your Book — Chapter 1 (demo)',
    status: 'ACTIVE',
    visibility: 'PUBLIC_ONBOARDING',
    campaignRef: 'your-book-campaign-ref',
    startNodeId: 'YOUR_BOOK_CH1_Start',
  },
});
```

## Step 4: Create Passages

One per slot. Follow naming: `<BOOK>_<CHAPTER>_<SLOT>`.

## Step 5: Wire Thread + Links

```typescript
await db.questThread.update({
  where: { id: thread.id },
  data: { adventureId: adventure.id },
});

await db.questAdventureLink.create({
  data: {
    questId: quest.id,
    adventureId: adventure.id,
    moveType: 'wakeUp',
  },
});
```

## Step 6: Write Runbook

Create `docs/runbooks/BOOK_CYOA_<YOURBOOK>.md` with canonical URL and 5-step path.

## Step 7: QA Validation

- [ ] All nodeIds unique
- [ ] All targetIds valid
- [ ] linkedQuestId active
- [ ] Markdown renders
- [ ] Copy matches voice
- [ ] ≥1 epiphany_bridge
- [ ] ≥1 skill_development with quest

## Step 8: E2E Flow

1. Open `/campaign?ref=your-campaign-ref`
2. Read passages
3. Click "Take quest"
4. Verify quest assignment
5. Complete quest
6. Return to recap (back button or explicit)

## Full Example

See `scripts/seed-mtgoa-chapter1-cyoa.ts`

Run: `npm run seed:mtgoa-ch1`

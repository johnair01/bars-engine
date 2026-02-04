---
description: Manual UI verification checklist for features that can't be auto-tested
---

# Manual UI Verification Checklist

Run this when you need to verify UI features without browser automation.

---

## Pre-Flight
- [ ] Dev server running (`npm run dev`)
- [ ] Recent `test-game-loop.ts` passed

---

## Critical Paths

### 1. Available Bars Page (`/bars/available`)
- [ ] Page loads without error
- [ ] Stage indicator dots appear on quest cards (8 dots)
- [ ] Current stage emoji shows (⚡🤝👁🎭💧🔥🌬⛰)
- [ ] "Recommended for You" section appears if affinity match exists
- [ ] Affinity badge (✨) shows on matching quests

### 2. Quest Completion Flow
- [ ] Claim a quest from Available page
- [ ] Complete the quest
- [ ] Verify VibulonEvent logged in DB with `archetypeMove: 'IGNITE'`
- [ ] Verify Vibeulon earned

### 3. Wallet/Vibeulons
- [ ] Wallet page shows Vibeulons
- [ ] Generation badge visible (Original/Gen 2/etc)
- [ ] Origin title displays

### 4. Stage Progression (if UI exposed)
- [ ] Stage advances when action taken
- [ ] VibulonEvent logged with correct move

---

## Quick Verification Commands

```bash
# Check page loads (200 = success)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/bars/available

# Check for stage indicators in HTML
curl -s http://localhost:3000/bars/available | grep -c "Stage"

# Check recent events in DB
npx tsx -e "
  const {PrismaClient} = require('@prisma/client')
  const db = new PrismaClient()
  db.vibulonEvent.findMany({take:3,orderBy:{createdAt:'desc'}})
    .then(e => console.log(e))
    .finally(() => db.\$disconnect())
"
```

---

## When to Run Manual Checks

| Situation | Automated Only | + Manual Check |
|-----------|----------------|----------------|
| Schema change | ✓ | |
| Action logic change | ✓ | |
| UI component change | ✓ | ✓ |
| Before major deploy | ✓ | ✓ |
| CSS/styling change | | ✓ |

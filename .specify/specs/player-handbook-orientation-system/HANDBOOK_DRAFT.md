# Handbook Draft — Four Moves Compass

> Working content for `/wiki/handbook`. Each section: one-liner, one action verb, one deep link.

---

## Wake Up — Notice what's alive

**One-liner:** Raise your awareness. See who is here, what resources exist, what is charged.

**Do this:** Capture a charge — name the thing that is alive in you right now.  
**Link:** `/capture` (Capture Charge)

**You're doing this when:** Something feels charged and you stop to name it rather than let it pass.

---

## Clean Up — Process what's charged

**One-liner:** Move emotional energy through you. Unblock what's stuck so you can act.

**Do this:** Run the 321 process — take your charge through three perspective shifts.  
**Link:** `/shadow/321` (321 Shadow Process)

**You're doing this when:** You feel too stuck, too emotional, or too flat to act — and you work with that directly rather than bypassing it.

---

## Grow Up — Deepen your capacity

**One-liner:** Expand your developmental lines. Encounter the edge of your current worldview and step through.

**Do this:** Unpack a quest — reflect on what you are learning and what developmental move it requires.  
**Link:** `/quest/create` (Create Quest) or `/hand/quests` (Quests in Vault)

**You're doing this when:** You notice you are being asked to hold a larger perspective than is currently comfortable — and you stay with it.

---

## Show Up — Act in the world

**One-liner:** Do the work. Complete quests. Contribute to threads. Take direct action on what matters.

**Do this:** View your active quests — find the one that is yours to complete now.  
**Link:** `/` (NOW — active quests) or `/adventures` (PLAY)

**You're doing this when:** A quest is not just noted or planned but actually moved toward completion.

---

## Handbook page structure (target)

```
/wiki/handbook
├── Header: "How to play BARS Engine" (brief, honest, one paragraph)
├── What success looks like → /docs/player-success or inline
├── The four moves (compass layout or vertical sections)
│   ├── Wake Up → capture link
│   ├── Clean Up → 321 link
│   ├── Grow Up → quest/unpack link
│   └── Show Up → now / adventures link
├── Your character (nation + archetype — brief)
├── When you're stuck (→ /emotional-first-aid, → /shadow/321)
└── Reference links (glossary, moves wiki, nations, archetypes)
```

## Felt-sense touchpoints (Phase 3 decisions)

Identified touchpoints and their files:

| # | Where | File | Copy placement |
|---|-------|------|----------------|
| 1 | Charge capture | `src/app/capture/page.tsx` | Below subtitle "Name it before it fades" |
| 2 | 321 shadow process | `src/app/shadow/321/page.tsx` | Below "Shadow Work" h1 |
| 3 | Quest unpack | `src/app/quest/[questId]/unpack/page.tsx` | Below quest title in header |

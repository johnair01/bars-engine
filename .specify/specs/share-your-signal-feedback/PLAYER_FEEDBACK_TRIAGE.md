# Share Your Signal — Player Feedback Triage

**Source**: Player feedback (production, Share Your Signal quest)  
**Date**: 2026-03-01  
**Status**: Interview & implementation planning

---

## Raw Feedback

### 1. Recent charge / daily input

> The recent charge isn't update for daily input. Since it's a new day the recent charge should be available for a new charge to be captured. I'm still seeing the previously entered charge on the dashboard.

### 2. Hexagram draws

> The hexagram draws are.. not very good. The text is the same for a lot of the hexagrams when they should be unique in name and differ in what their advice is.

### 3. Hexagram click → CYOA (BLOCKER)

> Clicking a hexagram sends me to the campaign onboarding when it should be rendering a CYOA adventure that's an interpretation of the hexagram with the choice point being the 4 moves.

---

## Codebase Findings

### Issue 1: Recent charge / daily input

**Current behavior**:
- `RecentChargeSection` shows the 5 most recent charge captures (from `getRecentChargeBars`).
- No date filter — it's "recent" by creation order, not "today's charge."
- Charge capture is unlimited; there's no concept of "one charge per day" or "daily slot."

**Possible interpretations**:
- **A**: Player expects a "daily charge" slot that resets each day — on a new day, the primary capture area should be empty/ready for today's charge.
- **B**: Player expects the section to hide or deprioritize yesterday's charges when it's a new day.
- **C**: Player expects a different UX — e.g. "Today's charge" as a single slot, with previous days archived.

**Files**: `src/actions/charge-capture.ts`, `src/components/charge-capture/RecentChargeSection.tsx`, `src/app/page.tsx` (line 361: `getRecentChargeBars`)

---

### Issue 2: Hexagram text uniqueness

**Root cause**: Seed data in `src/lib/seed-utils.ts` (lines 29–40):

```ts
for (let i = 1; i <= 64; i++) {
  await prisma.bar.upsert({
    where: { id: i },
    create: {
      id: i,
      name: `Bar #${i}`,
      tone: 'Neutral',
      text: `This is the state of Bar ${i}. Potential energy waiting for form.`,
    },
  })
}
```

- **Name**: `Bar #1`, `Bar #2`, … — unique but not proper I Ching names (e.g. "The Creative", "The Receptive").
- **Tone**: Same for all — `"Neutral"`.
- **Text**: Same template for all — `"This is the state of Bar X. Potential energy waiting for form."`

**Fix**: Replace with real I Ching content (King Wen names, unique tone, unique advice per hexagram). Options: manual JSON, AI-generated, or external I Ching corpus.

---

### Issue 3: Hexagram click → CYOA (BLOCKER)

**Current behavior**:
- Campaign lobby (`/campaign/lobby`) shows 8 portals, each with a hexagram (name, flavor, path hint).
- "Enter" links to `/campaign?ref=bruised-banana` — **hexagram ID is not passed**.
- `/campaign` then redirects to `/campaign/initiation` or `/campaign/twine` (Begin the Journey) — generic onboarding, not hexagram-specific.

**Expected behavior** (from feedback):
- Click hexagram → CYOA adventure that is an interpretation of that hexagram.
- Choice point = the 4 moves (Grow Up, Clean Up, Wake Up, Show Up).

**Existing hexagram→CYOA flow** (Dashboard Caster):
- Cast I Ching → `generateQuestFromReading(hexagramId)` → creates Adventure + Quest + Thread → redirects to `/adventure/{id}/play`.
- That flow *does* produce a hexagram-specific CYOA, but it's triggered from the dashboard caster, not from the lobby portals.

**Gap**: Lobby portals don't wire hexagram → CYOA. They link to generic campaign. Need:
1. Pass `hexagramId` when clicking a portal (e.g. `/campaign?ref=...&hexagram=42` or `/adventure/hexagram/42`).
2. Route to hexagram-specific CYOA: either generate on-the-fly (like Dashboard Caster) or resolve a pre-built adventure per hexagram.
3. Ensure the CYOA's choice point is the 4 moves.

**Files**: `src/app/campaign/lobby/page.tsx`, `src/actions/campaign-portals.ts`, `src/app/campaign/page.tsx`, `src/actions/generate-quest.ts`, `src/actions/quest-grammar.ts` (`publishIChingQuestToPlayer`)

---

## Product Decisions (from interview)

### Recent charge / daily input

1. **Model**: Single "today's charge" slot empty at start of day; older charges in an archive.
2. **Timezone**: New day = instance timezone (not UTC, not player timezone).

### Hexagram text — BLOCKER

3. **Canonization**: Must canonize I Ching source before moving forward. This blocks hexagram content and hexagram→CYOA.
4. **Scope**: All 64 hexagrams updated with unique name, tone, and advice.

### Hexagram → CYOA pipeline

5. **Entry point**: The 8 portals on the campaign lobby.
6. **Generation**: Generate when player clicks — but only the **first time**. After that, CYOA data is only generated during the Wake Up choice in the adventure.
7. **Structure**: Orb template — choices happen after the introduction (intro passage(s) → choice node with 4 moves → move-specific branches).
8. **Auth**: Player must have finished onboarding to enter game map; can't enter hexagram portals without onboarding.

---

## Implementation Plan (Draft)

### Phase 0: I Ching canonization — BLOCKER

| Task | Description |
|------|-------------|
| P0.1 | Choose canonical source (Legge, Wilhelm/Baynes, or other) for names and advice |
| P0.2 | Create content JSON/script with unique name, tone, text per hexagram 1–64 |
| P0.3 | Update seed to populate `Bar` with canonical content |
| P0.4 | Unblocks Phase 1 and Phase 2 |

### Phase 1: Hexagram portal → CYOA pipeline

| Task | Description |
|------|--------------|
| P1.1 | Pass `hexagramId` from lobby portal click; route to hexagram-specific CYOA |
| P1.2 | Generate on first click only; after that, CYOA generated only during Wake Up choice in adventure |
| P1.3 | Orb template: intro passage(s) → choice node (4 moves) → move-specific branches |
| P1.4 | Gate game map: require onboarding complete; redirect to `/conclave/guided` if not |

### Phase 2: Hexagram content (depends on P0)

| Task | Description |
|------|-------------|
| P2.1 | Populate all 64 hexagrams from canonical source (see P0) |
| P2.2 | Verify campaign portals, casting ritual, quest generation use updated content |

### Phase 3: Recent charge — archive + instance timezone

| Task | Description |
|------|-------------|
| P3.1 | Add `Instance.timezone` (e.g. America/Los_Angeles); default to UTC if null |
| P3.2 | Use instance timezone for "start of today" in charge capture |
| P3.3 | Add archive section for older charges (collapsible or separate view) |

---

## Reference

- [GM_CONSULT_AND_PLAN.md](./GM_CONSULT_AND_PLAN.md) — Game Master consultation
- [cert-feedback-triage skill](../../.agents/skills/cert-feedback-triage/SKILL.md) — Triage workflow

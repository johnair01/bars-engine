# I Ching Canonical — Integration & Verification Plan

## Overview

This plan covers integrating `content/iching-canonical.json` into the system and verifying that hexagram `name`, `tone`, and `text` are used correctly at each touchpoint.

---

## Phase 1: Seed Integration

### 1.1 Update seed-utils.ts

**File:** `src/lib/seed-utils.ts`

**Current behavior (lines 29–41):** Placeholder Bars with `Bar #N`, `Neutral`, generic text.

**New behavior:**
- Read `content/iching-canonical.json`
- If file exists: for each entry, `prisma.bar.upsert` with `id`, `name`, `tone`, `text`
- If file missing: log warning and keep placeholder (or fail loudly per env flag)

**Implementation sketch:**
```ts
// Replace the 64-placeholder loop with:
const canonicalPath = path.join(process.cwd(), 'content', 'iching-canonical.json')
if (fs.existsSync(canonicalPath)) {
  const hexagrams = JSON.parse(fs.readFileSync(canonicalPath, 'utf8')) as { id: number; name: string; tone: string; text: string }[]
  for (const h of hexagrams) {
    await prisma.bar.upsert({
      where: { id: h.id },
      update: { name: h.name, tone: h.tone, text: h.text },
      create: { id: h.id, name: h.name, tone: h.tone, text: h.text },
    })
  }
} else {
  // fallback: existing placeholder loop
}
```

### 1.2 Run seed

```bash
npm run validate:iching   # QC first
npm run db:seed
```

### 1.3 Verify flow (automated)

```bash
npm run test:iching-flow  # Compares DB Bars to canonical, simulates touchpoints
```

---

## Phase 2: Text Output Touchpoints

| # | Location | Bar fields used | What user sees |
|---|----------|-----------------|----------------|
| 1 | **Casting ritual** | `name`, `tone`, `text` | After cast: hexagram name (h2), tone (subtitle), full text (blockquote) |
| 2 | **Campaign lobby portals** | `name`, `tone` | Portal card: `portal.name`, `portal.flavor` = `name: tone` |
| 3 | **Quest generation (AI)** | `name`, `tone`, `text` | AI prompt: `Hexagram #N name — tone` + `Meaning: text` → influences generated quest |
| 4 | **Gameboard unpacking** | `name` | Admin debug: `#hexagramId hexagramName` |
| 5 | **I Ching wiki** | `name` | Table: `#id — name` per hexagram |
| 6 | **Story-clock quest titles** | `name` | `P{period} • {hexagram.name}` |

---

## Phase 3: Verification Checklist

### 3.1 Casting ritual (`/iching` or modal)

- [ ] Cast I Ching
- [ ] **Verify:** Hexagram name matches canonical (e.g. "Creative Power" not "Bar #1")
- [ ] **Verify:** Tone displays (e.g. "Rising Energy")
- [ ] **Verify:** Full oracle text displays (no truncation, correct wording)

### 3.2 Campaign lobby (`/campaign/lobby?ref=...`)

- [ ] Load lobby with 8 portals
- [ ] **Verify:** Each portal shows distinct hexagram name (not "Hexagram N")
- [ ] **Verify:** Flavor = `name: tone` (e.g. "Creative Power: Rising Energy")

### 3.3 Quest generation (AI)

- [ ] Generate a quest from a hexagram (e.g. via conclave/gameboard or admin quest-grammar)
- [ ] **Verify:** Generated quest title/description reflects oracle theme (qualitative)
- [ ] **Verify:** No "Bar #N" or placeholder text in quest content

**How to test:** Admin → Quest Grammar → select hexagram → generate. Inspect prompt context or output.

### 3.4 I Ching wiki (`/wiki/iching`)

- [ ] **Verify:** Table shows canonical names (e.g. "#1 — Creative Power")
- [ ] **Verify:** Spot checks (15, 20) show correct names

### 3.5 Story-clock quests

- [ ] **Verify:** Period quest titles use hexagram name (e.g. "P1 • Creative Power")

---

## Phase 4: Debug / Trace (optional)

To confirm `hexagramText` reaches the AI:

1. **Log in buildQuestPromptContext:** Temporarily log `ic.hexagramText?.slice(0, 100)` when `ichingContext` is present.
2. **Admin Quest Grammar:** Use the UnpackingForm with a hexagram selected; the compile step receives `IChingContext` from `buildIChingContextFromHexagram`.

---

## Summary

| Step | Action |
|------|--------|
| 1 | `seed-utils.ts` loads canonical JSON and upserts Bar (done) |
| 2 | `npm run validate:iching` → `npm run db:seed` |
| 3 | `npm run test:iching-flow` — automated DB vs canonical check |
| 4 | Cast I Ching (`/iching`) → check name, tone, text |
| 5 | Campaign lobby → check portal name + flavor |
| 6 | Generate quest from hexagram → check AI uses oracle |
| 7 | Wiki (`/wiki/iching`) + story-clock → spot-check names |

# SPEC: #47 — I Ching Prompt Deck Engine
## Upgrade from Oracle → Interactive Reading Practice

**Owner:** Challenger (execution) | **Approver:** @wendell-britt
**Status:** Draft — pending human review
**Created:** 2026-04-20

---

## 1. Concept & Vision

The I Ching is not a content delivery system — it is a **practice**. A player draws a hexagram, chooses which face they need to hear from, receives a question calibrated to that face's lens, and writes their answer before seeing any guidance. The reading is a conversation, not a horoscope.

This upgrade transforms the I Ching from a passive "read your fortune" experience into an active practice where the player stakes on their own interpretation first. The BAR that results from a reading is the player's intellectual and emotional contribution — a synthesis of their question and the wisdom they brought to it.

**The emotional design target:** BAR Clash teaches players to operate in **faith mode** — committing to an answer before having all the information. The I Ching reading is the warm-up practice for that. You draw, you choose, you write, you accept. Not because you know you're right, but because the act of writing is the practice.

---

## 2. Design Decisions — Face Reasoning

### The Question Format: Option 2 — Bespoke Face-Anchored Questions

**Decision:** Every hexagram carries 6 bespoke questions, one per Game Master Face.

**Face Council Deliberation:**

| Face | Position | Key Reasoning |
|------|----------|---------------|
| 🧠 Architect | Option 2 (conditionally) | If prompts seed persistent `player_response` BARs, quality determines product quality. Low leverage if ephemeral; high leverage if persistent. |
| ⚔️ Challenger | Option 1 (UX wins) | The face picker IS the real moment of stake. Questions are secondary — the choice of face is the reading. Recommended investing craft budget in UX over content. |
| 🏛️ Regent | Option 2 (phased) | Creates a long-arc asset. Start with 10–15 anchor hexagrams done well; fill rest over time. Clean maintenance story. |
| 🌬️ Diplomat | Hybrid (3 archetypes) | Three rotating patterns per face creates texture without 384 bespoke entries. Compromise between quality and scale. |
| 🧙 Sage | Option 2 or rename | If we invoke the I Ching tradition, we must honor it. Generic questions invoke the lineage without earning it. |
| 🌍 Shaman | Option 1 | Face picker IS the reading. Question text can be simple — the player did the real work by choosing. |

**Outcome:** 3–3 tie resolved by the question: *does the reading need to feel wise, or useful?*

**Answer:** Both — and the bespoke approach is the only path to both. The community will recognize thin content. The tradition demands more.

**Resolution:** Option 2 accepted. Phased approach: craft anchors for high-frequency hexagrams first; generic fallback for low-frequency ones. Frequency data from `IChingCastEvent` model (this spec) determines which hexagrams get full bespoke treatment.

---

### Why Not Generic Prefixes (Option 1)

Generic prefix templates ("What in your body knows the answer to this? [BASE_QUESTION]") are:
- ✅ Fast to implement, easy to maintain
- ✅ Systematically consistent
- ❌ Felt as programmatic by players — breaks ritual immersion
- ❌ Claims I Ching lineage without earning it
- ❌ Does not accumulate as a trust asset over time

The bespoke approach:
- ✅ Feels offered, not generated
- ✅ Earns the tradition it invokes
- ✅ Becomes more valuable as the system matures
- ❌ Initial craft investment required (384 entries)
- ❌ Maintenance cost if hexagram questions change

**The bet:** The bespoke investment pays off because the prompts seed `player_response` BARs that persist in players' hands. The quality of the asking determines the quality of what gets created.

---

## 3. User Experience

### Flow: Draw → Choose Face → Answer → Accept

```
/iching
  │
  ├─ [CAST] → Hexagram N revealed
  │            (hexagram name, trigram structure, reading text shown)
  │
  ├─ [CHOOSE FACE] → 6 face cards displayed
  │                   "Which face do you need to hear from?"
  │                   (face label, role description, no questions shown yet)
  │
  ├─ [QUESTION REVEALED] → Face's question for this hexagram
  │                         (2-part: face lens + hexagram theme)
  │
  ├─ [WRITE RESPONSE] → "What does this hexagram ask of you?"
  │                       (textarea — this is the player's BAR seed)
  │
  └─ [ACCEPT] → Player's response stored as player_response BAR
                  Hexagram added to hand
                  Confirmation shown
```

**Faith mode:** The player writes their response before seeing any guidance, commentary, or expert interpretation. The system does not judge whether their response is "correct." The act of writing IS the practice.

**Confirmation mode (optional second step):** After accepting, the player may choose to receive the traditional Wilhelm commentary. This is additive — the reading does not depend on it.

---

### Face Picker Design

Six face cards, each showing:
- Face name and icon
- Role label (e.g., "Proving Ground", "Mythic Threshold")
- One-line invitation ("What edge are you willing to stand on?")

**No questions shown at this stage.** The player chooses based on what they sense they need — not based on which question looks most interesting. The face card's invitation should be evocative, not informative.

**Face-to-question binding:** The question shown after selection is specific to both the hexagram AND the chosen face. Two players drawing hexagram 17 who choose different faces receive different questions.

---

## 4. Data Model

### Extension to existing schema

```prisma
// prisma/schema.prisma

// New model — records every I Ching cast event for frequency analysis
model IChingCastEvent {
  id            String    @id @default(cuid())
  playerId      String
  hexagramId    Int       // 1–64
  chosenFace    String    // shaman | challenger | regent | architect | diplomat | sage
  playerResponse String?  // what the player wrote — null if they skipped
  promptUsed    String    // the full question shown (for audit/analysis)
  source        String    // iching | campaign | ritual
  instanceId    String?
  campaignRef   String?
  threadId      String?
  createdAt     DateTime  @default(now())

  player        Player    @relation(fields: [playerId], references: [id])

  @@index([hexagramId, createdAt])
  @@index([chosenFace, createdAt])
  @@index([playerId, createdAt])
  @@map("iching_cast_events")
}

// Bar model extended with:
model Bar {
  id              Int         @id
  name            String
  tone            String
  text            String
  promptTemplates String      @default("[]") // JSON — not used for I Ching but aligns with BarDeckCard convergence
  createdAt       DateTime    @default(now())
  assignedTo      PlayerBar[]
}
```

**Frequency Analysis Query:**
```sql
-- Most-cast hexagrams (overall signal strength)
SELECT barId, COUNT(*) as cast_count
FROM player_bars
WHERE source = 'iching'
GROUP BY barId
ORDER BY cast_count DESC;

-- Most-chosen faces (which wisdom the community reaches for most)
SELECT chosenFace, COUNT(*) as choice_count
FROM iching_cast_events
GROUP BY chosenFace
ORDER BY choice_count DESC;

-- Face × Hexagram matrix (which faces get chosen per hexagram)
SELECT hexagramId, chosenFace, COUNT(*) as count
FROM iching_cast_events
GROUP BY hexagramId, chosenFace
ORDER BY hexagramId, count DESC;
```

---

## 5. Component Changes

### CastIChingModal.tsx — New respond step

**Current:** cast → accept → done
**New:** cast → choose face → question revealed → write response → accept → done

State additions:
```typescript
type ModalPhase = 'cast' | 'chooseFace' | 'respond' | 'accepting'

const [phase, setPhase] = useState<ModalPhase>('cast')
const [chosenFace, setChosenFace] = useState<GameMasterFace | null>(null)
const [playerResponse, setPlayerResponse] = useState('')
```

**Phase transitions:**
- `cast` → `chooseFace`: on hexagram accepted
- `chooseFace` → `respond`: on face card selected
- `respond` → `accepting`: on response submitted (calls acceptReading with response)
- `accepting` → done: on server confirmation

### API: acceptReading — response parameter

```typescript
// src/actions/cast-iching.ts
export async function acceptReading(
  hexagramId: number,
  castContext?: IChingCastContext | null,
  chosenFace?: GameMasterFace | null,
  playerResponse?: string | null
)
```

`chosenFace` and `playerResponse` are stored on `IChingCastEvent`. `playerResponse` seeds the `player_response` CustomBar title/description.

---

## 6. File Changes

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `IChingCastEvent` model; add `promptTemplates` to `Bar` |
| `prisma/migrations/xxx_add_iching_cast_event/` | Migration |
| `packages/bars-core/src/shared/iching-prompt-templates.ts` | 64 hexagrams × 6 face questions (384 entries) |
| `packages/bars-core/src/shared/iching-struct.ts` | Add `getHexagramFaces()`, `getPromptTemplatesForHexagram()` |
| `src/actions/cast-iching.ts` | Add `chosenFace` + `playerResponse` params to `acceptReading`; write `IChingCastEvent` |
| `src/components/CastIChingModal.tsx` | Add `chooseFace` + `respond` phases; face picker UI; response textarea |
| `src/app/api/iching-stats/route.ts` | (New) Frequency analysis endpoint — returns cast counts by hexagram, face, and matrix |

---

## 7. Verification Gate

```bash
# After migration:
npx prisma migrate dev --name add_iching_cast_event

# Functional check:
# 1. Go to /iching, cast a hexagram
# 2. See 6 face cards — choose one
# 3. See face's question for this hexagram
# 4. Write a response — submit
# 5. Confirm: player_response BAR in /hand has title = response text, hexagramId set
# 6. Query: SELECT * FROM iching_cast_events WHERE playerId = 'test' — record exists with all fields

# Frequency check:
# 1. Make 3 casts with different faces
# 2. GET /api/iching-stats → hexagram counts and face counts increment correctly
```

---

## 8. Open Questions

1. **Confirmation mode:** After accepting a reading, should the player be able to optionally "Receive Commentary" (Wilhelm text)? This would be additive — does not change the faith mode requirement.

2. **Skip response:** Can a player accept a reading without writing a response? Should we require a response, or allow "just accept" for players who aren't ready to write?

3. **Frequency threshold:** At what cast count does a hexagram graduate from generic fallback to bespoke question treatment? (Suggested: top 20 by frequency, reviewed quarterly.)

---

## 9. Relationship to Other Work

- **Phase 2 (#64) — BAR Clash:** The I Ching reading is warm-up practice for the faith-mode commitment that BAR Clash requires. If a player can write their response to a hexagram before seeing guidance, they are practicing the skill BAR Clash demands.
- **Face move library convergence:** `face-move-library.ts` already has `prompt_templates`. When `BarDeckCard` ships, I Ching prompt templates converge into the same data model — no semantic loss.
- **Frequency data:** `IChingCastEvent` frequency analysis informs which hexagrams get bespoke question treatment first. The data funds the craft decision.

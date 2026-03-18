# Campaign Lobby: Path Hint Redesign & GM Face Interview

**Goal**: Replace generic placeholder path hints with hexagram-specific, face-voiced copy that invites players to explore the gameboard. Enter curious → leave excited, triumphant, peaceful, blissful, or poignant.

---

## 1. Current State Analysis

### 1.1 Campaign Lobby Page (`/campaign/lobby`)

- **Location**: `src/app/campaign/lobby/page.tsx`
- **Data**: `get8PortalsForCampaign(campaignRef)` → 8 portals
- **Display**: Each portal shows:
  - `portal.name` (hexagram name)
  - `portal.flavor` (hexagram name + tone, e.g. "Creative Power: Rising Energy")
  - `portal.pathHint` (generic placeholder)
  - "Enter" CTA

### 1.2 Current Generic Placeholder

**File**: `src/lib/portal-context.ts` line 54

```ts
pathHint: `In the spirit of ${stageAction}, this reading suggests a path.`
```

**Example**: `stageAction` = "We need resources" (from Kotter Stage 1 + GATHERING_RESOURCES)

→ "In the spirit of we need resources, this reading suggests a path."

**Problems**:
- Generic: same for every hexagram
- Stage-action-centric, not hexagram-centric
- No emotional arc or face voice
- No differentiation between "paths with changing lines" vs static

### 1.3 Data Flow

- **Portals**: `campaign-portals.ts` draws 8 random hexagrams (no Story Clock, no changing lines)
- **Context**: `contextualizeHexagramForPortal(hexagramId, allyshipDomain, kotterStage, name, tone)` — no `hexagramText` or changing lines passed
- **Line-to-face**: `LINE_TO_FACE` in `cast-iching.ts`: Line 1 (bottom) = Shaman, 2 = Challenger, 3 = Regent, 4 = Architect, 5 = Diplomat, 6 = Sage

The lobby currently has **no changing lines** concept. To implement "only paths with changing lines revealed," we need to either:
- Cast each hexagram with simulated changing lines (coin cast per portal)
- Or use Story Clock sequence + assign changing lines per period

---

## 2. Design Requirements

### 2.1 Path Hint Content

- **Hexagram-specific**: Each path hint must reflect the hexagram's name, tone, and text (or a distilled essence).
- **Face-voiced**: The path hint should be in the language of the GM face that governs that path's changing lines.
- **Emotional goal**: Orient toward exit states: excited, triumphant, peaceful, blissful, poignant.

### 2.2 Reveal Logic

- **Only paths with changing lines** are shown to players.
- If a hexagram has no changing lines (e.g. all 6 lines stable), that portal is hidden or not offered.
- Rationale: Changing lines = active transformation; static hexagrams = no invitation to enter.

### 2.3 Emotional Journey

| Entry | Exit |
|-------|------|
| Curious | Excited |
| Curious | Triumphant |
| Curious | Peaceful |
| Curious | Blissful |
| Curious | Poignant |

---

## 3. Game Master Face Interview Framework

To craft emotionally intelligent, integrally informed path hints, we "interview" each face. Each face answers:

1. **What is your role in the orientation process?**
2. **What language do you use when inviting someone to cross a threshold?**
3. **What emotional state do you want to evoke when someone leaves your path?**
4. **How do you speak about a hexagram reading when it's your line that's changing?**

### 3.1 Shaman (Line 1 — bottom)

- **Role**: Mythic threshold, belonging, ritual space, bridge between worlds
- **Mission**: Belonging, ritual space, bridge between worlds
- **Canonical move**: observe (Wake Up)

**Interview prompts**:
- "When a player enters a portal with a hexagram where Line 1 is changing, how do you invite them?"
- "What tone do you use—mysterious, warm, grounding?"
- "What emotional state do you want them to leave with?"

**Example voice** (hypothetical):
- "The threshold calls. This hexagram reveals a moment of emergence—something beneath the surface is ready to surface. Enter with curiosity; leave with belonging."

### 3.2 Challenger (Line 2)

- **Role**: Proving ground, action, edge, lever
- **Mission**: Action, edge, lever
- **Canonical move**: experiment (Show Up)

**Interview prompts**:
- "When Line 2 is changing, what do you say to someone about to enter?"
- "How do you frame challenge without discouragement?"
- "What does triumph feel like in your language?"

**Example voice**:
- "This reading demands action. The line that shifts is yours to move. Enter ready to prove; leave with a win."

### 3.3 Regent (Line 3)

- **Role**: Order, structure, roles, rules, collective tool
- **Mission**: Roles, rules, collective tool
- **Canonical move**: name (Wake Up)

**Interview prompts**:
- "When Line 3 is changing, how do you structure the invitation?"
- "What clarity do you offer before they enter?"
- "What does 'peaceful' mean in your domain?"

**Example voice**:
- "This hexagram names a structure. The line that shifts is the one that orders. Enter with a question; leave with clarity."

### 3.4 Architect (Line 4)

- **Role**: Blueprint, strategy, project, advantage
- **Mission**: Strategy, project, advantage
- **Canonical move**: reframe (Grow Up)

**Interview prompts**:
- "When Line 4 is changing, how do you frame the path as a design?"
- "What does 'excited' look like in your language?"
- "How do you invite someone to see the blueprint?"

**Example voice**:
- "This reading is a blueprint. The line that shifts is the one that reframes. Enter with a plan; leave with a better one."

### 3.5 Diplomat (Line 5)

- **Role**: Weave, relational field, care, connector
- **Mission**: Relational field, care, connector
- **Canonical move**: feel (Clean Up)

**Interview prompts**:
- "When Line 5 is changing, how do you invite connection?"
- "What does 'blissful' or 'poignant' mean in your relational language?"
- "How do you speak about care in the context of a hexagram?"

**Example voice**:
- "This hexagram weaves. The line that shifts is the one that connects. Enter with care; leave with a fuller heart."

### 3.6 Sage (Line 6 — top)

- **Role**: Whole, integration, emergence, flow
- **Mission**: Integration, emergence, flow
- **Canonical move**: integrate (Show Up)

**Interview prompts**:
- "When Line 6 is changing, how do you speak of integration?"
- "What does emergent wisdom sound like in your voice?"
- "How do you invite someone to see the whole?"

**Example voice**:
- "This reading integrates. The line that shifts is the one that completes. Enter with openness; leave with flow."

---

## 4. Path Hint Generation Logic (Proposed)

### 4.1 Inputs

- `hexagramId`, `hexagramName`, `hexagramTone`, `hexagramText`
- `allyshipDomain`, `kotterStage`, `stageAction`
- `changingLines: number[]` (1–6 for which lines are changing)
- `LINE_TO_FACE` mapping

### 4.2 Logic

1. **If `changingLines.length === 0`**: Portal is hidden (filtered out).
2. **Primary face**: The face governing the lowest changing line (or lowest-indexed) is the "primary voice."
3. **pathHint**: Generated from:
   - Hexagram essence (name + tone, or first sentence of text)
   - Stage action (context)
   - Face-specific template (from interview)

### 4.3 Template Shape (Per Face)

```
[Hexagram essence]. [Stage context]. [Face invitation].
```

Example:
- Hexagram 1 (Creative Power): "A dragon awakens. What had been hidden is now ascending."
- Stage: "We need resources"
- Face: Architect (Line 4 changing)

→ "Creative Power rises. In the spirit of gathering resources, this reading is a blueprint—the line that shifts reframes. Enter with a plan; leave with a better one."

---

## 5. Implementation Tasks

| # | Task | Notes |
|---|------|-------|
| 1 | Add `changingLines` to portal cast | Cast 8 hexagrams with simulated changing lines; filter to portals with ≥1 changing line |
| 2 | Extend `contextualizeHexagramForPortal` | Accept `hexagramText`, `changingLines`; compute primary face |
| 3 | Create face-specific path hint templates | One per face; use interview outputs |
| 4 | Filter portals | Only show portals with `changingLines.length > 0` |
| 5 | Wire Story Clock (optional) | If using Story Clock sequence, assign changing lines per period |

---

## 6. GM Interview Execution — How to Run

Use the Sage or each face's MCP tool to generate interview responses:

1. **Sage consult**: "What is the Shaman's role in orienting a player who enters a portal where Line 1 is changing? What language does the Shaman use? What emotional state should the player leave with?"

2. **Repeat for each face** (Challenger, Regent, Architect, Diplomat, Sage).

3. **Compile** responses into a `FACE_PATH_HINT_TEMPLATES` table or config.

4. **Refine** with human review for tone, brevity, and emotional arc.

---

## 7. GM Interview Responses (from Agent Calls)

### Sage (Line 6) — Live Response

> As you enter the portal where Line 6 shifts, remember that transformation culminates here. I, the Sage, stand as your guide, whispering the wisdom of Earth energy to anchor you in this moment of potential change. You journey into a space where past and future merge like threads woven together by unseen hands.
>
> Use the language of Earth's resonance – steady, deliberate, and grounded – encouraging you to step forth without haste but with deep-rooted assurance.
>
> Your emotional state should balance on the edge of neutrality, imbued with expectancy and readiness to embrace the transformative forces at play. Accept this transition as a natural cycle of growth and emergence.
>
> **Path Hint**: "Line 6 sets the pattern's zenith; resist finality. Await the steady rhythm of attunement. What holds steady amid change roots itself in eternal wisdom."

### Shaman (Line 1) — Live Response

> In the shifting sands of life's vast desert, you find yourself at the threshold of a new gateway, a portal where the unseen becomes seen and mysteries unravel. As the guardian of this crossing, I am the keeper of rituals and bearer of silent whispers from the spirits of earth and sky. Here, language curls like smoke, with a cadence that echoes the heart's deepest, wordless knowing — a narrative woven from the threads of myth and emotion.
>
> In this sacred space, feel the pulse of the earth beneath your feet, the grounding force that binds you to your essence. As you step through, let curiosity be your lantern, illuminating the path. You arrive burdened with questions, yet my role is to cultivate a journey that transforms uncertainty into the blissful knowing that you belong to the web of life.
>
> **Path Hint**: "The heart seeks its treasures not in distant lands, but in the quietude of its own dwelling." Let this hexagram guide you — a sacred reminder that peace and belonging are found within the self; a sanctuary for your spirit's whispered truths.

### Challenger (Line 2) — Live Response

> When the energy of Creative Power rises and Line 2 becomes focal, your task is to pinpoint a decisive move. **Harness the edge of emerging curiosity**: assert clear intention as a wayfinder. Test your will against the proving ground; the harsh environment shapes new mastery. Bring intention into reality by aligning action with the momentum already building within you. Approach with openness but let determination prevail to leave triumphant, catalyzing hidden potentials into influential energy.

### Regent (Line 3) — Live Response

> When Line 3 changes in a hexagram like Modesty, the Regent might suggest: "Harmonize your aspirations with reality by discovering the balance between ambition and humility. Use this moment to stabilize your commitments and cultivate shared understanding, moving from curiosity to clarity."

### Architect (Line 4) — Template (awaiting AI refinement)

> This reading is a blueprint. The line that shifts is the one that reframes. Enter with a plan; leave with a better one.

### Diplomat (Line 5) — From guide response

> Welcome to our vibrant community! … Let the rhythm of our community guide your pace, and celebrate each step you take as part of your journey with us. Remember, you're never alone on this path; we're here to weave this tapestry of relationships together.

**Refined path hint template**: "This hexagram weaves. The line that shifts is the one that connects. Enter with care; leave with a fuller heart."

---

## 8. Summary

- **Current**: Generic "In the spirit of X, this reading suggests a path."
- **Target**: Hexagram-specific, face-voiced path hints; only portals with changing lines revealed.
- **Emotional arc**: Curious → excited/triumphant/peaceful/blissful/poignant.
- **Method**: Interview each GM face via backend agents or MCP; compile templates; implement in `portal-context.ts` and `campaign-portals.ts`.

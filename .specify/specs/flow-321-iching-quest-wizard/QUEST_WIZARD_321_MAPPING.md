# Quest Wizard ↔ 321 — What goes where

## Why the old mapping felt wrong

`deriveMetadata321` builds **BAR / import metadata**:

| Field | Source | Intended use |
|-------|--------|----------------|
| **title** | `q1` + `q5` truncated | “Situation + insight” line — **shadow-work language**, not a quest marketing title |
| **description** | Concatenation of unpacking + Face It | **Process transcript**, not player-facing quest instructions |
| **tags** | Heuristic from words | Routing / search |

The wizard’s **Quest identity** step needs **game-facing** copy:

- **Title** — short label in the Conclave  
- **What the player does** — instructions for completing the quest  
- **Done means** — observable completion signal  

Those should **not** be auto-filled from the 321 transcript.

---

## Current behavior (after UX pass)

### Carried automatically from 321 (sessionStorage → wizard)

| Data | Where it lands | Purpose |
|------|----------------|---------|
| `phase2` / `phase3` JSON | `formData.source321` → server `persist321Session` + `source321SessionId` | **Linkage & learning** — same as direct “quest from 321” |
| `moveType` | From `extractCreationIntent(phase2)` (aligned action text) | Engine routing |
| `allyshipDomain` | From intent `domain` or tag match | Engine routing |
| `displayHints` | **UI only** — charge, mask, aligned move, integration shift | Reference `<details>` + optional append |

### Player-authored in wizard (step **Quest identity**)

| Field | Meaning |
|-------|---------|
| **Title** | Quest name in the game |
| **What the player does** | Instructions |
| **Done means** | Success signal (maps to `successCriteria` in `createQuestFromWizard`) |

Optional: **Append 321 summary to description** — appends a labeled block; player can edit.

### Server (`createQuestFromWizard`)

- `agentMetadata`: `{ sourceType: '321', nextAction, via: 'quest_wizard' }` (next action from aligned move)  
- `completionEffects.source321Wizard`: true  
- `persist321Session` links the quest to the shadow session  

---

## Wizard step order

1. Move + domain + template  
2. Template summary (prompts preview)  
3. Settings (scope, reward, gating, …)  
4. **Quest identity** (title, instructions, done means) — **321 reference panel** if `from=321`  
5. Preview → Publish  

---

## Design aesthetic

- **321** = shadow work / compost (reference)  
- **Quest** = committed, metabolizable work (authored)  
- Separation avoids dumping the transcript into “description” and calling it a quest.

---

## Gating: “archetype” labels (not “trigram” in UI)

`getGatingOptions()` loads **archetypes** from the DB and exposes **`archetypeKeys`**: the first word of each archetype display name (e.g. `Fire` from `Fire (Li)…`). The quest engine still stores this list in the **`allowedTrigrams`** column as JSON for historical reasons; matching uses `player.archetype.name.split(' ')[0]`. **Player-facing copy** says **archetype / playbook**, not trigram.

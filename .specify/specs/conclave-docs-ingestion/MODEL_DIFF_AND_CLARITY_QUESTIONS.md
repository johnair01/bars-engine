# Conclave Integration — Model Diffs & Clarity Questions

**Principle:** Privilege canonical BARS Engine models. When Conclave docs differ, document the diff and ask for clarity on how to integrate.

---

## 1. Archetypes

### Canonical (BARS Engine)

**Source:** `prisma/schema.prisma` → `Archetype` model; `src/lib/seed-utils.ts` → 8 archetypes

| # | Canonical Name |
|---|----------------|
| 1 | The Bold Heart |
| 2 | The Devoted Guardian |
| 3 | The Decisive Storm |
| 4 | The Danger Walker |
| 5 | The Still Point |
| 6 | The Subtle Influence |
| 7 | The Truth Seer |
| 8 | The Joyful Connector |

### Conclave (Bridge Scenario spec)

| # | Conclave Name |
|---|---------------|
| 1 | The Danger Walker |
| 2 | **The Brave Heart** |
| 3 | The Still Point |
| 4 | The Truth Seer |
| 5 | The Joyful Connector |
| 6 | The Subtle Influence |
| 7 | The Decisive Storm |
| 8 | [Eighth — MUST BE DISCOVERED] |

### Diff

| Conclave | Canonical | Action |
|----------|-----------|--------|
| **The Brave Heart** | **The Bold Heart** | Naming mismatch |

**Resolved:** Typo. Use **The Bold Heart** (canonical). Update Bridge spec fixture.

---

## 2. Game Master Faces

### Canonical (BARS Engine)

**Source:** `src/lib/quest-grammar/types.ts` → `GameMasterFace`, `GAME_MASTER_FACES`

```
shaman | challenger | regent | architect | diplomat | sage
```

### Conclave (Orb Encounter Grammar)

Same 6 faces. **No diff.** Use canonical.

---

## 3. Emotional Alchemy / Emotional Vectors

### Canonical (BARS Engine)

**Source:** `src/lib/quest-grammar/types.ts` → `EmotionalChannel`; `.specify/memory/conceptual-model.md`

- **Channels:** Fear, Anger, Sadness, Joy, Neutrality (5 elements: Metal=Fear, Water=Sadness, Wood=Joy, Fire=Anger, Earth=Neutrality)
- **Altitude:** dissatisfied | neutral | satisfied (from Orb Twee spec)
- **No explicit "emotional vector" schema** — used in prompts and AI context, not persisted as a first-class model

### Conclave (Orb specs)

- **Vector format:** `channel:from_altitude->to_altitude` (e.g. `fear:dissatisfied->fear:neutral`)
- **Proposed:** `orb_encounter_seeds.allowedVectors` (JSON array of vector strings)

### Diff

| Conclave | Canonical | Action |
|----------|-----------|--------|
| Vector as string | No persisted vector model | Conclave proposes new fields |

**Resolved:** Yes, we need a model for emotional vectors. Integrate with existing emotional alchemy moves. We haven't canonized the vectors yet — that work is needed.

---

## 4. Nations

### Canonical (BARS Engine)

**Source:** `prisma/schema.prisma` → `Nation`; `src/lib/seed-utils.ts`

- Nations have `name`, `element` (metal, water, wood, fire, earth)
- Seed creates 5 nations (Argyra, Lamenth, Meridia, Pyrakanth, Virelune)

### Conclave (Orb Twee Generator)

- Uses `nation` as string input (name or slug)
- Modulates language, symbolism, anomaly flavor

### Diff

**No structural diff.** Conclave consumes nation from player/campaign context. Use `Player.nationId` → `Nation`.

---

## 5. Orb Encounter Models (New)

### Conclave Proposes

- `orb_encounter_seeds`
- `orb_encounters`
- `orb_encounter_resolutions`
- `gm_face_modifiers`
- `orb_artifact_emissions`

### Canonical Overlap

- **GM faces:** Already exist as `GameMasterFace` type. Conclave adds `gm_face_modifiers` table for **modulation metadata** (anomaly_style, contact_voice, etc.). Not a replacement — an extension.

**Resolved:** Yes. Add `gm_face_modifiers` table as supplement to `GameMasterFace` type.

---

## 6. Bridge Scenario Models (New)

### Conclave Proposes

- `BridgeScenarioDefinition`
- `BridgeScenarioRun`
- `BridgeSeatAssignment`
- `BridgeAction`
- `BridgeTriggerEvent`
- `BridgeOutcome`

### Canonical Overlap

- **Archetypes:** Bridge uses archetypes for progression gating. Use `Archetype` model. Resolve "Brave Heart" → "Bold Heart" per §1.
- **Campaign / Instance:** Bridge has `campaignId`, `instanceId`. Use `Instance` model.
- **Outcomes:** BAR_MINTED, QUEST_UPDATED, VIBEULON_ALLOCATED, DAEMON_TRACE_CREATED. Map to `CustomBar`, `QuestThread`/`ThreadProgress`, `Vibulon`/`VibulonEvent`, `DaemonSummon`/`BlessedObjectEarned`.

**Resolved:** Seats defined in JSON only (scenario definition). Bridge Scenario Engine is **lower priority** in backlog.

---

## 7. Orb Twee Generator — Output Format

### Conclave Proposes

- 9 passages: context_1, context_2, context_3, anomaly_1, anomaly_2, anomaly_3, choice, response, artifact
- Output: `.twee` string

### Canonical Overlap

- **Adventure / Passage:** `prisma/schema.prisma` → `Adventure`, `Passage`. Twine content lives in `Passage` or `CompiledTweeVersion`.
- **CustomBar:** Quests are `CustomBar` with `moveType`, `allyshipDomain`, etc.

**Resolved:** Output must live somewhere admins can interface with it. Do **not** keep OrbEncounter as a model — preserve the **template** only. Long-term goal: agents develop their own templates. Need a home for generated content that admins can edit; template system, not encounter-type-specific models.

---

## Summary: Decisions (Resolved)

| # | Topic | Decision |
|---|-------|----------|
| 1 | Archetype naming | Brave Heart = typo for Bold Heart |
| 2 | Emotional vectors | Need model; integrate with emotional alchemy; canonize vectors |
| 3 | GmFaceModifier | Add modifiers table as supplement |
| 4 | Bridge seats | JSON only; Bridge Scenario lower priority |
| 5 | Orb output | Template system; admins interface; agents develop templates; no OrbEncounter model |

---

## Integration Checklist (After Clarity)

- [x] Resolve archetype naming (Brave → Bold Heart)
- [ ] Canonize emotional vectors (structure + transformation logic); add model; add Translate move; integrate with emotional alchemy (Transcend + Translate; Generative/Control as translate subtypes)
- [ ] Add gm_face_modifiers table
- [ ] Design template system (admin-editable; agent-developable; context-appropriate naming; no Orb-specific model)
- [ ] Add Bridge scenario models (seats in JSON; lower priority)
- [ ] Update Bridge spec fixture: Brave Heart → Bold Heart

---

## Ouroboros Questions — Resolved

### On emotional vectors

**Q1:** Canonize **structure** and **transformation logic** (not just language).

**Q2:** Canonization = surfacing what's already there. **Missing move: Translate.**
- **Transcend** — moving from dissatisfaction to satisfaction (altitude within channel)
- **Translate** — moving from one channel to another
- **Generative** — a translate move in alignment with the system
- **Control** — a translate move out of alignment with the system

The 15-move engine needs to reflect this. Vectors are latent in the moves; canonization makes them explicit.

---

### On templates

**Q3:** Fine to make a model — don't name it "Orb" or "OrbEncounter." Use names that fit our context. The Orb is external; we're preserving the *structure* it demonstrates, not the Orb itself.

**Q4:** Template ownership:
- **Ours (the system's):** Generated by agent or admin
- **Theirs (the players'):** Created by players in the system, or brought in from outside

**Q5:** Orb 9-passage structure = **first template in a library** (not a one-off).

---

### On the admin interface

**Q6:** Needs admin UI. Admins edit a **draft that becomes an Adventure**.

---

### On integration order

**Q7:** These aren't dependencies. **The Orb doesn't matter — the structure that the Orb produces is what we're preserving.** We're building the generic template system (library, draft→Adventure flow) that the Orb example demonstrates. Don't build "Orb" stuff; build the structure.

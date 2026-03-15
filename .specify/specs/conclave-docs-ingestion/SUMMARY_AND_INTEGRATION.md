# Conclave Docs — Summary and Integration Analysis

**Source:** `/Users/test/Downloads/Construc conclave (3)/`  
**Purpose:** Interpret intent, integration strategy, and Sage-powered ingestion pipeline.

---

## What You're Trying to Do

You are ingesting a **design system for the Construct Conclave** — the narrative container that metabolizes real-world stakes (Bruised Banana, Allyship) through collaborative play. The docs define:

1. **Orb Encounter Grammar** — How the world "notices" the player: context → anomaly → contact → interpretation → decision → world response → continuation. Modulated by six Game Master faces. The feeling: *"something in this world noticed me."*

2. **Orb Triadic Twee Generator** — A vertical slice: nation + archetype + emotional vector → 9-passage `.twee` (context_1–3, anomaly_1–3, choice, response, artifact). Proves the system can generate playable encounters from seeds.

3. **Bridge Scenario Engine** — Multiplayer archetype-gated encounters. Players in scenario seats; progression by archetype capacity, not seat role. Phase-based state; mints BARs, quests, vibeulons, daemon traces. For live party/campaign sessions.

4. **Onboarding Storytelling Grammar** — Correct ordering: Why (real-world stakes) → Where (shared story) → How (mechanics). Preserves meaning before play.

5. **Example Seed** (`unexpected_passenger_orb_seed_001.twee`) — Context → anomaly → contact → choice (look/lost/challenge) → artifact (BAR). Canonical triadic shape.

---

## Unifying Thread

The Conclave is the **metaphor layer** that lets players engage real-world challenges through shared imagination. Orb encounters are the **scene form** for "world noticing player." The Bridge Scenario is the **live multiplayer** variant. The Onboarding Grammar ensures players **enter in the right order**.

All of this feeds into the existing BARS Engine ontology:
- **Emotional Alchemy** → growth direction
- **GM face** → encounter style
- **Orb grammar** → scene structure
- **Scene DSL** → rendering
- **Quest / BAR / Vibeulon** → continuation artifacts

---

## Integration Strategy

### 1. Extend, Don't Replace

- **Orb Encounter Grammar** — Already has a spec in `.specify/specs/orb-encounter-grammar/`. The Conclave docs add detail (modulation schema, companion specs). **Action:** Merge into existing spec; add Sage analysis step for doc ingestion.

- **Orb Triadic Twee Generator** — New. Produces `.twee` from seeds + vector + GM face. **Action:** New spec; API-first; wire to existing encounter compiler when built.

- **Bridge Scenario Engine** — New. **Action:** New spec; API-first; archetype-gated (not seat-gated); must discover canonical archetypes from codebase first.

- **Onboarding Storytelling Grammar** — Informs existing onboarding. **Action:** Update docs/architecture; ensure Bruised Banana onboarding follows Why → Where → How.

### 2. Sage as Doc Analyzer

The Sage should analyze these docs to:
- Extract canonical entities (GM faces, anomaly types, emotional vectors)
- Identify conflicts with existing specs
- Propose schema mappings
- Suggest implementation order

**API:** `POST /api/admin/conclave-docs/analyze` — accepts doc content, returns structured Sage analysis.

### 3. Layered Architecture (Preserved)

```
Reality (Bruised Banana) → Myth (Conclave) → Mechanics (BARS)
Emotional Alchemy → growth direction
GM face → world style
Orb grammar → encounter form
Scene DSL → rendering
```

Keep these layers distinct. The Conclave docs reinforce this.

---

## Canonical Model Privilege

When integrating, **privilege canonical BARS Engine models**. Differences between Conclave docs and existing schema are documented in `MODEL_DIFF_AND_CLARITY_QUESTIONS.md`. Resolve clarity questions before implementing.

---

## Recommended Companion Specs

After ingestion:
- `gm_face_scene_modifiers.md` — Per-face modulation
- `orb_encounter_seed_library.md` — Seed library expansion
- `orb_encounter_runtime.md` — Runtime integration
- `bridge_scenario_phase_engine.md` — Phase state machine

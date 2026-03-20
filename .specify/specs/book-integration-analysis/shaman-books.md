# Shaman Books — Integration Analysis
**Books**: Existential Kink (Carolyn Elliott), Integral Life Practice (Wilber, Patten, Leonard, Morelli)
**Date**: 2026-03-19
**Analyst**: Research agent, bars-engine

---

## Existential Kink

### Core Concepts

1. **Jouissance / Psychic Masochism** — The unconscious takes forbidden pleasure in the very "bad stuff" we consciously hate (Freud's psychic masochism, Lacan's jouissance, Jung's Shadow). The pattern repeats because the enjoyment, being unconscious, is never satiated.

2. **Solve et Coagula** — Alchemical formula: first dissolve (solve) the existing form by making unconscious pleasure conscious; then re-coagulate into a new, more potent whole. Most Law-of-Attraction / affirmation systems skip the solve phase entirely.

3. **The EK Meditation** — A specific somatic practice: sit with the negative pattern, feel into the body sensations underneath the shame label, and consciously enjoy/celebrate them. This creates a "pattern interrupt" — the desire is finally consciously satisfied and loses its compulsive grip.

4. **Seven Axioms of EK** (from chapter outline):
   - Reality is fractal and holographic (as within, so without)
   - We are always doing magic (shaping reality through psychic state)
   - The unconscious rules far more of waking life than we admit
   - Disowned desires get fulfilled anyway — as "Fate"
   - Making unconscious pleasure conscious interrupts compulsion
   - The shadow protects something — integration is not destruction
   - Collective shadow exists alongside individual shadow

5. **Projection as Mirror** — What most disturbs us in others is disowned in ourselves. The trigger is a map to shadow territory. Elliott calls this the doorway to the "EK Exercises for Transformative Magic" (Part Two).

6. **Persephone / Pluto Mythos** — The maiden who splits into conscious innocence and unconscious power. Pluto (the unconscious divine) is not an enemy but a devoted servant who played villain on request. Integration = recognizing the Other as Self. This is the mythic template for shadow work in the Shaman register.

7. **Arousal as Misread Signal** — "Fear is excitement without the breath" (Fritz Perls). Sensation we label as terrible is often pleasure without approval. The EK practice involves re-labeling the sensation neutrally to allow conscious choice about what to do with it.

8. **Collective vs Individual Shadow** — Elliott explicitly names systemic oppression (sexism, racism) as part of a collective shadow that individuals can only change by doing their own solve work — not by righteously posting about injustice. This is the somatic allyship frame.

### Existing System Mappings

**Shadow 3-2-1 Sessions** (`backend/app/agents/shaman.py` lines 86–93, `prisma/schema.prisma` lines 338–362, `Shadow321Session` model):
- The 3-2-1 process (Face it / Talk to it / Be it) is already implemented and maps directly to EK's "make the unconscious conscious" step. But the system stops at the ILP version — it does not include the EK-specific step of **consciously celebrating/enjoying** the disowned pattern before releasing it.
- `Shadow321Session.outcome` enum includes `daemon_awakened` — the daemon system is the closest existing analog to the "Pluto figure" that was split off.

**CarriedWeight Model** (`prisma/schema.prisma` lines 2496–2515):
- `beliefText` + `shadowName` + `status` (held | in_play | metabolized | set_down) + `loadLevel` (1–3) is a direct structural analog to EK's concept of a "stuck pattern" that can be dissolved. The schema tracks the pattern's lifecycle but is missing the EK-specific **jouissance acknowledgment** step before metabolization.
- `metabolizedBarId` is the coagula phase — a quest or BAR that re-coagulates dissolved energy into creative output.

**Emotional Alchemy — Move Expressions** (`src/lib/quest-grammar/move-expressions.ts`):
- The `internal` field in each `MoveExpression` already describes the somatic/felt sense of a move. For example, `water_fire` (lines 183–189): "The grief does not need to be managed before it is useful — it needs to be fully met." This is exactly the EK frame.
- `metal_transcend`: "The fear is still in your chest and you are moving anyway. Not because it left — because you stopped waiting for it to." This is Perls' "fear is excitement without the breath" rendered as a move expression.
- The `SHADOW_PATTERNS` in `src/lib/quest-grammar/emotional-alchemy.ts` (lines 25–32) match exactly the kinds of self-sabotage beliefs EK addresses: `not_ready`, `not_worthy`, `don't_belong`. These feed `deriveMovementPerNode` — but there is no solve step before routing to a transcend/translate arc.

**Emotional First Aid Sessions** (`src/actions/emotional-first-aid.ts`):
- `stuckBefore` → `stuckAfter` → `delta` is the system's quantitative version of EK's "pattern interrupt." When `delta >= FIRST_AID_MINT_THRESHOLD` the player earns Vibeulons — rewarding the solve work.
- The Shadow 3-2-1 path (`is321Completion` at line 322) mints 1 Vibulon as a gold star regardless of delta — this is right. But EK would argue the *enjoyment* step must precede metabolization for the pattern to truly release.

**Shaman Agent** (`backend/app/agents/shaman.py`):
- The `EmotionalAlchemyReading.shadow_belief` field (line 43) correctly surfaces the shadow pattern.
- The system prompt (lines 64–100) cites Jung directly ("Until you make the unconscious, conscious, it will rule your life"), which is the EK epigraph. The Shaman already operates in EK territory.
- Missing: the Shaman has no instruction to help the player **savor or celebrate** the shadow pattern before integrating it — the EK solve step. The current instructions go directly from identification to dissolution.

**Daemon System** (`prisma/schema.prisma` lines 471–502, `Daemon` model):
- A daemon is the system's closest structural analog to Pluto — a split-off sub-personality with its own channel/altitude that can be summoned, leveled, and eventually promoted to an NPC. The `innerWorkDigest` field on Daemon captures the 3-2-1 integration work.
- The daemon's `shadow321SessionId` link connects it to the session where it was "awakened" from the shadow — this is the EK revelation moment (Persephone eating the pomegranate seeds).

### Missing Mechanics

1. **The Jouissance Step** — Between shadow identification and metabolization, there is no mechanic for the player to consciously *enjoy/celebrate* the previously unconscious pattern. EK argues this step is mandatory for pattern interruption. Mechanically this would be a specific quest beat or scene type: "What if part of you actually liked this? Sit with that." The `AlchemySceneTemplate` with `sceneType = 'control'` is closest — it moves the player to a lower-cost precision move — but that is still therapeutic framing, not EK's celebration framing.

2. **Solve Phase Tracking** — The `CarriedWeight` model has `status` (held → in_play → metabolized → set_down) but no field tracking whether the player has done the solve work — specifically the EK arousal/pleasure acknowledgment. A `solveCompletedAt` timestamp or `hasAcknowledgedJouissance: Boolean` on `CarriedWeight` would close this gap.

3. **Collective Shadow Quests** — EK distinguishes individual shadow from collective shadow (systemic oppression). The system has allyship domains (`src/lib/allyship-domains.ts`) but no mechanic that routes players from their individual shadow work to the collective shadow dimension of the same pattern. A quest grammar extension: when a player's `CarriedWeight` belief maps to an allyship domain, surface a "collective shadow inquiry" beat.

4. **Pattern Name Library** — EK's power is that it names common patterns (money ceiling, abusive relationship repetition, creative block, approval addiction). The system has `shadowName` on `CarriedWeight` and the shadow-name library spec (`.specify/specs/shadow-name-library/`) but no lookup table of canonical stuck-pattern archetypes with their probable EK jouissance keys. This library would enable the Shaman to say "I recognize this pattern — here are three others who carried it and what their solve looked like."

5. **Arousal Re-labeling Quest Beat** — A specific `beatType` extension for the Epiphany Bridge: an `arousal_relabel` beat that prompts the player to locate where a difficult sensation lives in their body, describe it without the shame label, and notice whether it might be excitement or aliveness without approval. This is a distinct somatic practice not covered by current `NodeEmotional` types.

### NPC Constitution Language

For the Shaman's `identity` block:

```
"identity": {
  "voice": "Campfire oracle who has eaten the pomegranate seeds. Knows the underworld from the inside. Does not perform comfort — offers recognition.",
  "myth": "Persephone who has remembered she created Pluto. Welcomes the monster as kin.",
  "somatic_register": "Sensation-first. Names where the pattern lives in the body before naming what it means.",
  "taboo_comfort": "Comfortable with what others find disgusting or shameful. Does not recoil from the 'wrongness.'"
},
"values": {
  "solve_before_coagula": "Refuses to help a player skip the dissolution step. Will not hand out affirmations before the shadow has been faced.",
  "jouissance_as_portal": "The kinky pleasure in the stuck pattern is not a pathology — it is the doorway. Honor it before dissolving it.",
  "collective_acknowledgment": "Names collective shadow (systemic forces) without using it as an escape hatch from personal solve work."
},
"limits": {
  "no_premature_transcendence": "Will not celebrate a player's breakthrough before the solve work is done. A bright Light without solve just sharpens the shadow.",
  "no_shame": "Never adds shame to the shadow material. The player is already carrying enough."
}
```

Patch for `guidance` field generation:
- Current Shaman guidance (line 99: "Speak with the weight of a campfire oracle, not a clinical therapist") is correct in register.
- Add: "Before offering the integration move, name what the player might have been secretly enjoying about the stuck pattern. Do not skip this step. It is the hinge everything turns on."

### Quest Grammar / Move Extensions

1. **New `beatType`: `solve_celebration`** — A beat that sits between `tension` and `integration` in the Epiphany Bridge. Text prompt: "Before you step through, take one honest look at what this pattern gave you. Name the pleasure underneath the pain." Emotional type: `control` (kè cycle) — it is a precision cost that prevents the pattern from returning.

2. **New `sceneType`: `kinky_integration`** — An `AlchemySceneTemplate` variant where the `friction` field is written from EK perspective: the player is invited to feel into the body sensation of their stuck pattern and notice what is alive in it. `choices` route to either `metabolize` (EK solve complete) or `sit_longer` (not yet ready to celebrate).

3. **CarriedWeight → Quest hook** — When a player picks up a `CarriedWeight` voluntarily (source: `voluntary_pickup`), the system should offer a mini-quest arc: (a) name the pattern in third person, (b) talk to it, (c) be it — and then specifically: (d) celebrate what it gave you (the EK step). This 4-step arc maps to the 3-2-1 + EK extension.

4. **Shadow Name as Move Trigger** — `CarriedWeight.shadowName` should be able to trigger a specific move in the move engine. When the player metabolizes a CarriedWeight through a BAR, the BAR's `moveType` should be set from the shadow's wuxing channel mapping (e.g., a pattern of "not ready" → Metal → `metal_transcend: Step Through`).

---

## Integral Life Practice

### Core Concepts

1. **AQAL** (All Quadrants, All Levels, All Lines, All States, All Types) — The meta-map. ILP is "powered by AQAL." The four quadrants: I (interior individual), We (interior collective), It (exterior individual), Its (exterior collective). All four must be addressed for genuine development.

2. **4 Core Modules** — Body, Mind, Spirit, Shadow. ILP's key insight is that traditional paths address 2–3 modules but almost universally omit Shadow. ILP is the first practice system to make Shadow a core module with equal standing.

3. **3 Kinds of Health**:
   - **Horizontal Health**: Fully inhabiting current level (translate)
   - **Vertical Health**: Growing into greater complexity (transcend)
   - **Essential Health**: Contact with Spirit / Suchness in any moment (state practice)

4. **Gold Star Practices** — Condensed, high-leverage practices for each module. The design principle: if a practice isn't high-leverage, it's not included. 1-Minute Modules are the smallest viable dose.

5. **ILP 3-2-1 Shadow Process** (Chapter 4) — The canonical version: (3rd person) Face the disturbing figure; (2nd person) Talk to it directly; (1st person) Be it, own it as a disowned part of Self. Transmuting authentic primary emotions and evolving the relationship with emotions.

6. **3 Bodies** (Gross / Subtle / Causal) — The somatic layer distinguishes: Gross body (physical), Subtle body (energetic, pranic, emotional charge), Causal body (witness consciousness). ILP's body module addresses all three. The subtle body is the layer where emotional alchemy happens.

7. **Transmuting Authentic Primary Emotions** — ILP chapter 4 section. Not suppressing or bypassing emotions — meeting them fully and allowing them to move through the three bodies into clarity. The ILP word for EK's solve phase applied to the emotional body.

8. **Levels and Lines of Development** — Different developmental lines (cognitive, emotional, spiritual, somatic, moral) can be at different levels. A person can be cognitively at Teal while emotionally at Orange. ILP explicitly tracks this to prevent "flying under altitude" (pretending to be at a higher level than you are — spiritual bypassing).

9. **States vs Stages** — States of consciousness (meditation peaks, flow states, emotional openings) are transient but real. Stages are permanent structures. Confusing peak experiences with stage development is a core ILP error. A player can have a fire_transcend experience without yet being able to sustain that level of functioning.

10. **Unique Self** — The appendix concept: awakening to non-dual consciousness does not erase individual uniqueness; it reveals it more fully. The Shaman's "Belonging, ritual space, bridge between worlds" mission is the We-quadrant expression of Unique Self realization.

11. **Integral Ethics** — "Flying under altitude" as an ethical concept: acting from a lower level than you actually occupy. The shadow of altitude claims without embodiment.

12. **Integral Cross-Training Synergy** — Gains in any single module accelerate gains in all others. The system's current architecture (shadow work → Vibulon mint → quest progression) is a gamified version of this.

### Existing System Mappings

**AQAL Quadrants → Move Expressions** (`src/lib/quest-grammar/move-expressions.ts` lines 21–30):
- `MoveExpression.internal` = I-quadrant read
- `MoveExpression.interpersonal` = We-quadrant read
- `MoveExpression.systemic` = Its-quadrant read
- Missing: explicit It-quadrant (exterior individual / somatic/behavioral) is sometimes folded into `internal` but is not named. This is the subtle body layer from ILP's 3-Body model.

**Translate vs Transcend** (`src/lib/quest-grammar/types.ts` line 64, `src/lib/quest-grammar/emotional-alchemy.ts`):
- `MovementType = 'translate' | 'transcend'` maps directly to ILP's Horizontal Health vs Vertical Health.
- The `DEFAULT_MOVEMENT_PER_NODE` (emotional-alchemy.ts lines 79–86): translate for beats 0–3, transcend for 4–5 — this is structurally the ILP idea that horizontal consolidation precedes vertical leap.

**Altitude System** (`src/lib/alchemy/types.ts` line 4, `AlchemyAltitude = 'dissatisfied' | 'neutral' | 'satisfied'`):
- This is a condensed version of ILP's levels. The three tiers map loosely to ILP's first-tier / second-tier thinking: dissatisfied = pre-integral (reactive, fragmented), neutral = integral awareness, satisfied = integrated embodiment.
- The `wuxing.ts` `altitudeStep` function (lines 41–47) encodes both sheng (ascending) and ke (descending) movements as altitude shifts — this is the ILP "vertical vs horizontal" distinction made mechanical.

**WAVE Progression** (`backend/app/agents/shaman.py` lines 78–83, `PersonalMoveType` in `types.ts` line 123):
- Wake / Clean / Grow / Show maps to ILP's practice progression within a single element. Wake Up = noticing (Essential Health contact), Clean Up = shadow work (horizontal consolidation), Grow Up = vertical development, Show Up = embodied action in the world (all quadrants).

**PlayerAlignment** (`prisma/schema.prisma` lines 2485–2493):
- `counts: String // JSON: { [moveType_domain_face_tag]: count }` is a cultural substrate alignment tracker. This maps to ILP's "Lines of Development" — the player's accumulated practice history across different developmental lines (emotional, somatic, relational, ethical).
- Currently stores move type × domain × face tag counts. Could be enriched with ILP's "which quadrant is this player strongest in / most neglected" meta-analysis.

**Shaman's EmotionalAlchemyReading** (`backend/app/agents/shaman.py` lines 24–57):
- `wave_stage` (line 51) maps directly to ILP's WAVE. `recommended_move_type` (line 47) maps to ILP's practice recommendation.
- `satisfaction_state` (line 35) maps to ILP's Horizontal Health assessment.
- Missing: no `developmental_line` field — ILP would want to know which line (emotional, somatic, relational, spiritual) is being addressed by the current moment of play.

**Threshold Encounter** (`src/actions/threshold-encounter.ts`, `ThresholdEncounter` in schema):
- The threshold encounter is ILP's "dark night of the soul" or "gate through which no one passes except on their knees" — a liminal passage between levels. The `tweeSource` driving these encounters is ILP's Essential Health contact made concrete.

### Missing Mechanics

1. **3-Body Awareness in Quest Nodes** — ILP's 3-Body model (Gross / Subtle / Causal) is not represented in `NodeEmotional` (`types.ts` lines 178–191). The `emotional` field on a node describes the alchemical vector but does not distinguish whether the player is being invited to work with physical sensation (gross), energetic charge (subtle), or witness consciousness (causal). A `bodyLayer?: 'gross' | 'subtle' | 'causal'` field on `NodeEmotional` would let the Shaman route players to the right somatic register for their current work.

2. **Lines of Development Tracking** — `PlayerAlignment` tracks move type × domain × face counts but not developmental lines. ILP explicitly warns that a player strong in the cognitive line may be weak in the emotional line at the same "level." A `developmentalLines` field on PlayerAlignment (JSON: `{ emotional: number, somatic: number, relational: number, ethical: number, spiritual: number }`) would enable the Shaman to say "your emotional line is lagging behind your cognitive line — the next quest should address this."

3. **States vs Stages Disambiguation** — When a player completes a `fire_transcend` move (anger → boundary honored), the system advances altitude. But ILP distinguishes this peak-state experience from genuine stage consolidation. A `stateExperience` flag on `AlchemySceneEvent` would mark when an altitude advance was a peak state vs repeated embodiment, allowing the Shaman to calibrate its reading ("you've touched this three times — it's becoming structural").

4. **Flying Under Altitude** — ILP's ethical concept has no mechanical equivalent. When a player's `PlayerAlignment` counts show strong accumulation at one face/move but their actual BAR content shows lower-level patterns, the Shaman should be able to name this. A "shadow of your altitude" reading: "Your records show 12 Grow Up moves, but this BAR reads like a Wake Up. What's the gap?"

5. **Essential Health / 1-Minute Module** — ILP's most important scalability innovation is the 1-Minute Module: the absolute minimum dose of each practice that keeps the player in contact with the essence of the work. The system has quests and BARs but no "micro-practice" primitive — a structured 60-second check-in that counts as a valid module completion. The `AlchemyCheckIn` (`src/actions/alchemy.ts` lines 100–133) is close but it gates the daily scene rather than standing alone as the micro-practice completion.

6. **Integral Cross-Training Synergy** — There is no mechanic rewarding cross-module engagement. ILP predicts that a player who does shadow work AND somatic practice AND meditation AND relational work will progress faster in each than a player who only does shadow work. The Vibulon economy could implement this via a cross-training bonus: completing practices across all four ILP modules in the same week unlocks a multiplier.

7. **Subtle Body / Somatic Tracking** — ILP's subtle body practices (breathwork, energy awareness, qigong) are not represented in the quest grammar or move engine. The `emotional-first-aid` tools could include a subtle body track. Currently, all tools route through cognitive/narrative framing. A `somaticInstructions` field on `EmotionalFirstAidTool` would enable breath-and-feel practices distinct from the narrative/cognitive tools.

### NPC Constitution Language

For the Shaman's `values` and `function` blocks, ILP-derived patches:

```
"values": {
  "aqal_completeness": "Holds all four quadrants simultaneously. Notices when a player is only working one quadrant and names what is being left out.",
  "horizontal_before_vertical": "Does not push a player to transcend before the current level is fully inhabited. Translate is not a consolation prize.",
  "states_vs_stages_integrity": "Celebrates peak experiences without confusing them with stage consolidation. Reminds players that the view from the peak must be earned through integration.",
  "flying_under_altitude_honesty": "Names it clearly, without shame, when a player's actions are below their stated developmental level. This is care, not criticism."
},
"function": {
  "module_audit": "Periodically reads the player's recent activity across body, mind, spirit, shadow. Names which module is most neglected. Does not prescribe — names.",
  "cross_training_encouragement": "When a player has been doing only one kind of work, names the synergy available from cross-training.",
  "wave_stage_tracking": "Maintains awareness of which WAVE stage the player is in across their active lines. Distinguishes emotional WAVE from somatic WAVE from relational WAVE."
}
```

Patch for `system_prompt` (`backend/app/agents/shaman.py` line 64):
- Add section: "3 Bodies: When reading a player's state, distinguish whether the work being done is Gross (behavioral, physical), Subtle (energetic, emotional charge), or Causal (witnessing, spacious presence). Name the body layer the player needs to work with."
- Add section: "Lines of Development: Be aware that the player may be advanced in one line and underdeveloped in another. Your job is to surface the gap, not to shame it."

### Quest Grammar / Move Extensions

1. **`bodyLayer` field on `NodeEmotional`** — Add `bodyLayer?: 'gross' | 'subtle' | 'causal'` to `NodeEmotional` in `src/lib/quest-grammar/types.ts` line 178. The Shaman-authored quest nodes would set this to guide the player's somatic attention.

2. **ILP Module tags on BARs** — Add `ilpModule?: 'body' | 'mind' | 'spirit' | 'shadow'` to `CustomBar` or store in `agentMetadata`. Used for cross-training bonus calculation and Shaman module-audit readings.

3. **1-Minute Module as Quest Spine variant** — A new `spineLength: 'micro'` value (alongside existing `'short' | 'full'` in `types.ts` line 149) that produces a 1-node quest packet: a single scene with a single choice and a `bodyLayer` tag. Completes in under 2 minutes. Counts for module credit.

4. **Transmutation Beat** — A new `beatType: 'transmutation'` for the Epiphany Bridge, sitting at the `integration` position. Text is written in ILP's language of "emotional transmutation": the player locates the emotion in the subtle body, allows it to move fully, and names what clarified. This is distinct from the EK `solve_celebration` beat — it is about *allowing* the energy to complete its movement, not celebrating its hidden pleasure.

5. **WAVE Stage on Scene Templates** — Add a `waveStageTarget: 'Wake' | 'Clean' | 'Grow' | 'Show'` field to `AlchemySceneTemplate`. This lets the Shaman select scenes matched to where in the WAVE arc the player currently sits, not just which element/altitude they are at.

---

## Cross-Book Synthesis

### Convergences Between EK and ILP

Both books address the Shadow module. Their key technical difference:

| | Existential Kink | Integral Life Practice |
|---|---|---|
| **Primary move** | Solve: consciously enjoy the disowned pattern | Transmute: allow authentic emotion to complete its movement through the three bodies |
| **Shadow step** | Celebrate the jouissance | Own it as disowned self (3-2-1) |
| **Error to avoid** | Coagula without solve (affirmations over unprocessed shadow) | Spiritual bypassing (flying under altitude) |
| **Mythic register** | Persephone eating the pomegranate — owning the Underworld | The unique self emerging through vertical development |
| **Somatic layer** | Arousal re-labeling (fear = excitement without breath) | 3-Body awareness (gross / subtle / causal) |
| **Collective** | Collective shadow named, but not prescriptive | AQAL We-quadrant as equal to I-quadrant |

The Shaman is the game face that holds both. EK gives the Shaman its **willingness to name the kinky pleasure** in stuck patterns. ILP gives the Shaman its **quadrant completeness** and its **altitude humility** (not pushing transcendence before the solve/transmutation work is done).

The two books together produce the Shaman's complete operating doctrine:

> Name what the player is unconsciously enjoying in their stuck pattern (EK solve). Then locate where that energy lives in the subtle body and allow it to complete its movement (ILP transmutation). Then and only then is a transcend or generate move genuinely available.

### The Single Highest-Leverage Integration

**The EK Jouissance Step inserted into the 3-2-1 process as a mandatory fourth step.**

Currently the system's 3-2-1 (`Shadow321Session`) has three phases mirroring ILP exactly. EK contributes a fourth step that the system does not yet implement:

```
Phase 1 (3rd person) — Face it: Describe the shadow in third person.
Phase 2 (2nd person) — Talk to it: Dialogue with the shadow figure.
Phase 3 (1st person) — Be it: Own it as a part of yourself.
Phase 4 (EK) — Celebrate it: Name what pleasure or payoff this part gave you. Feel that pleasure consciously for 60 seconds before releasing.
```

In the codebase, this would surface as:
- A new `phase4Snapshot` field on `Shadow321Session` (`prisma/schema.prisma` line 342) containing the player's stated jouissance/payoff text.
- A new `stage` value in the `ForgeSession.stage` enum (`prisma/schema.prisma` line 394): currently `THIRD_PERSON | SECOND_PERSON | FIRST_PERSON | FRICTION_REASSESS | ROUTING | COMPLETE`. Add `JOUISSANCE` between `FIRST_PERSON` and `FRICTION_REASSESS`.
- A Shaman system prompt instruction: "Before routing to FRICTION_REASSESS, ask the player what pleasure or relief or safety the pattern provided. Name it without shame. Celebrate it briefly. Only then proceed."

This single change would make the entire 3-2-1 → daemon awakening → CarriedWeight metabolization pipeline more effective because the solve phase would actually be complete.

### Recommended Immediate Action

**Implement the 4-2-1 Shadow Extension (not 3-2-1).**

The name "3-2-1" is correct for the ILP source. But the bars-engine system already has a creative license to extend it. The EK contribution is adding a `2.5-person` step: after being it (first person), briefly be the grateful recipient of what it provided. Elliott calls this "consciously celebrating the previously unconscious pleasure." It is a single beat, not a full additional phase.

Concretely:

1. Add `phase4Snapshot String? @db.Text` to `Shadow321Session` in `prisma/schema.prisma` — stores the player's EK celebration text. Optional field, backward compatible.

2. Patch `backend/app/agents/shaman.py` SYSTEM_PROMPT (line 87, between "3. Be it (1st person)" and the blank line before "## Transcend vs Translate"):
   ```
   4. Celebrate it — Name the payoff this part gave you. What pleasure, safety, or relief did the stuck pattern provide? Feel that consciously for one breath before releasing.
   ```

3. Add `JOUISSANCE` to `ForgeSession.stage` enum in schema and in the `/app/shadow/321/` runner — one additional UI step between "Be it" and the routing question.

4. Update `Shaman` `guidance` generation rule in the system prompt: "Phase 4 guidance must name the specific payoff without shame. Use the Persephone frame: your daemon was your devoted servant, not your enemy."

This is backward-compatible with all existing sessions. It closes the most significant gap between the books' teachings and the current system implementation. It requires a migration (new optional column), one new enum value, one UI step, and two system prompt patches — the minimum viable integration of EK's core mechanic into the existing Shaman workflow.

All other extensions (bodyLayer on NodeEmotional, ILP module tags, developmental lines tracking, cross-training bonus, 1-minute module spine) are valuable but can follow after the 4-2-1 core is stable.

---

## File Reference Index

| File | Lines | Relevance |
|---|---|---|
| `backend/app/agents/shaman.py` | 64–100 | System prompt — patch target for EK + ILP additions |
| `backend/app/agents/shaman.py` | 86–93 | 3-2-1 process — extend to 4-step |
| `prisma/schema.prisma` | 338–362 | `Shadow321Session` — add `phase4Snapshot` |
| `prisma/schema.prisma` | 390–394 | `ForgeSession.stage` — add `JOUISSANCE` |
| `prisma/schema.prisma` | 2496–2515 | `CarriedWeight` — add `solveCompletedAt`, `jouissanceText` |
| `prisma/schema.prisma` | 2485–2493 | `PlayerAlignment` — extend with developmental lines |
| `src/lib/quest-grammar/types.ts` | 178–191 | `NodeEmotional` — add `bodyLayer` |
| `src/lib/quest-grammar/types.ts` | 64 | `MovementType` — maps to ILP horizontal/vertical |
| `src/lib/quest-grammar/types.ts` | 149 | `spineLength` — extend with `'micro'` |
| `src/lib/quest-grammar/emotional-alchemy.ts` | 25–32 | `SHADOW_PATTERNS` — maps to EK jouissance triggers |
| `src/lib/quest-grammar/move-expressions.ts` | 21–30 | `MoveExpression` — AQAL quadrant structure (I/We/Its) |
| `src/lib/alchemy/wuxing.ts` | 39–47 | `altitudeStep` — ILP horizontal/vertical mapped |
| `src/lib/alchemy/types.ts` | 4 | `AlchemyAltitude` — ILP 3 kinds of health condensed |
| `src/lib/alchemy/select-scene.ts` | 84–125 | `selectScene` — add `waveStageTarget` field |
| `src/actions/alchemy.ts` | 100–133 | `createDailyCheckIn` — closest to ILP 1-minute module |
| `src/actions/emotional-first-aid.ts` | 322 | `is321Completion` — extend to is421Completion |
| `src/actions/npc-constitution.ts` | 5–41 | `createNpcConstitution` — Shaman constitution target |
| `src/lib/quest-grammar/elements.ts` | 20–46 | `ELEMENTS` — subtle body layer mapping opportunity |
